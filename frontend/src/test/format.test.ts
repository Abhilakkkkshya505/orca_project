import { describe, it, expect } from "vitest";
import {
  kmhToKnots,
  knotsToKmh,
  formatWaveHeight,
  formatWindSpeed,
  formatTemperature,
  formatPeriod,
  formatDistance,
  formatDataAge,
} from "@/lib/format";

describe("Formatting Utilities", () => {
  it("converts between km/h and knots accurately", () => {
    expect(Math.round(kmhToKnots(50))).toBe(27);
    expect(Math.round(knotsToKmh(27))).toBe(50);
  });

  it("formats wave height with sensible rounding and handles null", () => {
    expect(formatWaveHeight(1.84)).toBe("1.8 m");
    expect(formatWaveHeight(0.05)).toBe("0.1 m");
    expect(formatWaveHeight(null)).toBe("No data");
    expect(formatWaveHeight(undefined)).toBe("No data");
  });

  it("formats wind speed in metric and knots", () => {
    expect(formatWindSpeed(24, "metric")).toBe("24 km/h");
    expect(formatWindSpeed(24, "knots")).toBe("13 kts");
    expect(formatWindSpeed(null)).toBe("No data");
  });

  it("formats sea surface temperature", () => {
    expect(formatTemperature(28.24)).toBe("28.2 °C");
    expect(formatTemperature(null)).toBe("No data");
  });

  it("formats wave period", () => {
    expect(formatPeriod(8.2)).toBe("8 s");
    expect(formatPeriod(null)).toBe("No data");
  });

  it("formats distance", () => {
    expect(formatDistance(14.2)).toBe("14 km");
    expect(formatDistance(0.4)).toBe("<1 km");
    expect(formatDistance(null)).toBe("No data");
  });

  it("formats data age clearly", () => {
    expect(formatDataAge(0.5)).toBe("Just now");
    expect(formatDataAge(25)).toBe("25m ago");
    expect(formatDataAge(60)).toBe("1h ago");
    expect(formatDataAge(90)).toBe("1h 30m ago");
    expect(formatDataAge(1500)).toBe("1d ago");
    expect(formatDataAge(null)).toBe("Unknown age");
  });
});
