<script setup lang="ts">
import { ref } from 'vue'

const plainDate = ref<string | Date | null>(null)
const dueDate = ref<string | null>(null)
const range = ref<[string, string] | null>(null)
</script>

<template>
  <h2>Date picker</h2>

  <section>
    <h3>No format props (defaults)</h3>
    <el-date-picker v-model="plainDate" type="date" placeholder="Any date" aria-label="Plain date" />
    <div class="out" data-testid="plain-value">{{ plainDate === null ? '(none)' : JSON.stringify(plainDate) }}</div>
  </section>

  <section>
    <h3>Day-first display, ISO model</h3>
    <el-date-picker
      v-model="dueDate"
      type="date"
      format="DD/MM/YYYY"
      value-format="YYYY-MM-DD"
      placeholder="DD/MM/YYYY"
      aria-label="Due date"
    />
    <div class="out" data-testid="due-value">{{ dueDate ?? '(none)' }}</div>
  </section>

  <section>
    <h3>Range</h3>
    <el-date-picker
      v-model="range"
      type="daterange"
      format="DD/MM/YYYY"
      value-format="YYYY-MM-DD"
      start-placeholder="From"
      end-placeholder="To"
    />
    <div class="out" data-testid="range-value">{{ range ? range.join(' to ') : '(none)' }}</div>
  </section>
</template>
