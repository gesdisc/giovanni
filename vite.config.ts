import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
    base: command === 'build' ? './' : '/',
    plugins: [
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['@preact/signals-core', 'sortablejs', 'idb']
                }
            }
        },
        cssCodeSplit: false,
        chunkSizeWarningLimit: 1000
    },
    define: {
        // Force Lit to production mode
        'process.env.NODE_ENV': JSON.stringify(command === 'build' ? 'production' : 'development'),
        '__LIT_DEV_MODE__': command === 'build' ? false : true
    },
    optimizeDeps: {
        exclude: ['lit']
    },
}))
