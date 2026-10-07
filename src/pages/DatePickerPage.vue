<script setup lang="ts">
import { computed, ref } from 'vue'
import Readout from '../components/Readout.vue'
import { dayFirst, jsonDay } from '../readout'

const plainDate = ref<string | Date | null>(null)
const dueDate = ref<string | null>(null)
const range = ref<[string, string] | null>(null)

// The field shows YYYY-MM-DD; compare it with the day the stored value has
// once it is serialised (east of UTC that is the day before).
const plainExpected = computed(() => (plainDate.value === null ? '' : jsonDay(plainDate.value)))
</script>

<template>
  <section>
    <h3>No format props (defaults)</h3>
    <Readout :expected="plainExpected" :stored-key="plainDate">
      <el-date-picker v-model="plainDate" type="date" placeholder="Any date" aria-label="Plain date" />
      <template #stored><span data-testid="plain-value">{{ plainDate === null ? '(none)' : JSON.stringify(plainDate) }}</span></template>
    </Readout>
  </section>

  <section>
    <h3>Day-first display, ISO model</h3>
    <Readout :expected="dueDate ? dayFirst(dueDate) : ''" :stored-key="dueDate">
      <el-date-picker
        v-model="dueDate"
        type="date"
        format="DD/MM/YYYY"
        value-format="YYYY-MM-DD"
        placeholder="DD/MM/YYYY"
        aria-label="Due date"
      />
      <template #stored><span data-testid="due-value">{{ dueDate ?? '(none)' }}</span></template>
    </Readout>
  </section>

  <section>
    <h3>Range</h3>
    <Readout :expected="range ? range.map(dayFirst).join(' to ') : ''" :stored-key="range">
      <el-date-picker
        v-model="range"
        type="daterange"
        format="DD/MM/YYYY"
        value-format="YYYY-MM-DD"
        start-placeholder="From"
        end-placeholder="To"
      />
      <template #stored><span data-testid="range-value">{{ range ? range.join(' to ') : '(none)' }}</span></template>
    </Readout>
  </section>
</template>
