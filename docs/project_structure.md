# 项目目录详情

本目录帮助查找“要改哪个文件”。说明以当前文件职责为准，不代表部署文件清单。
开发输出、测试、工具、缓存与历史版本只说明文件夹用途，不展开内部文件。
图片按资源目录说明，不逐张列出。文件名保留现状，旧名称不在此批量重命名。

```text
Gacha System Update/
├─ AGENTS.md                       AI 工作规则与分类入口
├─ README.md                       项目简介、打开与发布方法、页面引用约定
├─ _redirects                      旧网址到当前页面的重定向规则
├─ wrangler.jsonc                  Cloudflare 正式站与测试站部署配置
├─ .assetsignore                  网站发布排除规则，排除开发目录与维护文档
├─ .gitignore                     Git 排除规则，排除临时输出与本机缓存
├─ .gitattributes                  固定 Windows 批处理脚本的 CRLF 换行格式
├─ upload.bat                      发布正式网站
├─ upload_test.bat                 发布测试网站
├─ upload_github.bat               上传代码到 GitHub
│
├─ html/                          当前版本的页面入口
│  ├─ index.html                   首页：介绍、游戏展示、版本摘要与联系入口
│  ├─ gallery_setup.html           图鉴配置页
│  ├─ pool_setup.html              卡池规则配置页
│  ├─ currency_setup.html          货币规则配置页
│  ├─ user_data.html               玩家数据页
│  ├─ simulator.html               抽卡模拟页
│  ├─ dashboard.html               抽卡结果、记录录入与统计页
│  ├─ settings.html                设置页
│  └─ changelog.html               版本更新详情与历史页
│
├─ pages/                         页面业务接线与页面专用交互
│  ├─ index.js                     首页侧栏初始化及账号弹窗等入口
│  ├─ home-assets.js               生成的首页游戏图标、背景资源清单
│  ├─ home-showcase.js             首页分屏导航、游戏展示与背景轮换
│  ├─ home-updates.js              首页更新摘要展开收起与按需滚动
│  ├─ home-privacy.js              首页隐私政策弹窗
│  ├─ home-email.js                首页及隐私政策中的复制邮箱操作
│  ├─ gallery_setup.js             图鉴物品、分类、标签与配置保存
│  ├─ gallery_ai.js                用户自有 AI 的图鉴提示词、模板与说明弹窗
│  ├─ gallery_bilingual.js         图鉴编辑字段的双语接线
│  ├─ gallery_economy.js           图鉴经济配置相关编辑逻辑
│  ├─ pool_setup.js                卡池规则编辑、候选预览与保存
│  ├─ pool_bilingual.js            卡池规则名称等双语字段接线
│  ├─ currency_setup.js            货币规则页面编辑与独立保存
│  ├─ user_data.js                 玩家资料、资源与进度页面操作
│  ├─ simulator.js                 抽卡模拟操作、结果与概率显示
│  ├─ dashboard.js                 历史记录、录入编辑与统计展示
│  ├─ settings.js                  偏好设置、本地备份与设置操作
│  ├─ start_page_picker.js         默认启动页选择界面
│  └─ changelog.js                 日志展示、搜索、分页与版本导航
│
├─ logic/                         公共数据处理、业务规则与存储
│  ├─ gacha_engine.js              概率、保底、UP、井兑换与赠送抽规则
│  ├─ game_data.js                 读取游戏预设与公共数据
│  ├─ catalog_utils.js             图鉴分类、检索、筛选与去重工具
│  ├─ pool_validation.js           卡池配置有效性检查
│  ├─ dashboard_validation.js      历史记录重放与规则检查
│  ├─ dashboard_accounts.js        按账号隔离录入记录并同步玩家资料
│  ├─ user_data_profiles.js        玩家账号、余额、持有与进度存档
│  ├─ user_data_tools.js           默认账号、旧记录接入与资料融合
│  ├─ simulator_economy.js         模拟器资源消耗、兑换与经济结算
│  ├─ simulator_session.js         模拟记录保存与恢复
│  ├─ simulator_start.js           模拟起点表单的数据与状态转换
│  ├─ preset_storage.js            官方预设配置缓存初始化
│  ├─ version_storage.js           版本存储隔离与首次继承
│  ├─ test_catalog.js              默认游戏与测试图鉴的显示策略
│  ├─ app_preferences.js           跨页面偏好读取与联动规则
│  ├─ list_order.js                按已保存的 ID 顺序排列列表
│  └─ import_export.js             JSON、ZIP 与图片的导入导出
│
├─ ui/                            公共界面组件、展示行为与样式
│  ├─ style.css                    全站基础样式
│  ├─ art-direction.css            全站主题配色与视觉风格
│  ├─ home.css                     首页布局、按钮与隐私弹窗样式
│  ├─ layout.js                    公共页面初始化、侧栏与主题语言状态
│  ├─ legacy_paths.js              历史版本已保存图片地址的兼容展示
│  ├─ quick_settings.js            快捷设置气泡与操作
│  ├─ dialog.js                    通用提示、确认弹窗与请求队列
│  ├─ toast.js                     通用短提示与显示计时
│  ├─ unsaved_changes.js           未保存修改检测与离开确认
│  ├─ cloud_unavailable.js         云端功能关闭提示
│  ├─ drag_sort.js                 通用拖拽排序交互
│  ├─ item_format.js               物品名称、简称、稀有度和标签展示
│  ├─ image_upload.js              本地图片读取、缩放与裁剪
│  ├─ icon_render.js               Emoji 与图片图标渲染
│  ├─ icon_picker.js               图标选择弹窗
│  ├─ icon_picker.css              图标选择器样式
│  ├─ color_style.js               纯色与渐变配色数据处理
│  ├─ color_picker.js              自定义配色弹窗
│  ├─ color_picker.css             配色弹窗样式
│  ├─ bilingual_input.js           双语字段编辑组件
│  ├─ bilingual_input.css          双语编辑组件样式
│  ├─ language_onboarding.js       首次语言引导与重新体验
│  ├─ language_onboarding.css      语言引导样式
│  ├─ select_ui.js                 通用自定义下拉选择控件
│  ├─ select_ui.css                下拉选择控件样式
│  ├─ number_input.js              数字输入控件交互
│  ├─ number_input.css             数字输入控件样式
│  ├─ state_toggle.js              通用状态开关
│  ├─ state_toggle.css             状态开关样式
│  ├─ preview_lock.js              预览锁定与只读状态展示
│  ├─ preset_visibility.js         默认图鉴显示选项
│  ├─ preset_visibility.css        默认图鉴显示选择器样式
│  ├─ page_layout.js               各页面布局偏好定义与控制
│  ├─ page_layout.css              页面布局相关样式
│  ├─ global_display.js            全局批量展示设置
│  ├─ panel_defaults.js            各级面板默认折叠行为
│  ├─ content_columns.js           分栏、分页与单面板展示交互
│  ├─ content_columns.css          分栏、分页与单面板展示样式
│  ├─ pool_rule_controls.js        多类卡池规则共用的启用条件控件
│  ├─ pool_rule_controls.css       规则条件控件样式
│  ├─ resource_exchanges.js        模拟器与玩家数据共用的资源兑换界面
│  ├─ gallery_economy.css          图鉴经济配置相关样式
│  ├─ dashboard_accounts.css       结果看板账号区域样式
│  ├─ gold_ordinal.js              结果看板出金序号展示
│  ├─ gold_ordinal.css             结果看板出金序号样式
│  ├─ simulator_gold_ordinal.js    模拟器累计出金序号与定位交互
│  ├─ simulator_gold_ordinal.css   模拟器出金序号样式
│  ├─ simulator_header.css         模拟器顶栏与操作区域样式
│  ├─ simulator_layout.js          窄窗口模拟器布局与吸顶区域
│  ├─ simulator_data_picker.js     模拟器玩家数据选择入口
│  ├─ simulator_start.js           模拟起点设置界面
│  ├─ simulator_wallet.js          模拟器余额与资源管理界面
│  ├─ simulator_wallet.css         余额与资源管理界面样式
│  ├─ user_data_accounts.js        玩家账号管理界面
│  ├─ user_data_merge.js           玩家资料融合预览与确认
│  └─ user_data.css                玩家数据页样式
│
├─ translate/                     中英文文案、日志与语言切换
│  ├─ translate.js                 翻译应用与语言辅助逻辑
│  ├─ translate_zh.js              中文界面词条、当前版本与首页更新摘要
│  ├─ translate_en.js              英文界面词条、当前版本与首页更新摘要
│  ├─ changelog_zh.js              中文详细版本日志与通道入口
│  └─ changelog_en.js              英文详细版本日志与通道入口
│
├─ Preset_Data/                   游戏预设与预设维护资料
│  ├─ db_hsr.js                    崩坏：星穹铁道预设
│  ├─ db_zzz.js                    绝区零预设
│  ├─ db_ark.js                    明日方舟预设
│  ├─ db_end.js                    明日方舟：终末地预设
│  ├─ db_test.js                   测试专用图鉴预设（网站功能资源）
│  ├─ 模板.js                      预设数据模板
│  ├─ item_id_registry.json        物品固定 ID 登记表
│  ├─ ITEM_IDS.md                  固定 ID 维护说明
│  ├─ CURRENCY_SOURCES.md          货币预设数据来源说明
│  ├─ TEST_CATALOG.md              测试专用图鉴维护说明
│  └─ zzz_catalog_sources.md       绝区零图鉴数据来源说明
│
├─ img/                           网站图片与图标资源，不逐张展开
│  ├─ ARK/                        明日方舟图片，含星级分组与 icon 图标
│  ├─ END/                        终末地图片，含 char、weapon、icon
│  ├─ HSR/                        星穹铁道图片，含 char、weapon、icon
│  ├─ ZZZ/                        绝区零图片，含 char、weapon、bangboo、icon
│  ├─ TEST/                       测试图鉴所用图标资源
│  └─ OTHER/                      其他共用图片，含 index 首页背景
│
├─ docs/                          项目说明与工作规则
│  ├─ project_structure.md         本目录详情
│  └─ agent_rule/                  按任务分类的长期工作规则
│     ├─ general.md               命名、规则维护与重复逻辑提醒
│     ├─ changelog.md             版本日志、日期、标签与最新通道规则
│     ├─ translate.md             中英文翻译与词条同步规则
│     ├─ toast.md                 确认操作后的完成提示规则
│     ├─ upload.md                正式站、测试站与 GitHub 上传范围规则
│     └─ project_structure.md     目录文档维护规则
│
├─ dev/                           开发资料统一目录，整个目录不发布到网站
│  ├─ output/                     临时预览、截图与验证产物，不提交 GitHub，不展开
│  ├─ tests/                      自动化测试，保留在 GitHub，不展开
│  └─ tools/                      本地预览与资源生成工具，保留在 GitHub，不展开
├─ old_version/                   网站历史版本
│  ├─ 0.0/                        0.0 历史版本归档，不展开
│  ├─ 0.1/                        0.1 历史版本归档，不展开
│  └─ 0.2/                        0.2 历史版本归档，不展开
├─ .wrangler/                     Cloudflare 开发部署缓存，不展开
└─ .git/                          Git 版本管理数据，不展开
```

## 查找方向

- 修改页面结构：先看 `html/`；修改该页面操作：看 `pages/`。
- 修改跨页面的数据或计算规则：看 `logic/`；修改公共控件与外观：看 `ui/`。
- `pages/simulator.js` 负责页面流程，`logic/gacha_engine.js` 负责抽卡计算。
- `logic/simulator_start.js` 负责起点数据转换，`ui/simulator_start.js` 负责起点界面。
- `translate/changelog_*.js` 是详细日志，`translate/translate_*.js` 中的版本词条是首页摘要。
- `dev/tests/` 是开发测试；`Preset_Data/db_test.js` 与 `img/TEST/` 是网站里的测试图鉴资源，两者不同。
- `pages/home-assets.js` 是生成清单，资源维护先参考开发工具的说明，不直接手改生成内容。

## 维护与发布边界

目录或文件新增、删除、移动、重命名、职责变化时，在同一次任务内同步本页。
只改文案、样式数值或函数细节且职责未变时，不必重写目录。
维护细则见 [目录维护规则](agent_rule/project_structure.md)。

“不展开”只是此文档的展示方式，不代表这些文件已经被部署工具排除。
实际发布范围需以部署配置、实际生效的忽略规则和上传流程为准。
当前 `.assetsignore` 只允许网站目录与路由文件；历史页面和图片仍用于网站访问，历史目录内的测试和开发文档也排除。发布归类见 [上传规则](agent_rule/upload.md)。
`.gitignore` 排除 `dev/output/` 与按需创建的 `dev/local/`；测试与工具仍可提交 GitHub。
