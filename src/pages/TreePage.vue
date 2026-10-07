<script setup lang="ts">
import { ref } from 'vue'
import type { TreeInstance } from 'element-plus'

const data = [
  {
    id: 'fiction',
    label: 'Fiction',
    children: [
      { id: 'dune', label: 'Dune' },
      { id: 'emma', label: 'Emma' },
      { id: 'ulysses', label: 'Ulysses' },
    ],
  },
  {
    id: 'non-fiction',
    label: 'Non-fiction',
    children: [
      { id: 'cosmos', label: 'Cosmos' },
      { id: 'sapiens', label: 'Sapiens' },
    ],
  },
]

const tree = ref<TreeInstance>()
const checked = ref<string[]>([])
const halfChecked = ref<string[]>([])
function onCheck() {
  checked.value = (tree.value?.getCheckedKeys() ?? []) as string[]
  halfChecked.value = (tree.value?.getHalfCheckedKeys() ?? []) as string[]
}

const single = ref<string | null>(null)
const multi = ref<string[]>([])
</script>

<template>
  <h2>Tree / Tree select</h2>

  <section>
    <h3>Tree with checkboxes</h3>
    <el-tree
      ref="tree"
      :data="data"
      node-key="id"
      show-checkbox
      aria-label="Library"
      style="max-width: 360px"
      @check="onCheck"
    />
    <div class="out" data-testid="checked-value">{{ checked.join(', ') || '(none)' }}</div>
    <div class="out" data-testid="half-value">{{ halfChecked.join(', ') || '(none)' }}</div>
  </section>

  <section>
    <h3>Tree select</h3>
    <el-tree-select v-model="single" :data="data" node-key="id" aria-label="Book" placeholder="Pick a book" style="width: 240px" />
    <div class="out" data-testid="single-value">{{ single ?? '(none)' }}</div>
  </section>

  <section>
    <h3>Tree select, multiple with checkboxes</h3>
    <el-tree-select
      v-model="multi"
      :data="data"
      node-key="id"
      multiple
      show-checkbox
      aria-label="Shelf"
      placeholder="Fill the shelf"
      style="width: 360px"
    />
    <div class="out" data-testid="multi-value">{{ multi.join(', ') || '(none)' }}</div>
  </section>
</template>
