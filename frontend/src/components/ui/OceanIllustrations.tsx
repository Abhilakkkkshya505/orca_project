import React from "react";

/**
 * Modern flat/semi-flat vector ocean landscape illustration for the Hero section.
 * Includes gentle waves, distant coastal island with lighthouse, sleek sailboat,
 * subtle sea turtle / dolphin silhouette, and soaring seagulls.
 */
export const HeroOceanIllustration: React.FC<{ className?: string }> = ({ className = "w-full h-auto" }) => {
  return (
    <div className={`relative overflow-hidden select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 900 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm"
      >
        <defs>
          {/* Sky & Water Gradients */}
          <linearGradient id="skyGrad" x1="450" y1="0" x2="450" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#F2F8FC" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#E1F5FE" />
          </linearGradient>

          <linearGradient id="sunGlow" x1="720" y1="80" x2="720" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE082" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FFF9C4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="deepWaveGrad" x1="450" y1="360" x2="450" y2="520" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E88E5" />
            <stop offset="100%" stopColor="#0F4C81" />
          </linearGradient>

          <linearGradient id="midWaveGrad" x1="450" y1="330" x2="450" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4DD0E1" />
            <stop offset="100%" stopColor="#1E88E5" />
          </linearGradient>

          <linearGradient id="softWaveGrad" x1="450" y1="300" x2="450" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B2EBF2" />
            <stop offset="100%" stopColor="#81D4FA" />
          </linearGradient>

          <linearGradient id="islandGrad" x1="680" y1="230" x2="680" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#90CAF9" />
            <stop offset="100%" stopColor="#42A5F5" />
          </linearGradient>
        </defs>

        {/* Ambient Sun & Soft Coastal Atmosphere */}
        <circle cx="720" cy="150" r="100" fill="url(#sunGlow)" />
        <circle cx="720" cy="150" r="32" fill="#FFF8E1" fillOpacity="0.85" />

        {/* Soaring Seagulls */}
        <g stroke="#64B5F6" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.75">
          {/* Seagull 1 */}
          <path d="M260 110 Q272 100 284 110 Q296 100 308 110" />
          {/* Seagull 2 */}
          <path d="M330 85 Q340 76 350 85 Q360 76 370 85" transform="scale(0.85) translate(40, 10)" />
          {/* Seagull 3 */}
          <path d="M480 140 Q490 132 500 140 Q510 132 520 140" transform="scale(0.7) translate(180, 40)" />
        </g>

        {/* Distant Coastal Islands */}
        <path
          d="M580 320 C620 270 720 260 780 320 Z"
          fill="url(#islandGrad)"
          opacity="0.5"
        />
        <path
          d="M660 320 C700 280 770 275 830 320 Z"
          fill="#64B5F6"
          opacity="0.35"
        />

        {/* Modern Minimalist Coastal Lighthouse */}
        <g transform="translate(680, 240)">
          {/* Light Beams */}
          <polygon points="12,18 -180,-20 -180,40" fill="#FFF9C4" fillOpacity="0.25" />
          {/* Base Rock */}
          <path d="M-10 80 Q12 70 34 80 Z" fill="#37474F" opacity="0.6" />
          {/* Tower */}
          <polygon points="5,78 19,78 17,25 7,25" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="1.5" />
          <polygon points="8,45 16,45 15,35 9,35" fill="#FF8A65" />
          {/* Lantern Room */}
          <rect x="7" y="16" width="10" height="9" rx="1.5" fill="#FFE082" stroke="#0F4C81" strokeWidth="1.2" />
          {/* Dome Cap */}
          <path d="M7 16 Q12 10 17 16 Z" fill="#0F4C81" />
        </g>

        {/* Minimalist Sailboat */}
        <g transform="translate(180, 245)" className="animate-float-slow">
          {/* Hull */}
          <path d="M10 50 L55 50 Q48 60 30 60 Q15 60 10 50 Z" fill="#0F4C81" />
          {/* Main Mast */}
          <line x1="32" y1="50" x2="32" y2="12" stroke="#0F4C81" strokeWidth="2" strokeLinecap="round" />
          {/* Main Sail */}
          <path d="M34 16 L56 46 L34 46 Z" fill="#FFFFFF" stroke="#64B5F6" strokeWidth="1.2" />
          {/* Jib Sail */}
          <path d="M30 22 L14 46 L30 46 Z" fill="#B2EBF2" stroke="#4DD0E1" strokeWidth="1" />
          {/* Water reflection ripples */}
          <line x1="8" y1="64" x2="52" y2="64" stroke="#81D4FA" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <line x1="16" y1="68" x2="42" y2="68" stroke="#81D4FA" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* Layer 1: Distant Calm Swell (Soft Seafoam) */}
        <path
          d="M0 320 C140 300 240 340 400 315 C560 290 680 330 900 310 L900 520 L0 520 Z"
          fill="url(#softWaveGrad)"
          opacity="0.85"
        />

        {/* Layer 2: Mid Aqua Wave */}
        <path
          d="M0 355 C180 330 310 380 490 350 C670 320 780 375 900 350 L900 520 L0 520 Z"
          fill="url(#midWaveGrad)"
          opacity="0.9"
        />

        {/* Sea Turtle Silhouette Swimming under Surface */}
        <g transform="translate(480, 375) rotate(-10)" opacity="0.85">
          {/* Shell */}
          <ellipse cx="25" cy="18" rx="16" ry="12" fill="#00695C" opacity="0.6" />
          {/* Head */}
          <ellipse cx="43" cy="18" rx="5" ry="4" fill="#00695C" opacity="0.6" />
          {/* Flippers */}
          <path d="M30 10 Q40 -2 46 2 Q38 10 28 14 Z" fill="#00695C" opacity="0.6" />
          <path d="M30 26 Q40 38 46 34 Q38 26 28 22 Z" fill="#00695C" opacity="0.6" />
          {/* Rear Flippers */}
          <path d="M14 12 Q8 6 6 9 Q10 14 15 15 Z" fill="#00695C" opacity="0.5" />
          <path d="M14 24 Q8 30 6 27 Q10 22 15 21 Z" fill="#00695C" opacity="0.5" />
        </g>

        {/* Leaping Dolphin Silhouette */}
        <g transform="translate(340, 280) scale(0.65)" opacity="0.8">
          <path
            d="M10 40 C20 15 50 10 75 25 C65 25 55 30 50 35 C65 30 75 35 85 45 C75 42 60 45 50 50 C35 55 20 50 10 40 Z"
            fill="#0F4C81"
          />
          {/* Fin */}
          <path d="M42 22 Q48 10 52 14 Q48 24 44 26 Z" fill="#0F4C81" />
        </g>

        {/* Layer 3: Foreground Deep Ocean Blue Wave */}
        <path
          d="M0 400 C160 375 320 425 520 395 C710 365 800 420 900 390 L900 520 L0 520 Z"
          fill="url(#deepWaveGrad)"
        />

        {/* Wave Crest Foam & Shimmer Highlights */}
        <path
          d="M0 400 C160 375 320 425 520 395 C710 365 800 420 900 390"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 25 120 30"
          opacity="0.85"
        />

        <path
          d="M50 430 C220 405 380 445 560 420 C720 395 820 435 900 415"
          stroke="#B2EBF2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="40 40 80 50"
          opacity="0.5"
        />

        {/* Floating Translucent Bubbles in Ocean */}
        <circle cx="160" cy="460" r="8" fill="#FFFFFF" fillOpacity="0.4" />
        <circle cx="163" cy="458" r="2.5" fill="#FFFFFF" fillOpacity="0.8" />

        <circle cx="280" cy="485" r="5" fill="#FFFFFF" fillOpacity="0.35" />
        <circle cx="620" cy="470" r="9" fill="#FFFFFF" fillOpacity="0.35" />
        <circle cx="623" cy="467" r="3" fill="#FFFFFF" fillOpacity="0.75" />

        <circle cx="780" cy="490" r="6" fill="#FFFFFF" fillOpacity="0.4" />
      </svg>
    </div>
  );
};

/**
 * Flowing SVG wave separator to transition smoothly between sections.
 * Can be positioned at the top or bottom of any section.
 */
export const WaveDivider: React.FC<{
  fillColor?: string;
  inverted?: boolean;
  className?: string;
}> = ({
  fillColor = "#FFFFFF",
  inverted = false,
  className = "w-full overflow-hidden leading-none",
}) => {
  return (
    <div className={`w-full overflow-hidden leading-none select-none ${className}`}>
      <svg
        viewBox="0 0 1440 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`w-full h-8 sm:h-12 lg:h-16 block ${inverted ? "rotate-180" : ""}`}
      >
        <path
          d="M0 32C240 75 480 8 720 48C960 88 1200 20 1440 52V96H0V32Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
};

/**
 * Animated Ambient Sea Bubbles that float subtly in the background.
 */
export const FloatingOceanBubbles: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const bubbles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 14 + (i * 8) % 24,
    left: `${8 + (i * 17) % 84}%`,
    top: `${12 + (i * 23) % 76}%`,
    delay: `${(i * 1.2).toFixed(1)}s`,
    duration: `${6 + (i * 1.5).toFixed(1)}s`,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden="true">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bubble animate-float-slow opacity-60 hover:opacity-100 transition-opacity"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: b.left,
            top: b.top,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Minimalist Marine Species & Safety Badge SVG Illustrations
 */
export const MarineIllustrations = {
  CompassRose: () => (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-primary">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 3" opacity="0.4" />
      <polygon points="24,6 28,21 42,24 28,27 24,42 20,27 6,24 20,21" fill="currentColor" opacity="0.8" />
      <polygon points="24,6 28,21 24,24 20,21" fill="#0F4C81" />
      <polygon points="24,42 20,27 24,24 28,27" fill="#4DD0E1" />
      <circle cx="24" cy="24" r="3" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="1.5" />
    </svg>
  ),

  FishSchool: () => (
    <svg viewBox="0 0 64 48" fill="none" className="w-full h-full text-ocean-blue">
      {/* Fish 1 */}
      <path d="M12 18 C20 12 32 12 40 18 L46 14 L46 22 L40 18 C32 24 20 24 12 18 Z" fill="#1E88E5" opacity="0.85" />
      <circle cx="18" cy="17" r="1.5" fill="#FFFFFF" />
      {/* Fish 2 */}
      <path d="M26 30 C32 25 42 25 48 30 L53 27 L53 33 L48 30 C42 35 32 35 26 30 Z" fill="#4DD0E1" opacity="0.75" />
      <circle cx="31" cy="29" r="1.2" fill="#FFFFFF" />
      {/* Fish 3 */}
      <path d="M6 34 C11 30 19 30 24 34 L28 31 L28 37 L24 34 C19 38 11 38 6 34 Z" fill="#64B5F6" opacity="0.65" />
    </svg>
  ),

  Lighthouse: () => (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <path d="M8 42 H40" stroke="#0F4C81" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="17,42 31,42 28,16 20,16" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="2" />
      <polygon points="18,30 30,30 29,24 19,24" fill="#FF8A65" />
      <rect x="19" y="10" width="10" height="6" rx="1" fill="#FFE082" stroke="#0F4C81" strokeWidth="1.5" />
      <path d="M19 10 Q24 5 29 10 Z" fill="#0F4C81" />
      <polygon points="24,13 46,-2 46,18" fill="#FFF9C4" fillOpacity="0.4" />
    </svg>
  ),

  CoralReef: () => (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      {/* Branching Coral in Coral Tint */}
      <path
        d="M24 44 V26 C24 20 16 18 16 12 C16 8 20 6 22 10 C24 14 26 22 26 26 C26 22 28 16 32 12 C36 8 40 10 38 14 C36 18 30 22 30 28 V44"
        fill="#FF8A65"
        opacity="0.85"
      />
      {/* Secondary branch */}
      <path
        d="M20 34 C14 30 10 26 10 20 C10 16 14 15 16 18 C18 21 21 26 22 30"
        stroke="#4DD0E1"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="16" cy="12" r="2.5" fill="#FFE082" />
      <circle cx="32" cy="12" r="2.5" fill="#FFE082" />
      <circle cx="22" cy="8" r="2" fill="#FFE082" />
    </svg>
  ),

  SeaTurtle: () => (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <g transform="translate(4, 4)">
        {/* Carapace Shell */}
        <ellipse cx="20" cy="20" rx="14" ry="11" fill="#1E88E5" opacity="0.9" />
        <ellipse cx="20" cy="20" rx="11" ry="8" fill="#4DD0E1" opacity="0.6" />
        {/* Head */}
        <ellipse cx="36" cy="20" rx="5" ry="4" fill="#0F4C81" />
        <circle cx="37" cy="19" r="1" fill="#FFFFFF" />
        {/* Front Flippers */}
        <path d="M26 12 C32 4 40 5 38 10 C34 16 26 18 24 18 Z" fill="#0F4C81" />
        <path d="M26 28 C32 36 40 35 38 30 C34 24 26 22 24 22 Z" fill="#0F4C81" />
        {/* Rear Flippers */}
        <path d="M10 14 C6 10 3 12 5 15 C8 17 12 17 12 17 Z" fill="#0F4C81" opacity="0.8" />
        <path d="M10 26 C6 30 3 28 5 25 C8 23 12 23 12 23 Z" fill="#0F4C81" opacity="0.8" />
        {/* Tail */}
        <polygon points="6,19 2,20 6,21" fill="#0F4C81" />
      </g>
    </svg>
  ),

  Dolphin: () => (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      <path
        d="M6 34 C14 20 28 14 42 22 C36 22 30 25 27 28 C34 25 40 28 44 32 C37 31 30 34 24 38 C16 41 9 39 6 34 Z"
        fill="#1E88E5"
      />
      {/* Dorsal Fin */}
      <path d="M24 18 Q28 10 31 13 Q28 20 25 22 Z" fill="#0F4C81" />
      {/* Eye */}
      <circle cx="36" cy="24" r="1.2" fill="#FFFFFF" />
    </svg>
  ),

  SeaShell: () => (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      {/* Scallop Shell */}
      <path
        d="M24 40 C14 40 6 30 6 22 C6 12 14 6 24 6 C34 6 42 12 42 22 C42 30 34 40 24 40 Z"
        fill="#F2F8FC"
        stroke="#64B5F6"
        strokeWidth="2"
      />
      {/* Rib lines */}
      <line x1="24" y1="40" x2="24" y2="8" stroke="#4DD0E1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="40" x2="14" y2="12" stroke="#4DD0E1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="40" x2="34" y2="12" stroke="#4DD0E1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="40" x2="8" y2="20" stroke="#4DD0E1" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="24" y1="40" x2="40" y2="20" stroke="#4DD0E1" strokeWidth="1.2" strokeLinecap="round" />
      {/* Shell hinge */}
      <path d="M18 40 H30 L27 44 H21 Z" fill="#0F4C81" />
    </svg>
  ),

  OceanPlant: () => (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      {/* Kelp / Seagrass Fronds */}
      <path
        d="M20 44 C20 34 14 26 18 16 C22 6 28 4 26 4 C24 4 18 10 14 20 C10 30 16 38 16 44"
        fill="#2ECC71"
        opacity="0.85"
      />
      <path
        d="M28 44 C28 32 34 24 30 14 C26 4 22 6 23 6 C25 6 30 12 32 22 C34 32 26 38 26 44"
        fill="#4DD0E1"
        opacity="0.75"
      />
    </svg>
  ),

  Sailboat: () => (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
      {/* Hull */}
      <path d="M8 36 L40 36 Q35 44 24 44 Q13 44 8 36 Z" fill="#0F4C81" />
      {/* Mast */}
      <line x1="24" y1="36" x2="24" y2="8" stroke="#0F4C81" strokeWidth="2" strokeLinecap="round" />
      {/* Mainsail */}
      <path d="M26 10 L40 32 L26 32 Z" fill="#FFFFFF" stroke="#1E88E5" strokeWidth="1.5" />
      {/* Jib */}
      <path d="M22 14 L10 32 L22 32 Z" fill="#B2EBF2" stroke="#4DD0E1" strokeWidth="1.2" />
      {/* Ripple */}
      <line x1="6" y1="45" x2="42" y2="45" stroke="#64B5F6" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  ),
};
