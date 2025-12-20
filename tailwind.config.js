/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/renderer/index.html",
        "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                'primary-hover': '#2563eb',
                'bg-body': '#111827',
                'bg-surface': '#1f2937',
                'text-main': '#f3f4f6',
                'text-secondary': '#9ca3af',
                'border-color': '#374151',
                // Solid Modern Dark Tokens
                'pure-black': '#000000',
                'surface-dark': '#0a0a0a',
                'surface-light': '#141414',
                'border-dark': '#1a1a1a',
                'accent-blue': '#3b82f6',
            }
        },
    },
    plugins: [],
}
