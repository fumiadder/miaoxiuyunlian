import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  code?: number;
}

export default function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const code = err.code || 500;
  const message = err.message || '服务器内部错误';
  console.error(`[Error] ${code}: ${message}`, err.stack);
  res.status(code).json({ code, message });
}
