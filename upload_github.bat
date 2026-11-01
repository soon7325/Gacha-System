@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title GitHub 一键上传
set "RESULT=1"
set "IN_PROJECT="

pushd "%~dp0"
if errorlevel 1 goto directory_failed
set "IN_PROJECT=1"

echo ==========================================
echo   GitHub 一键上传
echo   将提交所有未被 Git 忽略的新增、修改和删除。
echo ==========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [失败] 未找到 Git，请安装 Git 后重新运行。
    goto finish
)

git rev-parse --show-toplevel >nul 2>&1
if errorlevel 1 (
    echo [失败] 当前文件夹不是 Git 项目。
    goto finish
)

git symbolic-ref --quiet HEAD >nul 2>&1
if errorlevel 1 (
    echo [失败] 当前没有选中的分支，请先切换回 main 分支。
    goto finish
)

echo 上传目标：
git remote get-url --push origin
if errorlevel 1 (
    echo [失败] 尚未配置 origin 仓库地址。
    goto finish
)
echo.

echo [1/3] 收集项目修改...
git add -A
if errorlevel 1 (
    echo [失败] 收集修改失败，上传已停止。
    goto finish
)

git diff --cached --quiet --exit-code
if errorlevel 2 (
    echo [失败] 检查修改失败，上传已停止。
    goto finish
)
if not errorlevel 1 goto no_changes

echo [2/3] 保存本次修改...
git commit -m "Update project %date% %time%"
if errorlevel 1 (
    echo [失败] 提交失败，请查看上方提示，修复后重新运行。
    goto finish
)
goto upload

:no_changes
echo [2/3] 没有新修改，继续上传此前尚未上传的提交。

:upload
echo [3/3] 上传当前分支到 GitHub...
echo 如果弹出登录窗口，请完成 GitHub 登录。
git push --set-upstream origin HEAD
if errorlevel 1 (
    echo.
    echo [失败] 上传未完成，本地提交已保留。
    echo 网络或登录问题解决后，双击本文件即可重试。
    echo 如果提示远程有新提交，请先合并远程更新后重试。
    goto finish
)

echo.
echo [成功] 当前分支已同步到 GitHub！
set "RESULT=0"
goto finish

:directory_failed
echo [失败] 无法打开 upload_github.bat 所在的文件夹。

:finish
echo.
if defined IN_PROJECT popd
pause
exit /b %RESULT%
