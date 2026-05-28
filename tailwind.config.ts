import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366F1",
          foreground: "#ffffff",
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366F1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        background: "#FAFAFA",
        surface: "#ffffff",
        muted: "#f4f4f5",
        "muted-foreground": "#71717a",
        border: "#e4e4e7",
        destructive: "#ef4444",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
