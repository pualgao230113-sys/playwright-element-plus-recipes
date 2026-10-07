import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// One page per recipe. The `title` is shown in the sidebar.
export const recipeRoutes: (RouteRecordRaw & { meta: { title: string } })[] = [
  { path: '/select', component: () => import('./pages/SelectPage.vue'), meta: { title: 'Select' } },
  { path: '/message', component: () => import('./pages/MessagePage.vue'), meta: { title: 'Message (toasts)' } },
  { path: '/checkbox', component: () => import('./pages/CheckboxPage.vue'), meta: { title: 'Checkbox / Radio / Switch' } },
  { path: '/date-picker', component: () => import('./pages/DatePickerPage.vue'), meta: { title: 'Date picker' } },
  { path: '/dialog', component: () => import('./pages/DialogPage.vue'), meta: { title: 'Dialog / Drawer / MessageBox' } },
  { path: '/table', component: () => import('./pages/TablePage.vue'), meta: { title: 'Table' } },
  { path: '/form', component: () => import('./pages/FormPage.vue'), meta: { title: 'Form validation' } },
  { path: '/input', component: () => import('./pages/InputPage.vue'), meta: { title: 'Input' } },
  { path: '/popper', component: () => import('./pages/PopperPage.vue'), meta: { title: 'Viewport & popper placement' } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', redirect: '/select' }, ...recipeRoutes],
})
