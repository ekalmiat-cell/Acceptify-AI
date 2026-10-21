"use client";

import { useCallback, useEffect, useRef } from "react";

import { rmsOf } from "@/components/dashboard/copilot/use-ars-voice";

/**
 * Hears when the student starts talking over BRO, so he can stop and listen.
 *
 * The microphone is opened with the browser's echo cancellation and noise
 * suppression, then filtered to the band where speech carries (about 250 Hz
 * to 3.5 kHz), which drops hum, traffic rumble and hiss. A level counts as a
 * voice only when it is well above the background measured a moment before
 * and stays there long enough to be a word, not a cough or a door.
 *
 * While the student has the floor, `record` also keeps what they say, so
 * Gemini can hear which language it is in (see the chat route). That one
 * turn is sent with the message and stored nowhere; between turns the audio
 * only feeds the level meter.
 */

/** Floor for "loud enough to be someone talking to the phone" (RMS, 0..1). */
const MIN_VOICE_RMS = 0.02;
/** A voice has to be this many times louder than the background. */
const ABOVE_BACKGROUND = 3.2;
/** And keep going this long, so short knocks and coughs don't count. */
const SUSTAIN_MS = 280;
/** At the start of each watch the background is learned before anything can trigger. */
const WARMUP_MS = 450;
const TICK_MS = 40;

/** Recordings are sent at the rate Gemini works at anyway: smaller, no worse. */
const RECORD_RATE = 16_000;
/** A turn longer than this keeps only its first minute (the request has a size limit). */
const MAX_RECORD_SECONDS = 60;

/** A turn being recorded: `stop` gives it as base64 WAV (null if nothing was heard), `cancel` drops it. */
export interface Recording {
  stop(): string | null;
  cancel(): void;
}

/** Averages a block of samples down to RECORD_RATE (the input is 44.1 or 48 kHz). */
export function downsample(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate <= RECORD_RATE) return input.slice();
  const ratio = fromRate / RECORD_RATE;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

/** 16-bit mono WAV of the samples, as base64. */
export function toWavBase64(chunks: Float32Array[]): string {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const view = new DataView(new ArrayBuffer(44 + length * 2));
  const text = (at: number, value: string) => [...value].forEach((char, i) => view.setUint8(at + i, char.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, RECORD_RATE, true);
  view.setUint32(28, RECORD_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, length * 2, true);
  let at = 44;
  for (const chunk of chunks) {
    for (const sample of chunk) {
      view.setInt16(at, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
      at += 2;
    }
  }
  const bytes = new Uint8Array(view.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

interface Meter {
  ctx: AudioContext;
  stream: MediaStream;
  /** The unfiltered microphone, for recordings. */
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  buffer: Float32Array<ArrayBuffer>;
  /** A second buffer for `level`, which runs on its own clock next to `watch`. */
  levelBuffer: Float32Array<ArrayBuffer>;
}

export function useVoiceActivity() {
  const meterRef = useRef<Meter | null>(null);
  const watchRef = useRef<number | null>(null);

  const unwatch = useCallback(() => {
    if (watchRef.current !== null) window.clearInterval(watchRef.current);
    watchRef.current = null;
  }, []);

  /** Opens the microphone for level metering; false when it can't be had. */
  const open = useCallback(async (): Promise<boolean> => {
    if (meterRef.current) return true;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      return false;
    }
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 250;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 3500;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(highpass).connect(lowpass).connect(analyser);
    meterRef.current = {
      ctx,
      stream,
      source,
      analyser,
      buffer: new Float32Array(analyser.fftSize),
      levelBuffer: new Float32Array(analyser.fftSize),
    };
    return true;
  }, []);

  /** Stops watching and releases the microphone (the browser's mic light goes off). */
  const close = useCallback(() => {
    unwatch();
    const meter = meterRef.current;
    meterRef.current = null;
    meter?.stream.getTracks().forEach((track) => track.stop());
    void meter?.ctx.close().catch(() => {});
  }, [unwatch]);

  /**
   * Calls `onVoice` once, the first time someone speaks up. The background
   * is learned while watching — BRO's own voice leaking past the echo
   * cancellation included — so he does not interrupt himself.
   */
  const watch = useCallback(
    (onVoice: () => void) => {
      unwatch();
      const meter = meterRef.current;
      if (!meter) return;
      void meter.ctx.resume().catch(() => {});
      const started = performance.now();
      let background = MIN_VOICE_RMS / 2;
      let loudFor = 0;

      watchRef.current = window.setInterval(() => {
        const rms = rmsOf(meter.analyser, meter.buffer);

        const threshold = Math.max(MIN_VOICE_RMS, background * ABOVE_BACKGROUND);
        if (performance.now() - started < WARMUP_MS || rms < threshold) {
          // Quiet enough to be background: follow it, faster upward during warmup.
          const rate = performance.now() - started < WARMUP_MS ? 0.3 : 0.05;
          background = background * (1 - rate) + rms * rate;
          loudFor = 0;
          return;
        }
        loudFor += TICK_MS;
        if (loudFor >= SUSTAIN_MS) {
          unwatch();
          onVoice();
        }
      }, TICK_MS);
    },
    [unwatch],
  );

  /**
   * Starts keeping what the microphone hears, for one turn. Null when the
   * microphone isn't open. A ScriptProcessor rather than an AudioWorklet:
   * it needs no separate module file and works in every browser that
   * has Web Speech.
   */
  const record = useCallback((): Recording | null => {
    const meter = meterRef.current;
    if (!meter) return null;
    void meter.ctx.resume().catch(() => {});
    const { ctx, source } = meter;
    const chunks: Float32Array[] = [];
    let kept = 0;
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    // A processor only runs when it leads somewhere; this leads to silence.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    processor.onaudioprocess = (event) => {
      if (kept >= MAX_RECORD_SECONDS * RECORD_RATE) return;
      const chunk = downsample(event.inputBuffer.getChannelData(0), ctx.sampleRate);
      chunks.push(chunk);
      kept += chunk.length;
    };
    source.connect(processor);
    processor.connect(mute).connect(ctx.destination);

    const release = () => {
      processor.onaudioprocess = null;
      try {
        source.disconnect(processor);
      } catch {}
      processor.disconnect();
      mute.disconnect();
    };
    return {
      stop: () => {
        release();
        // Under a third of a second is a click, not a sentence.
        return kept > RECORD_RATE / 3 ? toWavBase64(chunks) : null;
      },
      cancel: release,
    };
  }, []);

  /** How loud the student is right now (RMS, 0..1); 0 while the microphone is closed. */
  const level = useCallback((): number => {
    const meter = meterRef.current;
    return meter ? rmsOf(meter.analyser, meter.levelBuffer) : 0;
  }, []);

  useEffect(() => close, [close]);

  return { open, watch, unwatch, close, level, record };
}
