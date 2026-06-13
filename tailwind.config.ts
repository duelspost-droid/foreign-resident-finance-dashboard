import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#161a22",
        panel: "#ffffff",
        line: "#d8dee8",
        muted: "#697586",
        teal: "#0f766e",
        berry: "#be123c",
        amber: "#b45309",
        cobalt: "#3157a4"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.06), 0 8px 24px rgba(16, 24, 40, 0.05)"
      }
    }
  },
  plugins: []
};

export default config;
