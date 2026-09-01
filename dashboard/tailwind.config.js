/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "var(--card-border)",
                input: "var(--card-border)",
                ring: "var(--primary)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--foreground)",
                },
                destructive: {
                    DEFAULT: "var(--severity-critical)",
                    foreground: "var(--foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--foreground)",
                },
                popover: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--foreground)",
                },
                cyber: {
                    dark: "#020617",
                    card: "#0f172a",
                    primary: "#06b6d4",
                    secondary: "#8b5cf6",
                    danger: "#f43f5e",
                    success: "#10b981",
                    warning: "#f59e0b"
                }
            },
            fontFamily: {
                grotesk: ["'Outfit'", "sans-serif"],
                inter: ["Inter", "sans-serif"],
                'plus-jakarta': ["'Plus Jakarta Sans'", "sans-serif"],
                outfit: ["'Outfit'", "sans-serif"],
            },
            backgroundImage: {
                'cyber-gradient': 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                'cyber-glow': 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
            }
        },
    },
    plugins: [],
}

