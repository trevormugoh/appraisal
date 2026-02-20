/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#48ad51",
                    dark: "#3a9142",
                },
                surface: {
                    dark: "#364241",
                },
            },
            fontFamily: {
                inter: ["var(--font-inter)", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
};
