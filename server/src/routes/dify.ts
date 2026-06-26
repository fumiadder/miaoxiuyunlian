import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /chat — SSE 流式透传到 Dify
 */
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const { query, conversation_id, user } = req.body;
  const difyBaseUrl = process.env.DIFY_BASE_URL || 'http://localhost/v1';
  const difyApiKey = process.env.DIFY_API_KEY || '';

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const difyResponse = await fetch(`${difyBaseUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query,
        response_mode: 'streaming',
        conversation_id: conversation_id || '',
        user: user || 'api-user',
      }),
    });

    if (!difyResponse.ok) {
      const errorData = await difyResponse.text();
      res.write(`data: ${JSON.stringify({ event: 'error', message: `Dify 服务错误: ${difyResponse.status}`, detail: errorData })}\n\n`);
      res.end();
      return;
    }

    const reader = difyResponse.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ event: 'error', message: '无法获取 Dify 响应流' })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    } catch (streamErr) {
      console.error('[Dify SSE] 流读取错误:', streamErr);
    }

    res.end();
  } catch (err) {
    console.error('[Dify SSE] 连接错误:', err);
    // 如果响应头尚未发送，重新设置
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }
    const errorMessage = err instanceof Error ? err.message : 'Dify 服务不可达';
    res.write(`data: ${JSON.stringify({ event: 'error', message: errorMessage })}\n\n`);
    res.end();
  }
});

export default router;
