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
            'https://rays-additionally-ron-designers.trycloudflare.com',
            'https://initiative-universities-roll-annual.trycloudflare.com' // Jaga-jaga backend domain juga
        ]
    }
})
