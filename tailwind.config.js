/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Calm Blue (Premium, Trustworthy, Less Saturated)
        // Usage: Main CTAs, links, focus states only
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc4fb',
          400: '#36a5f7',
          500: '#0c88e8',  // Main brand color - calm, confident
          600: '#0a6bc4',  // Hover state
          700: '#0d5499',
          800: '#11467d',
          900: '#133b67',
        },
        // Secondary - Neutral Gray-Blue (Supporting actions)
        // Usage: Secondary buttons, subtle accents
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Success - Calm Green (Feedback only)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Success states
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Error - Calm Red (Feedback only)
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Error states
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Warning - Calm Amber (Feedback only)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Warning states
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Neutral Grays - Premium, Calm (Layouts, Content)
        // Usage: Backgrounds, text, borders - most of the UI
        gray: {
          50: '#fafafa',   // Lightest backgrounds
          100: '#f5f5f5',  // Subtle backgrounds
          200: '#e5e5e5',  // Borders, dividers
          300: '#d4d4d4',  // Disabled states
          400: '#a3a3a3',  // Placeholder text
          500: '#737373',  // Secondary text
          600: '#525252',  // Body text
          700: '#404040',  // Headings
          800: '#262626',  // Strong headings
          900: '#171717',  // Darkest text
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.5rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      animation: {
        // Fade animations - Fast, smooth (200-250ms)
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fadeInUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-down': 'fadeInDown 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        // Slide animations - Smooth, fast (200-250ms)
        'slide-up': 'slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-left': 'slideLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slideRight 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        // Scale animations - Quick feedback (150-200ms)
        'scale-in': 'scaleIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-out': 'scaleOut 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-up': 'scaleUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        // Modal/Drawer animations - Smooth entrance (250-300ms)
        'modal-in': 'modalIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'modal-out': 'modalOut 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        // Page transitions - Smooth (300ms max)
        'page-in': 'pageIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        // Loading states - Subtle pulse
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Shimmer/Shine - Smooth loading
        'shimmer': 'shimmer 2s linear infinite',
        // Spin - Standard
        'spin-slow': 'spin 2s linear infinite',
        // Shake - Error feedback (fast)
        'shake': 'shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      },
      keyframes: {
        // Fade animations - Subtle, fast
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slide animations - Subtle movement
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Scale animations - Subtle scale
        scaleIn: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.98)', opacity: '0' },
        },
        scaleUp: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        // Modal animations - Smooth entrance/exit
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        modalOut: {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
        },
        // Page transitions - Smooth fade
        pageIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Loading states - Subtle pulse
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        // Shimmer - Smooth loading effect
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Shake - Error feedback
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
      },
      transitionTimingFunction: {
        // Premium easing functions - smooth, natural
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',      // Standard (ease-out)
        'snappy': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Quick response
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',   // Subtle spring
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',        // Fast ease-out
      },
      transitionDuration: {
        '150': '150ms',  // Micro-interactions
        '200': '200ms',  // Standard transitions
        '250': '250ms',  // Slightly slower
        '300': '300ms',  // Max for interactions
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

