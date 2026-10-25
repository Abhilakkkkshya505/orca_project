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
        // Strict Risk Tokens (never shown by color alone)
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
        sans: ["'Plus Jakarta Sans'", "'Inter'", "'IBM Plex Sans'", "system-ui", "-apple-system", "sans-serif"],
        heading: ["'Space Grotesk'", "'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(14, 34, 49, 0.05), 0 1px 2px rgba(14, 34, 49, 0.03)",
        "card-hover": "0 12px 28px -4px rgba(14, 34, 49, 0.12), 0 4px 12px -2px rgba(14, 34, 49, 0.08)",
        overlay: "0 16px 36px -4px rgba(14, 34, 49, 0.2), 0 6px 16px -2px rgba(14, 34, 49, 0.12)",
        glow: "0 0 20px -3px rgba(15, 92, 110, 0.3)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
        fast: "100ms",
        normal: "200ms",
        slow: "350ms",
      },
    },
  },
  plugins: [],
};
