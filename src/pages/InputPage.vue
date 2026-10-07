<script setup lang="ts">
import { ref } from 'vue'

const nickname = ref('')
const note = ref('')
const search = ref('')
const clearCount = ref(0)
</script>

<template>
  <section>
    <h3>maxlength + show-word-limit</h3>
    <el-input v-model="nickname" maxlength="10" show-word-limit placeholder="Nickname" aria-label="Nickname" style="width: 260px" />
    <div class="out">v-model: <span data-testid="nickname-value">{{ nickname }}</span></div>
  </section>

  <section>
    <h3>Textarea with a limit</h3>
    <el-input v-model="note" type="textarea" maxlength="30" show-word-limit placeholder="Short note" aria-label="Note" style="width: 360px" />
  </section>

  <section>
    <h3>Clearable</h3>
    <el-input v-model="search" clearable placeholder="Search fruit" aria-label="Search fruit" style="width: 260px" @clear="clearCount++" />
    <div class="out">v-model: <span data-testid="search-value">{{ search || '(empty)' }}</span></div>
    <div class="out">clear events: <span data-testid="clear-count">{{ clearCount }}</span></div>
  </section>
</template>
