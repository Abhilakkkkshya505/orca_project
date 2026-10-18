import React from "react";
import { RiskIcon, type RiskLevel } from "./risk-icons";

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md";
  className?: string;
}

const LEVEL_LABELS: Record<RiskLevel, string> = {
  safe: "Safe",
  caution: "Caution",
  unsafe: "Unsafe",
  unknown: "Unknown",
};

const LEVEL_STYLES: Record<RiskLevel, { text: string; bg: string; border: string }> = {
  safe: {
    text: "text-risk-safe",
    bg: "bg-risk-safe-bg",
    border: "border-risk-safe/30",
  },
  caution: {
    text: "text-risk-caution",
    bg: "bg-risk-caution-bg",
    border: "border-risk-caution/30",
  },
  unsafe: {
    text: "text-risk-unsafe",
    bg: "bg-risk-unsafe-bg",
    border: "border-risk-unsafe/30",
  },
  unknown: {
    text: "text-risk-unknown",
    bg: "bg-risk-unknown-bg",
    border: "border-risk-unknown/30",
  },
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = "md", className = "" }) => {
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.unknown;
  const label = LEVEL_LABELS[level] || LEVEL_LABELS.unknown;
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-sm border px-2.5 py-0.5 select-none ${
        size === "sm" ? "text-xs" : "text-sm"
      } ${style.bg} ${style.text} ${style.border} ${className}`}
      role="status"
      aria-label={`Risk assessment level: ${label}`}
    >
      <RiskIcon level={level} size={iconSize} />
      <span>{label}</span>
    </span>
  );
};
