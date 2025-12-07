import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Listen on all addresses
        // Mengizinkan akses dari domain Cloudflare Tunnel
        // Jika nanti link tunnel berubah, Anda perlu update domain ini lagi
        allowedHosts: [
            'jeff-eight-denver-identify.trycloudflare.com',
            'projectors-llp-daughters-lists.trycloudflare.com',
            '.trycloudflare.com' // Wildcard attempt sometimes works depending on version, otherwise specific hosts needed
        ]
    }
})
