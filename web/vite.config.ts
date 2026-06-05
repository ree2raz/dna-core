import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wasmPkg = path.resolve(__dirname, '../crates/dna-core/pkg')

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  optimizeDeps: {
    exclude: ['dna-core'],
  },
  build: {
    target: 'es2022',
  },
  resolve: {
    alias: {
      'dna-core': path.resolve(wasmPkg, 'dna_core.js'),
    },
  },
})
