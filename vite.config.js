import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Manual chunk: pisahkan vendor & data materi besar dari bundle app utama,
// agar app-shell (React + UI) bisa di-cache terpisah dan tidak ikut ter-invalidate
// tiap kali data materi berubah. Tidak mengubah perilaku runtime sedikit pun.
function chunkOf(id) {
  if (!id.includes('node_modules')) {
    // Data materi per level (file besar) → chunk sendiri per kelompok.
    if (id.includes('/src/data/kotoba-n1') || id.includes('\\src\\data\\kotoba-n1')) return 'data-kotoba-n1'
    if (id.includes('/src/data/kotoba-n2') || id.includes('\\src\\data\\kotoba-n2')) return 'data-kotoba-n2'
    if (id.includes('/src/data/kotoba-n3') || id.includes('\\src\\data\\kotoba-n3')) return 'data-kotoba-n3'
    if (id.includes('/src/data/mnenonic') || id.includes('\\src\\data\\mnenonic')) return 'data-mnemonic'
    if (id.includes('/src/data/') || id.includes('\\src\\data\\')) return 'data-core'
    return undefined
  }
  if (id.includes('firebase')) return 'vendor-firebase'
  if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\')) return 'vendor-react'
  if (id.includes('lucide')) return 'vendor-icons'
  return 'vendor'
}

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: chunkOf,
      },
    },
  },
})