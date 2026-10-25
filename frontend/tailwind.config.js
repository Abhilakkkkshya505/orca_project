/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "on-primary": "var(--color-on-primary)",
        focus: "var(--color-focus)",
        water: "var(--color-water)",
        
        // Ocean Specific Theme Colors
        ocean: {
          deep: "var(--color-ocean-deep, #0F4C81)",
          blue: "var(--color-ocean-blue, #1E88E5)",
          sky: "var(--color-sky-blue, #64B5F6)",
          aqua: "var(--color-aqua, #4DD0E1)",
          seafoam: "var(--color-seafoam, #B2EBF2)",
        },
        coral: "var(--color-coral, #FF8A65)",
        emerald: "var(--color-emerald, #2ECC71)",

        // Strict Risk Tokens
        risk: {
          safe: "var(--color-risk-safe)",
          "safe-bg": "var(--color-risk-safe-bg)",
          caution: "var(--color-risk-caution)",
          "caution-bg": "var(--color-risk-caution-bg)",
          unsafe: "var(--color-risk-unsafe)",
          "unsafe-bg": "var(--color-risk-unsafe-bg)",
          unknown: "var(--color-risk-unknown)",
          "unknown-bg": "var(--color-risk-unknown-bg)",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "system-ui", "-apple-system", "sans-serif"],
        heading: ["'Space Grotesk'", "'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(15, 76, 129, 0.05), 0 2px 6px -1px rgba(15, 76, 129, 0.03)",
        "card-hover": "0 14px 34px -4px rgba(15, 76, 129, 0.12), 0 4px 14px -2px rgba(15, 76, 129, 0.08)",
        overlay: "0 20px 40px -4px rgba(15, 76, 129, 0.2), 0 8px 20px -2px rgba(15, 76, 129, 0.12)",
        "ocean-glow": "0 0 24px -2px rgba(77, 208, 225, 0.35)",
        "blue-soft": "0 8px 30px rgba(30, 136, 229, 0.12)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      animation: {
        "wave-float": "waveFloat 8s ease-in-out infinite",
        "wave-float-reverse": "waveFloatReverse 10s ease-in-out infinite",
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        "shimmer": "shimmer 2.5s infinite linear",
      },
      keyframes: {
        waveFloat: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(0.5deg)" },
        },
        waveFloatReverse: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(6px) rotate(-0.5deg)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.75" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
