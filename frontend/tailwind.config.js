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
        sans: ["'IBM Plex Sans'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(14 34 49 / 0.08)",
        overlay: "0 8px 24px rgb(14 34 49 / 0.16)",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      transitionDuration: {
        DEFAULT: "120ms",
        fast: "120ms",
        normal: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};
