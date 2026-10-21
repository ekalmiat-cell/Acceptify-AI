import { describe, expect, it } from "vitest";

import { downsample, toWavBase64 } from "@/components/dashboard/copilot/use-voice-activity";

describe("downsample", () => {
  it("brings 48 kHz down to 16 kHz by averaging", () => {
    const input = new Float32Array([0.3, 0.3, 0.3, -0.6, -0.6, -0.6]);
    const out = downsample(input, 48_000);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeCloseTo(0.3);
    expect(out[1]).toBeCloseTo(-0.6);
  });

  it("leaves audio that is already 16 kHz alone", () => {
    expect(downsample(new Float32Array([0.1, 0.2]), 16_000)).toEqual(new Float32Array([0.1, 0.2]));
  });
});

describe("toWavBase64", () => {
  it("writes a 16 kHz mono 16-bit WAV Gemini can read", () => {
    const bytes = Buffer.from(toWavBase64([new Float32Array([0, 1]), new Float32Array([-1])]), "base64");
    expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
    expect(bytes.toString("ascii", 8, 16)).toBe("WAVEfmt ");
    expect(bytes.readUInt16LE(22)).toBe(1);
    expect(bytes.readUInt32LE(24)).toBe(16_000);
    expect(bytes.readUInt16LE(34)).toBe(16);
    expect(bytes.readUInt32LE(40)).toBe(6);
    expect([bytes.readInt16LE(44), bytes.readInt16LE(46), bytes.readInt16LE(48)]).toEqual([0, 32767, -32767]);
  });
});
