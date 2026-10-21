import React, { useEffect, useRef, useState, useMemo } from "react";
import { Pause, Play } from "lucide-react";

export interface SeaStateProps {
  waveHeightM?: number | null;
  wavePeriodS?: number | null;
  swellHeightM?: number | null;
  swellPeriodS?: number | null;
  windKmh?: number | null;
  portName?: string;
  validWindow?: string;
  dataAge?: string;
  dataAgeMinutes?: number | null;
  height?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Computes WMO Douglas Sea Scale description according to WMO Code Table 3700.
 */
export function getWmoSeaState(waveHeightM: number | null | undefined): string {
  if (waveHeightM == null || isNaN(waveHeightM)) return "Unknown";
  if (waveHeightM === 0) return "Calm (glassy)";
  if (waveHeightM <= 0.1) return "Calm (rippled)";
  if (waveHeightM <= 0.5) return "Smooth";
  if (waveHeightM <= 1.25) return "Slight";
  if (waveHeightM <= 2.5) return "Moderate";
  if (waveHeightM <= 4.0) return "Rough";
  if (waveHeightM <= 6.0) return "Very rough";
  if (waveHeightM <= 9.0) return "High";
  if (waveHeightM <= 14.0) return "Very high";
  return "Phenomenal";
}

/**
 * Amplitude mapping formula:
 * ampPx = clamp(containerHeight * 0.08 * (H^0.7), 2, containerHeight * 0.35)
 */
export function computeWaveAmplitude(containerHeight: number, waveHeightM: number | null | undefined): number {
  if (waveHeightM == null || waveHeightM <= 0) return 0;
  const rawAmp = containerHeight * 0.08 * Math.pow(waveHeightM, 0.7);
  return Math.max(2, Math.min(rawAmp, containerHeight * 0.35));
}

/**
 * Scroll duration derived from real wave period:
 * duration = clamp(period, 3, 14) seconds
 */
export function computeWaveDuration(periodS: number | null | undefined): number {
  if (periodS == null || periodS <= 0) return 8;
  return Math.max(3, Math.min(periodS, 14));
}

/**
 * Generates an SVG cubic bezier path string representing sinusoidal wave crests.
 */
function generateWavePath(width: number, height: number, amplitude: number, wavelength: number): string {
  if (amplitude <= 0) {
    return `M 0,${height / 2} L ${width},${height / 2} L ${width},${height} L 0,${height} Z`;
  }

  const baseline = height * 0.55;
  let d = `M 0,${baseline}`;

  let x = 0;
  while (x < width) {
    const half = wavelength / 2;
    const cp1x = x + half / 2;
    const cp1y = baseline - amplitude;
    const cp2x = x + half / 2;
    const cp2y = baseline + amplitude;
    const endX = Math.min(x + wavelength, width);

    d += ` Q ${cp1x},${cp1y} ${x + half},${baseline} Q ${cp2x},${cp2y} ${endX},${baseline}`;
    x += wavelength;
  }

  d += ` L ${width},${height} L 0,${height} Z`;
  return d;
}

export const SeaState: React.FC<SeaStateProps> = ({
  waveHeightM,
  wavePeriodS,
  swellHeightM,
  swellPeriodS,
  windKmh,
  portName = "Sample Port",
  validWindow = "Current",
  dataAge = "1 h old",
  compact = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Monitor prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Pause animation when offscreen via IntersectionObserver
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pause when browser tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsIntersecting(false);
      } else {
        setIsIntersecting(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const hasData = waveHeightM != null && !isNaN(waveHeightM);
  const seaStateLabel = getWmoSeaState(waveHeightM);

  const containerHeight = compact ? 80 : 160;
  const containerWidth = 600;

  const ampMid = computeWaveAmplitude(containerHeight, waveHeightM);
  const ampBack = computeWaveAmplitude(containerHeight, swellHeightM ?? (waveHeightM ? waveHeightM * 0.7 : null));
  const ampFront = Math.max(0, ampMid * 0.7);

  const durationMid = computeWaveDuration(wavePeriodS);
  const durationBack = computeWaveDuration(swellPeriodS ?? (wavePeriodS ? wavePeriodS * 1.3 : 10));
  const durationFront = Math.max(3, durationMid * 0.8);

  const shouldAnimate = hasData && !prefersReducedMotion && !isPaused && isIntersecting;

  const pathBack = useMemo(
    () => generateWavePath(containerWidth * 2, containerHeight, ampBack, 160),
    [containerHeight, ampBack]
  );
  const pathMid = useMemo(
    () => generateWavePath(containerWidth * 2, containerHeight, ampMid, 120),
    [containerHeight, ampMid]
  );
  const pathFront = useMemo(
    () => generateWavePath(containerWidth * 2, containerHeight, ampFront, 90),
    [containerHeight, ampFront]
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded border border-border bg-surface text-ink text-left ${className}`}
      role="region"
      aria-label={`Sea State visualization for ${portName}: ${seaStateLabel}`}
    >
      {/* Header bar / Metadata */}
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">{portName}</span>
          <span className="text-ink-muted">•</span>
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink">
            {seaStateLabel}
          </span>
        </div>

        {hasData && (
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline-focus"
            aria-label={isPaused ? "Play wave animation" : "Pause wave animation"}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            <span>{isPaused ? "Play" : "Pause"}</span>
          </button>
        )}
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden" style={{ height: `${containerHeight}px` }}>
        {!hasData ? (
          // Calm flat line for missing data
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <svg
              className="w-full"
              height={containerHeight}
              viewBox={`0 0 ${containerWidth} ${containerHeight}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1={containerHeight / 2}
                x2={containerWidth}
                y2={containerHeight / 2}
                stroke="var(--color-border-strong)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>
            <span className="text-xs font-medium text-ink-muted">No recent ocean data</span>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {/* Swell layer (back) */}
            <svg
              className="absolute left-0 top-0 h-full w-[200%]"
              data-layer="back-swell"
              viewBox={`0 0 ${containerWidth * 2} ${containerHeight}`}
              preserveAspectRatio="none"
              style={{
                animation: shouldAnimate ? `orca-wave-pan ${durationBack}s linear infinite` : "none",
                opacity: 0.45,
              }}
              aria-hidden="true"
            >
              <path d={pathBack} fill="var(--color-water)" />
            </svg>

            {/* Mid wave layer */}
            <svg
              className="absolute left-0 top-0 h-full w-[200%]"
              data-layer="mid-wave"
              viewBox={`0 0 ${containerWidth * 2} ${containerHeight}`}
              preserveAspectRatio="none"
              style={{
                animation: shouldAnimate ? `orca-wave-pan ${durationMid}s linear infinite reverse` : "none",
                opacity: 0.65,
              }}
              aria-hidden="true"
            >
              <path d={pathMid} fill="var(--color-water)" />
            </svg>

            {/* Front wind-wave layer */}
            <svg
              className="absolute left-0 top-0 h-full w-[200%]"
              data-layer="front-wind"
              viewBox={`0 0 ${containerWidth * 2} ${containerHeight}`}
              preserveAspectRatio="none"
              style={{
                animation: shouldAnimate ? `orca-wave-pan ${durationFront}s linear infinite` : "none",
                opacity: 0.85,
              }}
              aria-hidden="true"
            >
              <path d={pathFront} fill="var(--color-water)" />
            </svg>

            {/* Bobbing Vessel / Buoy locked to front wave phase */}
            <div
              className="absolute left-1/3 top-[50%] -translate-x-1/2 -translate-y-1/2 transition-transform pointer-events-none"
              style={{
                animation: shouldAnimate
                  ? `orca-bob ${durationFront}s ease-in-out infinite`
                  : "none",
                transform: `translateY(${ampMid * 0.3}px)`,
              }}
              aria-hidden="true"
            >
              <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                {/* Minimalist coastal fishing vessel / buoy */}
                <path
                  d="M4 14 L20 14 L17 18 L7 18 Z"
                  fill="var(--color-surface-raised)"
                  stroke="var(--color-border-strong)"
                  strokeWidth="1.2"
                />
                <rect x="11" y="7" width="3" height="7" fill="var(--color-border-strong)" />
                <polygon points="14,8 18,10 14,12" fill="var(--color-focus)" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Caption Footnote */}
      <div className="border-t border-border/60 bg-surface/80 px-3 py-1 text-[11px] text-ink-muted">
        {hasData ? (
          <span>
            Illustrative, not to scale. Forecast:{" "}
            <strong className="text-ink font-semibold">{waveHeightM.toFixed(1)} m</strong> wave,{" "}
            {wavePeriodS ? `${Math.round(wavePeriodS)} s period, ` : ""}
            {windKmh ? `${Math.round(windKmh)} km/h wind, ` : ""}
            valid {validWindow}, data {dataAge}.
          </span>
        ) : (
          <span>No recent ocean data available for this sector.</span>
        )}
      </div>

      {/* Inline styles for GPU-accelerated animations */}
      <style>{`
        @keyframes orca-wave-pan {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes orca-bob {
          0%, 100% { transform: translate3d(-50%, -${Math.max(2, ampMid * 0.4)}px, 0) rotate(-4deg); }
          50% { transform: translate3d(-50%, ${Math.max(2, ampMid * 0.4)}px, 0) rotate(4deg); }
        }
      `}</style>
    </div>
  );
};
