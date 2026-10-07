<script setup lang="ts">
import { narrow } from '../narrow'
import { ref } from 'vue'
import Readout from '../components/Readout.vue'

const quantity = ref<number | undefined>(1)
const price = ref<number | undefined>(2.5)
const boxes = ref<number | undefined>(6)
const changes = ref(0)
</script>

<template>
  <section>
    <el-form label-width="120px" :label-position="narrow ? 'top' : 'right'">
      <el-form-item label="Quantity">
        <Readout :expected="quantity === undefined || quantity === null ? '' : String(quantity)" :stored-key="quantity">
          <el-input-number v-model="quantity" :min="1" :max="10" @change="changes++" />
          <template #stored><span data-testid="quantity-value">{{ quantity ?? '(empty)' }}</span></template>
          <template #extra>change events: <span data-testid="quantity-changes">{{ changes }}</span></template>
        </Readout>
      </el-form-item>
      <el-form-item label="Price">
        <Readout :expected="price === undefined || price === null ? '' : price.toFixed(2)" :stored-key="price">
          <el-input-number v-model="price" :precision="2" :step="0.1" :min="0" />
          <template #stored><span data-testid="price-value">{{ price ?? '(empty)' }}</span></template>
        </Readout>
      </el-form-item>
      <el-form-item label="Boxes of 6">
        <Readout :expected="boxes === undefined || boxes === null ? '' : String(boxes)" :stored-key="boxes">
          <el-input-number v-model="boxes" :step="6" step-strictly :min="0" />
          <template #stored><span data-testid="boxes-value">{{ boxes ?? '(empty)' }}</span></template>
        </Readout>
      </el-form-item>
    </el-form>
  </section>
</template>
