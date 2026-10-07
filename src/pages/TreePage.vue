<script setup lang="ts">
import { ref } from 'vue'
import type { TreeInstance } from 'element-plus'
import Readout from '../components/Readout.vue'
import { labelOf } from '../readout'

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
    <div class="out">checked keys: <span data-testid="checked-value">{{ checked.join(', ') || '(none)' }}</span></div>
    <div class="out">half-checked keys: <span data-testid="half-value">{{ halfChecked.join(', ') || '(none)' }}</span></div>
  </section>

  <section>
    <h3>Tree select</h3>
    <Readout :expected="single ? labelOf(data, single) : ''" placeholder="Pick a book" :stored-key="single">
      <el-tree-select v-model="single" :data="data" node-key="id" aria-label="Book" placeholder="Pick a book" style="width: 240px" />
      <template #stored><span data-testid="single-value">{{ single ?? '(none)' }}</span></template>
    </Readout>
  </section>

  <section>
    <h3>Tree select, multiple with checkboxes</h3>
    <Readout :expected="multi.map((id) => labelOf(data, id)).join(', ')" placeholder="Fill the shelf" :stored-key="multi">
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
      <template #stored><span data-testid="multi-value">{{ multi.join(', ') || '(none)' }}</span></template>
    </Readout>
  </section>
</template>
