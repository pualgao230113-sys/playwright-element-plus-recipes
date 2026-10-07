<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Book {
  title: string
  author: string
  year: number
  pages: number
  genre: string
  shelf: string
}

const allBooks: Book[] = [
  { title: 'Dune', author: 'Frank Herbert', year: 1965, pages: 412, genre: 'Science fiction', shelf: 'A1' },
  { title: 'Emma', author: 'Jane Austen', year: 1815, pages: 474, genre: 'Romance', shelf: 'B2' },
  { title: 'Middlemarch', author: 'George Eliot', year: 1871, pages: 880, genre: 'Realism', shelf: 'B3' },
  { title: 'Neuromancer', author: 'William Gibson', year: 1984, pages: 271, genre: 'Science fiction', shelf: 'A2' },
  { title: 'Persuasion', author: 'Jane Austen', year: 1817, pages: 249, genre: 'Romance', shelf: 'B2' },
]

const books = ref<Book[]>([])
const loading = ref(true)
const query = ref('')
const borrowed = ref('')

const visible = computed(() =>
  books.value.filter((b) => b.title.toLowerCase().includes(query.value.toLowerCase())),
)

onMounted(() => {
  // Simulate a slow API: the table first renders empty, then fills.
  setTimeout(() => {
    books.value = allBooks
    loading.value = false
  }, 800)
})
</script>

<template>
  <h2>Table</h2>
  <el-input v-model="query" placeholder="Filter by title" aria-label="Filter by title" style="width: 240px; margin-bottom: 12px" clearable />
  <el-table v-loading="loading" :data="visible" style="width: 700px" empty-text="No books match" data-testid="books-table">
    <el-table-column prop="title" label="Title" width="150" fixed="left" class-name="col-title" />
    <el-table-column prop="author" label="Author" width="180" class-name="col-author" />
    <el-table-column prop="year" label="Year" width="110" sortable class-name="col-year" />
    <el-table-column prop="pages" label="Pages" width="110" sortable class-name="col-pages" />
    <el-table-column prop="genre" label="Genre" width="180" class-name="col-genre" />
    <el-table-column prop="shelf" label="Shelf" width="100" class-name="col-shelf" />
    <el-table-column label="Actions" width="120" fixed="right" class-name="col-actions">
      <template #default="{ row }">
        <el-button size="small" @click="borrowed = row.title">Borrow</el-button>
      </template>
    </el-table-column>
  </el-table>
  <div class="out" data-testid="borrowed">{{ borrowed || '(nothing borrowed)' }}</div>
</template>
