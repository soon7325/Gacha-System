# Gacha System

## 文件结构

完整的带用途说明目录树见 [项目目录详情](docs/project_structure.md)。源码逐项说明；测试、输出、工具和历史目录只介绍整体用途。

| 位置 | 用途 |
| --- | --- |
| `html/` | 当前版本的全部 HTML 页面，首页为 `html/index.html` |
| `pages/` | 各页面的 JavaScript 逻辑 |
| `logic/` | 数据、规则、存储等公共逻辑 |
| `ui/` | 公共界面组件和 CSS 样式 |
| `Preset_Data/` | 游戏预设数据 |
| `translate/` | 翻译内容与语言切换 |
| `img/` | 图片资源 |
| `old_version/0.0/`、`old_version/0.1/`、`old_version/0.2/` | 历史版本 |
| `dev/` | 开发测试、工具与临时输出；不发布到网站 |
| `.gitignore` | Git 排除规则，临时输出不上传 GitHub |
| `.assetsignore` | Cloudflare 静态资源排除规则 |
| `_redirects` | Cloudflare 的旧网址兼容规则 |
| `wrangler.jsonc` | Cloudflare 部署配置 |

## 打开与上传

直接在当前编辑目录运行下列脚本，无需复制到另一个发布目录。大版本归档由你手动整理到 `old_version/<版本号>/`。

- 本地预览：打开 `html/index.html`，或从项目根目录启动静态服务器后访问 `/html/index.html`。
- 上传代码到 GitHub：双击 `upload_github.bat`。
- 发布正式网站：双击 `upload.bat`。
- 发布测试网站：双击 `upload_test.bat`。
- 开发预览服务器：运行 `node dev/tools/preview.cjs`，访问其地址下的 `/html/index.html`。

`dev/tests/` 与 `dev/tools/` 建议提交 GitHub，方便验证和维护；`dev/output/` 与按需创建的 `dev/local/` 存放临时或仅本机使用的内容，由 `.gitignore` 排除。整个 `dev/` 由 `.assetsignore` 排除，不作为网站资源发布。Git 已跟踪的文件不会仅因添加忽略规则自动退出版本管理。

GitHub 上传与 Cloudflare 网站发布是两个独立操作。重新发布网站后，原来的 `/`、`/index.html`、`/settings.html` 等入口会跳转到 `html/` 中的页面，并保留查询参数。

| 内容 | 正式 / 测试网站 | GitHub |
| --- | --- | --- |
| 当前网站源码、图片、预设、翻译、历史版本网站文件与路由 | 上传 | 上传 |
| 文档、规则、测试、工具、上传脚本、部署配置 | 不上传为网站资源 | 上传 |
| 临时输出、`dev/local/`、缓存、依赖、本地环境变量文件 | 不上传 | 不上传 |

网站范围由 `.assetsignore` 的允许列表控制，新建网站根目录或根文件时需要同步添加。`wrangler.jsonc` 用于部署设置，但不会作为网页文件公开。GitHub 脚本会停止跟踪已被忽略的文件，同时保留本地副本；旧提交内已有的内容不会因此消失。私人备份请放项目外或 `dev/local/`。维护约定见 [上传规则](docs/agent_rule/upload.md)。

## 修改页面引用

`html/` 中的页面在资源标签之前设置了 `<base href="../">`，所以相对引用统一以项目根目录为基准：

- 样式与脚本继续使用 `ui/style.css`、`pages/index.js` 等路径。
- 图片继续使用 `img/...`，预设数据与已保存的图片路径无需迁移。
- 当前版本页面链接使用 `html/settings.html`、`html/dashboard.html?gameId=...` 等路径。
- 页内链接应带上页面路径，例如 `html/index.html#games`；脚本中解析相对页面链接时使用 `document.baseURI`。
- 新增页面时，如需兼容根目录下的旧网址，在 `_redirects` 中添加对应规则。

`_redirects` 由 Cloudflare 处理；普通本地静态服务器和 GitHub Pages 不会自动应用这些规则。
