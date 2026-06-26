import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

/**
 * 获取当前班次 ID（基于当前小时判断）
 */
function getCurrentShiftId(): number {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 16) return 1; // 早班
  if (hour >= 16) return 2;              // 中班
  return 3;                               // 夜班
}

/**
 * GET / — 按日期查询排班
 * query param: date (可选，默认今天)
 */
router.get('/', (req: Request, res: Response): void => {
  const date = req.query.date as string;
  const today = new Date();
  const queryDate = date
    ? date
    : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const currentShiftId = getCurrentShiftId();

  // 查询所有班次
  const shifts = db
    .prepare('SELECT id as shift_id, shift_name, shift_start, shift_end FROM shift_schedule ORDER BY sort_order')
    .all() as Array<{ shift_id: number; shift_name: string; shift_start: string; shift_end: string }>;

  // 查询每个班次在指定日期的成员
  const shiftsData = shifts.map((shift) => {
    const members = db
      .prepare(
        'SELECT id, name, phone, is_available FROM schedule_member WHERE shift_id = ? AND schedule_date = ?'
      )
      .all(shift.shift_id, queryDate) as Array<{ id: number; name: string; phone: string; is_available: number }>;

    return {
      ...shift,
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        is_available: m.is_available === 1,
      })),
    };
  });

  // 查找当前班次名称
  const currentShift = shifts.find((s) => s.shift_id === currentShiftId);

  res.json({
    code: 0,
    data: {
      date: queryDate,
      shifts: shiftsData,
      current_shift: currentShift
        ? { shift_id: currentShift.shift_id, shift_name: currentShift.shift_name }
        : null,
    },
  });
});

/**
 * GET /current-assignees — 获取当前班次推荐人员
 */
router.get('/current-assignees', (_req: Request, res: Response): void => {
  const shiftId = getCurrentShiftId();
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 查当前班次名称
  const shift = db.prepare('SELECT shift_name FROM shift_schedule WHERE id = ?').get(shiftId) as
    | { shift_name: string }
    | undefined;

  // 查当前班次 + 今日 + 可用的成员，LIMIT 2
  const members = db
    .prepare(
      'SELECT name FROM schedule_member WHERE shift_id = ? AND schedule_date = ? AND is_available = 1 LIMIT 2'
    )
    .all(shiftId, dateStr) as Array<{ name: string }>;

  res.json({
    code: 0,
    data: {
      shift_name: shift?.shift_name || '未知班次',
      assignees: members.map((m) => m.name),
    },
  });
});

/**
 * POST / — 新增排班记录
 */
router.post('/', (req: Request, res: Response): void => {
  const { shift_id, name, phone, schedule_date, is_available } = req.body;

  if (!shift_id || !name) {
    res.status(400).json({ code: 400, message: 'shift_id 和 name 为必填项' });
    return;
  }

  const today = new Date();
  const dateStr = schedule_date
    || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const result = db
    .prepare(
      'INSERT INTO schedule_member (name, phone, shift_id, schedule_date, is_available) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name, phone || null, shift_id, dateStr, is_available !== undefined ? (is_available ? 1 : 0) : 1);

  res.json({
    code: 0,
    data: { id: result.lastInsertRowid, name, shift_id, schedule_date: dateStr },
  });
});

/**
 * PUT /:id — 修改排班
 */
router.put('/:id', (req: Request, res: Response): void => {
  const id = Number(req.params.id);
  const { name, phone, shift_id, schedule_date, is_available } = req.body;

  const existing = db.prepare('SELECT * FROM schedule_member WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ code: 404, message: '排班记录不存在' });
    return;
  }

  db.prepare(
    'UPDATE schedule_member SET name = ?, phone = ?, shift_id = ?, schedule_date = ?, is_available = ? WHERE id = ?'
  ).run(
    name || (existing as Record<string, unknown>).name,
    phone !== undefined ? phone : (existing as Record<string, unknown>).phone,
    shift_id || (existing as Record<string, unknown>).shift_id,
    schedule_date || (existing as Record<string, unknown>).schedule_date,
    is_available !== undefined ? (is_available ? 1 : 0) : (existing as Record<string, unknown>).is_available,
    id
  );

  res.json({ code: 0, message: '更新成功' });
});

/**
 * DELETE /:id — 删除排班
 */
router.delete('/:id', (req: Request, res: Response): void => {
  const id = Number(req.params.id);

  const result = db.prepare('DELETE FROM schedule_member WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ code: 404, message: '排班记录不存在' });
    return;
  }

  res.json({ code: 0, message: '删除成功' });
});

export default router;
