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
        
        // Ocean Specific Theme Colors
        ocean: {
          deep: "var(--color-ocean-deep, #0C4A6E)",
          blue: "var(--color-ocean-blue, #0284C7)",
          sky: "var(--color-sky-blue, #38BDF8)",
          aqua: "var(--color-aqua, #0D9488)",
          seafoam: "var(--color-seafoam, #CCFBF1)",
        },
        coral: "var(--color-coral, #E11D48)",
        emerald: "var(--color-emerald, #059669)",

        // Semantic Risk Tokens
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
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        heading: ["'Space Grotesk'", "'Inter'", "sans-serif"],
        mono: ["'Geist Mono'", "'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 12px -2px rgba(0, 0, 0, 0.06)",
        overlay: "0 12px 28px -4px rgba(0, 0, 0, 0.15)",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
