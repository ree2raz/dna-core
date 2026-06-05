import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wasmPkg = path.resolve(__dirname, '../crates/dna-core/pkg')

const REPO_NAME = 'dna-core'
const GITHUB_PAGES_BASE = `/${REPO_NAME}/`

export default defineConfig(({ command }) => {
  const isServe = command === 'serve'
  return {
    base: isServe ? '/' : GITHUB_PAGES_BASE,
    plugins: [react()],
    server: {
      port: 5178,
      strictPort: true,
      fs: {
        allow: [path.resolve(__dirname, '..')],
      },
    },
    preview: {
      port: 5178,
      strictPort: true,
    },
    optimizeDeps: {
      exclude: ['dna-core'],
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
    },
    resolve: {
      alias: {
        'dna-core': path.resolve(wasmPkg, 'dna_core.js'),
      },
    },
  }
})
