import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Le decimos a electron-vite dónde están nuestras 3 entradas,
// porque no usamos la estructura por defecto (src/main, src/preload, src/renderer).
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: { rollupOptions: { input: resolve(__dirname, 'main/index.ts') } }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { rollupOptions: { input: resolve(__dirname, 'preload/index.ts') } }
  },
  renderer: {
    root: resolve(__dirname, 'app'),
    plugins: [react()],
    build: { rollupOptions: { input: resolve(__dirname, 'app/index.html') } }
  }
})
