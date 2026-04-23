import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          bg: "#0b141a",
          panel: "#111b21",
          panel2: "#202c33",
          border: "#2a3942",
          text: "#e9edef",
          muted: "#8696a0",
          accent: "#00a884",
          bubbleOut: "#005c4b",
          bubbleIn: "#202c33",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
