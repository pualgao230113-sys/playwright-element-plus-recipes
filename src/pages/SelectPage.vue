<script setup lang="ts">
import { ref } from 'vue'
import Readout from '../components/Readout.vue'

const fruits = ['Apple', 'Apricot', 'Banana', 'Cherry', 'Grape', 'Mango', 'Pineapple']
const books = ['Dune', 'Emma', 'Middlemarch', 'Moby-Dick', 'Neuromancer', 'Persuasion', 'Ulysses']

const fruit = ref('')
const filteredFruit = ref('')
const basket = ref<string[]>([])
const book = ref('')
const bookOptions = ref<string[]>([])
const loadingBooks = ref(false)

// Fake server search with a delay, like a real remote select would have.
function searchBooks(query: string) {
  loadingBooks.value = true
  setTimeout(() => {
    bookOptions.value = query ? books.filter((b) => b.toLowerCase().includes(query.toLowerCase())) : []
    loadingBooks.value = false
  }, 400)
}
</script>

<template>
  <section>
    <h3>Basic</h3>
    <Readout :expected="fruit" placeholder="Pick a fruit" :stored-key="fruit">
      <el-select v-model="fruit" placeholder="Pick a fruit" aria-label="Fruit" style="width: 240px">
        <el-option v-for="f in fruits" :key="f" :label="f" :value="f" />
      </el-select>
      <template #stored><span data-testid="fruit-value">{{ fruit || '(none)' }}</span></template>
    </Readout>
  </section>

  <section>
    <h3>Filterable</h3>
    <Readout :expected="filteredFruit" placeholder="Type to filter" :stored-key="filteredFruit">
      <el-select v-model="filteredFruit" filterable placeholder="Type to filter" aria-label="Filtered fruit" style="width: 240px">
        <el-option v-for="f in fruits" :key="f" :label="f" :value="f" />
      </el-select>
      <template #stored><span data-testid="filtered-fruit-value">{{ filteredFruit || '(none)' }}</span></template>
    </Readout>
  </section>

  <section>
    <h3>Multiple</h3>
    <Readout :expected="basket.join(', ')" placeholder="Fill the basket" :stored-key="basket">
      <el-select v-model="basket" multiple placeholder="Fill the basket" aria-label="Basket" style="width: 360px">
        <el-option v-for="f in fruits" :key="f" :label="f" :value="f" />
      </el-select>
      <template #stored><span data-testid="basket-value">{{ basket.join(', ') || '(empty)' }}</span></template>
    </Readout>
  </section>

  <section>
    <h3>Remote</h3>
    <Readout :expected="book" placeholder="Search a book" :stored-key="book">
      <el-select
        v-model="book"
        filterable
        remote
        :remote-method="searchBooks"
        :loading="loadingBooks"
        placeholder="Search a book"
        aria-label="Book"
        style="width: 240px"
      >
        <el-option v-for="b in bookOptions" :key="b" :label="b" :value="b" />
      </el-select>
      <template #stored><span data-testid="book-value">{{ book || '(none)' }}</span></template>
    </Readout>
  </section>
</template>
