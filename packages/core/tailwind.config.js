/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--kd-border))',
        input: 'hsl(var(--kd-input))',
        ring: 'hsl(var(--kd-ring))',
        background: 'hsl(var(--kd-background))',
        foreground: 'hsl(var(--kd-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--kd-primary))',
          foreground: 'hsl(var(--kd-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--kd-secondary))',
          foreground: 'hsl(var(--kd-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--kd-destructive))',
          foreground: 'hsl(var(--kd-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--kd-muted))',
          foreground: 'hsl(var(--kd-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--kd-accent))',
          foreground: 'hsl(var(--kd-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--kd-popover))',
          foreground: 'hsl(var(--kd-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--kd-card))',
          foreground: 'hsl(var(--kd-card-foreground))',
        },
        // Node category colors
        node: {
          trigger: 'var(--kd-node-trigger)',
          action: 'var(--kd-node-action)',
          logic: 'var(--kd-node-logic)',
          data: 'var(--kd-node-data)',
          integration: 'var(--kd-node-integration)',
          ai: 'var(--kd-node-ai)',
          database: 'var(--kd-node-database)',
          communication: 'var(--kd-node-communication)',
          custom: 'var(--kd-node-custom)',
        },
        // Status colors
        status: {
          success: 'var(--kd-status-success)',
          error: 'var(--kd-status-error)',
          warning: 'var(--kd-status-warning)',
          info: 'var(--kd-status-info)',
          running: 'var(--kd-status-running)',
        },
      },
      borderRadius: {
        lg: 'var(--kd-radius)',
        md: 'calc(var(--kd-radius) - 2px)',
        sm: 'calc(var(--kd-radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--kd-font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--kd-font-mono)', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--kd-status-running)' },
          '50%': { boxShadow: '0 0 20px 4px var(--kd-status-running)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        'flow': {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 1s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'flow': 'flow 0.5s linear infinite',
      },
    },
  },
  plugins: [],
};
