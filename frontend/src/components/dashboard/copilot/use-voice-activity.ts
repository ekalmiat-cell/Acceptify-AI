"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Hears when the student starts talking over BRO, so he can stop and listen.
 *
 * The microphone is opened with the browser's echo cancellation and noise
 * suppression, then filtered to the band where speech carries (about 250 Hz
 * to 3.5 kHz), which drops hum, traffic rumble and hiss. A level counts as a
 * voice only when it is well above the background measured a moment before
 * and stays there long enough to be a word, not a cough or a door.
 *
 * Nothing is recorded or sent: the audio only feeds a level meter.
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

interface Meter {
  ctx: AudioContext;
  stream: MediaStream;
  analyser: AnalyserNode;
  buffer: Float32Array<ArrayBuffer>;
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
    meterRef.current = { ctx, stream, analyser, buffer: new Float32Array(analyser.fftSize) };
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
        meter.analyser.getFloatTimeDomainData(meter.buffer);
        let sum = 0;
        for (const sample of meter.buffer) sum += sample * sample;
        const rms = Math.sqrt(sum / meter.buffer.length);

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

  useEffect(() => close, [close]);

  return { open, watch, unwatch, close };
}
