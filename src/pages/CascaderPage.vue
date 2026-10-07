<script setup lang="ts">
import { narrow } from '../narrow'
import { ref } from 'vue'
import Readout from '../components/Readout.vue'
import { pathLabels } from '../readout'

const options = [
  {
    value: 'fruit',
    label: 'Fruit',
    children: [
      { value: 'citrus', label: 'Citrus', children: [{ value: 'lemon', label: 'Lemon' }, { value: 'orange', label: 'Orange' }] },
      { value: 'berries', label: 'Berries', children: [{ value: 'strawberry', label: 'Strawberry' }, { value: 'blueberry', label: 'Blueberry' }] },
    ],
  },
  {
    value: 'vegetables',
    label: 'Vegetables',
    children: [
      { value: 'root', label: 'Root', children: [{ value: 'carrot', label: 'Carrot' }, { value: 'beet', label: 'Beet' }] },
      { value: 'leafy', label: 'Leafy', children: [{ value: 'spinach', label: 'Spinach' }, { value: 'lettuce', label: 'Lettuce' }] },
    ],
  },
]

const basic = ref<string[] | null>(null)
const hover = ref<string[] | null>(null)
const searchable = ref<string[] | null>(null)
const anyLevel = ref<string[] | null>(null)
const many = ref<string[][]>([])
const show = (v: unknown) => (v === null || (Array.isArray(v) && v.length === 0) ? '(none)' : JSON.stringify(v))
const labels = (v: string[] | null) => (v ? pathLabels(options, v) : '')
</script>

<template>
  <section>
    <el-form label-width="140px" :label-position="narrow ? 'top' : 'right'">
      <el-form-item label="Produce">
        <Readout :expected="labels(basic)" :stored-key="basic">
          <el-cascader v-model="basic" :options="options" placeholder="Pick produce" />
          <template #stored><span data-testid="basic-value">{{ show(basic) }}</span></template>
        </Readout>
      </el-form-item>
      <el-form-item label="Hover produce">
        <Readout :expected="labels(hover)" :stored-key="hover">
          <el-cascader v-model="hover" :options="options" :props="{ expandTrigger: 'hover' }" placeholder="Hover to expand" />
          <template #stored><span data-testid="hover-value">{{ show(hover) }}</span></template>
        </Readout>
      </el-form-item>
      <el-form-item label="Search produce">
        <Readout :expected="labels(searchable)" :stored-key="searchable">
          <el-cascader v-model="searchable" :options="options" filterable placeholder="Type to search" />
          <template #stored><span data-testid="search-value">{{ show(searchable) }}</span></template>
        </Readout>
      </el-form-item>
      <el-form-item label="Any level">
        <Readout :expected="labels(anyLevel)" :stored-key="anyLevel">
          <el-cascader v-model="anyLevel" :options="options" :props="{ checkStrictly: true }" placeholder="Pick any level" />
          <template #stored><span data-testid="any-value">{{ show(anyLevel) }}</span></template>
        </Readout>
      </el-form-item>
      <el-form-item label="Many produce">
        <Readout :expected="many.map((p) => pathLabels(options, p)).join(', ')" :stored-key="many">
          <el-cascader v-model="many" :options="options" :props="{ multiple: true }" placeholder="Pick several" />
          <template #stored><span data-testid="many-value">{{ show(many) }}</span></template>
        </Readout>
      </el-form-item>
    </el-form>
  </section>
</template>
