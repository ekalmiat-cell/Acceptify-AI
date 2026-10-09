"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CopilotStyle } from "@/types/copilot";

/**
 * Talking to the mentor: the browser's Web Speech API turns the student's
 * voice into text, and the reply is read by Gemini's voice, streamed from
 * /api/v1/copilot/speech and played as it arrives. There is deliberately no
 * fallback to the browser's own robotic voices: when Gemini's voice is not
 * available the mentor stays silent and says so on screen. No audio of the
 * student is recorded or uploaded by us (Chrome does send it to Google's
 * recognizer).
 */

export type VoiceLang = "ru" | "en";
export type ListenError = "unsupported" | "denied" | "no-speech" | "failed";
/** "unavailable": nothing was played because the voice could not be had. */
export type SpeakResult = "done" | "stopped" | "unavailable";

/** One spoken word, so the face can open its mouth once per syllable. */
export interface SpokenWord {
  id: number;
  syllables: number;
  ms: number;
}

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

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** What the speech route streams: 16-bit mono PCM at this rate. */
const PCM_RATE = 24_000;
/** Loudness is measured over frames this long to find syllables. */
const FRAME_SECONDS = 0.02;
/** Quieter than this (RMS, 0..1) is a pause, not a syllable. */
const SYLLABLE_FLOOR = 0.03;
/** Syllables closer together than this are one mouth movement. */
const MIN_SYLLABLE_GAP_SECONDS = 0.11;
/** How long the mouth takes to open and close on one syllable. */
const SYLLABLE_MS = 200;
/** Headroom before the first chunk plays, so a slow next chunk does not leave a gap. */
const START_DELAY_SECONDS = 0.15;

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Bytes of little-endian 16-bit PCM to samples in -1..1. */
function toSamples(bytes: Uint8Array): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const samples = new Float32Array(bytes.byteLength >> 1);
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
  return samples;
}

/**
 * Finds where syllables start in a stream of audio, one chunk at a time:
 * the loudness rises clearly above the last dip, then has to fall well
 * below its peak before the next one can start.
 */
function syllableFinder() {
  let open = false;
  let peak = 0;
  let valley = 1;
  let lastOnset = -Infinity;
  return (samples: Float32Array, startsAt: number): number[] => {
    const frame = Math.round(PCM_RATE * FRAME_SECONDS);
    const onsets: number[] = [];
    for (let i = 0; i + frame <= samples.length; i += frame) {
      let sum = 0;
      for (let j = i; j < i + frame; j++) sum += samples[j] * samples[j];
      const rms = Math.sqrt(sum / frame);
      const at = startsAt + i / PCM_RATE;
      if (open) {
        if (rms > peak) peak = rms;
        else if (rms < peak * 0.55) {
          open = false;
          valley = rms;
        }
      } else if (rms < valley) {
        valley = rms;
      } else if (rms > SYLLABLE_FLOOR && rms > valley * 1.6 && at - lastOnset >= MIN_SYLLABLE_GAP_SECONDS) {
        open = true;
        peak = rms;
        lastOnset = at;
        onsets.push(at);
      }
    }
    return onsets;
  };
}

/** A reply already voiced once, so the replay button costs nothing. */
interface VoicedReply {
  text: string;
  chunks: Uint8Array[];
}

export function useArsVoice() {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const speakTokenRef = useRef(0);
  const wordIdRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  /** Everything the current playback started, so stopping can undo it. */
  const playbackRef = useRef<{ sources: AudioBufferSourceNode[]; timers: number[]; abort: AbortController | null }>({
    sources: [],
    timers: [],
    abort: null,
  });
  const voicedRef = useRef<VoicedReply | null>(null);

  useEffect(() => {
    setCanListen(recognitionCtor() !== null);
    setCanSpeak(audioContextCtor() !== null);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const stopPlayback = useCallback(() => {
    const playback = playbackRef.current;
    playback.abort?.abort();
    playback.sources.forEach((source) => {
      try {
        source.stop();
      } catch {}
    });
    playback.timers.forEach((id) => window.clearTimeout(id));
    playbackRef.current = { sources: [], timers: [], abort: null };
  }, []);

  const stopSpeaking = useCallback(() => {
    speakTokenRef.current += 1;
    stopPlayback();
  }, [stopPlayback]);

  /**
   * Call inside the tap itself: browsers only let a page start sound after a
   * user gesture, and the reply arrives seconds later.
   */
  const unlockSpeech = useCallback(() => {
    const Ctor = audioContextCtor();
    if (!Ctor) return;
    audioRef.current ??= new Ctor();
    void audioRef.current.resume().catch(() => {});
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
   * Plays PCM chunks as they come, scheduling each right after the last, and
   * opens the mouth on every syllable the audio actually has.
   */
  const playPcm = useCallback(
    async (
      next: () => Promise<Uint8Array | null>,
      onWord: (word: SpokenWord) => void,
      alive: () => boolean,
      keep: Uint8Array[],
    ): Promise<SpeakResult> => {
      const ctx = audioRef.current;
      if (!ctx) return "unavailable";
      if (ctx.state !== "running") await ctx.resume().catch(() => {});
      if (ctx.state !== "running") return "unavailable";

      const playback = playbackRef.current;
      const findSyllables = syllableFinder();
      let playAt = 0;
      let leftover: Uint8Array | null = null;
      let played = 0;

      for (;;) {
        let chunk: Uint8Array | null;
        try {
          chunk = await next();
        } catch {
          // Cut off mid-reply: let what was scheduled finish.
          chunk = null;
        }
        if (!alive()) return "stopped";
        if (!chunk) break;
        keep.push(chunk);

        // Samples are two bytes; a chunk can split one.
        let bytes = chunk;
        if (leftover) {
          bytes = new Uint8Array(leftover.length + chunk.length);
          bytes.set(leftover);
          bytes.set(chunk, leftover.length);
          leftover = null;
        }
        if (bytes.length % 2) {
          leftover = bytes.slice(-1);
          bytes = bytes.subarray(0, bytes.length - 1);
        }
        if (!bytes.length) continue;

        const samples = toSamples(bytes);
        const buffer = ctx.createBuffer(1, samples.length, PCM_RATE);
        buffer.getChannelData(0).set(samples);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        playAt = Math.max(playAt, ctx.currentTime + (played === 0 ? START_DELAY_SECONDS : 0.02));
        source.start(playAt);
        playback.sources.push(source);

        for (const onset of findSyllables(samples, playAt)) {
          const delay = Math.max(0, (onset - ctx.currentTime) * 1000);
          playback.timers.push(
            window.setTimeout(
              () => alive() && onWord({ id: ++wordIdRef.current, syllables: 1, ms: SYLLABLE_MS }),
              delay,
            ),
          );
        }
        playAt += buffer.duration;
        played += 1;
      }

      if (played === 0) return "unavailable";
      // The stream is in; wait for the last of it to be heard.
      while (alive() && ctx.currentTime < playAt) await pause(100);
      return alive() ? "done" : "stopped";
    },
    [],
  );

  /**
   * Reads one of the copilot's replies in Gemini's voice: streamed from the
   * speech route the first time, from memory on a replay. `voiceToken` is
   * the chat route's signature that lets this reply be voiced.
   */
  const speak = useCallback(
    async (
      text: string,
      voiceToken: string,
      style: CopilotStyle,
      onWord: (word: SpokenWord) => void,
    ): Promise<SpeakResult> => {
      stopPlayback();
      const token = ++speakTokenRef.current;
      const alive = () => speakTokenRef.current === token;

      const voiced = voicedRef.current;
      if (voiced?.text === text) {
        const chunks = [...voiced.chunks];
        return playPcm(async () => chunks.shift() ?? null, onWord, alive, []);
      }

      const abort = new AbortController();
      playbackRef.current.abort = abort;
      let reader: ReadableStreamDefaultReader<Uint8Array>;
      try {
        const response = await fetch("/api/v1/copilot/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, token: voiceToken, style }),
          signal: abort.signal,
        });
        if (!response.ok || !response.body) return alive() ? "unavailable" : "stopped";
        reader = response.body.getReader();
      } catch {
        return alive() ? "unavailable" : "stopped";
      }

      const keep: Uint8Array[] = [];
      let complete = false;
      const result = await playPcm(
        async () => {
          const { done, value } = await reader.read();
          if (done) complete = true;
          return done ? null : value;
        },
        onWord,
        alive,
        keep,
      );
      if (complete) voicedRef.current = { text, chunks: keep };
      return result;
    },
    [playPcm, stopPlayback],
  );

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      stopPlayback();
      void audioRef.current?.close().catch(() => {});
    },
    [stopPlayback],
  );

  return { canListen, canSpeak, listen, stopListening, speak, stopSpeaking, unlockSpeech };
}
