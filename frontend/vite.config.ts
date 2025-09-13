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
    port: 8439,
    host: true,
    strictPort: true,
    open: false,
    cors: true,
    allowedHosts: ['crm.probyr.com', 'localhost', '0.0.0.0']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
