<script setup lang="ts">
import { ref } from 'vue'

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
  <h2>Select</h2>

  <section>
    <h3>Basic</h3>
    <el-select v-model="fruit" placeholder="Pick a fruit" aria-label="Fruit" style="width: 240px">
      <el-option v-for="f in fruits" :key="f" :label="f" :value="f" />
    </el-select>
    <div class="out" data-testid="fruit-value">{{ fruit || '(none)' }}</div>
  </section>

  <section>
    <h3>Filterable</h3>
    <el-select v-model="filteredFruit" filterable placeholder="Type to filter" aria-label="Filtered fruit" style="width: 240px">
      <el-option v-for="f in fruits" :key="f" :label="f" :value="f" />
    </el-select>
    <div class="out" data-testid="filtered-fruit-value">{{ filteredFruit || '(none)' }}</div>
  </section>

  <section>
    <h3>Multiple</h3>
    <el-select v-model="basket" multiple placeholder="Fill the basket" aria-label="Basket" style="width: 360px">
      <el-option v-for="f in fruits" :key="f" :label="f" :value="f" />
    </el-select>
    <div class="out" data-testid="basket-value">{{ basket.join(', ') || '(empty)' }}</div>
  </section>

  <section>
    <h3>Remote</h3>
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
    <div class="out" data-testid="book-value">{{ book || '(none)' }}</div>
  </section>
</template>
