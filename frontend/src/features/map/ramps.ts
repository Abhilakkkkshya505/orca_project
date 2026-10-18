/**
 * Color-blind safe color ramps for marine data visualization adhering to docs/design.md.
 * Sequential single-hue ramp for magnitude (wave height, chlorophyll).
 */

export interface ColorStop {
  value: number;
  color: string;
  label: string;
}

// Wave Height Ramp (meters)
export const WAVE_HEIGHT_RAMP: ColorStop[] = [
  { value: 0.0, color: "#E1F1E7", label: "Calm (< 0.5 m)" },
  { value: 1.0, color: "#BDE2CD", label: "Slight (1.0 m)" },
  { value: 1.5, color: "#FCEBC2", label: "Moderate / Caution (1.5 m)" },
  { value: 2.2, color: "#F9DAD7", label: "Rough / Unsafe (2.2 m)" },
  { value: 3.5, color: "#9F1D17", label: "Very Rough (> 3.5 m)" },
];

// Potential Fishing Zone Score Ramp (0 to 100)
export const FISHING_ZONE_RAMP: ColorStop[] = [
  { value: 0, color: "#E3E6E8", label: "Low Potential (0-39)" },
  { value: 40, color: "#CFE3E8", label: "Moderate (40-69)" },
  { value: 70, color: "#0F5C6E", label: "High Potential (70-100)" },
];

export function getFishingZoneColor(score: number): string {
  if (score >= 70) return "#0F5C6E";
  if (score >= 40) return "#5FB4C7";
  return "#8B8574";
}
