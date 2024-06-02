/** @type {import('tailwindcss').Config} */
import gp3Config from '@globalpress/tailwind-preset';
export default {
  presets: [gp3Config],
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
    'formkit.theme.ts'
	],
}