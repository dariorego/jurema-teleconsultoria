import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          bg: "var(--color-bg)",
          panel: "var(--color-panel)",
          panel2: "var(--color-panel2)",
          border: "var(--color-border)",
          text: "var(--color-text)",
          muted: "var(--color-muted)",
          accent: "var(--color-accent)",
          bubbleOut: "var(--color-bubble-out)",
          bubbleIn: "var(--color-bubble-in)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
