<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { recipes } from '../recipes'

const emit = defineEmits<{ close: [navigated: boolean] }>()
const router = useRouter()

const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement>()

// Every word must appear in the name, component, family or pitfall line.
const results = computed(() => {
  const words = query.value.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return recipes
  return recipes.filter((r) => {
    const hay = `${r.num} ${r.title} ${r.component} ${r.family} ${r.pitfall}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
})

async function go(path: string) {
  await router.push(path)
  emit('close', true)
}

function onKeydown(e: KeyboardEvent) {
  const n = results.value.length
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close', false)
  } else if (e.key === 'ArrowDown' && n) {
    e.preventDefault()
    active.value = (active.value + 1) % n
  } else if (e.key === 'ArrowUp' && n) {
    e.preventDefault()
    active.value = (active.value - 1 + n) % n
  } else if (e.key === 'Enter' && n) {
    e.preventDefault()
    go(results.value[Math.min(active.value, n - 1)].path)
  } else if (e.key === 'Tab') {
    // Keep focus in the panel: the input is the only stop, results use arrows.
    e.preventDefault()
  }
}

onMounted(async () => {
  await nextTick()
  input.value?.focus()
})
</script>

<template>
  <div class="search-backdrop chrome" @mousedown.self="emit('close', false)">
    <div class="search" role="dialog" aria-modal="true" aria-label="Search recipes" @keydown="onKeydown">
      <input
        ref="input"
        v-model="query"
        type="search"
        class="search__input"
        placeholder="Component or pitfall, e.g. teleported, blur, hidden"
        aria-label="Search recipes"
        aria-controls="search-results"
        :aria-activedescendant="results.length ? `search-result-${active}` : undefined"
        autocomplete="off"
        spellcheck="false"
        @input="active = 0"
      />
      <ul id="search-results" class="search__results" role="listbox" aria-label="Recipes">
        <li
          v-for="(r, i) in results"
          :id="`search-result-${i}`"
          :key="r.path"
          role="option"
          :aria-selected="i === active"
          :class="{ 'is-active': i === active }"
          @mousemove="active = i"
          @click="go(r.path)"
        >
          <span class="search__title">{{ r.num }} {{ r.title }}</span>
          <span class="search__pitfall">{{ r.pitfall }}</span>
        </li>
        <li v-if="!results.length" class="search__empty" role="presentation">No recipe matches that.</li>
      </ul>
      <p class="search__hint">Arrow keys to move, Enter to open, Esc to close.</p>
    </div>
  </div>
</template>

<style>
.search-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12vh 16px 16px;
  background: rgba(15, 22, 32, 0.45);
  font-family: var(--sans);
}
.search {
  width: 100%;
  max-width: 560px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: var(--page);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}
.search__input {
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 14px 16px;
  font: inherit;
  font-size: 16px;
  background: transparent;
  color: var(--ink);
}
.search__input::placeholder {
  color: var(--muted);
}
.search .search__input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  border-radius: 0;
}
.search__results {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
}
.search__results li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.search__results li.is-active {
  background: var(--accent-tint);
  box-shadow: inset 2px 0 0 var(--accent);
}
.search__title {
  font-weight: 650;
  font-size: 14px;
}
.search__pitfall {
  font-size: 13px;
  color: var(--muted);
}
.search__empty {
  color: var(--muted);
  font-size: 14px;
  cursor: default;
}
.search__hint {
  margin: 0;
  padding: 8px 16px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--muted);
}
</style>
