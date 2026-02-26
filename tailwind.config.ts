import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50:  "#fdf2f4",
          100: "#fce7eb",
          200: "#f9d0d8",
          300: "#f4a9b8",
          400: "#ec7490",
          500: "#e04570",
          600: "#c82554",
          700: "#a81a43",
          800: "#8b1538",
          900: "#781333",
          950: "#430518",
        },
        gold: "#C8A96E",
      },
      fontFamily: {
        arabic: ["var(--font-cairo)", "sans-serif"],
        sans:   ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
