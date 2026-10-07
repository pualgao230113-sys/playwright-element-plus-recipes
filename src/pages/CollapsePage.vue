<script setup lang="ts">
import { ref } from 'vue'

const open = ref<string[]>(['shopping'])
</script>

<template>
  <h2>Collapse</h2>
  <section>
    <h3>Todo lists</h3>
    <el-collapse v-model="open">
      <el-collapse-item title="Shopping" name="shopping">Apples, bread, milk</el-collapse-item>
      <el-collapse-item title="Garden" name="garden">Water the plants, cut the grass</el-collapse-item>
      <el-collapse-item title="Garden tools" name="tools">Rake, hose</el-collapse-item>
    </el-collapse>
    <div class="out" data-testid="open-value">{{ open.join(', ') || '(none)' }}</div>
  </section>
</template>
