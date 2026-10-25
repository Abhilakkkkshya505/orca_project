/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-alt": "var(--color-bg-alt)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        "surface-elevated": "var(--color-surface-elevated)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        ink: "var(--color-ink)",
        "ink-secondary": "var(--color-ink-secondary)",
        "ink-muted": "var(--color-ink-muted)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "on-primary": "var(--color-on-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        focus: "var(--color-focus)",
        water: "var(--color-water)",
        
        // Option A Earth & Mineral Tokens
        forest: "var(--color-forest)",
        sage: "var(--color-sage)",
        bronze: "var(--color-bronze)",
        sand: "var(--color-sand)",
        stone: "var(--color-stone)",
        charcoal: "var(--color-charcoal)",
        terracotta: "var(--color-terracotta)",

        // Semantic Risk Tokens (Quiet, natural earth tones)
        risk: {
          safe: "var(--color-risk-safe)",
          "safe-bg": "var(--color-risk-safe-bg)",
          "safe-border": "var(--color-risk-safe-border)",
          caution: "var(--color-risk-caution)",
          "caution-bg": "var(--color-risk-caution-bg)",
          "caution-border": "var(--color-risk-caution-border)",
          unsafe: "var(--color-risk-unsafe)",
          "unsafe-bg": "var(--color-risk-unsafe-bg)",
          "unsafe-border": "var(--color-risk-unsafe-border)",
          unknown: "var(--color-risk-unknown)",
          "unknown-bg": "var(--color-risk-unknown-bg)",
          "unknown-border": "var(--color-risk-unknown-border)",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        heading: ["'Space Grotesk'", "'Inter'", "sans-serif"],
        editorial: ["'Instrument Serif'", "'Newsreader'", "Georgia", "serif"],
        serif: ["'Instrument Serif'", "'Newsreader'", "Georgia", "serif"],
        mono: ["'Geist Mono'", "'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(26, 24, 22, 0.04)",
        card: "0 1px 3px 0 rgba(26, 24, 22, 0.04), 0 1px 2px -1px rgba(26, 24, 22, 0.03)",
        "card-hover": "0 2px 8px -2px rgba(26, 24, 22, 0.07)",
        overlay: "0 10px 25px -4px rgba(26, 24, 22, 0.12)",
      },
      borderRadius: {
        xs: "3px",
        sm: "6px",
        md: "8px",   // 8-10px for buttons
        lg: "10px",  // 10-14px for cards
        xl: "12px",
        "2xl": "14px",
      },
    },
  },
  plugins: [],
};
