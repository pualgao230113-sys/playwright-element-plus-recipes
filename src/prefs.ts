import { ref, watch } from 'vue'

// Per-visitor conveniences kept in localStorage: theme, pages seen, ticked
// steps. Storage can be missing or throw (private windows, blocked site
// data), so every access is wrapped and the page works without it.

const PREFIX = 'ep-recipes:'

function read(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(PREFIX + key)
    else localStorage.setItem(PREFIX + key, value)
  } catch {
    // Not saved. Fine for a convenience.
  }
}

function readList(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(read(key) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

// --- Theme -----------------------------------------------------------------
// No stored choice means "follow the system". Tests run in a fresh context
// with Playwright's default (light) colour scheme, so they always get light.

type Theme = 'light' | 'dark'

const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
const stored = read('theme')
const chosen = ref<Theme | null>(stored === 'light' || stored === 'dark' ? stored : null)
const systemDark = ref(media?.matches ?? false)
media?.addEventListener('change', (e) => (systemDark.value = e.matches))

export const isDark = ref(false)

watch(
  [chosen, systemDark],
  () => {
    isDark.value = chosen.value ? chosen.value === 'dark' : systemDark.value
    // Element Plus switches its own variables on `html.dark`.
    document.documentElement.classList.toggle('dark', isDark.value)
    document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
  },
  { immediate: true },
)

export function toggleTheme() {
  const next: Theme = isDark.value ? 'light' : 'dark'
  // Picking the system's own scheme again clears the stored choice.
  chosen.value = next === (systemDark.value ? 'dark' : 'light') ? null : next
  write('theme', chosen.value)
}

// --- Pages seen ------------------------------------------------------------

export const seen = ref<string[]>(readList('seen'))

export function markSeen(path: string) {
  if (seen.value.includes(path)) return
  seen.value = [...seen.value, path]
  write('seen', JSON.stringify(seen.value))
}

// --- Ticked "Try this" steps, per page ---------------------------------------

export function readSteps(path: string): string[] {
  return readList(`steps:${path}`)
}

export function writeSteps(path: string, done: string[]) {
  write(`steps:${path}`, done.length ? JSON.stringify(done) : null)
}
