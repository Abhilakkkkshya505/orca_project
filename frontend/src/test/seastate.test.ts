import { describe, it, expect } from "vitest";
import {
  getWmoSeaState,
  computeWaveAmplitude,
  computeWaveDuration,
} from "@/components/ui/SeaState";

describe("SeaState WMO Douglas Scale Mapping", () => {
  it("maps 0.0m to Calm (glassy)", () => {
    expect(getWmoSeaState(0.0)).toBe("Calm (glassy)");
  });

  it("maps 0.05m to Calm (rippled)", () => {
    expect(getWmoSeaState(0.05)).toBe("Calm (rippled)");
  });

  it("maps 0.3m to Smooth", () => {
    expect(getWmoSeaState(0.3)).toBe("Smooth");
  });

  it("maps 1.0m to Slight", () => {
    expect(getWmoSeaState(1.0)).toBe("Slight");
  });

  it("maps 1.8m to Moderate", () => {
    expect(getWmoSeaState(1.8)).toBe("Moderate");
  });

  it("maps 3.2m to Rough", () => {
    expect(getWmoSeaState(3.2)).toBe("Rough");
  });

  it("maps 5.0m to Very rough", () => {
    expect(getWmoSeaState(5.0)).toBe("Very rough");
  });

  it("maps 7.5m to High", () => {
    expect(getWmoSeaState(7.5)).toBe("High");
  });

  it("maps 11.0m to Very high", () => {
    expect(getWmoSeaState(11.0)).toBe("Very high");
  });

  it("maps 16.0m to Phenomenal", () => {
    expect(getWmoSeaState(16.0)).toBe("Phenomenal");
  });

  it("handles null and undefined gracefully as Unknown", () => {
    expect(getWmoSeaState(null)).toBe("Unknown");
    expect(getWmoSeaState(undefined)).toBe("Unknown");
    expect(getWmoSeaState(NaN)).toBe("Unknown");
  });
});

describe("SeaState Wave Physics Calculations", () => {
  const containerHeight = 160;

  it("computes amplitude within clamp bounds [2, containerHeight * 0.35]", () => {
    const minAmp = computeWaveAmplitude(containerHeight, 0.1);
    expect(minAmp).toBeGreaterThanOrEqual(2);

    const normalAmp = computeWaveAmplitude(containerHeight, 2.0);
    expect(normalAmp).toBeGreaterThan(minAmp);
    expect(normalAmp).toBeLessThanOrEqual(containerHeight * 0.35);

    const hugeAmp = computeWaveAmplitude(containerHeight, 20.0);
    expect(hugeAmp).toBe(containerHeight * 0.35);
  });

  it("returns 0 amplitude when wave height is 0 or null", () => {
    expect(computeWaveAmplitude(containerHeight, 0)).toBe(0);
    expect(computeWaveAmplitude(containerHeight, null)).toBe(0);
  });

  it("clamps wave animation duration between 3s and 14s", () => {
    expect(computeWaveDuration(1)).toBe(3); // clamped to min 3s
    expect(computeWaveDuration(8)).toBe(8); // within bounds
    expect(computeWaveDuration(20)).toBe(14); // clamped to max 14s
    expect(computeWaveDuration(null)).toBe(8); // default fallback
  });
});
