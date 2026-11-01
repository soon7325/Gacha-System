@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title Cloudflare Worker 一键部署
set "RESULT=1"
set "IN_PROJECT="

pushd "%~dp0"
if errorlevel 1 goto directory_failed
set "IN_PROJECT=1"

echo ==========================================
echo   正在自动部署到 Cloudflare Worker...
echo ==========================================
echo.

if not exist ".assetsignore" (
    echo [失败] 缺少 .assetsignore 排除规则，已停止部署。
    goto finish
)
if not exist "wrangler.jsonc" (
    echo [失败] 缺少 wrangler.jsonc 部署配置。
    goto finish
)
where npx.cmd >nul 2>&1
if errorlevel 1 (
    echo [失败] 未找到 npx，请先安装 Node.js。
    goto finish
)
echo 已启用 .assetsignore：仅上传网站资源，排除 Git、缓存、脚本等文件。
echo.

:: 执行部署
call npx.cmd wrangler deploy --config "wrangler.jsonc"
set "RESULT=%ERRORLEVEL%"

echo.
echo ==========================================
if "%RESULT%"=="0" (
    echo   [成功] 部署完成！
) else (
    echo   [失败] 部署过程中出现错误，请检查上方日志。
)
echo ==========================================
goto finish

:directory_failed
echo [失败] 无法打开 upload.bat 所在的文件夹。

:finish
echo.
if defined IN_PROJECT popd
pause
exit /b %RESULT%
