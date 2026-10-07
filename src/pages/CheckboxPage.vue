<script setup lang="ts">
import { narrow } from '../narrow'
import { ref } from 'vue'

const agree = ref(false)
const toppings = ref<string[]>(['Cheese'])
const size = ref('Medium')
const sizeButton = ref('Medium')
const notify = ref(false)
const darkMode = ref(false)
</script>

<template>
  <section>
    <h3>Checkbox</h3>
    <el-checkbox v-model="agree">I agree to the terms</el-checkbox>
    <div class="out">v-model: <span data-testid="agree-value">{{ agree }}</span></div>
  </section>

  <section>
    <h3>Checkbox group</h3>
    <el-checkbox-group v-model="toppings" aria-label="Toppings">
      <el-checkbox value="Cheese">Cheese</el-checkbox>
      <el-checkbox value="Olives">Olives</el-checkbox>
      <el-checkbox value="Basil">Basil</el-checkbox>
    </el-checkbox-group>
    <div class="out">v-model: <span data-testid="toppings-value">{{ toppings.join(', ') }}</span></div>
  </section>

  <section>
    <h3>Radio</h3>
    <el-radio-group v-model="size" aria-label="Size">
      <el-radio value="Small">Small</el-radio>
      <el-radio value="Medium">Medium</el-radio>
      <el-radio value="Large">Large</el-radio>
    </el-radio-group>
    <div class="out">v-model: <span data-testid="size-value">{{ size }}</span></div>
  </section>

  <section>
    <h3>Radio buttons</h3>
    <el-radio-group v-model="sizeButton" aria-label="Button size">
      <el-radio-button value="Small">Small</el-radio-button>
      <el-radio-button value="Medium">Medium</el-radio-button>
      <el-radio-button value="Large">Large</el-radio-button>
    </el-radio-group>
    <div class="out">v-model: <span data-testid="size-button-value">{{ sizeButton }}</span></div>
  </section>

  <section>
    <h3>Switch</h3>
    <el-form label-width="140px" :label-position="narrow ? 'top' : 'right'">
      <el-form-item label="Email reminders">
        <el-switch v-model="notify" />
      </el-form-item>
      <el-form-item label="Theme">
        <el-switch v-model="darkMode" active-text="Dark" inactive-text="Light" />
      </el-form-item>
    </el-form>
    <div class="out">reminders: <span data-testid="notify-value">{{ notify }}</span></div>
    <div class="out">dark theme: <span data-testid="dark-value">{{ darkMode }}</span></div>
  </section>
</template>
