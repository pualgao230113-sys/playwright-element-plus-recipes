<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, type UploadFile, type UploadRawFile } from 'element-plus'

const uploaded = ref<string[]>([])
const rejected = ref<string[]>([])
const exceeded = ref(0)

// The app relies on before-upload to enforce type and size. `accept` only
// filters the OS file dialog.
function beforeUpload(file: UploadRawFile) {
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    rejected.value.push(file.name)
    ElMessage.error(`${file.name} is not a PNG or JPEG`)
    return false
  }
  if (file.size > 1024 * 1024) {
    rejected.value.push(file.name)
    ElMessage.error(`${file.name} is larger than 1 MB`)
    return false
  }
  return true
}
function onSuccess(_res: unknown, file: UploadFile) {
  uploaded.value.push(file.name)
}
</script>

<template>
  <h2>Upload</h2>
  <section>
    <h3>Cover image</h3>
    <el-upload
      action="/api/upload"
      accept=".png,.jpg,.jpeg"
      :limit="2"
      :before-upload="beforeUpload"
      :on-success="onSuccess"
      :on-exceed="() => exceeded++"
    >
      <el-button type="primary">Choose cover</el-button>
      <template #tip>
        <div class="el-upload__tip">PNG or JPEG, up to 1 MB, two files at most</div>
      </template>
    </el-upload>
    <div class="out">uploaded: <span data-testid="uploaded">{{ uploaded.join(', ') || '(none)' }}</span></div>
    <div class="out">rejected: <span data-testid="rejected">{{ rejected.join(', ') || '(none)' }}</span></div>
    <div class="out">exceeded: <span data-testid="exceeded">{{ exceeded }}</span></div>
  </section>
</template>
