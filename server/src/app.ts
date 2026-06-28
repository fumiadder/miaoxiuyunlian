import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import authRouter from './routes/auth.js';
import difyRouter from './routes/dify.js';
import scheduleRouter from './routes/schedule.js';
import faultRouter from './routes/fault.js';
import uploadRouter from './routes/upload.js';
import reportRouter from './routes/report.js';
import errorHandler from './middleware/errorHandler.js';

// 获取本地局域网 IP
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const LOCAL_IP = getLocalIP();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// /static/uploads 静态文件服务
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const absoluteUploadDir = path.resolve(uploadDir);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}
app.use('/static/uploads', express.static(absoluteUploadDir));

// 静态前端文件（生产环境）
const staticDir = process.env.STATIC_DIR;
if (staticDir && fs.existsSync(path.resolve(staticDir))) {
  app.use(express.static(path.resolve(staticDir)));
}

// 路由挂载
app.use('/api/auth', authRouter);
app.use('/api/dify', difyRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/fault', faultRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/report', reportRouter);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, message: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理中间件
app.use(errorHandler);

// 启动服务（监听所有网卡，局域网可访问）
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] 工业维修管理系统后端已启动:`);
  console.log(`  本机访问:  http://localhost:${PORT}`);
  console.log(`  局域网访问: http://${LOCAL_IP}:${PORT}`);
  console.log(`  API 健康检查: http://${LOCAL_IP}:${PORT}/api/health`);
});
