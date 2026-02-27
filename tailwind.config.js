/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#CC0000', // Bold Red
                secondary: '#FFFFFF', // Pure White
                text: '#1A1A1A', // Jet Black
                background: '#FFFFFF', // Pure White background
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'premium': '0 4px 20px rgba(0, 0, 0, 0.08)',
            }
        },
    },
    plugins: [],
}
