/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      screens: {
        'sm640': '640px'
      },
      colors: {
        neon: '#00eaff',
        deep: '#020f14',
        panel: 'rgba(8,28,36,0.72)'
      },
      fontFamily: {
        display: ['Orbitron','sans-serif'],
        raj: ['Rajdhani','sans-serif'],
        mono: ['JetBrains Mono','monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'orbit': 'orbitRotate 3s linear infinite',
        'orbit-rev': 'orbitRotate 2.2s linear infinite reverse',
        'pulse-glow': 'pulseGlow 1.6s ease-in-out infinite',
        'scan': 'scanMove 2.2s ease-in-out infinite',
        'gridDrift': 'gridDrift 28s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        orbitRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        pulseGlow: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        scanMove: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' }
        }
      }
    }
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ]
};
