<script setup lang="ts">
import { ref } from 'vue'

const last = ref('(none)')
</script>

<template>
  <h2>Dropdown</h2>
  <section style="display: flex; gap: 48px; align-items: center">
    <el-dropdown @command="(c: string) => (last = `hover: ${c}`)">
      <el-button>Shelf actions</el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="sort">Sort</el-dropdown-item>
          <el-dropdown-item command="share">Share</el-dropdown-item>
          <el-dropdown-item command="archive" disabled>Archive</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-dropdown trigger="click" @command="(c: string) => (last = `click: ${c}`)">
      <el-button>Book actions</el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="lend">Lend</el-dropdown-item>
          <el-dropdown-item command="share">Share</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-dropdown split-button type="primary" @click="last = 'split: main'" @command="(c: string) => (last = `split: ${c}`)">
      Read now
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="later">Read later</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </section>
  <div class="out">last command: <span data-testid="last">{{ last }}</span></div>
</template>
