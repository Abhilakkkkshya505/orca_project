"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme/ThemeContext";

export interface PlinthTallyProps {
  /** The text or acronym to display, e.g. "ORCA" */
  text?: string;
  /** Numeric or text value alternative */
  value?: string | number;
  /** Size scale */
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  /** Extrusion depth in pixels (default: 16) */
  depth?: number;
  /** Custom gradient for the top face [startColor, endColor] */
  faceGradient?: [string, string];
  /** Color of the extruded side walls */
  wallColor?: string;
  /** Maximum tilt angle in degrees (default: 18) */
  tiltIntensity?: number;
  /** Enable mouse hover / pointer tilt tracking (default: true) */
  interactive?: boolean;
  /** Stagger vertical lift per letter on hover (default: true) */
  staggerHover?: boolean;
  /** Optional subtitle or category indicator below the glyphs */
  subtitle?: string;
  /** Enable subtle ocean aura glow beneath the plinth (default: true) */
  glow?: boolean;
  /** Additional container classes */
  className?: string;
  /** Custom container style */
  style?: React.CSSProperties;
}

export const PlinthTally: React.FC<PlinthTallyProps> = ({
  text,
  value,
  size = "hero",
  depth = 16,
  faceGradient,
  wallColor,
  tiltIntensity = 18,
  interactive = true,
  staggerHover = true,
  subtitle,
  glow = true,
  className = "",
  style,
}) => {
  const displayText = String(text ?? value ?? "ORCA");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth lerp state for 3D tilt
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [lightOffset, setLightOffset] = useState({ x: 50, y: 50 });
  const animFrameRef = useRef<number | null>(null);

  // Sizing tokens
  const sizeConfig = {
    sm: {
      fontSize: "text-lg sm:text-xl",
      padding: "px-2 py-1",
      letterGap: "gap-1",
      charWidth: "w-6 sm:w-7 h-8 sm:h-9",
      depthMultiplier: 0.4,
      subText: "text-[9px]",
    },
    md: {
      fontSize: "text-2xl sm:text-3xl",
      padding: "px-3 py-2",
      letterGap: "gap-2",
      charWidth: "w-9 sm:w-11 h-12 sm:h-14",
      depthMultiplier: 0.6,
      subText: "text-[10px]",
    },
    lg: {
      fontSize: "text-4xl sm:text-5xl",
      padding: "px-4 py-3",
      letterGap: "gap-2.5 sm:gap-3",
      charWidth: "w-14 sm:w-16 h-18 sm:h-20",
      depthMultiplier: 0.8,
      subText: "text-xs",
    },
    xl: {
      fontSize: "text-5xl sm:text-6xl",
      padding: "px-5 py-4",
      letterGap: "gap-3 sm:gap-4",
      charWidth: "w-18 sm:w-20 h-22 sm:h-26",
      depthMultiplier: 1.0,
      subText: "text-xs",
    },
    hero: {
      fontSize: "text-5xl sm:text-7xl lg:text-8xl",
      padding: "px-3 sm:px-6 py-3 sm:py-5",
      letterGap: "gap-2 sm:gap-4 lg:gap-5",
      charWidth: "w-16 sm:w-24 lg:w-28 h-20 sm:h-32 lg:h-36",
      depthMultiplier: 1.25,
      subText: "text-xs sm:text-sm",
    },
  }[size];

  const actualDepth = Math.max(4, Math.round(depth * sizeConfig.depthMultiplier));

  // Colors based on theme
  const defaultGradient: [string, string] = isDark
    ? ["#4DA3FF", "#7DE2D1"]
    : ["#0F4C81", "#1E88E5"];
  const [gradStart, gradEnd] = faceGradient ?? defaultGradient;

  const resolvedWallColor =
    wallColor ?? (isDark ? "rgba(10, 37, 64, 0.95)" : "rgba(15, 76, 129, 0.85)");
  const plinthBaseBg = isDark
    ? "bg-slate-900/80 border-slate-700/60 shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
    : "bg-white/80 border-slate-200/80 shadow-[0_12px_36px_rgba(15,76,129,0.12)]";

  // Animation loop with smooth damping
  const updatePhysics = useCallback(() => {
    const ease = 0.12;
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * ease;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * ease;

    setRotation({
      x: Number(currentRotation.current.x.toFixed(2)),
      y: Number(currentRotation.current.y.toFixed(2)),
    });

    const isClose =
      Math.abs(targetRotation.current.x - currentRotation.current.x) < 0.05 &&
      Math.abs(targetRotation.current.y - currentRotation.current.y) < 0.05;

    if (!isClose || isHovered) {
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    } else {
      animFrameRef.current = null;
    }
  }, [isHovered]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    // Map to -1 .. 1
    const normX = (x - 0.5) * 2;
    const normY = (y - 0.5) * 2;

    targetRotation.current = {
      x: -normY * tiltIntensity,
      y: normX * tiltIntensity,
    };

    setLightOffset({
      x: Math.round(x * 100),
      y: Math.round(y * 100),
    });

    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    }
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setHoveredIndex(null);
    targetRotation.current = { x: 0, y: 0 };
    setLightOffset({ x: 50, y: 50 });
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    }
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Generate multi-layer extrusion shadows to form a solid 3D beveled block letter
  const generateExtrusionStyle = (depthPx: number) => {
    const shadows: string[] = [];
    const step = 1;
    for (let i = 1; i <= depthPx; i += step) {
      const alpha = Math.max(0.2, 0.95 - (i / depthPx) * 0.4);
      const color = isDark
        ? `rgba(7, 26, 47, ${alpha})`
        : `rgba(10, 42, 67, ${alpha})`;
      shadows.push(`0px ${i}px 0px ${color}`);
    }
    // Ambient drop shadow beneath the 3D extrusion
    shadows.push(`0px ${depthPx + 4}px 12px rgba(0, 0, 0, ${isDark ? 0.6 : 0.25})`);
    shadows.push(`0px ${depthPx + 14}px 24px rgba(77, 163, 255, ${isDark ? 0.2 : 0.1})`);
    return shadows.join(", ");
  };

  const textShadowExtrusion = generateExtrusionStyle(actualDepth);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      style={{
        perspective: "1200px",
        ...style,
      }}
      aria-label={displayText}
    >
      {/* Background Aura Glow */}
      {glow && (
        <div
          className="absolute -inset-4 sm:-inset-6 rounded-3xl opacity-60 dark:opacity-40 blur-2xl pointer-events-none transition-opacity duration-500"
          style={{
            background: isDark
              ? `radial-gradient(ellipse at ${lightOffset.x}% ${lightOffset.y}%, rgba(77, 163, 255, 0.35), rgba(125, 226, 209, 0.15), transparent 70%)`
              : `radial-gradient(ellipse at ${lightOffset.x}% ${lightOffset.y}%, rgba(30, 136, 229, 0.2), rgba(77, 208, 225, 0.1), transparent 70%)`,
          }}
        />
      )}

      {/* 3D Tilting Stage Container */}
      <div
        className="relative flex flex-col items-center transition-transform duration-75 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Glyph Plinth Slabs Row */}
        <div
          className={`flex items-center justify-center ${sizeConfig.letterGap}`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {displayText.split("").map((char, index) => {
            const isCharHovered = hoveredIndex === index;
            // Lift each character slightly on individual hover
            const liftZ = staggerHover && isCharHovered ? 16 : isHovered ? 6 : 0;
            const liftY = staggerHover && isCharHovered ? -8 : 0;

            return (
              <div
                key={`${char}-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`relative flex items-center justify-center font-heading font-black tracking-tight ${sizeConfig.charWidth} ${sizeConfig.fontSize} cursor-pointer transition-all duration-200`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${liftZ}px) translateY(${liftY}px)`,
                }}
              >
                {/* Plinth Foundation Pedestal (The physical slab beneath each letter) */}
                <div
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl border backdrop-blur-md transition-all duration-300 ${plinthBaseBg}`}
                  style={{
                    transform: "translateZ(-8px)",
                    boxShadow: isDark
                      ? `0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)`
                      : `0 10px 24px rgba(15, 76, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
                  }}
                >
                  {/* Subtle specular rim reflection responding to cursor */}
                  <div
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-40 pointer-events-none"
                    style={{
                      background: `linear-gradient(${120 + rotation.y * 2}deg, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                    }}
                  />
                  {/* Tally tick marks on pedestal bottom */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-40">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    <span className="w-2.5 h-0.5 rounded-full bg-secondary" />
                    <span className="w-1 h-1 rounded-full bg-primary" />
                  </div>
                </div>

                {/* 3D Extruded Character Glyphs */}
                <span
                  className="relative font-mono sm:font-heading font-black tracking-tighter transition-all duration-150 inline-block text-center"
                  style={{
                    background: `linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: textShadowExtrusion,
                    filter: `drop-shadow(0px 1px 1px ${resolvedWallColor})`,
                    transform: "translateZ(8px)",
                  }}
                >
                  {char}
                </span>

                {/* Interactive Dynamic Specular Glint */}
                <div
                  className="absolute inset-x-2 top-2 h-1/2 rounded-t-xl pointer-events-none opacity-25 mix-blend-overlay"
                  style={{
                    background: `radial-gradient(circle at ${lightOffset.x}% ${lightOffset.y}%, #ffffff 0%, transparent 70%)`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Optional Plinth Tally Base Bar & Subtitle */}
        {subtitle && (
          <div
            className={`mt-2.5 sm:mt-3 px-3 py-1 rounded-full border border-border/80 backdrop-blur-md bg-surface/80 dark:bg-[#0B2447]/80 text-ink-muted font-mono uppercase tracking-widest font-semibold flex items-center gap-2 shadow-xs ${sizeConfig.subText}`}
            style={{
              transform: "translateZ(4px)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            <span>{subtitle}</span>
            <span className="opacity-40">•</span>
            <span className="text-primary font-bold">PLINTH TALLY</span>
          </div>
        )}
      </div>

      {/* Screen Reader Accessible Label */}
      <span className="sr-only">{displayText}</span>
    </div>
  );
};

export default PlinthTally;
