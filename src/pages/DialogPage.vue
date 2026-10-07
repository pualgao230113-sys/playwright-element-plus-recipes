<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'

const dialogOpen = ref(false)
const drawerOpen = ref(false)
const title = ref('Dune')
const savedTitle = ref('Dune')
const status = ref('idle')
const longList = Array.from({ length: 80 }, (_, i) => `Shelf row ${i + 1}`)

function saveDialog() {
  savedTitle.value = title.value
  dialogOpen.value = false
}

async function deleteBook() {
  try {
    await ElMessageBox.confirm(`Delete "${savedTitle.value}"? This cannot be undone.`, 'Delete book', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Keep it',
      type: 'warning',
    })
    status.value = 'deleted'
  } catch {
    status.value = 'kept'
  }
}
</script>

<template>
  <h2>Dialog / Drawer / MessageBox</h2>

  <section>
    <el-button type="primary" @click="dialogOpen = true">Edit book</el-button>
    <el-button @click="drawerOpen = true">Show details</el-button>
    <el-button type="danger" @click="deleteBook">Delete book</el-button>
    <div class="out" data-testid="saved-title">{{ savedTitle }}</div>
    <div class="out" data-testid="status">{{ status }}</div>
  </section>

  <section>
    <h3>A long page so scroll locking is observable</h3>
    <p v-for="row in longList" :key="row">{{ row }}</p>
  </section>

  <el-dialog v-model="dialogOpen" title="Edit book" width="420px">
    <el-input v-model="title" aria-label="Title" />
    <template #footer>
      <el-button @click="dialogOpen = false">Cancel</el-button>
      <el-button type="primary" @click="saveDialog">Save</el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="drawerOpen" title="Book details" size="360px">
    <p>Author: Frank Herbert</p>
    <p>Pages: 412</p>
    <el-button @click="drawerOpen = false">Close details</el-button>
  </el-drawer>
</template>
