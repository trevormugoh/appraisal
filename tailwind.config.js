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
                    DEFAULT: "#004d24",
                    dark: "#003d1c",
                },
                surface: {
                    dark: "#004d24",
                },
            },
            fontFamily: {
                poppins: ["var(--font-poppins)", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
};
