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
  { path: '/cascader', component: () => import('./pages/CascaderPage.vue'), meta: { title: 'Cascader' } },
  { path: '/tree', component: () => import('./pages/TreePage.vue'), meta: { title: 'Tree / Tree select' } },
  { path: '/autocomplete', component: () => import('./pages/AutocompletePage.vue'), meta: { title: 'Autocomplete' } },
  { path: '/input-number', component: () => import('./pages/InputNumberPage.vue'), meta: { title: 'Input number' } },
  { path: '/time-picker', component: () => import('./pages/TimePickerPage.vue'), meta: { title: 'Time picker / Time select' } },
  { path: '/upload', component: () => import('./pages/UploadPage.vue'), meta: { title: 'Upload' } },
  { path: '/tabs', component: () => import('./pages/TabsPage.vue'), meta: { title: 'Tabs' } },
  { path: '/pagination', component: () => import('./pages/PaginationPage.vue'), meta: { title: 'Pagination' } },
  { path: '/dropdown', component: () => import('./pages/DropdownPage.vue'), meta: { title: 'Dropdown' } },
  { path: '/popover', component: () => import('./pages/PopoverPage.vue'), meta: { title: 'Popconfirm / Tooltip' } },
  { path: '/notification', component: () => import('./pages/NotificationPage.vue'), meta: { title: 'Notification' } },
  { path: '/collapse', component: () => import('./pages/CollapsePage.vue'), meta: { title: 'Collapse' } },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', redirect: '/select' }, ...recipeRoutes],
})
