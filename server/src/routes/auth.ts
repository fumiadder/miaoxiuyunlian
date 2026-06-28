import { Router, Request } from 'express';
import db from '../db/connection.js';

const router = Router();

// 从 token 中解析当前用户信息
type CurrentUser = { id: number; name: string; role: string; is_admin: boolean } | null;
function getCurrentUser(req: Request): CurrentUser {
  const token = req.headers['x-token'] as string | undefined;
  if (!token || !token.startsWith('token-')) return null;
  const parts = token.split('-');
  const userId = parts[parts.length - 1];
  if (!userId) return null;
  const user = db.prepare('SELECT id, name, role, is_admin FROM users WHERE id = ?').get(userId);
  if (!user) return null;
  return { id: user.id, name: user.name, role: user.role, is_admin: !!user.is_admin };
}

// 登录
router.post('/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.json({ code: 1, message: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
  if (!user || user.password !== password) {
    return res.json({ code: 1, message: '用户名或密码错误' });
  }

  res.json({
    code: 0,
    message: '登录成功',
    data: {
      id: user.id,
      name: user.name,
      role: user.role,
      is_admin: !!user.is_admin,
      token: 'token-' + Date.now() + '-' + user.id,
    },
  });
});

// 获取当前用户信息
router.get('/me', (req, res) => {
  const user = getCurrentUser(req);
  res.json({ code: 0, data: user });
});

// 人员列表
router.get('/users', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ code: 1, message: '未登录' });
  }

  if (currentUser.is_admin) {
    const users = db.prepare('SELECT id, name, role, is_admin, created_at FROM users ORDER BY id DESC').all();
    return res.json({ code: 0, data: users });
  }

  // 非管理员只能看到自己
  const user = db.prepare('SELECT id, name, role, is_admin, created_at FROM users WHERE id = ?').get(currentUser.id);
  res.json({ code: 0, data: user ? [user] : [] });
});

// 新增人员（仅管理员）
router.post('/users', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser || !currentUser.is_admin) {
    return res.status(403).json({ code: 1, message: '无权限' });
  }

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
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ code: 1, message: '未登录' });
  }

  const { id } = req.params;
  const targetId = Number(id);

  // 非管理员只能修改自己的密码
  if (!currentUser.is_admin) {
    if (targetId !== currentUser.id) {
      return res.status(403).json({ code: 1, message: '只能修改自己的密码' });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ code: 1, message: '请输入新密码' });
    }
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password, targetId);
    return res.json({ code: 0, message: '密码重置成功' });
  }

  // 管理员可以修改所有字段
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

  values.push(targetId);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  res.json({ code: 0, message: '更新成功' });
});

// 删除人员（仅管理员）
router.delete('/users/:id', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser || !currentUser.is_admin) {
    return res.status(403).json({ code: 1, message: '无权限' });
  }

  const { id } = req.params;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ code: 0, message: '删除成功' });
});

export default router;
