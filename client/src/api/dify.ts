import { fetchEventSource } from '@microsoft/fetch-event-source'

export function sendDifyChat(
  query: string,
  conversationId?: string,
  onMessage?: (message: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
) {
  const body: Record<string, any> = {
    query,
    response_mode: 'streaming',
  }
  if (conversationId) {
    body.conversation_id = conversationId
  }

  const controller = new AbortController()

  fetchEventSource('/api/dify/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
    onmessage(ev) {
      if (ev.event === 'message' || ev.event === 'agent_message') {
        try {
          const data = JSON.parse(ev.data as string)
          if (data.answer) {
            onMessage?.(data.answer)
          }
          if (data.conversation_id) {
            onMessage?.(data)
          }
        } catch {
          onMessage?.(ev.data as string)
        }
      } else if (ev.event === 'message_end') {
        onDone?.()
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
