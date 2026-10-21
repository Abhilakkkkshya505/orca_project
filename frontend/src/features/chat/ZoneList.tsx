import React from "react";
import { Fish, Target } from "lucide-react";

export interface FishingZoneItem {
  id: string;
  lat: number;
  lon: number;
  score: number;
  risk_level: string;
  origin?: string;
}

interface ZoneListProps {
  zones: FishingZoneItem[];
  className?: string;
}

export const ZoneList: React.FC<ZoneListProps> = ({ zones, className = "" }) => {
  if (!zones || zones.length === 0) return null;

  return (
    <div className={`p-3 rounded-lg bg-surface-raised border border-border flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
        <Fish className="h-4 w-4 text-emerald-500" />
        <span>Potential Fishing Zones (PFZ)</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {zones.map((z) => (
          <div
            key={z.id}
            className="flex items-center justify-between p-2 rounded bg-surface border border-border text-xs"
          >
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-ink-muted" />
              <span className="font-mono text-ink">
                {z.lat.toFixed(2)}°N, {z.lon.toFixed(2)}°E
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-muted uppercase">
                {z.origin || "orca_model"}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                Score {z.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
