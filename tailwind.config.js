/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        orendt: {
          black: "#0A0A0A",
          dark: "#1A1A1A",
          white: "#FFFFFF",
          accent: "#DEB887",
          "accent-hover": "#cda471",
          gray: {
            50: "#FAFAFA",
            100: "#F5F5F5",
            200: "#EEEEEE",
            300: "#DDDDDD",
            400: "#BBBBBB",
            500: "#999999",
            600: "#777777",
            700: "#555555",
            800: "#333333",
            900: "#222222",
          },
        },
        status: {
          live: "#EF4444",
          "live-bg": "#FEF2F2",
          finished: "#22C55E",
          "finished-bg": "#F0FDF4",
          scheduled: "#3B82F6",
          "scheduled-bg": "#EFF6FF",
        },
      },
      fontFamily: {
        display: ["var(--font-headline)", "Arial", "sans-serif"],
        body: ["var(--font-body)", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "scale-in": "scaleIn 0.5s ease forwards",
        "live-pulse": "livePulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { transform: "scale(0.9)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        livePulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
      },
    },
  },
  plugins: [],
}
