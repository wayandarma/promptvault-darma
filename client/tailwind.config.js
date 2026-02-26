/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                bg: '#0d0f11',
                surface: '#131619',
                card: '#191d21',
                border: '#252a2f',
                border2: '#2e353d',
                ink: '#e8eaec',
                muted: '#606870',
                muted2: '#8a949e',
                accent: '#e8c97a',
                green: '#5eb87f',
            },
            fontFamily: {
                serif: ['DM Serif Display', 'serif'],
                mono: ['DM Mono', 'monospace'],
                sans: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
