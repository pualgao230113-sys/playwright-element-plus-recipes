<script setup lang="ts">
import { ref } from 'vue'

const quantity = ref<number | undefined>(1)
const price = ref<number | undefined>(2.5)
const boxes = ref<number | undefined>(6)
const changes = ref(0)
</script>

<template>
  <h2>Input number</h2>
  <el-form label-width="120px" style="max-width: 520px">
    <el-form-item label="Quantity">
      <el-input-number v-model="quantity" :min="1" :max="10" @change="changes++" />
      <div class="out">model: <span data-testid="quantity-value">{{ quantity ?? '(empty)' }}</span>, change events: <span data-testid="quantity-changes">{{ changes }}</span></div>
    </el-form-item>
    <el-form-item label="Price">
      <el-input-number v-model="price" :precision="2" :step="0.1" :min="0" />
      <div class="out">model: <span data-testid="price-value">{{ price ?? '(empty)' }}</span></div>
    </el-form-item>
    <el-form-item label="Boxes of 6">
      <el-input-number v-model="boxes" :step="6" step-strictly :min="0" />
      <div class="out">model: <span data-testid="boxes-value">{{ boxes ?? '(empty)' }}</span></div>
    </el-form-item>
  </el-form>
</template>
