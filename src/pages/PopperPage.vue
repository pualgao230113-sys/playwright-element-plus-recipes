<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

const colour = ref('')
const colours = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet']

// The spec needs the select at a fixed height on the page: about 480 px from
// the top, so a 560 px window leaves no room under it and a 900 px window
// does. The header above the panel varies with its text, so the spacer is
// sized to whatever is left.
const SELECT_TOP = 480
const spacer = ref<HTMLElement>()
const field = ref<HTMLElement>()
const spacerHeight = ref(0)

async function place() {
  spacerHeight.value = 0
  await nextTick()
  if (!field.value) return
  const top = field.value.getBoundingClientRect().top + scrollY
  spacerHeight.value = Math.max(0, SELECT_TOP - top)
}
onMounted(() => {
  place()
  // Fonts can change the header height once loaded.
  document.fonts?.ready.then(place)
})
</script>

<template>
  <section>
    <p>The select below sits near the bottom of a short page.</p>
    <div ref="spacer" :style="{ height: `${spacerHeight}px` }"></div>
    <div ref="field">
      <el-select v-model="colour" placeholder="Pick a colour" aria-label="Colour" style="width: 240px">
        <el-option v-for="c in colours" :key="c" :label="c" :value="c" />
      </el-select>
    </div>
    <div class="out">v-model: <span data-testid="colour-value">{{ colour || '(none)' }}</span></div>
  </section>
</template>
