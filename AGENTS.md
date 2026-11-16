# 项目工作规则

## 使用方式
- 开始修改前读取本文件，以及 `docs/agent_rule/general.md`。
- 按任务读取下列分类规则；涉及多个类别时，读取所有对应文件。
- 当前用户明确要求优先；不要用旧规则覆盖用户刚修改的内容。

## 分类入口
| 任务 | 必读文件 |
| --- | --- |
| 新增、编辑或翻译版本日志，调整最新版本通道与版本摘要 | [changelog.md](docs/agent_rule/changelog.md) |
| 新增或修改中英文文案、语言词条、翻译 | [translate.md](docs/agent_rule/translate.md) |
| 新增或修改确认弹窗、操作结果提示、toast | [toast.md](docs/agent_rule/toast.md) |
| 命名、维护规则、发现跨页面重复逻辑 | [general.md](docs/agent_rule/general.md) |
| 上传脚本、网站发布范围、GitHub 忽略规则 | [upload.md](docs/agent_rule/upload.md) |
| 新增、删除、移动、重命名文件或改变职责，维护目录说明 | [project_structure.md](docs/agent_rule/project_structure.md) |

## 文件组织
- 分类规则统一放在 `docs/agent_rule/`，不使用 `agent-rule` 或 `agent-rules`。
- 每份规则文件不超过 300 行；接近上限时按主题拆分，并更新本入口。
- 同一条规则只在一个分类文件维护，其他地方引用，避免内容冲突。
- `AGENTS.md` 保留工具识别所需的标准名称，其余命名遵循通用规则。
