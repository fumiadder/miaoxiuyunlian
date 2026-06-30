import { fetchEventSource } from '@microsoft/fetch-event-source'

export interface DifyFile {
  type: string
  transfer_method: 'remote_url' | 'local_file'
  url?: string
  upload_file_id?: string
}

export interface DifyChatOptions {
  query: string
  conversationId?: string
  user?: string
  inputs?: Record<string, any>
  files?: DifyFile[]
  onMessage?: (message: string) => void
  onConversationId?: (conversationId: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

/**
 * 发送 Dify 聊天请求（SSE 流式）
 * @returns AbortController，用于取消请求
 */
export function sendDifyChat(options: DifyChatOptions) {
  const {
    query,
    conversationId,
    user,
    inputs,
    files,
    onMessage,
    onConversationId,
    onDone,
    onError,
  } = options

  const body: Record<string, any> = {
    query,
    response_mode: 'streaming',
    inputs: inputs || {},
    files: files || [],
  }

  if (conversationId) {
    body.conversation_id = conversationId
  }
  if (user) {
    body.user = user
  }

  const controller = new AbortController()

  fetchEventSource('/api/dify/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
    onmessage(ev) {
      // Dify SSE 流中每行以 "data: {...}" 格式返回
      if (!ev.data || ev.data.trim() === '') return

      try {
        const data = JSON.parse(ev.data)

        // 文本增量输出
        if (data.answer && typeof data.answer === 'string') {
          onMessage?.(data.answer)
        }

        // 会话 ID（首次返回时携带）
        if (data.conversation_id && onConversationId) {
          onConversationId(data.conversation_id)
        }

        // 流结束事件
        if (data.event === 'message_end') {
          onDone?.()
        }

        // 错误事件
        if (data.event === 'error') {
          onError?.(new Error(data.message || 'Dify 返回错误'))
        }
      } catch {
        // 非 JSON 格式的数据直接透传
        onMessage?.(ev.data)
      }
    },
    onerror(err) {
      onError?.(err)
      throw err
    },
    onclose() {
      onDone?.()
    },
  })

  return controller
}

/**
 * 兼容旧版调用方式：仅传入 query
 */
export function sendDifyChatLegacy(
  query: string,
  conversationId?: string,
  onMessage?: (message: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
) {
  return sendDifyChat({
    query,
    conversationId,
    onMessage,
    onDone,
    onError,
  })
}
