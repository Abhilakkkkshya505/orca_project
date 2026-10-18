import React from "react";

export type RiskLevel = "safe" | "caution" | "unsafe" | "unknown";

interface RiskIconProps extends React.SVGProps<SVGSVGElement> {
  level: RiskLevel;
  size?: number;
}

/**
 * Custom SVG risk icons adhering strictly to docs/design.md:
 * - safe: check in circle (#1B6B3F / #7ED3A0)
 * - caution: triangle with exclamation bar (#7A4B00 / #F2C14E)
 * - unsafe: octagon with horizontal bar (#9F1D17 / #FF9E96)
 * - unknown: circle with question mark (#44596A / #A3B6C1)
 * Distinguishable by geometry and outline, never by colour alone.
 */
export const RiskIcon: React.FC<RiskIconProps> = ({ level, size = 20, className = "", ...props }) => {
  switch (level) {
    case "safe":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
          {...props}
        >
          {/* Circle with check */}
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "caution":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
          {...props}
        >
          {/* Triangle with bar */}
          <path d="M12 2 2 20h20L12 2z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );

    case "unsafe":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
          {...props}
        >
          {/* Octagon with horizontal stop bar */}
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );

    case "unknown":
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
          {...props}
        >
          {/* Circle with question mark */}
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
};
