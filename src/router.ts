import { createRouter, createWebHistory } from 'vue-router'
import { recipes } from './recipes'
import HomePage from './pages/HomePage.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomePage, meta: { title: 'Home' } },
    // One page per recipe. The header above each page comes from `recipe`.
    ...recipes.map((r) => ({ path: r.path, component: r.page, meta: { title: r.title, recipe: r } })),
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title && title !== 'Home' ? `${title} · Element Plus recipes` : 'Playwright x Element Plus recipes'
})
