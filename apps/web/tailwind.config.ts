import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#F2EEE4",
        navy: {
          DEFAULT: "#17140F",
          soft: "#211C15",
        },
        accent: {
          DEFAULT: "#C2410C",
          hover: "#9A3412",
        },
        surface: {
          DEFAULT: "#F2EEE4",
          muted: "#9C9686",
        },
      },
      fontFamily: {
        sans: ["\"IBM Plex Sans\"", "\"Noto Sans Ethiopic\"", "system-ui", "sans-serif"],
        display: ["\"Space Grotesk\"", "\"Noto Sans Ethiopic\"", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "\"Noto Sans Ethiopic\"", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.125rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
