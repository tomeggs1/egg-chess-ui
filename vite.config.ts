import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the egg-chess-service during local development.
      '/api': {
        target: 'http://localhost:8180',
        changeOrigin: true,
      },
      // Forward the WebSocket (STOMP) endpoint, including the upgrade handshake.
      '/ws': {
        target: 'http://localhost:8180',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
