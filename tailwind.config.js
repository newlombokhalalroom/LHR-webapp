/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // primary
        "primary-lighten": "#0af267",
        primary: "#46c378",
        "primary-smoke": "#F4FFFA",
        "primary-darken": "#159749",
        // secondary
        "secondary-lighten": "#ffdb5b",
        secondary: "#FFC700",
        "secondary-darken": "#d8aa00",
        // main
        "white-smoke": "#e6e6e6",
        white: "#f9f9f9ff",
        black: "#1C1E21",
        "black-pure": "#111111",
        "black-smoke": "#1c1e218a",
        //body
        gg: "#EDFCF6",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
