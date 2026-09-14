/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#181C3B",
        navy: "#212743",
        steel: "#7088A9",
        mist: "#9FB0C8",
        blue: "#004679"
      },
      boxShadow: {
        soft: "0 16px 45px rgba(24, 28, 59, .08)",
        dark: "0 16px 45px rgba(0, 0, 0, .25)"
      }
    }
  },
  plugins: []
};
