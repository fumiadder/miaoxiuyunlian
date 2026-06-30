@echo off
setlocal enabledelayedexpansion

:: 标题使用 ASCII 避免编码问题
title miaoxiuyunlian-start

:: Banner 用 powershell 输出中文（兼容内网编码环境）
powershell -Command "Write-Host '============================================'; Write-Host '  秒修云链 - 一键启动'; Write-Host '  云铝溢鑫设备维修管理平台'; Write-Host '============================================'; Write-Host ''"

:: ============================================
:: 1. Git 拉取最新代码（支持 no-pull 参数跳过）
:: ============================================
if /i "%1"=="no-pull" (
    powershell -Command "Write-Host '[1/7] 跳过 git pull（no-pull 模式）'"
    goto :check_node
)

powershell -Command "Write-Host '[1/7] 拉取最新代码...'"
cd /d "%~dp0"

:: 清理可能被错误跟踪的自动生成的文件，避免 pull 冲突
git rm --cached components.d.ts auto-imports.d.ts client/components.d.ts client/auto-imports.d.ts 2>nul

git pull origin main --autostash
if %errorlevel% neq 0 (
    powershell -Command "Write-Host '[ERROR] git pull failed, project not started' -ForegroundColor Red"
    powershell -Command "Write-Host '[TIP] Use: start.bat no-pull   to skip git pull and start directly' -ForegroundColor Yellow"
    powershell -Command "Write-Host '[TIP] Or run: git pull origin main --autostash   manually after fixing network' -ForegroundColor Yellow"
    pause
    exit /b 1
)
powershell -Command "Write-Host '[OK] Code updated'"
powershell -Command "Write-Host ''"

:check_node
:: ============================================
:: 2. 检查 Node.js
:: ============================================
powershell -Command "Write-Host '[2/7] Checking Node.js...'"
where node >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Write-Host '[ERROR] Node.js not found. Please install Node.js 18+ first.' -ForegroundColor Red"
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do powershell -Command "Write-Host \"[OK] Node.js %%v\""
powershell -Command "Write-Host ''"

:: ============================================
:: 3. 安装后端依赖
:: ============================================
powershell -Command "Write-Host '[3/7] Checking backend dependencies...'"
cd /d "%~dp0server"
if not exist "node_modules" (
    powershell -Command "Write-Host '[INSTALL] Installing backend dependencies...'"
    call npm install
    if %errorlevel% neq 0 (
        powershell -Command "Write-Host '[ERROR] Backend dependencies installation failed' -ForegroundColor Red"
        pause
        exit /b 1
    )
) else (
    powershell -Command "Write-Host '[OK] Backend dependencies ready'"
)
powershell -Command "Write-Host ''"

:: ============================================
:: 4. 安装前端依赖
:: ============================================
powershell -Command "Write-Host '[4/7] Checking frontend dependencies...'"
cd /d "%~dp0client"
if not exist "node_modules" (
    powershell -Command "Write-Host '[INSTALL] Installing frontend dependencies...'"
    call npm install
    if %errorlevel% neq 0 (
        powershell -Command "Write-Host '[ERROR] Frontend dependencies installation failed' -ForegroundColor Red"
        pause
        exit /b 1
    )
) else (
    powershell -Command "Write-Host '[OK] Frontend dependencies ready'"
)
powershell -Command "Write-Host ''"

:: ============================================
:: 5. 初始化数据库
:: ============================================
powershell -Command "Write-Host '[5/7] Checking database...'"
cd /d "%~dp0server"
if not exist "data\maintenance.db" (
    powershell -Command "Write-Host '[INIT] Creating database...'"
)
powershell -Command "Write-Host '[MIGRATE] Checking database schema...'"
call npx tsx src/db/migrate.ts
if %errorlevel% neq 0 (
    powershell -Command "Write-Host '[ERROR] Database migration failed' -ForegroundColor Red"
    pause
    exit /b 1
)
powershell -Command "Write-Host '[OK] Database ready'"
powershell -Command "Write-Host ''"

:: ============================================
:: 6. 检查 .env
:: ============================================
powershell -Command "Write-Host '[6/7] Checking config file...'"
cd /d "%~dp0server"
if not exist ".env" (
    if exist "..\.env.example" (
        copy "..\.env.example" ".env" >nul
        powershell -Command "Write-Host '[WARN] Copied .env.example to .env. Please fill in Dify config and restart.' -ForegroundColor Yellow"
        pause
        exit /b 0
    ) else (
        powershell -Command "Write-Host '[ERROR] Missing config file' -ForegroundColor Red"
        pause
        exit /b 1
    )
) else (
    powershell -Command "Write-Host '[OK] Config file exists'"
)
powershell -Command "Write-Host ''"

:: ============================================
:: 7. 启动服务（Ctrl+C 停止）
:: ============================================
powershell -Command "Write-Host '[7/7] Starting services...'"
powershell -Command "Write-Host ''"

:: 获取本机 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP: =%

powershell -Command "Write-Host '============================================'"
powershell -Command "Write-Host '  miaoxiuyunlian is running'"
powershell -Command "Write-Host '  Backend: http://%IP%:4000'"
powershell -Command "Write-Host '  Frontend: http://%IP%:3000'"
powershell -Command "Write-Host '  Default login: admin / admin123'"
powershell -Command "Write-Host '  Press Ctrl+C to stop all services'"
powershell -Command "Write-Host '============================================'"
powershell -Command "Write-Host ''"
powershell -Command "Write-Host '---------- Backend Logs ----------'"
powershell -Command "Write-Host ''"

:: 启动后端（前台运行），输出实时日志
cd /d "%~dp0server"
start /b "" npx tsx src/app.ts

:: 等待后端启动
timeout /t 3 /nobreak >nul

powershell -Command "Write-Host ''"
powershell -Command "Write-Host '---------- Frontend Logs ----------'"
powershell -Command "Write-Host ''"

:: 启动前端（前台运行），输出实时日志
cd /d "%~dp0client"
start /b "" npx vite --host 0.0.0.0 --port 3000

:: 脚本持续运行，Ctrl+C 会终止所有 start /b 的子进程
:: 主进程等待前端 vite 进程结束（后端结束时 vite 可能还在运行）
waitfor /t 86400 pause_signal 2>nul
exit /b 0
