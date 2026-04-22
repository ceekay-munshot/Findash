/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        canvas: "#F7F5F0",
        surface: "#FFFFFF",
        ink: {
          900: "#16181D",
          700: "#2E333B",
          500: "#5B6169",
          400: "#7A8089",
          300: "#A8ADB5",
          200: "#D8DCE1",
          100: "#ECEEF1",
        },
        divider: "#E7E4DC",
        accent: {
          green: "#2E7D5B",
          greenSoft: "#E4F1EA",
          amber: "#B5791F",
          amberSoft: "#FBEFD7",
          red: "#B3261E",
          redSoft: "#F8DEDA",
          slate: "#475062",
          slateSoft: "#E9ECF2",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,24,29,0.04), 0 4px 16px rgba(22,24,29,0.04)",
        soft: "0 1px 2px rgba(22,24,29,0.03)",
      },
      borderRadius: {
        xl2: "14px",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};
