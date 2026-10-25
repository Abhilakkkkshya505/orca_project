import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to coastal light mode" : "Switch to deep ocean dark mode"}
      title={isDark ? "Switch to Coastal Light Mode" : "Switch to Deep Ocean Dark Mode"}
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl border border-border bg-surface-raised hover:bg-surface text-ink transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs group focus-visible:outline-2 focus-visible:outline-focus ${className}`}
    >
      <div className="relative h-4 w-4 shrink-0 flex items-center justify-center">
        {/* Sun Icon (shown in dark mode) */}
        <Sun
          className={`h-4 w-4 text-[#F59E0B] transition-all duration-300 transform ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
          aria-hidden="true"
        />

        {/* Moon Icon (shown in light mode) */}
        <Moon
          className={`h-4 w-4 text-[#1E88E5] transition-all duration-300 transform ${
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute"
              : "rotate-0 scale-100 opacity-100"
          }`}
          aria-hidden="true"
        />
      </div>

      {showLabel && (
        <span className="text-xs font-semibold text-ink capitalize">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};
