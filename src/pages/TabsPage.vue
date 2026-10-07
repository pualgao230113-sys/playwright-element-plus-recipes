<script setup lang="ts">
import { ref } from 'vue'

const active = ref('summary')
const loads = ref<string[]>([])
// Stand-in for a pane that fetches data when it first mounts.
const ReviewsPane = {
  setup() {
    loads.value.push('reviews')
    return () => 'Reviews: 3 readers liked this book'
  },
}
</script>

<template>
  <h2>Tabs</h2>
  <el-tabs v-model="active" aria-label="Book sections">
    <el-tab-pane label="Summary" name="summary">A desert planet and a spice everyone wants.</el-tab-pane>
    <el-tab-pane label="Summary notes" name="notes">Notes on the summary.</el-tab-pane>
    <el-tab-pane label="Reviews" name="reviews" lazy><component :is="ReviewsPane" /></el-tab-pane>
    <el-tab-pane label="Sequels" name="sequels" disabled>Dune Messiah</el-tab-pane>
  </el-tabs>
  <div class="out">active: <span data-testid="active-tab">{{ active }}</span></div>
  <div class="out">loaded: <span data-testid="loads">{{ loads.join(', ') || '(none)' }}</span></div>
</template>
