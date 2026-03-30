/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /**
         * Premium Crypto/AI gold scale — aurum / brass / champagne
         * Use: text-gold, bg-gold-500/10, border-gold-500/25, ring-gold-500/20, from-gold-400 to-gold-600
         */
        gold: {
          DEFAULT: "#f2c94c",
          foreground: "#0a0a0b",
          50: "#fffdf5",
          100: "#fff7e0",
          200: "#ffe9a8",
          300: "#ffd54a",
          400: "#f5d76e",
          500: "#f2c94c",
          600: "#d4a017",
          700: "#b8860b",
          800: "#92400e",
          900: "#713f12",
          950: "#2a1506",
        },
        solaris: {
          gold: "#F2C94C",
          cyan: "#2EE7FF",
          dark: "#020617",
          void: "#020617",
          card: "#0B0E16",
          text: "#F4F6FF",
          muted: "#A6A9B6",
        },
      },
      /** Ring accents for trust badges / focus rings; `<alpha-value>` enables `/25`, `/40`, … */
      ringColor: {
        "solaris-gold": "rgb(242 201 76 / <alpha-value>)",
        "solaris-cyan": "rgb(46 231 255 / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'gold': '0 0 40px rgba(242, 201, 76, 0.18)',
        'gold-lg': '0 0 60px rgba(242, 201, 76, 0.25)',
        'cyan': '0 0 40px rgba(46, 231, 255, 0.14)',
        'card': '0 24px 70px rgba(0, 0, 0, 0.55)',
        'solar': '0 0 80px -12px rgba(255, 200, 120, 0.35), 0 0 120px -20px rgba(242, 180, 60, 0.2)',
        'solar-sm': '0 0 48px -8px rgba(255, 210, 140, 0.28)',
      },
      backgroundImage: {
        'gradient-solar': 'linear-gradient(135deg, #F2C94C 0%, #D4AF37 100%)',
        'gradient-solar-soft': 'linear-gradient(120deg, rgba(255,224,160,0.95) 0%, rgba(232,184,74,0.98) 40%, rgba(201,162,39,1) 100%)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "orb-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "translate(-50%, -50%) scale(1)" },
          "50%": { opacity: "1", transform: "translate(-50%, -50%) scale(1.1)" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(242, 201, 76, 0.15)" },
          "50%": { boxShadow: "0 0 50px rgba(242, 201, 76, 0.4), 0 0 100px rgba(242, 201, 76, 0.2)" },
        },
        /** Slow ambient drift for hero gradient orbs (keeps transform origin stable). */
        "hero-aurora": {
          "0%, 100%": { transform: "translate(-48%, -42%) scale(1)" },
          "50%": { transform: "translate(-52%, -46%) scale(1.08)" },
        },
        /** Very slow conic sheen — avoids the “cheap spinner” feel of 8s spin-slow. */
        "hero-conic-drift": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        /** Solaris mark — subtle “alive” pulse (replaces tacky infinite spin on icons). */
        "logo-breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.045)", opacity: "0.96" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "float": "float 4.5s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "shimmer": "shimmer 5s linear infinite",
        "ticker": "ticker 20s linear infinite",
        "orb-pulse": "orb-pulse 6s ease-in-out infinite",
        "gold-pulse": "gold-pulse 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "hero-aurora": "hero-aurora 28s ease-in-out infinite",
        "hero-conic-drift": "hero-conic-drift 100s linear infinite",
        "logo-breathe": "logo-breathe 5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
