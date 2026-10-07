import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Element Plus's dark variables, applied when <html> has the `dark` class.
import 'element-plus/theme-chalk/dark/css-vars.css'
// Self-hosted, so the demo (and the tests) never need the network for fonts.
import '@fontsource-variable/recursive/full.css'
import './styles.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).use(ElementPlus).mount('#app')
