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

// 部门列表（所有登录用户可见）
router.get('/', (_req, res) => {
  const depts = db.prepare('SELECT id, name, description, sort_order, created_at FROM departments ORDER BY sort_order, id').all();
  res.json({ code: 0, data: depts });
});

// 新增部门（仅管理员）
router.post('/', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser || !currentUser.is_admin) {
    return res.status(403).json({ code: 1, message: '无权限' });
  }

  const { name, description, sort_order } = req.body;
  if (!name) {
    return res.status(400).json({ code: 1, message: '部门名称不能为空' });
  }

  const exists = db.prepare('SELECT id FROM departments WHERE name = ?').get(name);
  if (exists) {
    return res.status(400).json({ code: 1, message: '部门名称已存在' });
  }

  const result = db.prepare(
    'INSERT INTO departments (name, description, sort_order) VALUES (?, ?, ?)'
  ).run(name, description || null, sort_order || 0);

  res.json({ code: 0, message: '添加成功', data: { id: result.lastInsertRowid } });
});

// 修改部门（仅管理员）
router.put('/:id', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser || !currentUser.is_admin) {
    return res.status(403).json({ code: 1, message: '无权限' });
  }

  const { id } = req.params;
  const { name, description, sort_order } = req.body;

  const fields: string[] = [];
  const values: any[] = [];

  if (name) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description || null); }
  if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }

  if (fields.length === 0) {
    return res.status(400).json({ code: 1, message: '无更新内容' });
  }

  // 检查名称唯一性
  if (name) {
    const dup = db.prepare('SELECT id FROM departments WHERE name = ? AND id != ?').get(name, id);
    if (dup) {
      return res.status(400).json({ code: 1, message: '部门名称已存在' });
    }
  }

  values.push(id);
  db.prepare(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  res.json({ code: 0, message: '更新成功' });
});

// 删除部门（仅管理员）
router.delete('/:id', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser || !currentUser.is_admin) {
    return res.status(403).json({ code: 1, message: '无权限' });
  }

  const { id } = req.params;

  // 检查是否有关联用户
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE department = (SELECT name FROM departments WHERE id = ?)').get(id) as { count: number };
  if (userCount.count > 0) {
    return res.status(400).json({ code: 1, message: '该部门下有关联人员，无法删除' });
  }

  db.prepare('DELETE FROM departments WHERE id = ?').run(id);
  res.json({ code: 0, message: '删除成功' });
});

export default router;
