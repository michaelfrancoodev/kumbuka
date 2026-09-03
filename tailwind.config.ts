import type { Config } from "tailwindcss";

/**
 * Design tokens.
 *
 * Green is a state colour, not a brand colour — it appears only on the
 * confirmed dot, the save button, and money coming in. Everywhere else the
 * palette stays neutral so state is the only thing that reads as "different".
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        fg: "#0D0D0D",
        muted: "#5C5C5C",
        meta: "#8A8A8A",
        surface: "#F7F7F5",
        "surface-2": "#EFEFEC",
        border: "#E4E4E1",
        "border-soft": "#EDEDEA",
        accent: "#1E8E5A",
        "accent-hover": "#187249",
        warn: "#B7791F",
        "warn-soft": "#FBF2E3",
        danger: "#B3261E",
        "danger-soft": "#FBEAE9",
      },
      borderRadius: { sm: "6px", md: "10px" },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        rise: "rise 180ms ease-out",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
