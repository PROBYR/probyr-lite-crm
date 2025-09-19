import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '~backend/client': path.resolve(__dirname, './client'),
      '~backend': path.resolve(__dirname, '../backend'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  mode: "development",
  build: {
    minify: false,
  },
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 0, // 0 = auto-assign available port
    host: true,
    strictPort: false, // Allow port changes if specified port is unavailable
    open: false,
    cors: true
    // No allowedHosts restriction - allow all hosts
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
