import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:5000'
    }
  },
  resolve: {
    alias: {
      '@mediapipe/pose': path.resolve(__dirname, './src/components/mediapipe-shim.js')
    }
  }
})
