import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Birdnest (Muns) — proxied in dev to avoid CORS. Client calls /muns/*
      // and Vite forwards to https://birdnest.muns.io/*.
      '/muns': {
        target: 'https://birdnest.muns.io',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/muns/, ''),
      },
    },
  },
})
