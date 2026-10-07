<script setup lang="ts">
import { ref } from 'vue'

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
</script>

<template>
  <h2>Cascader</h2>
  <el-form label-width="140px" style="max-width: 560px">
    <el-form-item label="Produce">
      <el-cascader v-model="basic" :options="options" placeholder="Pick produce" />
      <div class="out" data-testid="basic-value">{{ show(basic) }}</div>
    </el-form-item>
    <el-form-item label="Hover produce">
      <el-cascader v-model="hover" :options="options" :props="{ expandTrigger: 'hover' }" placeholder="Hover to expand" />
      <div class="out" data-testid="hover-value">{{ show(hover) }}</div>
    </el-form-item>
    <el-form-item label="Search produce">
      <el-cascader v-model="searchable" :options="options" filterable placeholder="Type to search" />
      <div class="out" data-testid="search-value">{{ show(searchable) }}</div>
    </el-form-item>
    <el-form-item label="Any level">
      <el-cascader v-model="anyLevel" :options="options" :props="{ checkStrictly: true }" placeholder="Pick any level" />
      <div class="out" data-testid="any-value">{{ show(anyLevel) }}</div>
    </el-form-item>
    <el-form-item label="Many produce">
      <el-cascader v-model="many" :options="options" :props="{ multiple: true }" placeholder="Pick several" />
      <div class="out" data-testid="many-value">{{ show(many) }}</div>
    </el-form-item>
  </el-form>
</template>
