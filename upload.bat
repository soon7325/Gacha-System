@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title Cloudflare 正式网站上传
set "RESULT=1"
pushd "%~dp0"
if errorlevel 1 goto directory_failed
echo 正在从当前编辑目录发布正式网站。
echo 上传范围由 .assetsignore 决定；不上传开发资料和本机缓存。
if not exist ".assetsignore" goto config_missing
if not exist "wrangler.jsonc" goto config_missing
if not exist "html\index.html" goto config_missing
where npx >nul 2>&1
if errorlevel 1 (
    echo [失败] 未找到 npx，请安装 Node.js 后重试。
    goto finish
)
call npx wrangler deploy --config wrangler.jsonc
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
    echo [失败] 发布未完成，请查看上方错误。
    goto finish
)
echo [成功] 正式网站发布完成。
goto finish
:config_missing
echo [失败] 缺少发布配置或首页，请从完整项目目录运行。
goto finish
:directory_failed
echo [失败] 无法打开脚本所在目录。
pause
exit /b 1
:finish
popd
pause
exit /b %RESULT%
