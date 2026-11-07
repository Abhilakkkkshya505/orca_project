/**
 * Formatting and unit conversion utilities for ORCA.
 * Follows docs/design.md rules:
 * - Round sensibly: waves to 0.1 m, wind to whole km/h or knots, SST to 0.1 °C.
 * - Missing data reads "No data" with reason or context, never 0, - or blank.
 * - Uses standard Intl APIs (no moment.js).
 */

export type UnitSystem = "metric" | "knots";

export const KMH_TO_KNOTS = 0.539957;

/**
 * Converts km/h to nautical knots.
 */
export function kmhToKnots(kmh: number): number {
  return kmh * KMH_TO_KNOTS;
}

/**
 * Converts nautical knots to km/h.
 */
export function knotsToKmh(knots: number): number {
  return knots / KMH_TO_KNOTS;
}

/**
 * Formats wave or swell height in meters.
 * Example: 1.84 -> "1.8 m"
 */
export function formatWaveHeight(
  heightM: number | null | undefined,
  _units: UnitSystem = "metric"
): string {
  if (heightM == null || isNaN(heightM)) return "No data";
  return `${heightM.toFixed(1)} m`;
}

/**
 * Formats wind speed according to selected unit system.
 * Metric: "24 km/h"
 * Knots: "13 kts"
 */
export function formatWindSpeed(
  speedKmh: number | null | undefined,
  units: UnitSystem = "metric"
): string {
  if (speedKmh == null || isNaN(speedKmh)) return "No data";
  if (units === "knots") {
    const kts = Math.round(kmhToKnots(speedKmh));
    return `${kts} kts`;
  }
  return `${Math.round(speedKmh)} km/h`;
}

/**
 * Formats sea surface temperature in Celsius.
 * Example: 28.24 -> "28.2 °C"
 */
export function formatTemperature(celsius: number | null | undefined): string {
  if (celsius == null || isNaN(celsius)) return "No data";
  return `${celsius.toFixed(1)} °C`;
}

/**
 * Formats wave period in seconds.
 * Example: 8.2 -> "8 s"
 */
export function formatPeriod(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return "No data";
  return `${Math.round(seconds)} s`;
}

/**
 * Formats geographic distance in kilometers.
 * Example: 14.2 -> "14 km"
 */
export function formatDistance(km: number | null | undefined): string {
  if (km == null || isNaN(km)) return "No data";
  if (km < 1) return "<1 km";
  return `${Math.round(km)} km`;
}

/**
 * Formats telemetry data age relative to current time.
 */
export function formatDataAge(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(minutes) || minutes < 0) return "Unknown age";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  const remMins = Math.round(minutes % 60);
  if (hours < 24) {
    return remMins > 0 ? `${hours}h ${remMins}m ago` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Formats timestamp using accessible native Intl API.
 */
export function formatDateTime(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "No date";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Invalid date";

  const defaultOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
  };

  return new Intl.DateTimeFormat("en-IN", defaultOpts).format(date);
}
