import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7778,
    proxy: {
      '/api': {
        target: 'http://localhost:7777',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  build: {
    outDir: '../server/dist',
    emptyOutDir: true
  }
})
