<script setup lang="ts">
import { ref } from 'vue'

const status = ref('(none)')
</script>

<template>
  <h2>Popconfirm / Tooltip</h2>
  <section style="display: flex; gap: 24px; align-items: center">
    <el-popconfirm title="Remove this todo?" @confirm="status = 'removed'" @cancel="status = 'kept'">
      <template #reference>
        <el-button type="danger">Remove todo</el-button>
      </template>
    </el-popconfirm>
    <el-popconfirm title="Clear all todos?" confirm-button-text="Clear" cancel-button-text="Keep" @confirm="status = 'cleared'">
      <template #reference>
        <el-button>Clear todos</el-button>
      </template>
    </el-popconfirm>
  </section>
  <div class="out">status: <span data-testid="status">{{ status }}</span></div>

  <section style="display: flex; gap: 24px; align-items: center; margin-top: 32px">
    <el-tooltip content="Due tomorrow at 9:00" placement="top">
      <el-button>Water the plants</el-button>
    </el-tooltip>
  </section>
</template>
