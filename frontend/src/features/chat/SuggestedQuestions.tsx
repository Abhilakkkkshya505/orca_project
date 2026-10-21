import React from "react";
import { Sparkles } from "lucide-react";

interface SuggestedQuestionsProps {
  currentPortName?: string;
  onSelect: (questionText: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  currentPortName,
  onSelect,
  disabled = false,
}) => {
  // Real popular ports dynamically rotated, avoiding hardcoded Kochi
  const port = currentPortName || "Mumbai";

  const suggestions = [
    `Is it safe off ${port} tomorrow morning?`,
    `Are there any active cyclone warnings near ${port}?`,
    `Where are the best fishing zones around ${port}?`,
    `Compare wave heights between ${port} and Mangalore tomorrow`,
  ];

  return (
    <div className="px-4 py-2 bg-surface flex flex-wrap items-center gap-1.5 border-b border-border">
      <div className="flex items-center gap-1 text-[11px] font-medium text-ink-muted shrink-0 mr-1">
        <Sparkles className="h-3 w-3 text-primary" />
        <span>Suggestions:</span>
      </div>

      <div className="flex flex-wrap gap-1.5 overflow-x-auto py-1">
        {suggestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            disabled={disabled}
            className="text-xs px-2.5 py-1 rounded-full bg-surface-raised hover:bg-water/50 border border-border text-ink hover:text-primary transition-all text-left whitespace-nowrap focus-visible:outline-focus disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
