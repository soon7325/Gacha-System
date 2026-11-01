@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title Cloudflare Worker 测试版一键部署 (gachasystem-test)
set "RESULT=1"
set "IN_PROJECT="

pushd "%~dp0"
if errorlevel 1 goto directory_failed
set "IN_PROJECT=1"

echo ==========================================
echo   正在部署到测试环境 (gachasystem-test)...
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

:: 执行测试环境部署
call npx.cmd wrangler deploy --config "wrangler.jsonc" --env test
set "RESULT=%ERRORLEVEL%"

echo.
echo ==========================================
if "%RESULT%"=="0" (
    echo   [成功] 测试服部署完成！
    echo   手机访问: https://gachasystem-test.gachasystem.com
) else (
    echo   [失败] 部署过程中出现错误，请检查上方日志。
)
echo ==========================================
goto finish

:directory_failed
echo [失败] 无法打开 upload_test.bat 所在的文件夹。

:finish
echo.
if defined IN_PROJECT popd
pause
exit /b %RESULT%
