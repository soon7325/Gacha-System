/**
 * 更新日志：分页、版本导航、搜索、复制、下载和页面语言切换。
 * 由 changelog.html 底部加载，保持原先的依赖和执行顺序。
 * 使用普通 script，全局函数仍可供 HTML 内联 onclick 调用。
 */
// 继承全局语言，避免重复使用 let 声明
    currentLang = localStorage.getItem('GM_Lang') || 'zh';
    let lineLimitPerPage = [150, 300, 500, 1000].includes(Number(localStorage.getItem('GM_Changelog_Line_Limit'))) ? Number(localStorage.getItem('GM_Changelog_Line_Limit')) : 300;
    let currentPage = 1;
    let pagedGroups = []; // 切分后的页面数据数组
    let measureContainer = null;

    // 浏览器恢复缓存页面时，URL 中的通道可能已在离开前更新。
    window.addEventListener('pageshow', () => {
        const params = new URLSearchParams(window.location.search);
        const requested = (params.get('channel') || params.get('from') || '').replace(/^v/, '');
        const active = window.GACHA_VERSION_CHANNELS[requested] ? requested : window.GACHA_LATEST_VERSION;
        if (active !== window.GACHA_ACTIVE_VERSION) window.location.reload();
    });

    // 日志卡片和右侧通道按钮都要更新返回时使用的历史记录。
    document.addEventListener('click', event => {
        const link = event.target.closest('a[data-channel]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const url = new URL(window.location.href);
        url.searchParams.delete('from');
        url.searchParams.set('channel', link.dataset.channel);
        window.history.replaceState(window.history.state, '', url.href);
    });

    window.addEventListener('DOMContentLoaded', () => {
        if (typeof renderSidebar === 'function') renderSidebar();
        // 旧版 layout.js 会覆盖 head 中的属性（例如旧值 full）。
        // 布局脚本加载完后再次规范化，确保默认与不支持的旧值都居中。
        applyChangelogLayout();
        applyChannelEnvironment();


        initMeasureContainer();
        applyUiText();
        buildAndRenderPages();
        renderTocSidebar();

        // 监听窗口大小变化（窗口变窄会导致自动折行增多，行数动态重新测量）
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                buildAndRenderPages();
            }, 200);
        });
    });

// ==========================================
    // 🌟 1. 终极真实视觉行数测量（彻底消除 ±1 误差）
    // ==========================================
    function initMeasureContainer() {
        if (!measureContainer) {
            measureContainer = document.createElement('div');
            measureContainer.style.cssText = `
                position: absolute;
                top: -99999px;
                left: -99999px;
                visibility: hidden;
                pointer-events: none;
                white-space: pre-wrap;
                word-break: break-word;
                padding: 18px 22px;
                font-size: 14px;
                line-height: 1.6;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                box-sizing: border-box;
            `;
            document.body.appendChild(measureContainer);
        }
    }

    // 精准获取时间轴卡片本体的实际渲染宽度（确保居中、靠左、靠右时测量完全精准）
    function getAvailableCardWidth() {
        const timeline = document.getElementById('timeline-container');
        if (timeline && timeline.clientWidth > 0) {
            return timeline.clientWidth; // 卡片实际呈现宽度
        }
        return 950;
    }

    // 测量视觉折行后的真实行数（利用 Range 获取实际分行矩形数量）
    function measureRenderedLines(text) {
        if (!text) return 1;
        initMeasureContainer();
        
        // 宽度完全等同于实际 .log-card 宽度
        measureContainer.style.width = getAvailableCardWidth() + 'px';
        measureContainer.textContent = text;

        // 使用浏览器布局引擎的 Range API 逐行测量真实的折行 ClientRects
        const range = document.createRange();
        range.selectNodeContents(measureContainer);
        const rects = range.getClientRects();

        // 如果浏览器支持逐行提取 rects，数量即为准确视觉行数
        if (rects && rects.length > 0) {
            // 合并同一垂直 Y 坐标的片段（防止单行内被断成多个行内盒子）
            let visualLineCount = 0;
            let lastBottom = -999;
            for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                if (r.width === 0 && r.height === 0) continue;
                if (Math.abs(r.bottom - lastBottom) > 4) { // 换行了
                    visualLineCount++;
                    lastBottom = r.bottom;
                }
            }
            return Math.max(1, visualLineCount);
        }

        // 备用兜底（除法方案使用标准字符集测量并向上取整 Math.ceil）
        measureContainer.textContent = 'Ag测试Mypq123';
        const singleLineHeight = measureContainer.getBoundingClientRect().height - 36; // 扣去上下 padding 36px
        measureContainer.textContent = text;
        const totalHeight = measureContainer.getBoundingClientRect().height - 36;
        return Math.max(1, Math.ceil(totalHeight / (singleLineHeight || 22.275)));
    }

    // 按真实视觉行截断文本（超过 300 真实行时）
    function splitTextByVisualLines(fullText, maxVisualLines) {
        const rawLines = fullText.split('\n');
        const chunks = [];
        let currentChunkLines = [];

        rawLines.forEach((line) => {
            currentChunkLines.push(line);
            const curText = currentChunkLines.join('\n');
            const linesSoFar = measureRenderedLines(curText);

            if (linesSoFar > maxVisualLines) {
                if (currentChunkLines.length > 1) {
                    currentChunkLines.pop();
                    chunks.push(currentChunkLines.join('\n'));
                    currentChunkLines = [line];
                } else {
                    chunks.push(currentChunkLines.join('\n'));
                    currentChunkLines = [];
                }
            }
        });

        if (currentChunkLines.length > 0) {
            chunks.push(currentChunkLines.join('\n'));
        }

        return chunks.length > 0 ? chunks : [fullText];
    }

    // ==========================================
    // 🌟 2. 分页构建核心：按【真实渲染视觉行数】精准分页
    // ==========================================
    function getRawVersionList() {
        if (currentLang === 'en') {
            return (window.CHANGELOG_EN && window.CHANGELOG_EN.length > 0) ? window.CHANGELOG_EN : (window.CHANGELOG_ZH || []);
        }
        return (window.CHANGELOG_ZH && window.CHANGELOG_ZH.length > 0) ? window.CHANGELOG_ZH : (window.CHANGELOG_EN || []);
    }

    function buildAndRenderPages() {
        const rawList = getRawVersionList();
        pagedGroups = [];

        let curPageItems = [];
        let curPageVisualLines = 0;

        rawList.forEach((item) => {
            // 计算当前版本在屏幕上的真实视觉折行数
            const actualVisualLines = measureRenderedLines(item.content);

            // 场景 1：单版本本身就超过了每页上限（如 350 真实视觉行）-> 切片拆分
            if (actualVisualLines > lineLimitPerPage) {
                const chunks = splitTextByVisualLines(item.content, lineLimitPerPage);
                chunks.forEach((chunkText, chunkIdx) => {
                    const chunkVisualLines = measureRenderedLines(chunkText);
                    const isMultiPart = true;
                    const partNumber = chunkIdx + 1;
                    const totalParts = chunks.length;

                    // 若当前页已有其他内容，加上该切片会超限，先封存当前页
                    if (curPageItems.length > 0 && (curPageVisualLines + chunkVisualLines > lineLimitPerPage)) {
                        pagedGroups.push(curPageItems);
                        curPageItems = [];
                        curPageVisualLines = 0;
                    }

                    curPageItems.push({
                        version: item.version,
                        title: item.title,
                        date: item.date,
                        tag: item.tag,
                        author: item.author,
                        channel: item.channel || item.rollback || item.forward,
                        rollback: item.rollback,
                        content: chunkText,
                        fullContent: item.content,
                        lineCount: chunkVisualLines, // 存入真实视觉折行数
                        isPart: isMultiPart,
                        partStr: `Part ${partNumber}/${totalParts}`
                    });
                    curPageVisualLines += chunkVisualLines;

                    if (curPageVisualLines >= lineLimitPerPage) {
                        pagedGroups.push(curPageItems);
                        curPageItems = [];
                        curPageVisualLines = 0;
                    }
                });
            }
            // 场景 2：单版本在行数以内（如 160 行）
            else {
                // 如果加入当前页会导致真实折行超标（如当前已有 180 真实行，180 + 160 = 340 > 300）
                // 则整个版本顺延至下一页，不在版本中间切断
                if (curPageItems.length > 0 && (curPageVisualLines + actualVisualLines > lineLimitPerPage)) {
                    pagedGroups.push(curPageItems);
                    curPageItems = [];
                    curPageVisualLines = 0;
                }

                curPageItems.push({
                    version: item.version,
                    title: item.title,
                    date: item.date,
                    tag: item.tag,
                    author: item.author,
                    channel: item.channel || item.rollback || item.forward,
                    rollback: item.rollback,
                    content: item.content,
                    fullContent: item.content,
                    lineCount: actualVisualLines, // 存入真实视觉折行数
                    isPart: false,
                    partStr: ''
                });
                curPageVisualLines += actualVisualLines;
            }
        });

        if (curPageItems.length > 0) {
            pagedGroups.push(curPageItems);
        }

        if (pagedGroups.length === 0) {
            pagedGroups.push([]);
        }

        if (currentPage > pagedGroups.length) {
            currentPage = pagedGroups.length;
        }

        renderCurrentPageDOM();
        renderPaginationControls();
    }

    // ==========================================
    // 🌟 更新下拉菜单（动态拼接数字 + translate.js 的“行 / lines”）
    // ==========================================

    // 页面初始化与统一翻译应用
    function applyUiText() {
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(); // 自动应用 HTML 中所有 data-i18n 标签
        }
    }

    // 语言切换
function applyChangelogLanguage(lang) {
    currentLang = lang;
    
    applyUiText();
    currentPage = 1;
    buildAndRenderPages();
    renderTocSidebar(); // 🌟 语言切换时同步更新侧栏文本与通道标题

    showToast(currentLang === 'zh' ? window.getTrans('cl_toast_lang_zh') : window.getTrans('cl_toast_lang_en'));
}

    // ==========================================
    // 🌟 卡片渲染：所有固定词条改用 window.getTrans()
    // ==========================================
    // 根据实际文字宽度决定是否换行，不按固定屏幕断点强制拆开短标题。
    const versionHeaderObserver = new ResizeObserver(entries => {
        for (const { target } of entries) updateVersionHeader(target);
    });
    function updateVersionHeader(header) {
        const title = header.querySelector('.ver-main-title');
        const number = header.querySelector('.ver-number');
        const meta = header.querySelector('.ver-meta');
        const probe = title.cloneNode(true);
        Object.assign(probe.style, { position: 'fixed', visibility: 'hidden', whiteSpace: 'nowrap', width: 'max-content', maxWidth: 'none' });
        header.appendChild(probe);
        const titleWidth = probe.getBoundingClientRect().width;
        probe.remove();
        // 元信息也测自然单行宽度，避免已换行后的宽度变小导致反复切换布局。
        const metaProbe = meta.cloneNode(true);
        Object.assign(metaProbe.style, { position: 'fixed', visibility: 'hidden', whiteSpace: 'nowrap', flexWrap: 'nowrap', width: 'max-content', maxWidth: 'none' });
        header.appendChild(metaProbe);
        const metaWidth = metaProbe.getBoundingClientRect().width;
        metaProbe.remove();
        const style = getComputedStyle(header);
        const available = header.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        header.classList.toggle('header-wrapped', titleWidth + number.scrollWidth + metaWidth + 24 > available);
    }
    function observeVersionHeader(header) {
        updateVersionHeader(header);
        versionHeaderObserver.observe(header);
    }
    function renderCurrentPageDOM() {
        // 分页/语言更新时清理旧观察目标，避免保留已移除卡片。
        versionHeaderObserver.disconnect();
        const container = document.getElementById('timeline-container');
        container.innerHTML = '';

        const pageData = pagedGroups[currentPage - 1] || [];

        if (pageData.length === 0) {
            container.innerHTML = `<div style="color:var(--cl-text-dim); text-align:center; padding:40px 0;">${window.getTrans('cl_empty_tip')}</div>`;
            return;
        }

        const linesUnit = window.getTrans('cl_lines_unit');
        const tooltipVisual = window.getTrans('cl_tooltip_visual_line');
        const btnCopyText = window.getTrans('cl_btn_copy');
        const btnDownloadText = window.getTrans('cl_btn_download_part');

        pageData.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'log-card';
            card.dataset.version = item.version;

            const partHtml = item.isPart ? `<span class="ver-part-badge">${item.partStr}</span>` : '';
            
            // 兼容不管是写成 item.rollback 还是 item.forward
            // 兼容旧的 rollback 字段或新的 channel 字段
            // 🌟 按钮渲染逻辑
            // 🌟 1. 按钮与当前版本指示器渲染
            const navConfig = item.channel || item.rollback || item.forward;
            let actionBtnHtml = '';

            if (navConfig && navConfig.enabled && navConfig.path) {
                let targetVer = navConfig.targetVer || inferVersionFromPath(navConfig.path);
                targetVer = String(targetVer || 'latest').replace(/^v/, '');

                const isCurrentThisVer = isCurrentVersion(targetVer);

                // 场景 A：命中当前运行的版本 -> 显示《当前版本》提示标签
                if (isCurrentThisVer) {
                    const currentBadgeText = window.getTrans ? window.getTrans('cl_current_ver_badge') : '📌 当前版本';
                    actionBtnHtml = `
                        <span class="card-btn" style="cursor: default; border-color: rgba(255, 255, 255, 0.15); color: var(--cl-text-dim); background: rgba(255, 255, 255, 0.03); font-weight: 600; user-select: none;">
                            ${escapeHtml(currentBadgeText)}
                        </span>
                    `;
                } 
                // 场景 B：非当前版本 -> 显示切换/前往按钮
                else {
                    const isToLatest = (targetVer === 'latest' || targetVer === '0.2');
                    const icon = isToLatest ? '⏩' : '⏪';

                    // 统一使用蓝色主题色
                        const btnColor = '#007bff';
                        const btnBg = 'rgba(0, 123, 255, 0.08)';
                        const btnHoverBg = 'rgba(0, 123, 255, 0.2)';
                    
                    let defaultText = isToLatest ? '前往最新版本' : `前往 v${targetVer} 版本`;
                    if (window.getTrans) {
                        defaultText = isToLatest 
                            ? (currentLang === 'zh' ? '前往最新版本' : 'Switch to Modern') 
                            : window.getTrans('cl_switch_to_ver').replace('{ver}', targetVer);
                    }
                    const btnText = escapeHtml(navConfig.text || defaultText);

                    actionBtnHtml = `
                        <a href="${getVersionHomeUrl(targetVer, navConfig.path)}" data-channel="${escapeHtml(targetVer)}" class="card-btn" style="text-decoration: none; border-color: ${btnColor}; color: ${btnColor}; background: ${btnBg}; font-weight: bold;" onmouseover="this.style.background='${btnHoverBg}'" onmouseout="this.style.background='${btnBg}'">
                            <span>${icon}</span> <span>${btnText}</span>
                        </a>
                    `;
                }
            }

            // 2. 纯净文本裁剪
            const cleanContent = (item.content || '').replace(/^[\r\n\s]+|[\r\n\s]+$/g, '');

            // 在 renderCurrentPageDOM 遍历 item 时：
const hasCustomTitle = !!(item.title && item.title.trim());
const displayTitle = hasCustomTitle ? item.title.trim() : item.version;
const subVerHtml = hasCustomTitle ? `<span class="ver-sub-badge">${escapeHtml(item.version)}</span>` : '';
const tagHtml = formatTagsHtml(item.tag);

card.innerHTML = `
    <div class="card-header">
        <span class="ver-main-title">${escapeHtml(displayTitle)}</span>
        <div class="ver-number">${subVerHtml}</div>
        <div class="ver-meta">
            <span>📅 ${escapeHtml(item.date)}</span>
            <span>👤 ${escapeHtml(item.author || 'Dev')}</span>
            <span title="${tooltipVisual}">📏 ${item.lineCount} ${linesUnit}</span>
        </div>
        <div class="ver-tags-row">${tagHtml}${partHtml}</div>
    </div>
    <div class="card-body"><div class="card-text">${escapeHtml(cleanContent)}</div></div>
    <div class="card-actions">
        <div class="card-actions-left">
            ${actionBtnHtml}
        </div>
        <div class="card-actions-right">
            <button class="card-btn" onclick="copyVersionText(${idx})">
                <span>📋</span> <span>${btnCopyText}</span>
            </button>
            <button class="card-btn" onclick="downloadSingleVersionTxt(${idx})">
                <span>⬇️</span> <span>${btnDownloadText}</span>
            </button>
        </div>
    </div>
`;
            container.appendChild(card);
            observeVersionHeader(card.querySelector('.card-header'));
        });

        // 真实折行数量精准校准（末尾行数同样读取 getTrans）
        requestAnimationFrame(() => {
            const cardTexts = document.querySelectorAll('.card-text'); // 🌟 改为测量纯文本区
            cardTexts.forEach(textEl => {
                const range = document.createRange();
                range.selectNodeContents(textEl);
                const rects = range.getClientRects();
                let actualLines = 0;
                let lastBottom = -999;
                for (let i = 0; i < rects.length; i++) {
                    if (rects[i].width === 0 && rects[i].height === 0) continue;
                    if (Math.abs(rects[i].bottom - lastBottom) > 4) {
                        actualLines++;
                        lastBottom = rects[i].bottom;
                    }
                }
                if (actualLines > 0) {
                    const lineBadge = textEl.closest('.log-card').querySelector('.ver-meta span:last-child');
                    if (lineBadge) {
                        lineBadge.innerText = `📏 ${actualLines} ${window.getTrans('cl_lines_unit')}`;
                    }
                }
            });
        });
    }

    // ==========================================
    // 🌟 底部翻页提示语多语言化
    // ==========================================
    function renderPaginationControls() {
        const ctrl = document.getElementById('pagination-controls');
        const tip = document.getElementById('pagination-tip');
        ctrl.innerHTML = '';

        const totalPages = pagedGroups.length;
        if (totalPages <= 1) {
            tip.innerText = window.getTrans('cl_total_ver_tip').replace('{total}', getRawVersionList().length);
            return;
        }

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerText = '‹';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderCurrentPageDOM(); renderPaginationControls(); } };
        ctrl.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const numBtn = document.createElement('button');
            numBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            numBtn.innerText = i;
            numBtn.onclick = () => { currentPage = i; renderCurrentPageDOM(); renderPaginationControls(); };
            ctrl.appendChild(numBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerText = '›';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderCurrentPageDOM(); renderPaginationControls(); } };
        ctrl.appendChild(nextBtn);

        tip.innerText = window.getTrans('cl_page_tip')
            .replace('{cur}', currentPage)
            .replace('{total}', totalPages);
    }

    // ==========================================
    // 4. TXT 生成下载与文本复制
    // ==========================================
    function downloadTxtFile(filename, textContent) {
        const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ==========================================
    // 🌟 下载与复制 Toast 提示多语言化
    // ==========================================
    window.downloadSingleVersionTxt = function(indexInPage) {
        const pageData = pagedGroups[currentPage - 1];
        if (!pageData || !pageData[indexInPage]) return;
        const item = pageData[indexInPage];

        const safeVerName = item.version.replace(/[\\/:*?"<>| ]/g, '_');
        const filename = `Changelog_${safeVerName}_(${currentLang}).txt`;

        const headerInfo = `========================================\n`
            + `Version: ${item.version}\n`
            + `Release Date: ${item.date}\n`
            + `Tag: ${item.tag || 'N/A'}\n`
            + `Author: ${item.author || 'Dev'}\n`
            + `========================================\n\n`;

        const fullText = headerInfo + (item.fullContent || item.content);
        downloadTxtFile(filename, fullText);
        
        showToast(window.getTrans('cl_toast_download_single').replace('{ver}', item.version));
    };

    window.downloadFullChangelogTxt = function() {
        const rawList = getRawVersionList();
        if (!rawList || rawList.length === 0) return;

        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `GachaSystem_Full_Changelog_${currentLang}_${dateStr}.txt`;

        let combinedText = `====================================================\n`
            + ` Gacha System - Version Update Logs & Roadmap (${currentLang.toUpperCase()})\n`
            + ` Generated: ${new Date().toLocaleString()}\n`
            + `====================================================\n\n`;

        rawList.forEach((item) => {
            combinedText += `----------------------------------------------------\n`
                + `[Version]: ${item.version}  |  [Date]: ${item.date}  |  [Tag]: ${item.tag || ''}\n`
                + `----------------------------------------------------\n`
                + `${item.content}\n\n`;
        });

        downloadTxtFile(filename, combinedText);
        showToast(window.getTrans('cl_toast_download_full'));
    };

    window.copyVersionText = function(indexInPage) {
        const pageData = pagedGroups[currentPage - 1];
        if (!pageData || !pageData[indexInPage]) return;
        const text = pageData[indexInPage].fullContent || pageData[indexInPage].content;

        navigator.clipboard.writeText(text).then(() => {
            showToast(window.getTrans('cl_copy_success'));
        }).catch(() => {
            showToast(window.getTrans('cl_copy_fail'));
        });
    };

    function onLineLimitChanged(val) {
        lineLimitPerPage = [150, 300, 500, 1000].includes(Number(val)) ? Number(val) : 300;
        localStorage.setItem('GM_Changelog_Line_Limit', String(lineLimitPerPage));
        currentPage = 1;
        buildAndRenderPages();
    }

    // 更新日志保留原来的纯文本及 show 类动画，只共用提示计时器。
    window.showToast = Toast.create({
        target: 'cl-toast',
        mode: 'class',
        duration: 1800
    }).show;

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

function getVersionDirectory(version) {
    const normalized = String(version || '').replace(/^v/, '');
    const configured = window.GACHA_VERSION_CHANNELS[normalized];
    return configured ? configured.directory : '';
}

function inferVersionFromPath(path) {
    const match = String(path || '').match(/(?:^|\/)v?(\d+(?:\.\d+)*)\s+old\//i);
    return match ? match[1] : (path === 'index.html' ? 'latest' : 'latest');
}

function isCurrentVersion(version) {
    const normalized = String(version || '').replace(/^v/, '');
    return window.GACHA_ACTIVE_VERSION === (normalized === 'latest' ? window.GACHA_LATEST_VERSION : normalized);
}

function getVersionHomeUrl(version, legacyPath) {
    const directory = getVersionDirectory(version);
    if (directory) return `${directory}index.html`;
    // The root site is always the current release.  Retain a non-home legacy URL
    // only when no version metadata was provided.
    return version === 'latest' || version === window.GACHA_LATEST_VERSION || !legacyPath ? 'index.html' : legacyPath;
}

function applyChangelogLayout() {
    const savedLayout = localStorage.getItem('GM_Changelog_Layout');
    document.documentElement.setAttribute('data-layout', ['center', 'left', 'right', 'full'].includes(savedLayout) ? savedLayout : 'center');
}

function getSidebarChannelUrl(href) {
    const directory = window.GACHA_CHANNEL_BASE;
    if (!directory || !href || /^(?:#|[a-z]+:|\/|\.\.\/)/i.test(href) || href.startsWith(directory)) return href;
    return directory + href;
}

// 侧栏在折叠、排序或修改后可能重新生成链接；点击时也保证使用所选通道。
document.addEventListener('click', event => {
    const link = event.target.closest('.sidebar a[href]');
    if (link) link.setAttribute('href', getSidebarChannelUrl(link.getAttribute('href')));
}, true);

function applyChannelEnvironment() {
    const homeBtn = document.getElementById('back-home-btn');
    const titleGroup = document.querySelector('.title-group h1');
    const activeVer = window.GACHA_ACTIVE_VERSION;
    const isLatest = window.GACHA_IS_LATEST;

    // 离开共用更新日志页时，首页与侧栏始终进入当前发布版本。
    if (homeBtn) {
        homeBtn.onclick = () => { window.location.href = getVersionHomeUrl('latest'); };
    }

    // B. Mark the active shell, without hard-coding the root release number.
    if (titleGroup && !document.getElementById('channel-status-badge')) {
        const badge = document.createElement('span');
        badge.id = 'channel-status-badge';
        badge.style.cssText = 'font-size:12px;padding:3px 8px;border-radius:6px;font-weight:bold;margin-left:10px;display:inline-flex;align-items:center;vertical-align:middle;';
        badge.style.background = isLatest ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 193, 7, 0.15)';
        badge.style.color = isLatest ? '#10b981' : '#ffc107';
        badge.style.border = `1px solid ${isLatest ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`;
        badge.innerText = isLatest ? '当前通道：当前版本' : `当前通道：v${activeVer} 旧版环境`;
        titleGroup.appendChild(badge);
    }

    // 侧栏显示的是当前通道的数据，链接必须进入同一版本的页面。
    document.querySelectorAll('.sidebar a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        if (href) link.setAttribute('href', getSidebarChannelUrl(href));
    });
}

// ==========================================
// 🌟 右侧版本目录 (TOC) 与多通道控制逻辑
// ==========================================

// 1. 折叠 / 展开状态控制
function toggleToc(collapsed) {
    const sidebar = document.getElementById('toc-sidebar');
    const expandBtn = document.getElementById('toc-expand-btn');
    if (collapsed) {
        sidebar.classList.add('collapsed');
        expandBtn.classList.add('show');
        localStorage.setItem('GM_Changelog_TOC_Collapsed', '1');
    } else {
        sidebar.classList.remove('collapsed');
        expandBtn.classList.remove('show');
        localStorage.setItem('GM_Changelog_TOC_Collapsed', '0');
    }
}

function renderTocSidebar() {
    const rawList = getRawVersionList();
    const listEl = document.getElementById('toc-version-list');
    const countEl = document.getElementById('toc-ver-count');
    const channelsEl = document.getElementById('toc-channel-list');
    if (!listEl || !channelsEl) return;

    countEl.innerText = rawList.length;
    listEl.innerHTML = '';

    // A. 渲染版本目录：显示版本标题，若无标题直接使用版本号
    rawList.forEach((item) => {
        const li = document.createElement('li');
        const displayTitle = (item.title && item.title.trim()) ? item.title.trim() : item.version;
        // 搜索关键词同时匹配标题与版本号
        const searchKeyword = `${item.version} ${item.title || ''}`.toLowerCase();
        li.setAttribute('data-ver', searchKeyword);

        li.innerHTML = `
            <a class="toc-item-link" onclick="jumpToVersion('${escapeHtml(item.version)}')" title="${escapeHtml(item.version)} - ${escapeHtml(displayTitle)}">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">
                    ${escapeHtml(displayTitle)}
                </span>
                <span style="font-size:11px; color:var(--cl-text-dim); flex-shrink: 0;">${escapeHtml(item.date || '')}</span>
            </a>
        `;
        listEl.appendChild(li);
    });

    // 所有旧通道由同一份配置生成，新增版本无需再维护另一份按钮清单。
    const channels = [
        { labelKey: 'cl_channel_modern', version: window.GACHA_LATEST_VERSION, path: 'index.html' },
        ...Object.entries(window.GACHA_VERSION_CHANNELS).map(([version, config]) => ({
            labelKey: config.labelKey, version, path: config.directory + 'index.html'
        }))
    ];

    channelsEl.innerHTML = '';
    channels.forEach(ch => {
        const isCurrent = isCurrentVersion(ch.version);
        const a = document.createElement('a');
        a.className = `toc-channel-btn ${isCurrent ? 'current' : ''}`;
        a.href = isCurrent ? 'javascript:void(0)' : getVersionHomeUrl(ch.version, ch.path);
        if (!isCurrent) {
            a.dataset.channel = ch.version;
        }

        const channelLabel = window.getTrans ? window.getTrans(ch.labelKey) : ch.labelKey;
        const statusText = isCurrent 
            ? (window.getTrans ? window.getTrans('cl_toc_badge_current') : '📌 当前')
            : (window.getTrans ? window.getTrans('cl_toc_badge_goto') : '➔ 前往');

        a.innerHTML = `
            <span>${escapeHtml(channelLabel)}</span>
            <span style="font-size:11px;">${escapeHtml(statusText)}</span>
        `;
        channelsEl.appendChild(a);
    });

    if (localStorage.getItem('GM_Changelog_TOC_Collapsed') === '1') {
        toggleToc(true);
    }
}

// 3. 实时搜索过滤
function onTocSearch(keyword) {
    const q = keyword.trim().toLowerCase();
    const items = document.querySelectorAll('#toc-version-list li');
    items.forEach(li => {
        const v = li.getAttribute('data-ver') || '';
        li.style.display = v.includes(q) ? '' : 'none';
    });
}

// 回车直接跳到搜索结果第 1 个匹配项
function onTocSearchKeydown(e) {
    if (e.key === 'Enter') {
        const firstVisible = Array.from(document.querySelectorAll('#toc-version-list li'))
            .find(li => li.style.display !== 'none');
        if (firstVisible) {
            const link = firstVisible.querySelector('a');
            if (link) link.click();
        }
    }
}

// 4. 关键：跨分页的精准定位跳转
function jumpToVersion(targetVer) {
    // 查找该版本落在第几页
    let targetPageIndex = -1;
    for (let p = 0; p < pagedGroups.length; p++) {
        if (pagedGroups[p].some(item => item.version === targetVer)) {
            targetPageIndex = p + 1;
            break;
        }
    }

    if (targetPageIndex !== -1) {
        // 如果不在当前页，切页并重绘 DOM
        if (currentPage !== targetPageIndex) {
            currentPage = targetPageIndex;
            renderCurrentPageDOM();
            renderPaginationControls();
        }

        // DOM 渲染后平滑滚动到卡片位置并增加闪烁高亮提示
        requestAnimationFrame(() => {
            const cards = document.querySelectorAll('.log-card');
            for (let card of cards) {
                if (card.dataset.version === targetVer) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
                    card.style.borderColor = 'var(--cl-primary)';
                    card.style.boxShadow = '0 0 25px rgba(0, 123, 255, 0.6)';
                    setTimeout(() => {
                        card.style.borderColor = '';
                        card.style.boxShadow = '';
                    }, 1600);
                    break;
                }
            }
        });
    }
}
function formatTagsHtml(tagRaw) {
    if (!tagRaw) return '';
    const tags = Array.isArray(tagRaw) ? tagRaw : [tagRaw];
    let html = '';

    tags.forEach(t => {
        // 1. 如果是对象形式
        if (typeof t === 'object' && t !== null) {
            const scope = (t.scope || t.page || t.module || '').trim();
            
            // 规范化小标签为数组
            let rawTypes = t.type || t.kind || t.action || [];
            if (!Array.isArray(rawTypes)) {
                rawTypes = String(rawTypes).split(/[,，/、]/);
            }
            const types = rawTypes.map(x => String(x).trim()).filter(Boolean);

            if (scope && types.length > 0) {
                // 大标签 + 小标签组合（胶囊）
                const typesHtml = types.map(tp => `<span class="ver-tag-type">${escapeHtml(tp)}</span>`).join('');
                html += `
                    <span class="ver-tag-pill">
                        <span class="ver-tag-scope">${escapeHtml(scope)}</span>
                        ${typesHtml}
                    </span>
                `;
            } else if (scope) {
                // 只有大标签 -> 渲染为独立中标签
                html += `<span class="ver-tag-single">${escapeHtml(scope)}</span>`;
            } else if (types.length > 0) {
                // 只有小标签 -> 渲染为独立中标签
                types.forEach(tp => {
                    html += `<span class="ver-tag-single">${escapeHtml(tp)}</span>`;
                });
            }
        } 
        // 2. 如果是纯字符串形式（例如 "优化"、"预告"）
        else if (typeof t === 'string' && t.trim()) {
            const str = t.trim();
            // 兼容快捷斜杠/冒号写法，如 "版本页/补丁"
            if (str.includes('/') || str.includes(':') || str.includes('：')) {
                const parts = str.split(/[/：:]/);
                const scope = parts[0].trim();
                const typeList = parts.slice(1).join('/').split(/[,，/、]/).map(x => x.trim()).filter(Boolean);
                if (scope && typeList.length > 0) {
                    const typesHtml = typeList.map(tp => `<span class="ver-tag-type">${escapeHtml(tp)}</span>`).join('');
                    html += `
                        <span class="ver-tag-pill">
                            <span class="ver-tag-scope">${escapeHtml(scope)}</span>
                            ${typesHtml}
                        </span>
                    `;
                    return;
                }
            }
            // 普通纯文本 -> 渲染为独立中标签
            html += `<span class="ver-tag-single">${escapeHtml(str)}</span>`;
        }
    });

    return html;
}


window.addEventListener('storage', event => {
    if (event.key === 'GM_Changelog_Line_Limit') onLineLimitChanged(event.newValue);
    if (event.key === 'GM_Lang') applyChangelogLanguage(event.newValue || 'zh');
});
