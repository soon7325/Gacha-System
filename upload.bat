@echo off
chcp 65001 >nul
title Cloudflare Worker 一键部署

echo ==========================================
echo   正在自动部署到 Cloudflare Worker...
echo ==========================================
echo.

:: 确保执行路径在当前 bat 所在目录（跨盘符也能生效）
cd /d "%~dp0"

:: 执行部署
call npx wrangler deploy

echo.
echo ==========================================
if %ERRORLEVEL% equ 0 (
    echo   [成功] 部署完成！
) else (
    echo   [失败] 部署过程中出现错误，请检查上方日志。
)
echo ==========================================
echo.
pause