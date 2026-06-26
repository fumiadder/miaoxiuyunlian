import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import db from '../db/connection.js';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

// 确保 uploads 目录存在
const absoluteUploadDir = path.resolve(uploadDir);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

// 配置 multer diskStorage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const now = new Date();
    const dir = path.join(
      absoluteUploadDir,
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    );
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}_${basename}${ext}`);
  },
});

// 文件过滤器：仅允许 jpg/jpeg/png/webp
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}，仅允许 jpg/jpeg/png/webp`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize },
});

/**
 * POST / — multer 照片上传
 * fields: file (照片), fault_id (可选), photo_type (report/process/completion, 默认report)
 */
router.post('/', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ code: 400, message: '请上传文件 (field: file)' });
    return;
  }

  const faultId = req.body.fault_id ? Number(req.body.fault_id) : null;
  const photoType = req.body.photo_type || 'report';

  // 验证 fault_id 存在（如果提供了）
  if (faultId) {
    const fault = db.prepare('SELECT id FROM fault_record WHERE id = ?').get(faultId);
    if (!fault) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      res.status(400).json({ code: 400, message: '关联的故障记录不存在' });
      return;
    }
  }

  // 插入 photo 记录（fault_id 为可选，不强制）
  if (faultId) {
    db.prepare(
      'INSERT INTO photo (fault_record_id, photo_type, file_path, file_size, uploaded_at) VALUES (?, ?, ?, ?, datetime("now","localtime"))'
    ).run(faultId, photoType, req.file.path, req.file.size);
  }

  // 返回相对 URL 路径
  const relativePath = req.file.path.replace(absoluteUploadDir, '');
  const urlPath = `/static/uploads${relativePath}`;

  res.json({
    code: 0,
    data: {
      file_path: req.file.path,
      url: urlPath,
      file_size: req.file.size,
    },
  });
});

export default router;
