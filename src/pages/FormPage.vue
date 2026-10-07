<script setup lang="ts">
import { narrow } from '../narrow'
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const form = reactive({ username: '', email: '', fruit: '' })
const result = ref('')

const takenNames = ['admin', 'alice']

// Async validator: pretends to ask a server whether the name is free.
function checkUsername(_rule: unknown, value: string, callback: (err?: Error) => void) {
  setTimeout(() => {
    if (takenNames.includes(value.trim().toLowerCase())) callback(new Error('That username is taken'))
    else callback()
  }, 500)
}

const rules: FormRules = {
  username: [
    { required: true, message: 'Username is required', trigger: 'blur' },
    { validator: checkUsername, trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email', trigger: ['blur', 'change'] },
  ],
  fruit: [{ required: true, message: 'Pick a favourite fruit', trigger: 'change' }],
}

async function submit() {
  result.value = 'validating'
  const ok = await formRef.value?.validate().catch(() => false)
  result.value = ok ? 'submitted' : 'invalid'
}
</script>

<template>
  <section>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" :label-position="narrow ? 'top' : 'right'" style="max-width: 520px">
    <el-form-item label="Username" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
    <el-form-item label="Email" prop="email">
      <el-input v-model="form.email" />
    </el-form-item>
    <el-form-item label="Favourite fruit" prop="fruit">
      <el-select v-model="form.fruit" placeholder="Choose">
        <el-option v-for="f in ['Apple', 'Banana', 'Cherry']" :key="f" :label="f" :value="f" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">Create account</el-button>
    </el-form-item>
  </el-form>
  <div class="out">result: <span data-testid="form-result">{{ result || '(not submitted)' }}</span></div>
  </section>
</template>
