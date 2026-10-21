import React from "react";
import { Database } from "lucide-react";

interface SourceChipsProps {
  sources?: string[];
  dataAgeHours?: number | null;
  className?: string;
}

export const SourceChips: React.FC<SourceChipsProps> = ({
  sources = ["Open-Meteo", "NOAA ERDDAP", "IMD"],
  dataAgeHours = 1.2,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-1 text-[11px] text-ink-muted ${className}`}>
      <div className="flex items-center gap-1 font-mono">
        <Database className="h-3 w-3 text-primary" />
        <span>Telemetry:</span>
      </div>

      {sources.map((src) => (
        <span
          key={src}
          className="px-1.5 py-0.5 rounded bg-surface-raised border border-border text-[10px] font-medium text-ink uppercase"
        >
          {src}
        </span>
      ))}

      {dataAgeHours !== null && dataAgeHours !== undefined && (
        <span className="text-[10px] font-mono ml-1">
          ({dataAgeHours.toFixed(1)}h ago)
        </span>
      )}
    </div>
  );
};
