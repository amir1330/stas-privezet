import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        unicorn: {
          text: "#222222",
          muted: "#717171",
          tile: "#efedec",
          surface: "#f6f6f6",
          button: "#f2f2f2",
          navy: "#5B21B6",
          pink: "#7C3AED",
          yellow: "#ffe0a2",
          gray: "#f3f2f1",
        },
        accent: {
          DEFAULT: "#7C3AED",
          dark: "#5B21B6",
        },
      },
      borderRadius: {
        card: "10px",
        tile: "20px",
      },
      boxShadow: {
        tab: "0 1px 1px rgba(0,0,0,0.09)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
