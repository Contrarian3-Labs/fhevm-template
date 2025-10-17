import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@fhevm-sdk/vue': path.resolve(__dirname, '../fhevm-sdk/dist/vue/index.js'),
      '@fhevm-sdk/core': path.resolve(__dirname, '../fhevm-sdk/dist/exports/core.js'),
      '@fhevm-sdk': path.resolve(__dirname, '../fhevm-sdk/dist/exports/index.js'),
      buffer: 'buffer'
    },
    dedupe: ['vue']
  },
  define: {
    'global': 'globalThis'
  },
  server: {
    port: 3001,
    strictPort: false
  },
  optimizeDeps: {
    exclude: ['@fhevm-sdk'],
    include: ['buffer'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
})
