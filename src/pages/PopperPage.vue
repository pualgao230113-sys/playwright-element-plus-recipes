<script setup lang="ts">
import { ref } from 'vue'

const colour = ref('')
const colours = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet']
</script>

<template>
  <h2>Viewport & popper placement</h2>
  <p>The select below sits near the bottom of a short page.</p>
  <!-- Spacer pushes the select down so a short viewport leaves no room under it. -->
  <div style="height: 420px"></div>
  <el-select v-model="colour" placeholder="Pick a colour" aria-label="Colour" style="width: 240px">
    <el-option v-for="c in colours" :key="c" :label="c" :value="c" />
  </el-select>
  <div class="out" data-testid="colour-value">{{ colour || '(none)' }}</div>
</template>
