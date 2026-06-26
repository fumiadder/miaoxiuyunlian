import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

/**
 * GET /fault-stats — 故障统计
 * query: startDate?, endDate?
 */
router.get('/fault-stats', (req: Request, res: Response): void => {
  const { startDate, endDate } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (startDate) {
    conditions.push('created_at >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('created_at <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 总数
  const totalRow = db
    .prepare(`SELECT COUNT(*) as count FROM fault_record ${whereClause}`)
    .get(...params) as { count: number };

  // 按故障类型分组
  const byType = db
    .prepare(`SELECT fault_type, COUNT(*) as count FROM fault_record ${whereClause} GROUP BY fault_type`)
    .all(...params) as Array<{ fault_type: string; count: number }>;

  // 按状态分组
  const byStatus = db
    .prepare(`SELECT status, COUNT(*) as count FROM fault_record ${whereClause} GROUP BY status`)
    .all(...params) as Array<{ status: string; count: number }>;

  // 按日期分组（趋势）
  const byDate = db
    .prepare(
      `SELECT date(created_at) as date, COUNT(*) as count FROM fault_record ${whereClause} GROUP BY date(created_at) ORDER BY date`
    )
    .all(...params) as Array<{ date: string; count: number }>;

  res.json({
    code: 0,
    data: {
      total: totalRow.count,
      by_type: byType,
      by_status: byStatus,
      by_date: byDate,
    },
  });
});

/**
 * GET /spare-parts-consumption — 备件消耗（简化版占位）
 */
router.get('/spare-parts-consumption', (_req: Request, res: Response): void => {
  res.json({
    code: 0,
    data: {
      total: 0,
      items: [],
      note: '备件消耗数据需对接 Dify SQL 数据库获取',
    },
  });
});

/**
 * GET /dispatch-detail — 派单详情
 * query: status?, page?, pageSize?(默认20)
 */
router.get('/dispatch-detail', (req: Request, res: Response): void => {
  const { status, page, pageSize } = req.query;
  const pageNum = Number(page) || 1;
  const size = Number(pageSize) || 20;
  const offset = (pageNum - 1) * size;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRow = db
    .prepare(`SELECT COUNT(*) as count FROM fault_record ${whereClause}`)
    .get(...params) as { count: number };

  const list = db
    .prepare(
      `SELECT id, fault_no, device_name, fault_type, fault_description, status, 
              assignee_name, assignee_name_2, created_at, dispatched_at, accepted_at, completed_at
       FROM fault_record ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
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

export default router;
