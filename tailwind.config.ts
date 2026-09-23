import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blossom: {
          blush: "#e8a0ab",
          rose: "#d16b82",
          deeprose: "#b84a63",
          sage: "#5c6e4a",
          skin: "#faf3ee",
          cream: "#fffdfa",
          gold: "#d9a441",
          ink: "#4a3b36",
        },
      },
      fontFamily: {
        script: ["'Alex Brush'", "cursive"],
        display: ["'Fredoka'", "'Nunito'", "sans-serif"],
        body: ["'Nunito'", "'Poppins'", "sans-serif"],
      },
      borderRadius: {
        plaque: "1.75rem",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(74, 59, 54, 0.25)",
        card: "0 14px 34px -14px rgba(209, 107, 130, 0.35)",
      },
      keyframes: {
        "fade-scale": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { opacity: "1", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(8deg)" },
        },
        "petal-fall": {
          "0%": { transform: "translateY(-10%) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(340deg)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-scale": "fade-scale 0.7s ease-out both",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pop-in": "pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        float: "float 5s ease-in-out infinite",
        "petal-fall": "petal-fall linear infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;