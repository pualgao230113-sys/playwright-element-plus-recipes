<script setup lang="ts">
import { narrow } from '../narrow'
import { ref } from 'vue'
import Readout from '../components/Readout.vue'
import { localTime } from '../readout'

const opens = ref<string | null>(null)
const plain = ref<Date | null>(null)
const slot = ref('')
</script>

<template>
  <section>
    <el-form label-width="140px" :label-position="narrow ? 'top' : 'right'">
      <el-form-item label="Opening time">
        <Readout :expected="opens ?? ''" quiet>
          <el-time-picker v-model="opens" format="HH:mm" value-format="HH:mm" placeholder="HH:mm" />
          <template #stored><span data-testid="opens-value">{{ opens || '(none)' }}</span></template>
          <template #extra>raw: <span data-testid="opens-raw">{{ JSON.stringify(opens) }}</span></template>
        </Readout>
      </el-form-item>
      <el-form-item label="Plain time">
        <Readout :expected="plain ? localTime(plain) : ''" quiet>
          <el-time-picker v-model="plain" placeholder="Any time" />
          <template #stored><span data-testid="plain-value">{{ plain === null ? '(none)' : JSON.stringify(plain) }}</span></template>
        </Readout>
      </el-form-item>
      <el-form-item label="Pickup slot">
        <Readout :expected="slot" placeholder="Pick a slot" :stored-key="slot">
          <el-time-select v-model="slot" start="08:00" step="00:30" end="12:00" placeholder="Pick a slot" />
          <template #stored><span data-testid="slot-value">{{ slot || '(none)' }}</span></template>
        </Readout>
      </el-form-item>
    </el-form>
  </section>
</template>
