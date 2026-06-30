<template>
  <div class="material-plan-query">
    <el-card shadow="never">
      <template #header>
        <span>备件材料计划表查询</span>
      </template>
      <div class="query-bar">
        <el-input
          v-model="deviceName"
          placeholder="输入设备名称"
          clearable
          @keyup.enter="handleQuery"
        />
        <el-button type="primary" :loading="isStreaming" @click="handleQuery">
          查询材料计划
        </el-button>
      </div>
      <div v-if="responseContent || isStreaming" class="response-area">
        <StreamMessage :content="responseContent" :is-streaming="isStreaming" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import StreamMessage from '../../components/common/StreamMessage.vue'
import { sendDifyChat } from '../../api/dify'

const deviceName = ref('')
const responseContent = ref('')
const isStreaming = ref(false)
let controller: AbortController | null = null

function handleQuery() {
  if (!deviceName.value.trim()) return

  isStreaming.value = true
  responseContent.value = ''

  const queryText = `请查询设备 "${deviceName.value}" 的备件材料计划表，包括所需备件名称、型号、规格、数量和预计使用时间。`

  controller = sendDifyChat({
    query: queryText,
    onMessage(message) {
      responseContent.value += message
    },
    onDone() {
      isStreaming.value = false
    },
    onError() {
      isStreaming.value = false
      responseContent.value += '\n\n[查询出错，请重试]'
    },
  })
}

onUnmounted(() => {
  controller?.abort()
})
</script>

<style scoped>
.material-plan-query {
  max-width: 800px;
  margin: 0 auto;
}

.query-bar {
  display: flex;
  gap: 12px;
}

.response-area {
  margin-top: 16px;
}
</style>
