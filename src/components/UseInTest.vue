<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { Recipe } from '../recipes'

defineProps<{ recipe: Recipe }>()

const code = ref<HTMLElement>()
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  const text = code.value?.textContent ?? ''
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // No clipboard access (http, old browser): select the text instead.
    const range = document.createRange()
    if (code.value) range.selectNodeContents(code.value)
    const sel = getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    return
  }
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1500)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="use-in-test chrome">
    <div class="use-in-test__head">
      <h3>Use in your test</h3>
      <button type="button" class="tool-button" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
    </div>
    <p>The main call for this page, with your app's names in place of the demo's.</p>
    <pre class="code"><code ref="code">{{ recipe.snippet }}</code></pre>
  </div>
</template>
