/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
    return ({ opacityValue }) => {
        if (opacityValue !== undefined) {
            return `rgba(var(${variableName}), ${opacityValue})`;
        }
        return `rgb(var(${variableName}))`;
    };
}

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: withOpacity('--color-primary'),
                    dark: withOpacity('--color-primary-dark'),
                    light: withOpacity('--color-primary-light'),
                },
                accent: {
                    teal: withOpacity('--color-secondary'),
                    'teal-dark': withOpacity('--color-secondary-dark'),
                    'teal-light': withOpacity('--color-secondary-light'),
                },
                secondary: '#FFFFFF',
                text: {
                    DEFAULT: '#1A1A1A',
                    muted: '#666666',
                    light: '#999999',
                },
                background: '#FFFFFF',
                dark: '#0A0A0A',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'premium': '0 10px 40px rgba(0, 0, 0, 0.08)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            },
            backgroundImage: {
                'gradient-premium': 'linear-gradient(135deg, #CC0000 0%, #008080 100%)',
            }
        },
    },
    plugins: [],
}
