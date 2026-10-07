import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const require = createRequire(import.meta.url)
// Shown at the bottom of the sidebar, so a visitor knows which version the
// demo was built with. Read here because the CI matrix swaps the version.
const elementPlusVersion: string = require('element-plus/package.json').version

export default defineConfig({
  // GitHub Pages serves the demo under /<repo>/. Local dev and tests use '/'.
  base: process.env.DEMO_BASE ?? '/',
  plugins: [vue()],
  define: { __EP_VERSION__: JSON.stringify(elementPlusVersion) },
  server: { port: 5179, strictPort: true },
  build: {
    // Element Plus is registered globally, so the main chunk is about 1 MB.
    chunkSizeWarningLimit: 1500,
    // Ship the licence texts of the bundled packages (Vue, Element Plus, ...)
    // next to the built demo. The sidebar links to this file.
    license: { fileName: 'third-party-licenses.md' },
  },
})
