import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        // Neon Cabinet Design System
        nc: {
          bg: {
            primary: "var(--nc-bg-primary)",
            secondary: "var(--nc-bg-secondary)",
            tertiary: "var(--nc-bg-tertiary)",
          },
          neon: {
            green: "var(--nc-neon-green)",
            "green-soft": "var(--nc-neon-green-soft)",
            "green-dark": "var(--nc-neon-green-dark)",
            purple: "var(--nc-neon-purple)",
            "purple-soft": "var(--nc-neon-purple-soft)",
            "purple-dark": "var(--nc-neon-purple-dark)",
            pink: "var(--nc-neon-pink)",
            yellow: "var(--nc-neon-yellow)",
            cyan: "var(--nc-neon-cyan)",
          },
          text: {
            primary: "var(--nc-text-primary)",
            secondary: "var(--nc-text-secondary)",
            muted: "var(--nc-text-muted)",
          },
          border: {
            soft: "var(--nc-border-soft)",
            neon: "var(--nc-border-neon)",
          },
        },
      },
      boxShadow: {
        "neon-green":
          "0 0 8px rgba(57, 255, 20, 0.4), 0 0 20px rgba(57, 255, 20, 0.2)",
        "neon-green-lg":
          "0 0 12px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3), 0 0 80px rgba(57, 255, 20, 0.15)",
        "neon-purple":
          "0 0 8px rgba(176, 38, 255, 0.4), 0 0 20px rgba(176, 38, 255, 0.2)",
        "neon-purple-lg":
          "0 0 14px rgba(176, 38, 255, 0.5), 0 0 40px rgba(176, 38, 255, 0.3), 0 0 80px rgba(176, 38, 255, 0.15)",
        "neon-pink":
          "0 0 8px rgba(255, 79, 216, 0.4), 0 0 20px rgba(255, 79, 216, 0.2)",
        "neon-cyan":
          "0 0 8px rgba(60, 242, 255, 0.4), 0 0 20px rgba(60, 242, 255, 0.2)",
        card: "0 12px 28px rgba(10, 0, 25, 0.45)",
        "card-hover":
          "0 16px 40px rgba(10, 0, 25, 0.55), 0 0 30px rgba(176, 38, 255, 0.2)",
        // Skeuomorphic shadows
        "btn-raised":
          "0 4px 0 0 rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        "btn-pressed":
          "0 1px 0 0 rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.3)",
        "inner-glow": "inset 0 0 20px rgba(176, 38, 255, 0.15)",
        cabinet:
          "inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.05)",
      },
      animation: {
        "neon-pulse": "neon-pulse 3s ease-in-out infinite",
        "neon-flicker": "neon-flicker 4s linear infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "glow-breathe": "glow-breathe 4s ease-in-out infinite",
      },
      keyframes: {
        "neon-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "neon-flicker": {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": {
            opacity: "1",
          },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": { opacity: "0.4" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-breathe": {
          "0%, 100%": {
            boxShadow:
              "0 0 8px rgba(176, 38, 255, 0.4), 0 0 20px rgba(176, 38, 255, 0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 16px rgba(176, 38, 255, 0.6), 0 0 40px rgba(176, 38, 255, 0.3)",
          },
        },
      },
      backgroundImage: {
        "scene-lighting":
          "radial-gradient(ellipse 120% 80% at 30% -20%, rgba(176, 38, 255, 0.15) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 70% 10%, rgba(57, 255, 20, 0.08) 0%, transparent 40%)",
        "neon-gradient":
          "linear-gradient(135deg, var(--nc-neon-purple) 0%, var(--nc-neon-green) 100%)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
