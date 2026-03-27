import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/domain/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          DEFAULT: "var(--color-cosmic-base)",
          mid: "var(--color-cosmic-mid)",
          veil: "var(--color-cosmic-veil)"
        },
        content: {
          primary: "var(--color-text-primary)",
          muted: "var(--color-text-muted)",
          faint: "var(--color-text-faint)"
        },
        tron: {
          DEFAULT: "var(--color-tron)",
          dim: "var(--color-tron-dim)",
          glow: "var(--color-tron-glow)"
        },
        solana: {
          DEFAULT: "var(--color-solana)",
          dim: "var(--color-solana-dim)",
          glow: "var(--color-solana-glow)"
        },
        ai: {
          DEFAULT: "var(--color-ai)",
          dim: "var(--color-ai-dim)"
        },
        glass: {
          border: "var(--glass-border)",
          bg: "var(--glass-bg)",
          highlight: "var(--glass-highlight)"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      boxShadow: {
        "tron-sm": "0 0 24px var(--color-tron-glow)",
        "solana-sm": "0 0 24px var(--color-solana-glow)",
        "ai-sm": "0 0 24px rgba(167, 139, 250, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
