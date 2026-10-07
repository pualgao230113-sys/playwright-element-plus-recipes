<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { families, recipes, type Recipe } from './recipes'
import { isDark, markSeen, seen, toggleTheme } from './prefs'
import RecipeHeader from './components/RecipeHeader.vue'
import UseInTest from './components/UseInTest.vue'
import SearchPanel from './components/SearchPanel.vue'
import ThemeIcon from './components/ThemeIcon.vue'

// Written by `vite build`; it does not exist in dev.
const licensesUrl = `${import.meta.env.BASE_URL}third-party-licenses.md`
const epVersion = __EP_VERSION__

const route = useRoute()
const router = useRouter()
const recipe = computed(() => route.meta.recipe as Recipe | undefined)
const groups = families.map((family) => ({ family, items: recipes.filter((r) => r.family === family) }))
const seenCount = computed(() => recipes.filter((r) => seen.value.includes(r.path)).length)

watch(
  () => route.path,
  (path) => {
    if (recipes.some((r) => r.path === path)) markSeen(path)
  },
)

// Quick search: "/" or Cmd/Ctrl+K.
const searchOpen = ref(false)
let returnFocus: HTMLElement | null = null
function openSearch() {
  returnFocus = document.activeElement as HTMLElement | null
  searchOpen.value = true
}
async function closeSearch(navigated: boolean) {
  searchOpen.value = false
  if (!navigated) {
    returnFocus?.focus?.()
    return
  }
  // After a jump, start keyboard users at the new page's title. The
  // tabindex is only there while it has focus, so clicks on the title
  // (some specs click it to blur a field) behave as before.
  await nextTick()
  const title = document.querySelector<HTMLElement>('.page-title')
  if (!title) return
  title.tabIndex = -1
  title.addEventListener('blur', () => title.removeAttribute('tabindex'), { once: true })
  title.focus()
}
function isEditable(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}
function onKeydown(e: KeyboardEvent) {
  if (searchOpen.value) return
  if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey) && !e.altKey) {
    e.preventDefault()
    openSearch()
  } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditable(e.target)) {
    e.preventDefault()
    openSearch()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function onPick(e: Event) {
  router.push((e.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="shell">
    <a class="skip-link" href="#content">Skip to content</a>
    <!-- Phones: a compact bar instead of the sidebar. -->
    <div class="topbar chrome">
      <p class="brand"><RouterLink to="/">EP recipes</RouterLink></p>
      <select aria-label="Go to recipe" :value="recipe ? recipe.path : '/'" @change="onPick">
        <option value="/">Home</option>
        <optgroup v-for="g in groups" :key="g.family" :label="g.family">
          <option v-for="r in g.items" :key="r.path" :value="r.path">{{ r.title }}</option>
        </optgroup>
      </select>
      <button type="button" class="tool-button" aria-label="Search recipes" @click="openSearch">
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.8" />
          <path d="m11 11 3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
      <button type="button" class="tool-button" aria-label="Dark theme" :aria-pressed="isDark" @click="toggleTheme">
        <ThemeIcon :dark="isDark" />
      </button>
    </div>

    <nav class="sidebar chrome" aria-label="Recipes">
      <p class="brand">
        <RouterLink to="/">EP recipes<span class="sr-only">: </span><small>Playwright and Element Plus</small></RouterLink>
      </p>

      <div class="tools">
        <button type="button" class="tool-button tool-button--grow" @click="openSearch">
          Search recipes <kbd aria-hidden="true">/</kbd>
        </button>
        <button type="button" class="tool-button" aria-label="Dark theme" :aria-pressed="isDark" @click="toggleTheme">
          <ThemeIcon :dark="isDark" />
        </button>
      </div>

      <p class="progress"><strong>{{ seenCount }} of {{ recipes.length }}</strong> seen</p>

      <div v-for="g in groups" :key="g.family" class="nav-group">
        <p class="nav-group__label">{{ g.family }}</p>
        <RouterLink v-for="r in g.items" :key="r.path" :to="r.path" class="nav-link">
          <span class="seen-dot" :class="{ 'is-seen': seen.includes(r.path) }" aria-hidden="true"></span>
          <span>{{ r.title }}<span v-if="seen.includes(r.path)" class="sr-only"> (seen)</span></span>
        </RouterLink>
      </div>

      <div class="sidebar-foot">
        <span>Element Plus {{ epVersion }}</span>
        <a :href="licensesUrl">Third-party licenses</a>
      </div>
    </nav>

    <main id="content" class="main" tabindex="-1">
      <div class="main-inner">
        <RecipeHeader v-if="recipe" :key="recipe.path" :recipe="recipe" />
        <div class="demo">
          <RouterView />
        </div>
        <UseInTest v-if="recipe" :key="recipe.path" :recipe="recipe" />
      </div>
    </main>

    <SearchPanel v-if="searchOpen" @close="closeSearch" />
  </div>
</template>
