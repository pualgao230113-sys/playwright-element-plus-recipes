<script setup lang="ts">
import { ref } from 'vue'
import { README_URL, specUrl, type Recipe } from '../recipes'
import { readSteps, writeSteps } from '../prefs'

const props = defineProps<{ recipe: Recipe }>()

// Ticked steps are stored by their index, per page.
const done = ref<string[]>(readSteps(props.recipe.path))
function toggle(i: number, checked: boolean) {
  const key = String(i)
  done.value = checked ? [...new Set([...done.value, key])] : done.value.filter((k) => k !== key)
  writeSteps(props.recipe.path, done.value)
}
</script>

<template>
  <header class="recipe-head chrome">
    <p class="eyebrow">Recipe {{ recipe.num }} · <code>{{ recipe.component }}</code></p>
    <h1 class="page-title">{{ recipe.title }}</h1>

    <div class="try">
      <h3 :id="`try-${recipe.num}`">Try this</h3>
      <ol class="steps" :aria-labelledby="`try-${recipe.num}`">
        <li v-for="(step, i) in recipe.steps" :key="i" :class="{ 'is-done': done.includes(String(i)) }">
          <input
            :id="`step-${recipe.num}-${i}`"
            type="checkbox"
            :checked="done.includes(String(i))"
            @change="toggle(i, ($event.target as HTMLInputElement).checked)"
          />
          <label :for="`step-${recipe.num}-${i}`">{{ step }}</label>
        </li>
      </ol>
    </div>

    <p class="head-links">
      <a :href="specUrl(recipe.spec)" target="_blank" rel="noopener">Open the spec: {{ recipe.spec }}</a>
      <a :href="README_URL" target="_blank" rel="noopener">README: all recipes</a>
    </p>
  </header>
</template>
