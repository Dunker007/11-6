/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-space': '#05050a',
        'hologram-blue': '#00f3ff',
        'neon-purple': '#bc13fe',
        'cyber-grid': '#1a1a2e',
        'glass-panel': 'rgba(10, 10, 15, 0.6)',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #05050a 0%, #1a1a2e 100%)',
        'glow-radial': 'radial-gradient(circle at center, rgba(0, 243, 255, 0.1) 0%, transparent 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px #00f3ff' },
          '50%': { opacity: '.5', boxShadow: '0 0 20px #00f3ff' },
        }
      }
    },
  },
  plugins: [],
}
