<script setup lang="ts">
import { ref } from 'vue'
import Readout from '../components/Readout.vue'

const fruits = ['Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry', 'Cherry', 'Grape', 'Pineapple']

const fruit = ref('')
const picked = ref('')
const selectCount = ref(0)

// Fake server search with a delay.
function search(query: string, cb: (items: { value: string }[]) => void) {
  setTimeout(() => {
    const q = query.toLowerCase()
    cb(fruits.filter((f) => f.toLowerCase().includes(q)).map((value) => ({ value })))
  }, 300)
}
function onSelect(item: Record<string, unknown>) {
  picked.value = String(item.value)
  selectCount.value++
}
</script>

<template>
  <section>
    <Readout :expected="fruit" :stored-key="fruit">
      <el-autocomplete
        v-model="fruit"
        :fetch-suggestions="search"
        :debounce="200"
        placeholder="Start typing a fruit"
        aria-label="Fruit"
        style="width: 280px"
        @select="onSelect"
      />
      <template #stored><span data-testid="model-value">{{ fruit || '(empty)' }}</span></template>
      <template #extra>
        <div>picked: <span data-testid="picked-value">{{ picked || '(none)' }}</span></div>
        <div>select events: <span data-testid="select-count">{{ selectCount }}</span></div>
      </template>
    </Readout>
  </section>
</template>
