import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DB_PATH || './data/maintenance.db';
const absolutePath = path.resolve(dbPath);
const dbDir = path.dirname(absolutePath);

// 确保 data/ 目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(absolutePath);

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');
// 启用外键约束
db.pragma('foreign_keys = ON');

export default db;
