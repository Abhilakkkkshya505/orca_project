import React from "react";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { RiskLevel } from "@/components/ui/risk-icons";

export interface FactorData {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  level: RiskLevel;
  caution_at: number | null;
  unsafe_at: number | null;
  source: string;
  observed_at?: string | null;
  data_age_minutes?: number | null;
}

interface FactorRowProps {
  factor: FactorData;
}

export const FactorRow: React.FC<FactorRowProps> = ({ factor }) => {
  const { label, value, unit, level, caution_at, unsafe_at } = factor;

  // Calculate percentage along safe -> caution -> unsafe threshold range
  let progressPct = 0;
  if (value !== null && unsafe_at && unsafe_at > 0) {
    progressPct = Math.min(100, Math.max(0, (value / (unsafe_at * 1.2)) * 100));
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-sm bg-surface-raised border border-border gap-2 text-left">
      <div className="flex-1">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="text-sm font-medium text-ink">{label}</span>
          <RiskBadge level={level} size="sm" />
        </div>

        {/* Small bar showing position between caution and unsafe thresholds */}
        {value !== null && unsafe_at !== null && caution_at !== null && (
          <div className="w-full sm:max-w-xs mt-2" aria-hidden="true">
            <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  level === "unsafe"
                    ? "bg-risk-unsafe"
                    : level === "caution"
                    ? "bg-risk-caution"
                    : "bg-risk-safe"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-ink-muted mt-1 font-mono">
              <span>0</span>
              <span>Caution: {caution_at}{unit}</span>
              <span>Unsafe: {unsafe_at}{unit}</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-right shrink-0">
        <span className="text-base font-semibold font-mono tabular-nums text-ink">
          {value !== null ? `${value} ${unit}` : "No data"}
        </span>
      </div>
    </div>
  );
};
