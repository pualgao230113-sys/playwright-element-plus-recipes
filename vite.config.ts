import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // GitHub Pages serves the demo under /<repo>/. Local dev and tests use '/'.
  base: process.env.DEMO_BASE ?? '/',
  plugins: [vue()],
  server: { port: 5179, strictPort: true },
  build: {
    // Element Plus is registered globally, so the main chunk is about 1 MB.
    chunkSizeWarningLimit: 1500,
    // Ship the licence texts of the bundled packages (Vue, Element Plus, ...)
    // next to the built demo. The sidebar links to this file.
    license: { fileName: 'third-party-licenses.md' },
  },
})
