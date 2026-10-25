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
  /** Extrusion depth in pixels (default: 8) */
  depth?: number;
  /** Custom gradient for the top face [startColor, endColor] */
  faceGradient?: [string, string];
  /** Color of the extruded side walls */
  wallColor?: string;
  /** Maximum tilt angle in degrees (default: 12) */
  tiltIntensity?: number;
  /** Enable mouse hover / pointer tilt tracking (default: true) */
  interactive?: boolean;
  /** Stagger vertical lift per letter on hover (default: false) */
  staggerHover?: boolean;
  /** Optional subtitle or category indicator below the glyphs */
  subtitle?: string;
  /** Enable subtle ocean aura glow beneath the plinth (default: false) */
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
  depth = 8,
  faceGradient,
  wallColor,
  tiltIntensity = 12,
  interactive = true,
  staggerHover = false,
  subtitle,
  glow = false,
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
  const animFrameRef = useRef<number | null>(null);

  // Sizing tokens — refined, architectural proportions
  const sizeConfig = {
    sm: {
      fontSize: "text-base sm:text-lg font-bold tracking-tight",
      padding: "px-1.5 py-0.5",
      letterGap: "gap-1",
      charWidth: "w-6 h-7 sm:w-7 sm:h-8",
      depthMultiplier: 0.5,
      subText: "text-[9px]",
    },
    md: {
      fontSize: "text-xl sm:text-2xl font-bold tracking-tight",
      padding: "px-2.5 py-1.5",
      letterGap: "gap-1.5",
      charWidth: "w-8 sm:w-10 h-10 sm:h-12",
      depthMultiplier: 0.7,
      subText: "text-[10px]",
    },
    lg: {
      fontSize: "text-3xl sm:text-4xl font-bold tracking-tight",
      padding: "px-3 py-2",
      letterGap: "gap-2",
      charWidth: "w-11 sm:w-13 h-14 sm:h-16",
      depthMultiplier: 0.85,
      subText: "text-xs",
    },
    xl: {
      fontSize: "text-4xl sm:text-5xl font-bold tracking-tight",
      padding: "px-4 py-3",
      letterGap: "gap-2.5 sm:gap-3",
      charWidth: "w-14 sm:w-16 h-18 sm:h-20",
      depthMultiplier: 1.0,
      subText: "text-xs",
    },
    hero: {
      fontSize: "text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
      padding: "px-3 sm:px-4 py-2 sm:py-3",
      letterGap: "gap-2 sm:gap-3",
      charWidth: "w-12 sm:w-18 lg:w-20 h-16 sm:h-22 lg:h-24",
      depthMultiplier: 1.0,
      subText: "text-xs font-mono",
    },
  }[size];

  const actualDepth = Math.max(3, Math.round(depth * sizeConfig.depthMultiplier));

  // Architectural colors: Clean ink with subtle ocean accent
  const defaultGradient: [string, string] = isDark
    ? ["#F8FAFC", "#38BDF8"]
    : ["#0F172A", "#0284C7"];
  const [gradStart, gradEnd] = faceGradient ?? defaultGradient;

  const resolvedWallColor =
    wallColor ?? (isDark ? "rgba(11, 15, 23, 0.9)" : "rgba(15, 23, 42, 0.7)");
  const plinthBaseBg = isDark
    ? "bg-[#131926] border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
    : "bg-white border-[#E7E5E4] shadow-[0_2px_8px_rgba(15,23,42,0.06)]";

  // Animation loop with smooth damping
  const updatePhysics = useCallback(() => {
    const ease = 0.15;
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
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const normX = (x - 0.5) * 2;
    const normY = (y - 0.5) * 2;

    targetRotation.current = {
      x: -normY * tiltIntensity,
      y: normX * tiltIntensity,
    };

    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    }
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setHoveredIndex(null);
    targetRotation.current = { x: 0, y: 0 };
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

  // Crisp, restrained extrusion depth without heavy neon blur
  const generateExtrusionStyle = (depthPx: number, wallCol: string) => {
    const shadows: string[] = [];
    const step = 1;
    for (let i = 1; i <= depthPx; i += step) {
      shadows.push(`0px ${i}px 0px ${wallCol}`);
    }
    // Crisp contact shadow
    shadows.push(`0px ${depthPx + 2}px 6px rgba(0, 0, 0, ${isDark ? 0.4 : 0.12})`);
    return shadows.join(", ");
  };

  const textShadowExtrusion = generateExtrusionStyle(actualDepth, resolvedWallColor);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`relative inline-flex flex-col select-none ${className}`}
      style={{
        perspective: "1000px",
        ...style,
      }}
      aria-label={displayText}
    >
      {/* Optional subtle aura glow */}
      {glow && (
        <div
          className="absolute -inset-2 rounded-xl opacity-20 pointer-events-none transition-opacity"
          style={{
            background: isDark
              ? "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)",
          }}
        />
      )}

      {/* 3D Tilting Stage Container */}
      <div
        className="relative flex flex-col transition-transform duration-75 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Glyph Plinth Slabs Row */}
        <div
          className={`flex items-center ${sizeConfig.letterGap}`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {displayText.split("").map((char, index) => {
            const isCharHovered = hoveredIndex === index;
            const liftZ = staggerHover && isCharHovered ? 6 : isHovered ? 2 : 0;
            const liftY = staggerHover && isCharHovered ? -3 : 0;

            return (
              <div
                key={`${char}-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`relative flex items-center justify-center font-heading ${sizeConfig.charWidth} ${sizeConfig.fontSize} cursor-pointer transition-transform duration-150`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${liftZ}px) translateY(${liftY}px)`,
                }}
              >
                {/* Plinth Pedestal Slab */}
                <div
                  className={`absolute inset-0 rounded-lg border transition-colors ${plinthBaseBg}`}
                  style={{
                    transform: "translateZ(-4px)",
                  }}
                />

                {/* 3D Extruded Character Glyphs */}
                <span
                  className="relative font-heading tracking-tight inline-block text-center"
                  style={{
                    background: `linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: textShadowExtrusion,
                    transform: "translateZ(4px)",
                  }}
                >
                  {char}
                </span>
              </div>
            );
          })}
        </div>

        {/* Optional Plinth Tally Base Bar & Subtitle */}
        {subtitle && (
          <div
            className={`mt-2.5 px-2.5 py-0.5 rounded-md border border-border bg-surface text-ink-muted uppercase tracking-wider font-medium flex items-center gap-1.5 w-fit ${sizeConfig.subText}`}
            style={{
              transform: "translateZ(2px)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{subtitle}</span>
          </div>
        )}
      </div>

      {/* Screen Reader Accessible Label */}
      <span className="sr-only">{displayText}</span>
    </div>
  );
};

export default PlinthTally;
