@echo off
chcp 65001 >nul
title Cloudflare Worker 测试版一键部署 (gachasystem-test)

echo ==========================================
echo   正在部署到测试环境 (gachasystem-test)...
echo ==========================================
echo.

:: 确保执行路径在当前 bat 所在目录（跨盘符也能生效）
cd /d "%~dp0"

:: 执行测试环境部署
call npx wrangler deploy --env test

echo.
echo ==========================================
if %ERRORLEVEL% equ 0 (
    echo   [成功] 测试服部署完成！
    echo   手机访问: https://gachasystem-test.gachasystem.com
) else (
    echo   [失败] 部署过程中出现错误，请检查上方日志。
)
echo ==========================================
echo.
pause