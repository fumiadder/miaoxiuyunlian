import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

// 登录
router.post('/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ code: 1, message: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
  if (!user || user.password !== password) {
    return res.status(401).json({ code: 1, message: '用户名或密码错误' });
  }

  res.json({
    code: 0,
    message: '登录成功',
    data: {
      name: user.name,
      role: user.role,
      is_admin: !!user.is_admin,
      token: 'token-' + Date.now() + '-' + user.id,
    },
  });
});

// 获取当前用户信息
router.get('/me', (req, res) => {
  // 简化为前端自行管理，后端预留接口
  res.json({ code: 0, data: null });
});

// 人员列表
router.get('/users', (_req, res) => {
  const users = db.prepare('SELECT id, name, role, is_admin, created_at FROM users ORDER BY id DESC').all();
  res.json({ code: 0, data: users });
});

// 新增人员
router.post('/users', (req, res) => {
  const { name, password, role, is_admin } = req.body;
  if (!name || !password) {
    return res.status(400).json({ code: 1, message: '用户名和密码不能为空' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
  if (exists) {
    return res.status(400).json({ code: 1, message: '用户名已存在' });
  }

  const result = db.prepare(
    'INSERT INTO users (name, password, role, is_admin) VALUES (?, ?, ?, ?)'
  ).run(name, password, role || 'worker', is_admin ? 1 : 0);

  res.json({ code: 0, message: '添加成功', data: { id: result.lastInsertRowid } });
});

// 修改人员
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, password, role, is_admin } = req.body;

  const fields: string[] = [];
  const values: any[] = [];

  if (name) { fields.push('name = ?'); values.push(name); }
  if (password) { fields.push('password = ?'); values.push(password); }
  if (role) { fields.push('role = ?'); values.push(role); }
  if (is_admin !== undefined) { fields.push('is_admin = ?'); values.push(is_admin ? 1 : 0); }

  if (fields.length === 0) {
    return res.status(400).json({ code: 1, message: '无更新内容' });
  }

  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  res.json({ code: 0, message: '更新成功' });
});

// 删除人员
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ code: 0, message: '删除成功' });
});

export default router;
