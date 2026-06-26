<template>
  <div class="spare-part-query">
    <el-card shadow="never">
      <template #header>
        <span>备件查询</span>
      </template>
      <div class="query-bar">
        <el-input
          v-model="query"
          placeholder="输入备件名称、型号或规格进行查询"
          clearable
          @keyup.enter="handleQuery"
        />
        <el-button type="primary" :loading="isStreaming" @click="handleQuery">
          查询
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

const query = ref('')
const responseContent = ref('')
const isStreaming = ref(false)
let controller: AbortController | null = null

function handleQuery() {
  if (!query.value.trim()) return

  isStreaming.value = true
  responseContent.value = ''

  controller = sendDifyChat(
    query.value,
    undefined,
    (message: any) => {
      if (typeof message === 'object') {
        // conversation_id data
        return
      }
      responseContent.value += message
    },
    () => {
      isStreaming.value = false
    },
    () => {
      isStreaming.value = false
      responseContent.value += '\n\n[查询出错，请重试]'
    }
  )
}

onUnmounted(() => {
  controller?.abort()
})
</script>

<style scoped>
.spare-part-query {
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
