@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title 秒修云链 - 生产模式一键启动

echo ============================================
echo   秒修云链 - 生产模式一键启动
echo   云铝溢鑫设备维修管理平台
echo ============================================
echo.

:: ============================================
:: 1. Git 拉取最新代码
:: ============================================
echo [1/8] 拉取最新代码...
cd /d "%~dp0"

:: 清理可能被错误跟踪的自动生成的文件，避免 pull 冲突
git rm --cached components.d.ts auto-imports.d.ts client/components.d.ts client/auto-imports.d.ts 2>nul

git pull origin main --autostash
if %errorlevel% neq 0 (
    echo [错误] git pull 失败，项目未启动
    echo [提示] 如果提示 merge conflict，请手动解决后重试
    pause
    exit /b 1
)
echo [OK] 代码已更新
echo.

:: ============================================
:: 2. 检查 Node.js
:: ============================================
echo [2/8] 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v
echo.

:: ============================================
:: 3. 安装后端依赖
:: ============================================
echo [3/8] 检查后端依赖...
cd /d "%~dp0server"
if not exist "node_modules" (
    echo [安装] 正在安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [OK] 后端依赖已安装
)
echo.

:: ============================================
:: 4. 安装前端依赖
:: ============================================
echo [4/8] 检查前端依赖...
cd /d "%~dp0client"
if not exist "node_modules" (
    echo [安装] 正在安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [OK] 前端依赖已安装
)
echo.

:: ============================================
:: 5. 构建前端
:: ============================================
echo [5/8] 构建前端...
cd /d "%~dp0client"
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)
echo [OK] 前端构建完成
echo.

:: ============================================
:: 6. 初始化数据库
:: ============================================
echo [6/8] 检查数据库...
cd /d "%~dp0server"
if not exist "data\maintenance.db" (
    echo [初始化] 正在创建数据库...
    call npx tsx src/db/migrate.ts
    if %errorlevel% neq 0 (
        echo [错误] 数据库初始化失败
        pause
        exit /b 1
    )
) else (
    echo [OK] 数据库已就绪
)
echo.

:: ============================================
:: 7. 检查 .env
:: ============================================
echo [7/8] 检查配置文件...
cd /d "%~dp0server"
if not exist ".env" (
    if exist "..\.env.example" (
        copy "..\.env.example" ".env" >nul
        echo [警告] 已从 .env.example 复制为 .env，请填写 Dify 配置后重新运行
        pause
        exit /b 0
    ) else (
        echo [错误] 缺少配置文件
        pause
        exit /b 1
    )
) else (
    echo [OK] 配置文件已存在
)
echo.

:: ============================================
:: 8. 启动生产服务（Ctrl+C 停止）
:: ============================================
echo [8/8] 启动生产服务...

:: 获取本机 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP: =%

echo.
echo ============================================
echo   秒修云链 生产服务运行中
echo   访问地址: http://%IP%:4000
echo   默认账号: admin / admin123
echo   按 Ctrl+C 停止服务
echo ============================================
echo.
echo ---------- 服务日志 ----------
echo.

:: 启动后端（前台运行），输出实时日志
cd /d "%~dp0server"
npx tsx src/app.ts
