import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/data': 'http://localhost:8000',
      '/creative': 'http://localhost:8000',
      '/execution': 'http://localhost:8000',
      '/memory': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
  build: {
    outDir: '../web/dist',
    emptyOutDir: true,
  },
})
