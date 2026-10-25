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
export function generateWavePath(width: number, height: number, amplitude: number, wavelength: number): string {
  const baseline = height * 0.55;
  if (amplitude <= 0) {
    return `M 0,${baseline} L ${width},${baseline} L ${width},${height} L 0,${height} Z`;
  }

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

/**
 * Generates an SVG path string for the crisp white wave crest / foam line.
 */
export function generateWaveCrestPath(width: number, height: number, amplitude: number, wavelength: number): string {
  const baseline = height * 0.55;
  if (amplitude <= 0) {
    return `M 0,${baseline} L ${width},${baseline}`;
  }

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
  height,
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

  const containerHeight = height ?? (compact ? 80 : 160);
  const containerWidth = 600;

  const ampMid = computeWaveAmplitude(containerHeight, waveHeightM);
  const ampBack = computeWaveAmplitude(containerHeight, swellHeightM ?? (waveHeightM ? waveHeightM * 0.7 : null));
  const ampFront = Math.max(0, ampMid * 0.75);

  const durationMid = computeWaveDuration(wavePeriodS);
  const durationBack = computeWaveDuration(swellPeriodS ?? (wavePeriodS ? wavePeriodS * 1.3 : 10));
  const durationFront = Math.max(3, durationMid * 0.8);

  const shouldAnimate = hasData && !prefersReducedMotion && !isPaused && isIntersecting;

  const pathBack = useMemo(
    () => generateWavePath(containerWidth * 2, containerHeight, ampBack, 160),
    [containerHeight, ampBack]
  );
  const crestBack = useMemo(
    () => generateWaveCrestPath(containerWidth * 2, containerHeight, ampBack, 160),
    [containerHeight, ampBack]
  );

  const pathMid = useMemo(
    () => generateWavePath(containerWidth * 2, containerHeight, ampMid, 120),
    [containerHeight, ampMid]
  );
  const crestMid = useMemo(
    () => generateWaveCrestPath(containerWidth * 2, containerHeight, ampMid, 120),
    [containerHeight, ampMid]
  );

  const pathFront = useMemo(
    () => generateWavePath(containerWidth * 2, containerHeight, ampFront, 90),
    [containerHeight, ampFront]
  );
  const crestFront = useMemo(
    () => generateWaveCrestPath(containerWidth * 2, containerHeight, ampFront, 90),
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

      {/* SVG Canvas Container with Sky & Deep Ocean Backdrop */}
      <div
        className="relative w-full overflow-hidden bg-gradient-to-b from-[#EBF5FB] via-[#D4E6F1] to-[#A9CCE3] dark:from-[#091524] dark:via-[#0D2036] dark:to-[#102A45]"
        style={{ height: `${containerHeight}px` }}
      >
        {/* SVG Definition Gradients for Blue & White Marine Wave Palette */}
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            {/* Swell Layer: Deep Atlantic Indigo */}
            <linearGradient id="swellBlueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
            </linearGradient>

            {/* Mid Wave Layer: Vibrant Marine Cerulean */}
            <linearGradient id="midWaveBlueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.88" />
              <stop offset="60%" stopColor="#0369A1" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.98" />
            </linearGradient>

            {/* Front Wave Layer: Luminous Azure Blue */}
            <linearGradient id="frontWaveBlueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.96" />
              <stop offset="35%" stopColor="#0EA5E9" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>

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
                y1={containerHeight * 0.55}
                x2={containerWidth}
                y2={containerHeight * 0.55}
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>
            <span className="text-xs font-medium text-ink-muted">No recent ocean data</span>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {/* Swell layer (back) with soft white crest highlight */}
            <svg
              className="absolute left-0 top-0 h-full w-[200%]"
              data-layer="back-swell"
              viewBox={`0 0 ${containerWidth * 2} ${containerHeight}`}
              preserveAspectRatio="none"
              style={{
                animation: shouldAnimate ? `orca-wave-pan ${durationBack}s linear infinite` : "none",
              }}
              aria-hidden="true"
            >
              <path d={pathBack} fill="url(#swellBlueGrad)" />
              <path d={crestBack} fill="none" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.35" />
            </svg>

            {/* Mid wave layer with medium white crest foam */}
            <svg
              className="absolute left-0 top-0 h-full w-[200%]"
              data-layer="mid-wave"
              viewBox={`0 0 ${containerWidth * 2} ${containerHeight}`}
              preserveAspectRatio="none"
              style={{
                animation: shouldAnimate ? `orca-wave-pan ${durationMid}s linear infinite reverse` : "none",
              }}
              aria-hidden="true"
            >
              <path d={pathMid} fill="url(#midWaveBlueGrad)" />
              <path d={crestMid} fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeOpacity="0.6" />
            </svg>

            {/* Front wind-wave layer with crisp, bright white foam crest */}
            <svg
              className="absolute left-0 top-0 h-full w-[200%]"
              data-layer="front-wind"
              viewBox={`0 0 ${containerWidth * 2} ${containerHeight}`}
              preserveAspectRatio="none"
              style={{
                animation: shouldAnimate ? `orca-wave-pan ${durationFront}s linear infinite` : "none",
              }}
              aria-hidden="true"
            >
              <path d={pathFront} fill="url(#frontWaveBlueGrad)" />
              <path
                d={crestFront}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeOpacity="0.95"
              />
            </svg>

            {/* Bobbing Red & White Coastal Fishing Vessel locked to wave phase */}
            <div
              className="absolute left-1/3 top-[54%] -translate-x-1/2 -translate-y-1/2 transition-transform pointer-events-none z-10"
              style={{
                animation: shouldAnimate
                  ? `orca-bob ${durationFront}s ease-in-out infinite`
                  : "none",
                transform: `translateY(${ampMid * 0.28}px)`,
              }}
              aria-hidden="true"
            >
              <svg width="42" height="34" viewBox="0 0 42 34" fill="none" className="drop-shadow-md">
                {/* Slender Rigging Mast */}
                <line x1="20" y1="3" x2="20" y2="21" stroke="#E2E8F0" strokeWidth="1.75" strokeLinecap="round" />
                <line x1="8" y1="21" x2="20" y2="7" stroke="#CBD5E1" strokeWidth="0.8" strokeOpacity="0.75" />
                <line x1="34" y1="21" x2="20" y2="7" stroke="#CBD5E1" strokeWidth="0.8" strokeOpacity="0.75" />

                {/* Bright Red Maritime Pennant */}
                <polygon points="20,3 28,6 20,9" fill="#EF4444" stroke="#DC2626" strokeWidth="0.5" />

                {/* Arctic White Deck Wheelhouse */}
                <rect x="14" y="12" width="12" height="9" rx="1.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
                {/* Tinted Wheelhouse Windows */}
                <rect x="16" y="14" width="3.2" height="4" rx="0.5" fill="#0F172A" />
                <rect x="20.8" y="14" width="3.2" height="4" rx="0.5" fill="#0F172A" />

                {/* Vibrant Maritime Red Hull */}
                <path
                  d="M5 21 L37 21 C35.5 26.5 31 30 26 30 L16 30 C11 30 6.5 26.5 5 21 Z"
                  fill="#EF4444"
                  stroke="#DC2626"
                  strokeWidth="1"
                />

                {/* Crisp White Deck Sheer / Waterline Stripe */}
                <path
                  d="M5 21 L37 21"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Lower Hull Crimson Shadow */}
                <path
                  d="M10 26 L32 26 C30 28.5 27 30 24 30 L18 30 C15 30 12 28.5 10 26 Z"
                  fill="#B91C1C"
                  opacity="0.75"
                />

                {/* White & Red Safety Life Ring on Wheelhouse Wall */}
                <circle cx="23" cy="19.5" r="2" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Caption Footnote */}
      <div className="border-t border-border/60 bg-surface/80 px-3 py-1.5 text-[11px] text-ink-muted">
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
          0%, 100% { transform: translate3d(-50%, -${Math.max(3, ampMid * 0.45)}px, 0) rotate(-6deg); }
          50% { transform: translate3d(-50%, ${Math.max(3, ampMid * 0.45)}px, 0) rotate(6deg); }
        }
      `}</style>
    </div>
  );
};
