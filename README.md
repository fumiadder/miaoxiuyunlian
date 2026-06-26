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

## Windows 一键部署（推荐）

### 前置条件

安装 [Node.js 18+](https://nodejs.org/)（LTS 版本），安装时勾选「Add to PATH」。

### 开发模式（双窗口，支持热更新）

1. 克隆项目：
```cmd
git clone https://github.com/fumiadder/miaoxiuyunlian.git
cd miaoxiuyunlian
```

2. 编辑配置文件 `server\.env`，填写 Dify 地址和 API Key：
```env
DIFY_BASE_URL=http://你的Dify服务器IP/v1
DIFY_API_KEY=app-你的密钥
```

3. 双击运行 `start.bat`，脚本会自动完成：
   - 拉取最新代码
   - 安装前后端依赖（首次运行）
   - 初始化数据库（首次运行）
   - 启动后端和前端（弹出两个窗口）

4. 浏览器打开控制台提示的地址，如 `http://192.168.1.100:3000`

### 生产模式（单端口，性能更好）

双击 `start-prod.bat`，会自动构建前端并启动单端口服务，浏览器访问 `http://你的IP:4000`

## 手动部署（非 Windows）

### 1. 安装依赖

```bash
cd client && npm install
cd ../server && npm install
```

### 2. 配置环境变量

```bash
cd server
cp .env.example .env
# 编辑 .env，填写 Dify 地址和 API Key
```

关键配置项：
```env
DIFY_BASE_URL=http://你的Dify服务器IP/v1
DIFY_API_KEY=app-你的密钥
PORT=4000
```

### 3. 初始化数据库

```bash
cd server
npm run migrate
```

### 4. 启动服务

```bash
# 终端1：启动后端（监听所有网卡，局域网可访问）
cd server && npm run dev

# 终端2：启动前端
cd client && npm run dev
```

启动后控制台会显示局域网 IP 地址，如 `http://192.168.1.100:3000`

### 5. 生产部署

```bash
cd client && npm run build
cd ../server && npm start
# 访问 http://你的IP:4000
```

## 目录结构

```
industrial-maintenance-system/
├── start.bat              # Windows 一键启动（开发模式）
├── start-prod.bat         # Windows 一键启动（生产模式）
├── client/                # Vue 3 前端
│   ├── src/
│   │   ├── api/           # API 请求层
│   │   ├── assets/styles/ # 工业深色主题
│   │   ├── components/    # 通用/布局组件
│   │   ├── views/         # 10个页面
│   │   ├── stores/        # Pinia 状态
│   │   ├── types/         # TypeScript 类型
│   │   └── router/        # 路由
│   └── vite.config.ts
├── server/                # Express 后端
│   ├── src/
│   │   ├── routes/        # API 路由（5个）
│   │   ├── db/            # 数据库连接 + 迁移
│   │   └── app.ts         # 入口
│   ├── uploads/           # 照片存储
│   └── .env               # Dify 配置（从 .env.example 复制）
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

## 常见问题

| 问题 | 解决 |
|------|------|
| `better-sqlite3` 安装失败 | 安装 Node.js 时勾选「Automatically install necessary tools」，或手动安装 Python + VS Build Tools |
| 双击 `start.bat` 闪退 | 右键 → 以管理员身份运行 |
| 局域网其他电脑无法访问 | 检查 Windows 防火墙，放行 3000 和 4000 端口 |
| Dify 返回 401 | 检查 `server/.env` 中 API Key 是否正确 |
| 照片上传失败 | 确认 `server/uploads/` 目录有写入权限 |
