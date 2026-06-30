import { Router, Request, Response } from 'express';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const router = Router();

/**
 * POST /chat — SSE 流式透传到 Dify
 * 完整转发 query / inputs / conversation_id / user / files 等参数
 * 支持 HTTPS 自签名证书（通过 DIFY_ALLOW_INSECURE 环境变量控制）
 */
router.post('/chat', (req: Request, res: Response): void => {
  const { query, conversation_id, user, inputs, files } = req.body;
  const difyBaseUrl = process.env.DIFY_BASE_URL || 'http://localhost/v1';
  const difyApiKey = process.env.DIFY_API_KEY || '';
  const allowInsecure = process.env.DIFY_ALLOW_INSECURE === 'true';

  if (!query) {
    res.status(400).json({ code: 1, message: 'query 不能为空' });
    return;
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 构造 Dify 请求体（完整转发所有参数）
  const body = JSON.stringify({
    inputs: inputs || {},
    query,
    response_mode: 'streaming',
    conversation_id: conversation_id || '',
    user: user || 'api-user',
    files: files || [],
  });

  const url = new URL(`${difyBaseUrl}/chat-messages`);
  const options: https.RequestOptions = {
    method: 'POST',
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    headers: {
      'Authorization': `Bearer ${difyApiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    // 如果 DIFY_ALLOW_INSECURE=true，跳过 HTTPS 证书验证（内网自签名证书场景）
    rejectUnauthorized: !allowInsecure,
  };

  const protocol = url.protocol === 'https:' ? https : http;

  const proxyReq = protocol.request(options, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      let errorData = '';
      proxyRes.setEncoding('utf8');
      proxyRes.on('data', (chunk) => {
        errorData += chunk;
      });
      proxyRes.on('end', () => {
        console.error('[Dify] 非 200 响应:', proxyRes.statusCode, errorData);
        res.write(`data: ${JSON.stringify({ event: 'error', message: `Dify 服务错误: ${proxyRes.statusCode}`, detail: errorData })}

`);
        res.end();
      });
      return;
    }

    // 成功响应：直接 pipe Dify 的 SSE 流到客户端
    proxyRes.pipe(res);

    proxyRes.on('error', (err) => {
      console.error('[Dify SSE] 流错误:', err);
      res.write(`data: ${JSON.stringify({ event: 'error', message: 'Dify 流中断' })}

`);
      res.end();
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[Dify SSE] 连接错误:', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }
    res.write(`data: ${JSON.stringify({ event: 'error', message: `Dify 连接失败: ${err.message}` })}

`);
    res.end();
  });

  proxyReq.on('timeout', () => {
    console.error('[Dify SSE] 连接超时');
    proxyReq.destroy();
    res.write(`data: ${JSON.stringify({ event: 'error', message: 'Dify 连接超时' })}

`);
    res.end();
  });

  proxyReq.write(body);
  proxyReq.end();
});

export default router;
