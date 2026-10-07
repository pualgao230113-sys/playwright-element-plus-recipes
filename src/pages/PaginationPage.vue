<script setup lang="ts">
import { computed, ref } from 'vue'

const fruits = Array.from({ length: 95 }, (_, i) => `Fruit ${i + 1}`)
const page = ref(1)
const size = ref(10)
const visible = computed(() => fruits.slice((page.value - 1) * size.value, page.value * size.value))
</script>

<template>
  <section>
  <ul data-testid="fruit-list">
    <li v-for="f in visible" :key="f">{{ f }}</li>
  </ul>
  <el-pagination
    v-model:current-page="page"
    v-model:page-size="size"
    :total="fruits.length"
    :page-sizes="[10, 20, 50]"
    layout="total, sizes, prev, pager, next, jumper"
  />
  <div class="out">page <span data-testid="page">{{ page }}</span>, size <span data-testid="size">{{ size }}</span></div>
  </section>
</template>
