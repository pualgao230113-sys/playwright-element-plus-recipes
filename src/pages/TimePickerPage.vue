<script setup lang="ts">
import { ref } from 'vue'

const opens = ref<string | null>(null)
const plain = ref<Date | null>(null)
const slot = ref('')
</script>

<template>
  <h2>Time picker / Time select</h2>
  <el-form label-width="140px" style="max-width: 560px">
    <el-form-item label="Opening time">
      <el-time-picker v-model="opens" format="HH:mm" value-format="HH:mm" placeholder="HH:mm" />
      <div class="out" data-testid="opens-value">{{ opens || '(none)' }}</div>
      <div class="out">raw: <span data-testid="opens-raw">{{ JSON.stringify(opens) }}</span></div>
    </el-form-item>
    <el-form-item label="Plain time">
      <el-time-picker v-model="plain" placeholder="Any time" />
      <div class="out" data-testid="plain-value">{{ plain === null ? '(none)' : JSON.stringify(plain) }}</div>
    </el-form-item>
    <el-form-item label="Pickup slot">
      <el-time-select v-model="slot" start="08:00" step="00:30" end="12:00" placeholder="Pick a slot" />
      <div class="out" data-testid="slot-value">{{ slot || '(none)' }}</div>
    </el-form-item>
  </el-form>
</template>
