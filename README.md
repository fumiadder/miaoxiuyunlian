# 工业维修管理系统

工业设备维修管理前端网页，后端与 Dify 智能体 API 互动。

## 功能模块

- **备件管理**：备件查询、备件材料计划表查询（对接 Dify 智能体）
- **故障派单**：四类故障录入 → AI 分析 → 排班自动派单 → 案例库闭环
- **报修管理**：拍照报修 → 派单 → 维修人接单 → 实时进度 → 照片反馈
- **报表中心**：故障统计、备件消耗台账、派单详情
- **排班管理**：三班制（08-16/16-24/24-08）13人排班 CRUD

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia + ECharts |
| 后端 | Express + SQLite (better-sqlite3) + Multer |
| AI | Dify 智能体（SSE 流式 API 代理） |

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
cd client && npm install

# 安装后端依赖
cd ../server && npm install
```

### 2. 配置环境变量

```bash
cd server
cp .env.example .env
# 编辑 .env，填写 Dify 平台地址和 API Key
```

关键配置项：
```env
DIFY_BASE_URL=http://你的Dify地址/v1
DIFY_API_KEY=app-你的密钥
PORT=4000
```

### 3. 初始化数据库

```bash
cd server
npm run migrate
```

### 4. 开发模式

```bash
# 终端1：启动后端
cd server && npm run dev

# 终端2：启动前端
cd client && npm run dev
```

前端访问：http://localhost:3000
后端 API：http://localhost:4000

### 5. 生产部署

```bash
# 构建前端
cd client && npm run build

# 启动生产服务（Express 托管前端静态文件）
cd server && npm start
```

访问：http://localhost:4000

## 目录结构

```
industrial-maintenance-system/
├── client/                    # Vue 3 前端
│   ├── src/
│   │   ├── api/               # API 请求层
│   │   ├── assets/styles/     # 工业深色主题
│   │   ├── components/         # 通用/布局组件
│   │   ├── views/             # 10个页面
│   │   ├── stores/            # Pinia 状态
│   │   ├── types/             # TypeScript 类型
│   │   └── router/            # 路由
│   └── vite.config.ts
├── server/                    # Express 后端
│   ├── src/
│   │   ├── routes/            # API 路由（5个）
│   │   ├── db/                # 数据库连接 + 迁移
│   │   └── app.ts             # 入口
│   └── uploads/               # 照片存储
└── .env.example
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/dify/chat | Dify SSE 流式代理 |
| POST | /api/fault/create | 创建故障 + 自动派单 |
| GET | /api/fault/list | 故障列表（分页+筛选） |
| GET | /api/fault/:id | 故障详情（含时间线） |
| PUT | /api/fault/:id/accept | 接单 |
| PUT | /api/fault/:id/status | 状态更新 |
| POST | /api/fault/:id/feedback | 动作反馈 + 案例入库 |
| GET | /api/schedule | 排班查询 |
| GET | /api/schedule/current-assignees | 当前班次推荐人员 |
| POST | /api/upload | 照片上传 |
| GET | /api/report/fault-stats | 故障统计 |
| GET | /api/report/dispatch-detail | 派单详情 |
