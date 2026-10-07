<script setup lang="ts">
import { ref } from 'vue'

const status = ref('(none)')
</script>

<template>
  <section>
  <div style="display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center">
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
  </div>
  <div class="out">status: <span data-testid="status">{{ status }}</span></div>
  </section>

  <section>
    <el-tooltip content="Due tomorrow at 9:00" placement="top">
      <el-button>Water the plants</el-button>
    </el-tooltip>
  </section>
</template>
