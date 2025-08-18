import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
    base: command === 'build' ? './' : '/',
    plugins: [
        tailwindcss(),
    ],
}))
