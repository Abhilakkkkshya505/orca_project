"use client";

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export interface NeonGlowButtonProps {
  to?: string;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "cyan" | "emerald" | "amber" | "violet" | "marine";
  glowColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  pulse?: boolean;
}

const VARIANTS = {
  cyan: {
    color: "#00EEFF",
    border: "rgba(0, 238, 255, 0.45)",
    bg: "rgba(0, 238, 255, 0.08)",
    bgHover: "rgba(0, 238, 255, 0.16)",
    glow: "rgba(0, 238, 255, 0.35)",
    text: "#00EEFF",
    textLight: "#0284C7",
  },
  emerald: {
    color: "#00FF9D",
    border: "rgba(0, 255, 157, 0.45)",
    bg: "rgba(0, 255, 157, 0.08)",
    bgHover: "rgba(0, 255, 157, 0.16)",
    glow: "rgba(0, 255, 157, 0.35)",
    text: "#00FF9D",
    textLight: "#059669",
  },
  marine: {
    color: "#5FB4C7",
    border: "rgba(95, 180, 199, 0.5)",
    bg: "rgba(15, 92, 110, 0.2)",
    bgHover: "rgba(15, 92, 110, 0.35)",
    glow: "rgba(95, 180, 199, 0.4)",
    text: "#5FB4C7",
    textLight: "#0F5C6E",
  },
  amber: {
    color: "#FFB800",
    border: "rgba(255, 184, 0, 0.45)",
    bg: "rgba(255, 184, 0, 0.08)",
    bgHover: "rgba(255, 184, 0, 0.16)",
    glow: "rgba(255, 184, 0, 0.35)",
    text: "#FFB800",
    textLight: "#D97706",
  },
  violet: {
    color: "#B6A8F2",
    border: "rgba(182, 168, 242, 0.45)",
    bg: "rgba(182, 168, 242, 0.08)",
    bgHover: "rgba(182, 168, 242, 0.16)",
    glow: "rgba(182, 168, 242, 0.35)",
    text: "#B6A8F2",
    textLight: "#7C3AED",
  },
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-md",
  md: "px-4 py-2 text-xs gap-2 rounded-lg",
  lg: "px-5 py-2.5 text-sm gap-2.5 rounded-lg",
};

/**
 * Originkit Neon Glow Button
 * Delivers dynamic glowing perimeter, ambient volumetric aura, smooth spring interactions,
 * and high-contrast accessibility across both dark and light modes.
 */
export const NeonGlowButton: React.FC<NeonGlowButtonProps> = ({
  to,
  href,
  onClick,
  children,
  icon,
  variant = "cyan",
  glowColor,
  size = "sm",
  className = "",
  disabled = false,
  type = "button",
  pulse = true,
}) => {
  const v = VARIANTS[variant] || VARIANTS.cyan;
  const activeColor = glowColor || v.color;
  const sizeClasses = SIZES[size] || SIZES.sm;

  const content = (
    <>
      {/* Outer ambient blur aura */}
      <span
        className={`absolute inset-0 rounded-inherit opacity-70 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-md -z-10 ${
          pulse ? "animate-pulse" : ""
        }`}
        style={{
          backgroundColor: v.glow,
        }}
        aria-hidden="true"
      />

      {/* Subtle sweeping specular reflection */}
      <span
        className="absolute inset-0 rounded-inherit overflow-hidden pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"
        aria-hidden="true"
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </span>

      {/* Button content */}
      {icon && (
        <span
          className="shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ color: activeColor }}
        >
          {icon}
        </span>
      )}
      <span className="font-semibold tracking-wide flex items-center gap-1.5 text-ink dark:text-white">
        {children}
      </span>
      {/* Neon dot indicator */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
        style={{ backgroundColor: activeColor, color: activeColor }}
        aria-hidden="true"
      />
    </>
  );

  const sharedStyles: React.CSSProperties = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 0 14px ${v.glow}, inset 0 0 10px ${v.bg}`,
    borderColor: v.border,
    backgroundColor: v.bg,
  };

  const sharedClasses = `group font-sans border backdrop-blur-md transition-all duration-200 select-none ${sizeClasses} ${
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg"
  } ${className}`;

  if (to) {
    return (
      <motion.div
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className="inline-block"
      >
        <Link
          to={to}
          onClick={onClick as any}
          className={sharedClasses}
          style={sharedStyles}
          role="button"
          aria-disabled={disabled}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  if (href) {
    return (
      <motion.div
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className="inline-block"
      >
        <a
          href={href}
          onClick={onClick as any}
          className={sharedClasses}
          style={sharedStyles}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={sharedClasses}
      style={sharedStyles}
    >
      {content}
    </motion.button>
  );
};

export default NeonGlowButton;
