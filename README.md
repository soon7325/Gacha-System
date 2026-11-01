# Gacha System

## 文件结构

| 位置 | 用途 |
| --- | --- |
| `html/` | 当前版本的全部 HTML 页面，首页为 `html/index.html` |
| `pages/` | 各页面的 JavaScript 逻辑 |
| `logic/` | 数据、规则、存储等公共逻辑 |
| `ui/` | 公共界面组件和 CSS 样式 |
| `Preset_Data/` | 游戏预设数据 |
| `translate/` | 翻译内容与语言切换 |
| `img/` | 图片资源 |
| `0.0 old/`、`0.1 old/`、`0.2 old/` | 历史版本 |
| `_redirects` | Cloudflare 的旧网址兼容规则 |
| `wrangler.jsonc` | Cloudflare 部署配置 |
| `.assetsignore` | 正式版与测试版共用的 Cloudflare 资源上传规则 |

## 打开与上传

- 本地预览：打开 `html/index.html`，或从项目根目录启动静态服务器后访问 `/html/index.html`。
- 上传代码到 GitHub：双击 `upload_github.bat`。
- 发布正式网站：双击 `upload.bat`。
- 发布测试网站：双击 `upload_test.bat`。

GitHub 上传与 Cloudflare 网站发布是两个独立操作。重新发布网站后，原来的 `/`、`/index.html`、`/settings.html` 等入口会跳转到 `html/` 中的页面，并保留查询参数。

正式版与测试版部署只上传 `.assetsignore` 中允许的网站资源目录，保留三个历史版本目录。Git 数据、本地缓存、环境变量文件、上传脚本、开发配置与 Markdown 文档不会作为网站资源发布；`_redirects`、`_headers` 仍由 Wrangler 读取并应用。新增根目录资源文件夹时，需要在 `.assetsignore` 中加入允许规则。排除规则缺失时，两份部署脚本都会停止上传。

## 修改页面引用

`html/` 中的页面在资源标签之前设置了 `<base href="../">`，所以相对引用统一以项目根目录为基准：

- 样式与脚本继续使用 `ui/style.css`、`pages/index.js` 等路径。
- 图片继续使用 `img/...`，预设数据与已保存的图片路径无需迁移。
- 当前版本页面链接使用 `html/settings.html`、`html/dashboard.html?gameId=...` 等路径。
- 页内链接应带上页面路径，例如 `html/index.html#games`；脚本中解析相对页面链接时使用 `document.baseURI`。
- 新增页面时，如需兼容根目录下的旧网址，在 `_redirects` 中添加对应规则。

`_redirects` 由 Cloudflare 处理；普通本地静态服务器和 GitHub Pages 不会自动应用这些规则。
