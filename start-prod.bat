@echo off
chcp 65001 >nul 2>&1
title 工业维修管理系统 - 生产模式一键启动

echo ============================================
echo   工业维修管理系统 - 生产模式部署
echo ============================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

:: 1. 拉取最新代码
echo [1/6] 拉取最新代码...
git pull origin main

:: 2. 安装后端依赖
echo [2/6] 安装后端依赖...
cd /d "%~dp0server"
call npm install

:: 3. 安装前端依赖
echo [3/6] 安装前端依赖...
cd /d "%~dp0client"
call npm install

:: 4. 构建前端
echo [4/6] 构建前端（此步骤可能需要1-2分钟）...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)
echo [信息] 前端构建完成

:: 5. 检查数据库
echo [5/6] 检查数据库...
cd /d "%~dp0server"
if not exist "data\maintenance.db" (
    call npx tsx src/db/migrate.ts
)

:: 6. 检查 .env
echo [6/6] 检查配置文件...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [警告] 已从 .env.example 复制为 .env，请填写 Dify 配置后重新运行
        pause
        exit /b 0
    ) else (
        echo [错误] 缺少配置文件
        pause
        exit /b 1
    )
)

:: 获取本机 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP: =%

echo.
echo ============================================
echo   生产服务启动中...
echo   访问地址: http://%IP%:4000
echo ============================================
echo.

cd /d "%~dp0server"
npx tsx src/app.ts
