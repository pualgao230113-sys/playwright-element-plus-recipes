/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/** The installed Element Plus version, read from its package.json at build time. */
declare const __EP_VERSION__: string
