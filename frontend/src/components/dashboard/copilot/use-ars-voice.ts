"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Talking to Ars with the browser's own speech tools: the Web Speech API
 * turns the student's voice into text, and speechSynthesis reads the reply.
 * Both are free — only the text goes to Gemini — which is what keeps a
 * spoken turn as cheap as a typed one. No audio is recorded or uploaded by
 * us (Chrome does send the audio to Google's recognizer).
 */

export type VoiceLang = "ru" | "en";
export type ListenError = "unsupported" | "denied" | "no-speech" | "failed";

const LANG_TAG: Record<VoiceLang, string> = { ru: "ru-RU", en: "en-US" };

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

/** Reads text aloud in the language it is written in, whatever the UI language. */
function replyLang(text: string): VoiceLang {
  return /[а-яё]/i.test(text) ? "ru" : "en";
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

/** The nicest installed voice for a language: network/neural voices first. */
function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
  const rank = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online/i.test(v.name) ? 2 : 0) + (/google/i.test(v.name) ? 1 : 0);
  return voices.sort((a, b) => rank(b) - rank(a))[0] ?? null;
}

export function useArsVoice() {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const speakTokenRef = useRef(0);

  useEffect(() => {
    setCanListen(recognitionCtor() !== null);
    const synth = typeof window !== "undefined" && "speechSynthesis" in window;
    setCanSpeak(synth);
    // Voices load asynchronously in Chrome; asking once starts the load.
    if (synth) window.speechSynthesis.getVoices();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const stopSpeaking = useCallback(() => {
    speakTokenRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  /**
   * Must run inside the tap itself: iOS Safari only lets a page speak after
   * a user gesture, and the reply arrives seconds later from the network.
   */
  const unlockSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const primer = new SpeechSynthesisUtterance(" ");
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

  /** Reads `text` aloud; resolves when it is done or was stopped. */
  const speak = useCallback((text: string): Promise<void> => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve();
    const clean = speakable(text);
    if (!clean) return Promise.resolve();

    const synth = window.speechSynthesis;
    synth.cancel();
    const token = ++speakTokenRef.current;
    const lang = replyLang(clean);
    const voice = pickVoice(lang);
    const parts = sentences(clean);

    return new Promise<void>((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        window.clearInterval(watchdog);
        resolve();
      };

      parts.forEach((part, index) => {
        const utterance = new SpeechSynthesisUtterance(part);
        utterance.lang = LANG_TAG[lang];
        if (voice) utterance.voice = voice;
        utterance.rate = 1.03;
        if (index === parts.length - 1) {
          utterance.onend = finish;
          utterance.onerror = finish;
        }
        synth.speak(utterance);
      });

      // onend is not reliable in every browser; this also catches a cancel().
      let quietTicks = 0;
      const watchdog = window.setInterval(() => {
        if (speakTokenRef.current !== token) return finish();
        quietTicks = synth.speaking || synth.pending ? 0 : quietTicks + 1;
        if (quietTicks >= 3) finish();
      }, 400);
    });
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  return { canListen, canSpeak, listen, stopListening, speak, stopSpeaking, unlockSpeech };
}
