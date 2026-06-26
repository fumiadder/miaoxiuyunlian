import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// 合法状态转换映射
const VALID_TRANSITIONS: Record<string, string[]> = {
  dispatched: ['accepted'],
  accepted: ['repairing'],
  repairing: ['completed'],
};

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
 * 获取当前班次名称
 */
function getCurrentShiftName(shiftId: number): string {
  const shift = db.prepare('SELECT shift_name FROM shift_schedule WHERE id = ?').get(shiftId) as
    | { shift_name: string }
    | undefined;
  return shift?.shift_name || '未知班次';
}

/**
 * 生成故障编号: GZ-YYYYMMDD-NNN
 */
function generateFaultNo(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const prefix = `GZ-${dateStr}-`;

  const todayStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00:00`;
  const todayEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 23:59:59`;

  const maxRow = db
    .prepare(
      `SELECT fault_no FROM fault_record 
       WHERE created_at >= ? AND created_at <= ? AND fault_no LIKE ?
       ORDER BY fault_no DESC LIMIT 1`
    )
    .get(todayStart, todayEnd, `${prefix}%`) as { fault_no: string } | undefined;

  let nextNum = 1;
  if (maxRow) {
    const parts = maxRow.fault_no.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * 获取当前班次可用人员（最多2人）
 */
function getCurrentAssignees(): { names: string[]; shiftId: number; shiftName: string } {
  const shiftId = getCurrentShiftId();
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const members = db
    .prepare(
      'SELECT name FROM schedule_member WHERE shift_id = ? AND schedule_date = ? AND is_available = 1 LIMIT 2'
    )
    .all(shiftId, dateStr) as Array<{ name: string }>;

  return {
    names: members.map((m) => m.name),
    shiftId,
    shiftName: getCurrentShiftName(shiftId),
  };
}

/**
 * POST /create — 创建故障并自动派单
 */
router.post('/create', (req: Request, res: Response): void => {
  const { device_name, fault_type, fault_description, reporter_name, reporter_photo_url } = req.body;

  if (!device_name || !fault_type || !fault_description || !reporter_name) {
    res.status(400).json({ code: 400, message: 'device_name, fault_type, fault_description, reporter_name 为必填项' });
    return;
  }

  const faultNo = generateFaultNo();
  const { names, shiftId, shiftName } = getCurrentAssignees();
  const now = new Date();
  const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  db.prepare(`
    INSERT INTO fault_record (
      fault_no, device_name, fault_type, fault_description, reporter_name, reporter_photo_url,
      status, assignee_name, assignee_name_2, shift_id, dispatched_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'dispatched', ?, ?, ?, ?)
  `).run(
    faultNo,
    device_name,
    fault_type,
    fault_description,
    reporter_name,
    reporter_photo_url || null,
    names[0] || null,
    names[1] || null,
    shiftId,
    nowStr
  );

  res.json({
    code: 0,
    message: '派单成功',
    data: {
      fault_no: faultNo,
      status: 'dispatched',
      assignee_name: names[0] || null,
      assignee_name_2: names[1] || null,
      shift_name: shiftName,
    },
  });
});

/**
 * GET /list — 分页列表
 * query: status?, type?, page?, pageSize?(默认20)
 */
router.get('/list', (req: Request, res: Response): void => {
  const { status, type, page, pageSize } = req.query;
  const pageNum = Number(page) || 1;
  const size = Number(pageSize) || 20;
  const offset = (pageNum - 1) * size;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (type) {
    conditions.push('fault_type = ?');
    params.push(type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRow = db
    .prepare(`SELECT COUNT(*) as count FROM fault_record ${whereClause}`)
    .get(...params) as { count: number };

  const list = db
    .prepare(
      `SELECT * FROM fault_record ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, size, offset);

  res.json({
    code: 0,
    data: {
      total: totalRow.count,
      list,
    },
  });
});

/**
 * GET /:id — 故障详情
 */
router.get('/:id', (req: Request, res: Response): void => {
  const id = Number(req.params.id);

  const fault = db.prepare('SELECT * FROM fault_record WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!fault) {
    res.status(404).json({ code: 404, message: '故障记录不存在' });
    return;
  }

  // 查询关联的维修案例
  let repairCase = null;
  if (fault.case_id) {
    repairCase = db.prepare('SELECT * FROM repair_case WHERE id = ?').get(fault.case_id);
  }

  // 构建 timeline
  const timeline: Array<{ action: string; time: string; operator: string }> = [];

  if (fault.created_at) {
    timeline.push({ action: '报修', time: fault.created_at as string, operator: fault.reporter_name as string });
  }
  if (fault.dispatched_at) {
    timeline.push({
      action: '派单',
      time: fault.dispatched_at as string,
      operator: '系统',
    });
  }
  if (fault.accepted_at) {
    timeline.push({
      action: '接单',
      time: fault.accepted_at as string,
      operator: (fault.assignee_name as string) || '未知',
    });
  }
  if (fault.completed_at) {
    timeline.push({
      action: '完成',
      time: fault.completed_at as string,
      operator: (fault.assignee_name as string) || '未知',
    });
  }

  res.json({
    code: 0,
    data: {
      ...fault,
      case: repairCase,
      timeline,
    },
  });
});

/**
 * PUT /:id/accept — 接单
 */
router.put('/:id/accept', (req: Request, res: Response): void => {
  const id = Number(req.params.id);
  const { operator_name } = req.body;

  const fault = db.prepare('SELECT * FROM fault_record WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!fault) {
    res.status(404).json({ code: 404, message: '故障记录不存在' });
    return;
  }

  if (fault.status !== 'dispatched') {
    res.status(400).json({ code: 400, message: `当前状态不允许接单，当前状态: ${fault.status}` });
    return;
  }

  const now = new Date();
  const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  db.prepare(
    `UPDATE fault_record SET status = 'accepted', accepted_at = ?, assignee_name = ?, updated_at = ? WHERE id = ?`
  ).run(nowStr, operator_name || null, nowStr, id);

  res.json({ code: 0, message: '接单成功' });
});

/**
 * PUT /:id/status — 更新状态
 */
router.put('/:id/status', (req: Request, res: Response): void => {
  const id = Number(req.params.id);
  const { status, operator_name, repair_description, completion_photo_url } = req.body;

  const fault = db.prepare('SELECT * FROM fault_record WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!fault) {
    res.status(404).json({ code: 404, message: '故障记录不存在' });
    return;
  }

  // 校验合法状态转换
  const currentStatus = fault.status as string;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(status)) {
    res.status(400).json({
      code: 400,
      message: `非法状态转换: ${currentStatus} -> ${status}`,
    });
    return;
  }

  const now = new Date();
  const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // 根据目标状态更新不同字段
  if (status === 'completed') {
    db.prepare(
      `UPDATE fault_record 
       SET status = ?, completed_at = ?, updated_at = ?, 
           repair_description = COALESCE(?, repair_description),
           completion_photo_url = COALESCE(?, completion_photo_url)
       WHERE id = ?`
    ).run(status, nowStr, nowStr, repair_description || null, completion_photo_url || null, id);
  } else {
    db.prepare(
      `UPDATE fault_record SET status = ?, updated_at = ? WHERE id = ?`
    ).run(status, nowStr, id);
  }

  res.json({ code: 0, message: '状态更新成功' });
});

/**
 * POST /:id/feedback — 填写反馈
 */
router.post('/:id/feedback', (req: Request, res: Response): void => {
  const id = Number(req.params.id);
  const { feedback_text, case_applicable, optimization_text } = req.body;

  const fault = db.prepare('SELECT * FROM fault_record WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!fault) {
    res.status(404).json({ code: 404, message: '故障记录不存在' });
    return;
  }

  const now = new Date();
  const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // 更新故障记录的反馈字段
  db.prepare(
    `UPDATE fault_record 
     SET feedback_text = ?, case_applicable = ?, optimization_text = ?, updated_at = ? 
     WHERE id = ?`
  ).run(
    feedback_text || null,
    case_applicable !== undefined ? (case_applicable ? 1 : 0) : null,
    optimization_text || null,
    nowStr,
    id
  );

  // 如果案例不适用但有优化建议，插入 repair_case
  if (case_applicable === false && optimization_text) {
    db.prepare(
      `INSERT INTO repair_case (fault_name, fault_type, device_name, case_content, source, fault_record_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      fault.fault_description,
      fault.fault_type,
      fault.device_name,
      optimization_text,
      'feedback',
      id,
      nowStr,
      nowStr
    );
  }

  res.json({ code: 0, message: '反馈提交成功' });
});

export default router;
