/**
 * 首页：侧栏初始化、认证弹窗切换及日志下载入口。
 * 由 index.html 底部加载，保持原先的依赖和执行顺序。
 * 使用普通 script，全局函数仍可供 HTML 内联 onclick 调用。
 */
// 页面加载完成后立即生成左侧菜单（在普通 script 里能准确捕捉到该事件）
        window.addEventListener('DOMContentLoaded', () => {
            if (typeof renderSidebar === 'function') renderSidebar();
        });

        // ==========================
        // 原生 UI 交互逻辑绑定区
        // ==========================
        
        // 唤起登录/注册弹窗
        window.openAuthModal = () => document.getElementById('authModalOverlay').style.display = 'flex';
        
        // 点击遮罩层的空白处自动关闭弹窗
        document.getElementById('authModalOverlay').addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
        
        // 切换登录/注册面板的状态 (显隐确认密码框、更改按钮文字)
        window.switchAuthTab = (mode) => {
            const tLogin = document.getElementById('tab-login');
            const tRegister = document.getElementById('tab-register');
            const confirmPwdGroup = document.getElementById('group-confirm-pwd');
            const submitBtn = document.getElementById('btn-auth-submit');
    
            if (mode === 'login') {
                tLogin.classList.add('active'); tRegister.classList.remove('active');
                confirmPwdGroup.style.display = 'none'; 
                submitBtn.innerText = window.getTrans('login'); // 动态获取翻译
            } else {
                tRegister.classList.add('active'); tLogin.classList.remove('active');
                confirmPwdGroup.style.display = 'block'; 
                submitBtn.innerText = window.getTrans('auth_btn_register'); // 动态获取翻译
            }
        };

        // 处理版本日志文件下载
        window.downloadChangelog = function(event) {
            event.preventDefault(); // 阻止 <a> 标签的默认跳转行为
    
            // 获取当前语言环境，决定下载哪种语言的日志版本
            const currentLang = localStorage.getItem('GM_Lang') || 'zh'; 
    
            // 默认配置（中文版路径）
            let fileUrl = 'changelog_zh.txt'; 
            let fileName = 'GachaMaster_Changelog_zh.txt';

            // 若检测到环境为英文，则切换到对应的英文件
            if (currentLang.includes('en')) {
                fileUrl = 'changelog_en.txt';
                fileName = 'GachaMaster_Changelog_en.txt';
            }

            // 动态创建不可见的 <a> 标签触发浏览器下载流，完成后从 DOM 中移除
            const a = document.createElement('a');
            a.href = fileUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a); 
        };

