# 绝区零图鉴补充（2026-10-26）

## 官方名称核对

- 挽昼 / Sunbringer：中文[代理人档案](https://zenless.hoyoverse.com/zh-cn/news/166997?catchSpider=1)，英文[代理人档案](https://www.hoyolab.com/article/47172159)，[英文官网角色列表](https://zenless.hoyoverse.com/en-us/main?catchSpider=1)。三位挽昼只登记一条角色候选。
- 知更鸟 / Robin：[官方代理人档案](https://www.hoyolab.com/article/47185723)。
- 卡芙卡 / Kafka：[官方代理人档案](https://www.hoyolab.com/article/47185592)。
- 菲欧妮 / Phoenix Reffaella：[官方英文档案](https://zenless.hoyoverse.com/en-us/news/166053?page=newslink)。
- 赛维里安 / Severian Lowell：[官方英文角色页](https://zenless.hoyoverse.com/en-us/character)。保留原中文主键和现有简称，避免拆散历史记录。
- 涅槃初翎 / Plume of Rebirth、禁罪囚笼 / Incarcerating Grip：[官方中文更新公告](https://zenless.hoyoverse.com/m/zh-cn/news/166963)，[官方英文版本介绍](https://www.hoyoverse.com/en-us/news/166759)。
- 夜色流光溢彩 / Flowing Nightglow：[星穹铁道官方 2.2 更新公告](https://www.hoyolab.com/article/28286762)。同时更正 HSR 数据库原来的 `Flowing Nightlow` 拼写。
- 只需等待 / Patience Is All You Need：[星穹铁道光锥跃迁公告](https://www.hoyolab.com/article/24375760)。

## 临时借用的音擎素材

| 条目 | 当前名称与英文 | 图片来源 | 状态 |
| --- | --- | --- | --- |
| 挽昼专属音擎 | 挽昼 音擎 / Sunbringer's W-Engine | ZZZ 涅槃初翎 | 名称与图片均为占位 |
| 知更鸟专属音擎 | 夜色流光溢彩 / Flowing Nightglow | HSR 同名光锥 | 暂借 HSR 名称、英文和图片 |
| 卡芙卡专属音擎 | 只需等待 / Patience Is All You Need | HSR 同名光锥 | 暂借 HSR 名称、英文和图片 |
| 赛维里安专属音擎 | 禁罪囚笼 / Incarcerating Grip | ZZZ 涅槃初翎 | 名称已核实，按要求暂借菲欧妮专属图片 |
| 菲欧妮专属音擎 | 涅槃初翎 / Plume of Rebirth | ZZZ 涅槃初翎 | 正式名称及图片 |

后续取得正式图片/音擎信息时更换上述借用条目。未添加技能、属性或未确认的抽卡机制，也未新增联动池。

## GIF 与旧缓存

`img/ZZZ/char/5/挽昼.gif` 是 256×250、51 帧的循环 GIF。`img` 元素直接引用原文件，图鉴、看板、模拟器可播放原动画；不要先转成静态 WebP/JPEG，也不要经过现有上传组件的 Canvas 压缩，否则会变成单帧。

`refreshCatalog: true` 只用于本次需要补充或更正的预设条目。公共读取层在内存中补齐这些条目、保留原 ID，不清空图鉴或写入玩家记录；图鉴页使用相同处理。更名音擎的 `aliases` 保留旧占位名的检索兼容，自建游戏不跟随预设更新。
