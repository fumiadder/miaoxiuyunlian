<template>
  <div class="photo-uploader">
    <div class="upload-actions">
      <el-button type="primary" @click="triggerFileInput">
        <el-icon><Camera /></el-icon>
        拍照/选择照片
      </el-button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        capture="environment"
        style="display: none"
        multiple
        @change="handleFileChange"
      />
    </div>

    <div v-if="previewList.length > 0" class="preview-area">
      <div v-for="(item, index) in previewList" :key="index" class="preview-item">
        <img :src="item.preview" class="preview-img" />
        <el-icon class="remove-btn" @click="removePhoto(index)">
          <Close />
        </el-icon>
        <span v-if="item.uploading" class="upload-status">
          <el-icon class="is-loading"><Loading /></el-icon>
          上传中
        </span>
        <span v-else-if="item.uploaded" class="upload-status success">已上传</span>
      </div>
    </div>

    <div v-if="hasPendingUpload" class="upload-bar">
      <el-button type="success" @click="uploadAll" :loading="isUploading">
        上传全部
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Camera, Close, Loading } from '@element-plus/icons-vue'
import { uploadPhoto } from '../../api/upload'

interface PhotoItem {
  file: File
  preview: string
  url?: string
  uploading: boolean
  uploaded: boolean
}

const emit = defineEmits<{
  uploaded: [url: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const previewList = ref<PhotoItem[]>([])
const isUploading = ref(false)

const hasPendingUpload = computed(
  () => previewList.value.some((item) => !item.uploaded && !item.uploading)
)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files) return

  for (const file of Array.from(files)) {
    const reader = new FileReader()
    reader.onload = () => {
      previewList.value.push({
        file,
        preview: reader.result as string,
        uploading: false,
        uploaded: false,
      })
    }
    reader.readAsDataURL(file)
  }

  // Reset input so same file can be selected again
  target.value = ''
}

function removePhoto(index: number) {
  previewList.value.splice(index, 1)
}

async function uploadAll() {
  isUploading.value = true
  for (const item of previewList.value) {
    if (item.uploaded || item.uploading) continue
    item.uploading = true
    try {
      const res = await uploadPhoto(item.file)
      item.url = res.data.url
      item.uploaded = true
      emit('uploaded', res.data.url)
    } catch {
      item.uploading = false
    }
  }
  isUploading.value = false
}
</script>

<style scoped>
.photo-uploader {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-actions {
  display: flex;
  gap: 8px;
}

.preview-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 12px;
}

.upload-status {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  padding: 2px 0;
  background: rgba(0, 0, 0, 0.6);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.upload-status.success {
  color: var(--color-success);
}

.upload-bar {
  display: flex;
  justify-content: flex-end;
}
</style>
