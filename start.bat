@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title 秒修云链 - 一键启动

echo ============================================
echo   秒修云链 - 一键启动
echo   云铝溢鑫设备维修管理平台
echo ============================================
echo.

:: ============================================
:: 1. Git 拉取最新代码
:: ============================================
echo [1/7] 拉取最新代码...
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
echo [2/7] 检查 Node.js...
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
echo [3/7] 检查后端依赖...
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
echo [4/7] 检查前端依赖...
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
:: 5. 初始化数据库
:: ============================================
echo [5/7] 检查数据库...
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
:: 6. 检查 .env
:: ============================================
echo [6/7] 检查配置文件...
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
:: 7. 启动服务
:: ============================================
echo [7/7] 启动服务...

:: 获取本机 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP: =%

:: 清理可能遗留的 PID 文件
del "%~dp0server.pid" 2>nul
del "%~dp0client.pid" 2>nul
del "%~dp0server.log" 2>nul
del "%~dp0client.log" 2>nul

:: 启动后端（隐藏窗口，输出到日志）
echo [启动] 后端服务 http://%IP%:4000 ...
powershell -Command "$p = Start-Process -FilePath 'cmd' -ArgumentList '/c cd /d "%~dp0server" && npx tsx src/app.ts' -PassThru -WindowStyle Hidden; $p.Id | Out-File -FilePath '%~dp0server.pid' -Encoding ASCII"

timeout /t 3 /nobreak >nul

:: 启动前端（隐藏窗口，输出到日志）
echo [启动] 前端服务 http://%IP%:3000 ...
powershell -Command "$p = Start-Process -FilePath 'cmd' -ArgumentList '/c cd /d "%~dp0client" && npx vite --host 0.0.0.0 --port 3000' -PassThru -WindowStyle Hidden; $p.Id | Out-File -FilePath '%~dp0client.pid' -Encoding ASCII"

timeout /t 2 /nobreak >nul

echo.
echo ============================================
echo   秒修云链 服务运行中
echo ============================================
echo   后端: http://%IP%:4000
echo   前端: http://%IP%:3000
echo   默认账号: admin / admin123
echo.
echo   按任意键停止所有服务...
echo ============================================
echo.

pause >nul

:: ============================================
:: 停止服务
:: ============================================
echo [停止] 正在关闭服务...

set "BACKEND_PID="
set "CLIENT_PID="

if exist "%~dp0server.pid" (
    for /f %%a in ('type "%~dp0server.pid"') do set BACKEND_PID=%%a
)
if exist "%~dp0client.pid" (
    for /f %%a in ('type "%~dp0client.pid"') do set CLIENT_PID=%%a
)

if defined BACKEND_PID (
    taskkill /PID %BACKEND_PID% /F /T >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] 后端已停止
    ) else (
        echo [提示] 后端进程可能已退出
    )
)
if defined CLIENT_PID (
    taskkill /PID %CLIENT_PID% /F /T >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] 前端已停止
    ) else (
        echo [提示] 前端进程可能已退出
    )
)

del "%~dp0server.pid" 2>nul
del "%~dp0client.pid" 2>nul

echo.
echo [完成] 所有服务已停止
timeout /t 2 >nul
