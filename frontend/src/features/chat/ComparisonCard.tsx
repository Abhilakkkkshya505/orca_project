import React from "react";
import type { RiskAssessmentData } from "./RiskCard";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ArrowLeftRight, Waves, Wind } from "lucide-react";

interface ComparisonCardProps {
  assessments: RiskAssessmentData[];
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ assessments }) => {
  if (!assessments || assessments.length < 2) return null;

  const [a1, a2] = assessments;

  const getMetric = (a: RiskAssessmentData, key: string): number | null => {
    const f = a.factors?.find((item) => item.key === key);
    return f && f.value !== null && f.value !== undefined ? Number(f.value) : null;
  };

  const w1 = getMetric(a1, "wave_height_m");
  const w2 = getMetric(a2, "wave_height_m");
  const wind1 = getMetric(a1, "wind_speed_kmh");
  const wind2 = getMetric(a2, "wind_speed_kmh");

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-4 shadow-card text-left flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <ArrowLeftRight className="h-4 w-4 text-primary shrink-0" />
        <h3 className="text-sm font-semibold text-ink">Port Conditions Comparison</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 divide-x divide-border">
        {/* Port 1 */}
        <div className="flex flex-col gap-2 pr-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-ink-muted">
              {a1.location.lat.toFixed(2)}°N, {a1.location.lon.toFixed(2)}°E
            </span>
            <RiskBadge level={a1.level} size="sm" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink">
            <Waves className="h-3.5 w-3.5 text-water-deep" />
            <span>Waves: <strong>{w1 !== null ? `${w1.toFixed(1)} m` : "N/A"}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink">
            <Wind className="h-3.5 w-3.5 text-sky-500" />
            <span>Wind: <strong>{wind1 !== null ? `${Math.round(wind1)} km/h` : "N/A"}</strong></span>
          </div>
        </div>

        {/* Port 2 */}
        <div className="flex flex-col gap-2 pl-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-ink-muted">
              {a2.location.lat.toFixed(2)}°N, {a2.location.lon.toFixed(2)}°E
            </span>
            <RiskBadge level={a2.level} size="sm" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink">
            <Waves className="h-3.5 w-3.5 text-water-deep" />
            <span>Waves: <strong>{w2 !== null ? `${w2.toFixed(1)} m` : "N/A"}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink">
            <Wind className="h-3.5 w-3.5 text-sky-500" />
            <span>Wind: <strong>{wind2 !== null ? `${Math.round(wind2)} km/h` : "N/A"}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
