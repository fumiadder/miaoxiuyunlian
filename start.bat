@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title MMS - Windows One-Click Start

echo ============================================
echo   Industrial Maintenance System
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [INFO] Node.js: %NODE_VER%

:: ==============================
:: 1. Pull latest code
:: ==============================
echo.
echo [1/5] Pulling latest code...

:: Handle local changes that would block git pull
:: Strategy: stash local changes, pull, then restore
git stash --include-untracked >nul 2>&1
set STASHED=%errorlevel%

git pull origin main
set PULL_OK=%errorlevel%

:: Restore stashed changes if any
if %STASHED% equ 0 (
    git stash pop >nul 2>&1
)

if %PULL_OK% neq 0 (
    echo [WARN] git pull failed. Trying reset to remote...
    git fetch origin main >nul 2>&1
    git reset --hard origin/main
    if %errorlevel% neq 0 (
        echo [WARN] Could not update code. Continuing with current version.
    ) else (
        echo [INFO] Code reset to latest version successfully.
    )
)

:: Remove auto-generated files that may conflict (components.d.ts, auto-imports.d.ts)
cd /d "%~dp0"
if exist "client\components.d.ts" del /f /q "client\components.d.ts" >nul 2>&1
if exist "client\auto-imports.d.ts" del /f /q "client\auto-imports.d.ts" >nul 2>&1
if exist "components.d.ts" del /f /q "components.d.ts" >nul 2>&1

:: ==============================
:: 2. Install server dependencies
:: ==============================
echo.
echo [2/5] Checking server dependencies...
cd /d "%~dp0server"
if not exist "node_modules" (
    echo [INFO] Installing server dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Server dependency installation failed
        pause
        exit /b 1
    )
) else (
    echo [INFO] Server dependencies OK, skipping.
)

:: ==============================
:: 3. Install client dependencies
:: ==============================
echo.
echo [3/5] Checking client dependencies...
cd /d "%~dp0client"
if not exist "node_modules" (
    echo [INFO] Installing client dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Client dependency installation failed
        pause
        exit /b 1
    )
) else (
    echo [INFO] Client dependencies OK, skipping.
)

:: ==============================
:: 4. Initialize database
:: ==============================
echo.
echo [4/5] Checking database...
cd /d "%~dp0server"
if not exist "data\maintenance.db" (
    echo [INFO] First run, initializing database...
    call npx tsx src/db/migrate.ts
    if %errorlevel% neq 0 (
        echo [ERROR] Database initialization failed
        pause
        exit /b 1
    )
) else (
    echo [INFO] Database OK, skipping.
)

:: ==============================
:: 5. Check .env config
:: ==============================
echo.
echo [5/5] Checking configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo.
        echo [WARN] No .env found, copied from .env.example
        echo [IMPORTANT] Edit server\.env and fill in your Dify config:
        echo.
        echo   DIFY_BASE_URL=http://YOUR_DIFY_IP/v1
        echo   DIFY_API_KEY=app-your-api-key
        echo.
        echo Run this script again after editing.
        pause
        exit /b 0
    ) else (
        echo [ERROR] No .env or .env.example found
        pause
        exit /b 1
    )
)

:: ==============================
:: Get local IP
:: ==============================
set IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "IP=%%a"
)
set "IP=%IP: =%"

echo.
echo ============================================
echo   Ready to start
echo ============================================
echo.
echo   Backend:  http://%IP%:4000
echo   Frontend: http://%IP%:3000
echo.
echo ============================================

:: ==============================
:: Start backend and frontend in separate windows
:: ==============================
echo Starting backend...
set "SERVER_DIR=%~dp0server"
start "MMS-Backend" cmd /k "cd /d "!SERVER_DIR!" && npx tsx src/app.ts"

timeout /t 3 /nobreak >nul

echo Starting frontend...
set "CLIENT_DIR=%~dp0client"
start "MMS-Frontend" cmd /k "cd /d "!CLIENT_DIR!" && npx vite --host 0.0.0.0 --port 3000"

echo.
echo [DONE] Services started in separate windows!
echo   Open browser: http://%IP%:3000
echo   Close the popup windows to stop services.
echo.
pause
