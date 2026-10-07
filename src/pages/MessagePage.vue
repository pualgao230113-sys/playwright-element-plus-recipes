<script setup lang="ts">
import { ElMessage } from 'element-plus'

// Each button simulates an action that reports back through ElMessage.
function save() {
  ElMessage.success('Book saved')
}
function remove() {
  ElMessage.success('Book deleted')
}
function fail() {
  ElMessage.error('Could not reach the library')
}
// A "quiet" action that is supposed to show nothing, but has a bug:
// it flashes a short error toast that is gone in under a second.
function quietButBuggy() {
  ElMessage({ type: 'error', message: 'Unexpected warning', duration: 600 })
}
function quietAndCorrect() {
  // Intentionally shows nothing.
}
</script>

<template>
  <h2>Message (toasts)</h2>
  <section>
    <el-button type="primary" @click="save">Save book</el-button>
    <el-button @click="remove">Delete book</el-button>
    <el-button type="danger" @click="fail">Sync library</el-button>
  </section>
  <section>
    <el-button @click="quietButBuggy">Refresh (buggy)</el-button>
    <el-button @click="quietAndCorrect">Refresh (correct)</el-button>
  </section>
</template>
