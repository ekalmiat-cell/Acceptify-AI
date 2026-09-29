"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Talking to the mentor with the browser's own speech tools: the Web Speech
 * API turns the student's voice into text, and speechSynthesis reads the
 * reply. Both are free — only the text goes to Gemini — which is what keeps
 * a spoken turn as cheap as a typed one. No audio is recorded or uploaded
 * by us (Chrome does send the audio to Google's recognizer).
 */

export type VoiceLang = "ru" | "en";
export type ListenError = "unsupported" | "denied" | "no-speech" | "failed";
export type SpeakResult = "done" | "stopped" | "failed";

/** One spoken word, so the face can open its mouth once per syllable. */
export interface SpokenWord {
  id: number;
  syllables: number;
  ms: number;
}

const LANG_TAG: Record<VoiceLang, string> = { ru: "ru-RU", en: "en-US" };
const RATE = 1.03;
/** Rough length of one spoken syllable at RATE, for voices that report no word timings. */
const SYLLABLE_MS = 190;
/** A voice that has not reported a word by then is not going to. */
const BOUNDARY_GRACE_MS = 350;

interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function hasSynth(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Reads text aloud in the language it is written in, whatever the UI language. */
function replyLang(text: string): VoiceLang {
  const cyrillic = (text.match(/[а-яё]/gi) ?? []).length;
  const latin = (text.match(/[a-z]/gi) ?? []).length;
  return cyrillic >= latin ? "ru" : "en";
}

/** Markdown and emoji would be read out as symbols. */
function speakable(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#`>|~]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short utterances: Chrome silently stops reading one that runs past ~15 seconds. */
function sentences(text: string): string[] {
  const parts = text.match(/[^.!?…]+[.!?…]*/g) ?? [text];
  return parts.map((part) => part.trim()).filter(Boolean);
}

function syllableCount(word: string): number {
  return Math.max(1, (word.match(/[аеёиоуыэюяaeiouy]+/gi) ?? []).length);
}

/**
 * The best installed voice for a language. Local and Edge "Natural" voices
 * come first: they are reliable and report word boundaries, which drive the
 * mouth. Chrome's network "Google" voices sound fine but report nothing.
 */
function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices();
  const voices = all.filter((v) => v.lang.toLowerCase().startsWith(lang));
  const rank = (v: SpeechSynthesisVoice) =>
    (/natural|neural/i.test(v.name) ? 4 : 0) + (v.localService ? 2 : 0) + (/google/i.test(v.name) ? 1 : 0);
  // Many Windows PCs here have only Russian voices installed. An English reply
  // read with an accent beats silence, which is what a missing voice gives.
  return voices.sort((a, b) => rank(b) - rank(a))[0] ?? all.find((v) => v.default) ?? all[0] ?? null;
}

/** Safari (desktop and iOS) only lets a page speak once it has spoken inside a tap. */
function needsSpeechUnlock(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg|CriOS|FxiOS/.test(ua));
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useArsVoice() {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const speakTokenRef = useRef(0);
  const wordIdRef = useRef(0);

  useEffect(() => {
    setCanListen(recognitionCtor() !== null);
    setCanSpeak(hasSynth());
    // Voices load asynchronously in Chrome; asking once starts the load.
    if (hasSynth()) window.speechSynthesis.getVoices();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const stopSpeaking = useCallback(() => {
    speakTokenRef.current += 1;
    if (hasSynth()) window.speechSynthesis.cancel();
  }, []);

  /** Call inside the tap itself (see needsSpeechUnlock). A no-op elsewhere. */
  const unlockSpeech = useCallback(() => {
    if (!hasSynth() || !needsSpeechUnlock()) return;
    const primer = new SpeechSynthesisUtterance(".");
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
  }, []);

  const listen = useCallback(
    (lang: VoiceLang, handlers: { onInterim: (text: string) => void }): Promise<string> => {
      const Ctor = recognitionCtor();
      if (!Ctor) return Promise.reject<string>("unsupported" satisfies ListenError);

      recognitionRef.current?.abort();
      const recognition = new Ctor();
      recognitionRef.current = recognition;
      recognition.lang = LANG_TAG[lang];
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      return new Promise<string>((resolve, reject) => {
        let finalText = "";
        let failure: ListenError | null = null;

        recognition.onresult = (event) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) finalText += result[0].transcript;
            else interim += result[0].transcript;
          }
          handlers.onInterim((finalText + interim).trim());
        };
        recognition.onerror = (event) => {
          failure =
            event.error === "not-allowed" || event.error === "service-not-allowed"
              ? "denied"
              : event.error === "no-speech" || event.error === "aborted"
                ? "no-speech"
                : "failed";
        };
        recognition.onend = () => {
          if (recognitionRef.current === recognition) recognitionRef.current = null;
          const text = finalText.trim();
          if (text) resolve(text);
          else reject(failure ?? ("no-speech" satisfies ListenError));
        };

        try {
          recognition.start();
        } catch {
          reject("failed" satisfies ListenError);
        }
      });
    },
    [],
  );

  /**
   * Reads `text` aloud one sentence at a time and reports each word as it is
   * spoken — from the voice's own word boundaries when it has them, from an
   * estimate by syllables when it does not.
   */
  const speak = useCallback(async (text: string, onWord: (word: SpokenWord) => void): Promise<SpeakResult> => {
    if (!hasSynth()) return "failed";
    const clean = speakable(text);
    if (!clean) return "done";

    const synth = window.speechSynthesis;
    const token = ++speakTokenRef.current;
    const alive = () => speakTokenRef.current === token;

    // Chrome drops an utterance queued right after cancel(), and can sit
    // paused after a tab switch; clear it, give it a beat, and resume.
    if (synth.speaking || synth.pending) {
      synth.cancel();
      await pause(120);
    }
    synth.resume();
    if (!alive()) return "stopped";

    const lang = replyLang(clean);
    const voice = pickVoice(lang);

    const emit = (word: string) => {
      const syllables = syllableCount(word);
      onWord({ id: ++wordIdRef.current, syllables, ms: (syllables * SYLLABLE_MS) / RATE });
    };

    const speakSentence = (sentence: string) =>
      new Promise<SpeakResult>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = voice?.lang ?? LANG_TAG[lang];
        if (voice) utterance.voice = voice;
        utterance.rate = RATE;

        let started = false;
        let boundaries = false;
        let settled = false;
        const timers: number[] = [];

        const settle = (result: SpeakResult) => {
          if (settled) return;
          settled = true;
          timers.forEach((id) => window.clearTimeout(id));
          window.clearInterval(watchdog);
          resolve(result);
        };

        /** No word timings from this voice: move the mouth on an estimated schedule. */
        const simulate = () => {
          let at = 0;
          for (const token of sentence.match(/[\p{L}\p{N}'’-]+|[,;:—.!?…]/gu) ?? []) {
            if (/^[,;:—.!?…]$/.test(token)) {
              at += 220;
              continue;
            }
            const word = token;
            timers.push(window.setTimeout(() => !boundaries && emit(word), at));
            at += (syllableCount(word) * SYLLABLE_MS) / RATE + 40;
          }
        };

        utterance.onstart = () => {
          started = true;
          timers.push(window.setTimeout(() => !boundaries && simulate(), BOUNDARY_GRACE_MS));
        };
        utterance.onboundary = (event) => {
          if (event.name && event.name !== "word") return;
          if (!boundaries) {
            boundaries = true;
            timers.forEach((id) => window.clearTimeout(id));
          }
          const word = sentence.slice(event.charIndex).match(/^[\p{L}\p{N}'’-]+/u)?.[0];
          if (word) emit(word);
        };
        utterance.onend = () => settle("done");
        utterance.onerror = (event) =>
          settle(event.error === "interrupted" || event.error === "canceled" ? "stopped" : "failed");

        // onend is not reliable in every browser, and a voice that never
        // starts must not leave the face "talking" forever.
        let quiet = 0;
        let waited = 0;
        const watchdog = window.setInterval(() => {
          if (!alive()) return settle("stopped");
          waited += 400;
          if (!started && waited >= 6000) return settle("failed");
          if (!started) return;
          quiet = synth.speaking ? 0 : quiet + 1;
          if (quiet >= 3) settle("done");
        }, 400);

        synth.speak(utterance);
      });

    for (const sentence of sentences(clean)) {
      if (!alive()) return "stopped";
      const result = await speakSentence(sentence);
      if (result !== "done") return alive() ? result : "stopped";
    }
    return "done";
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (hasSynth()) window.speechSynthesis.cancel();
    },
    [],
  );

  return { canListen, canSpeak, listen, stopListening, speak, stopSpeaking, unlockSpeech };
}
