import 'dotenv/config';
import db from './connection.js';

console.log('开始数据库迁移...');

// 创建班次表
db.exec(`
  CREATE TABLE IF NOT EXISTS shift_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_name TEXT NOT NULL,
    shift_start TEXT NOT NULL,
    shift_end TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );
`);

// 创建排班人员表
db.exec(`
  CREATE TABLE IF NOT EXISTS schedule_member (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    shift_id INTEGER NOT NULL REFERENCES shift_schedule(id),
    schedule_date TEXT NOT NULL,
    is_available INTEGER NOT NULL DEFAULT 1
  );
`);

// 创建故障记录表
db.exec(`
  CREATE TABLE IF NOT EXISTS fault_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fault_no TEXT UNIQUE NOT NULL,
    device_name TEXT NOT NULL,
    fault_type TEXT NOT NULL,
    fault_description TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    reporter_photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assignee_name TEXT,
    assignee_name_2 TEXT,
    shift_id INTEGER REFERENCES shift_schedule(id),
    case_id INTEGER REFERENCES repair_case(id),
    case_applicable INTEGER,
    feedback_text TEXT,
    optimization_text TEXT,
    completion_photo_url TEXT,
    repair_description TEXT,
    dify_conversation_id TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    dispatched_at TEXT,
    accepted_at TEXT,
    completed_at TEXT,
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// 创建维修案例表
db.exec(`
  CREATE TABLE IF NOT EXISTS repair_case (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fault_name TEXT NOT NULL,
    fault_type TEXT NOT NULL,
    device_name TEXT NOT NULL,
    case_content TEXT,
    source TEXT,
    fault_record_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// 创建照片表
db.exec(`
  CREATE TABLE IF NOT EXISTS photo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fault_record_id INTEGER NOT NULL REFERENCES fault_record(id),
    photo_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// 插入初始班次数据（仅在表为空时）
const shiftCount = db.prepare('SELECT COUNT(*) as count FROM shift_schedule').get() as { count: number };
if (shiftCount.count === 0) {
  const insertShift = db.prepare(
    'INSERT INTO shift_schedule (shift_name, shift_start, shift_end, sort_order) VALUES (?, ?, ?, ?)'
  );
  insertShift.run('早班', '08:00', '16:00', 1);
  insertShift.run('中班', '16:00', '00:00', 2);
  insertShift.run('夜班', '00:00', '08:00', 3);
  console.log('已插入 3 个班次数据');
}

// 插入排班人员（仅在表为空时）
const memberCount = db.prepare('SELECT COUNT(*) as count FROM schedule_member').get() as { count: number };
if (memberCount.count === 0) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const insertMember = db.prepare(
    'INSERT INTO schedule_member (name, phone, shift_id, schedule_date, is_available) VALUES (?, ?, ?, ?, 1)'
  );

  // 早班人员 (shift_id=1): 张建国、李伟、王志强、赵大勇
  insertMember.run('张建国', '13800001001', 1, dateStr);
  insertMember.run('李伟', '13800001002', 1, dateStr);
  insertMember.run('王志强', '13800001003', 1, dateStr);
  insertMember.run('赵大勇', '13800001004', 1, dateStr);

  // 中班人员 (shift_id=2): 钱明、孙磊、周杰、吴昊
  insertMember.run('钱明', '13800002001', 2, dateStr);
  insertMember.run('孙磊', '13800002002', 2, dateStr);
  insertMember.run('周杰', '13800002003', 2, dateStr);
  insertMember.run('吴昊', '13800002004', 2, dateStr);

  // 夜班人员 (shift_id=3): 郑凯、冯涛、陈辉、褚亮、卫斌
  insertMember.run('郑凯', '13800003001', 3, dateStr);
  insertMember.run('冯涛', '13800003002', 3, dateStr);
  insertMember.run('陈辉', '13800003003', 3, dateStr);
  insertMember.run('褚亮', '13800003004', 3, dateStr);
  insertMember.run('卫斌', '13800003005', 3, dateStr);

  console.log(`已插入 13 个排班人员 (${dateStr})`);
}

// 创建用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',
    is_admin INTEGER NOT NULL DEFAULT 0,
    department TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// 兼容旧表：添加 department 列（如果不存在）
try {
  db.prepare("SELECT department FROM users LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE users ADD COLUMN department TEXT");
  console.log('已添加 department 列到 users 表');
}

// 插入默认管理员（仅在表为空时）
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (name, password, role, is_admin, department) VALUES (?, ?, ?, ?, ?)'
  );
  insertUser.run('admin', 'admin123', 'worker', 1, '综合管理部');
  console.log('已插入默认管理员: admin / admin123');
}

console.log('数据库迁移完成！');
db.close();
