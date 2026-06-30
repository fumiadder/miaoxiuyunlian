@echo off
setlocal enabledelayedexpansion

:: Gitee 配置脚本
:: 运行后输入 Gitee 私人令牌，自动推送代码并切换 origin 为 Gitee

title Gitee 配置

powershell -Command "Write-Host '============================================'; Write-Host '  Gitee 仓库配置工具'; Write-Host '============================================'; Write-Host ''"

:: 检查是否在项目目录
if not exist ".git" (
    powershell -Command "Write-Host '[ERROR] 请在 miaoxiuyunlian 项目根目录下运行此脚本' -ForegroundColor Red"
    pause
    exit /b 1
)

:: 获取用户名
set /p USERNAME=请输入 Gitee 用户名: 
if "!USERNAME!"=="" (
    powershell -Command "Write-Host '[ERROR] 用户名不能为空' -ForegroundColor Red"
    pause
    exit /b 1
)

:: 获取私人令牌（输入时隐藏）
powershell -Command "Write-Host '请输入 Gitee 私人令牌: ' -NoNewline"
for /f "delims=" %%a in ('powershell -Command "$p = Read-Host -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))"') do set TOKEN=%%a

if "!TOKEN!"=="" (
    powershell -Command "Write-Host ''; Write-Host '[ERROR] 令牌不能为空' -ForegroundColor Red"
    pause
    exit /b 1
)

echo.

:: 添加/更新 gitee remote
git remote remove gitee 2>nul
git remote add gitee https://!USERNAME!:!TOKEN!@gitee.com/fumiadder/miaoxiuyunlian.git
if %errorlevel% neq 0 (
    powershell -Command "Write-Host '[ERROR] 添加 remote 失败' -ForegroundColor Red"
    pause
    exit /b 1
)

:: 推送到 Gitee
powershell -Command "Write-Host '[PUSH] 正在推送代码到 Gitee...'"
git push gitee main
if %errorlevel% neq 0 (
    powershell -Command "Write-Host '[ERROR] 推送失败，请检查用户名和令牌是否正确' -ForegroundColor Red"
    pause
    exit /b 1
)

:: 切换 origin 为 Gitee（以后默认从 Gitee 拉取/推送）
git remote set-url origin https://!USERNAME!:!TOKEN!@gitee.com/fumiadder/miaoxiuyunlian.git
if %errorlevel% neq 0 (
    powershell -Command "Write-Host '[ERROR] 切换 origin 失败' -ForegroundColor Red"
    pause
    exit /b 1
)

:: 验证
powershell -Command "Write-Host ''; Write-Host '[OK] Gitee 配置成功！' -ForegroundColor Green"
powershell -Command "Write-Host '当前 remote:'"
git remote -v

powershell -Command "Write-Host ''; Write-Host '============================================'; Write-Host '  配置完成' ; Write-Host '  以后使用 start.bat 会自动从 Gitee 拉取'; Write-Host '============================================'"

pause
