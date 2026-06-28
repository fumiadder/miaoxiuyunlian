<template>
  <div class="stream-message">
    <div v-if="isStreaming && !displayText" class="typing-indicator">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
    <div v-else class="message-content">
      {{ displayText }}
      <span v-if="isStreaming" class="cursor">|</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  content: string
  isStreaming: boolean
}>()

const displayText = ref('')
let currentIndex = 0
let timer: ReturnType<typeof setInterval> | null = null

function stopTyping() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  // 如果流式结束，确保显示完整内容
  if (!props.isStreaming) {
    displayText.value = props.content
    currentIndex = props.content.length
  }
}

watch(
  () => props.content,
  (newContent) => {
    if (props.isStreaming) {
      // 流式模式下追加新内容
      const newChars = newContent.slice(currentIndex)
      if (newChars) {
        displayText.value += newChars
        currentIndex = newContent.length
      }
    } else {
      displayText.value = newContent
      currentIndex = newContent.length
    }
  }
)

watch(
  () => props.isStreaming,
  (streaming) => {
    if (!streaming) {
      stopTyping()
      displayText.value = props.content
      currentIndex = props.content.length
    }
  }
)

onUnmounted(() => {
  stopTyping()
})
</script>

<style scoped>
.stream-message {
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  min-height: 48px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content {
  color: var(--text-primary);
  font-size: 14px;
}

.cursor {
  animation: blink 1s step-end infinite;
  color: var(--color-accent);
  font-weight: bold;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
  animation: typingDot 1.4s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingDot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}
</style>
