@echo off
chcp 65001 >nul 2>&1
title 工业维修管理系统 - 一键启动

echo ============================================
echo   工业维修管理系统 - Windows 一键部署脚本
echo ============================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 显示 Node.js 版本
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [信息] Node.js 版本: %NODE_VER%

:: ==============================
:: 1. 拉取最新代码
:: ==============================
echo.
echo [1/5] 拉取最新代码...
git pull origin main
if %errorlevel% neq 0 (
    echo [警告] git pull 失败，如果是首次克隆请忽略此提示
)

:: ==============================
:: 2. 安装后端依赖
:: ==============================
echo.
echo [2/5] 安装后端依赖...
cd /d "%~dp0server"
if not exist "node_modules" (
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [信息] 后端依赖已存在，跳过安装
)

:: ==============================
:: 3. 安装前端依赖
:: ==============================
echo.
echo [3/5] 安装前端依赖...
cd /d "%~dp0client"
if not exist "node_modules" (
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [信息] 前端依赖已存在，跳过安装
)

:: ==============================
:: 4. 初始化数据库
:: ==============================
echo.
echo [4/5] 检查数据库...
cd /d "%~dp0server"
if not exist "data\maintenance.db" (
    echo [信息] 首次运行，初始化数据库...
    call npx tsx src/db/migrate.ts
    if %errorlevel% neq 0 (
        echo [错误] 数据库初始化失败
        pause
        exit /b 1
    )
) else (
    echo [信息] 数据库已存在，跳过初始化
)

:: ==============================
:: 5. 检查 .env 配置
:: ==============================
echo.
echo [5/5] 检查配置文件...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [警告] 未找到 .env 配置文件，已从 .env.example 复制
        echo [重要] 请编辑 server\.env 文件，填写你的 Dify 地址和 API Key：
        echo.
        echo   DIFY_BASE_URL=http://你的Dify地址/v1
        echo   DIFY_API_KEY=app-你的密钥
        echo.
        echo 修改完成后，再次运行本脚本即可启动。
        pause
        exit /b 0
    ) else (
        echo [错误] 既没有 .env 也没有 .env.example，请手动创建配置
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo   配置检查完成，准备启动服务
echo ============================================

:: 获取本机 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
)
set IP=%IP: =%

echo.
echo   后端 API:   http://%IP%:4000
echo   前端页面:   http://%IP%:3000
echo.
echo   按 Ctrl+C 可停止所有服务
echo ============================================
echo.

:: 同时启动后端和前端（两个窗口）
echo 正在启动后端服务...
start "工业维修管理系统-后端" cmd /k "cd /d "%~dp0server" && npx tsx src/app.ts"

:: 等待后端启动
timeout /t 3 /nobreak >nul

echo 正在启动前端服务...
start "工业维修管理系统-前端" cmd /k "cd /d "%~dp0client" && npx vite --host 0.0.0.0 --port 3000"

echo.
echo [完成] 前后端服务已在独立窗口中启动！
echo   请在浏览器中访问: http://%IP%:3000
echo   关闭本窗口不会影响服务运行
echo   要停止服务，请关闭弹出的两个命令行窗口
echo.
pause
