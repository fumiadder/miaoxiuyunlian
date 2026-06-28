@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title MMS - Start

echo ============================================
echo   Industrial Maintenance System - Start
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo [INFO] Node.js: %%v

:: Check server dependencies
cd /d "%~dp0server"
if not exist "node_modules" (
    echo [INFO] Installing server dependencies...
    call npm install
)

:: Check client dependencies
cd /d "%~dp0client"
if not exist "node_modules" (
    echo [INFO] Installing client dependencies...
    call npm install
)

:: Check database
cd /d "%~dp0server"
if not exist "data\maintenance.db" (
    echo [INFO] Initializing database...
    call npx tsx src/db/migrate.ts
)

:: Check .env
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [WARN] .env created from .env.example, please edit Dify config first.
        pause
        exit /b 0
    ) else (
        echo [ERROR] No .env found.
        pause
        exit /b 1
    )
)

:: Get local IP
set IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set "IP=%%a"
set "IP=%IP: =%"

echo.
echo   Backend:  http://%IP%:4000
echo   Frontend: http://%IP%:3000
echo.

:: Start backend and frontend in two windows
set "SERVER_DIR=%~dp0server"
set "CLIENT_DIR=%~dp0client"

start "MMS-Backend" cmd /k "cd /d "!SERVER_DIR!" && npx tsx src/app.ts"
timeout /t 3 /nobreak >nul
start "MMS-Frontend" cmd /k "cd /d "!CLIENT_DIR!" && npx vite --host 0.0.0.0 --port 3000"

echo [DONE] Services started. Close popup windows to stop.
echo   Open: http://%IP%:3000
echo.
pause
