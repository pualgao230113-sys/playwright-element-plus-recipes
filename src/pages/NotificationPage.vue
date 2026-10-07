<script setup lang="ts">
import { ElNotification } from 'element-plus'

function done() {
  ElNotification({ title: 'Todo done', message: 'Buy apples', type: 'success' })
}
function reminder() {
  ElNotification({ title: 'Reminder', message: 'Water the plants', duration: 0 })
}
function failed() {
  ElNotification({ title: 'Sync failed', message: 'Could not reach the server', type: 'error', position: 'bottom-right' })
}
</script>

<template>
  <section>
    <el-button type="primary" @click="done">Complete todo</el-button>
    <el-button @click="reminder">Remind me</el-button>
    <el-button type="danger" @click="failed">Sync</el-button>
  </section>
</template>
