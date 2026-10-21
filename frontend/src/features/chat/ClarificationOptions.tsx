import React from "react";
import { MapPin, ChevronRight } from "lucide-react";
import type { ClarificationOptionData } from "./useChatStream";

interface ClarificationOptionsProps {
  options: ClarificationOptionData[];
  onSelect: (option: ClarificationOptionData) => void;
  disabled?: boolean;
}

export const ClarificationOptions: React.FC<ClarificationOptionsProps> = ({
  options,
  onSelect,
  disabled = false,
}) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-raised border border-border mt-2">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
        Select Port or Location
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt, idx) => (
          <button
            key={opt.slug || `${opt.name}-${idx}`}
            onClick={() => onSelect(opt)}
            disabled={disabled}
            className="flex items-center justify-between p-2.5 rounded bg-surface hover:bg-water/40 border border-border-strong text-left transition-colors group focus-visible:outline-focus disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink group-hover:text-primary">
                  {opt.name}
                </p>
                {opt.distance_hint && (
                  <p className="text-xs text-ink-muted">{opt.distance_hint}</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-ink-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
};
