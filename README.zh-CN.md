# 🎬 Awesome AI Video Prompts

**同一组 10 个场景，用 9 个视频模型各自的方言原生写成 —— 外加一个零依赖的翻译与校验 CLI。**

[![Website](https://img.shields.io/badge/website-freecreate.app-ff5c8a?style=flat-square&logo=safari&logoColor=white)](https://freecreate.app)
[![Prompts](https://img.shields.io/badge/prompts-90-f97316?style=flat-square)](prompts/generated.json)
[![Models](https://img.shields.io/badge/models-9-8b5cf6?style=flat-square)](prompts/models.json)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=flat-square)](package.json)

[English README →](README.md)

## 为什么做这个

GitHub 上的"提示词合集"绝大多数是：一个人用一种写法，然后复制粘贴到所有模型。
**这不管用，因为模型要的根本不是同一样东西**：

- Veo 3.1 会自动生成同步音频。你不说"不要音乐"，它就自己加一段配乐。
- HappyHorse 1.0 超过约 55 词就开始稀释主体。Seedance 的提示词直接粘贴过去，主体就没了。
- Kling 3.0 读的是分块标签。压成一段散文，运镜指令就消失了。
- Wan 2.7 把声音当作一等公民。不写 `Sound`，它就自动生成 BGM。
- Sora 2 的分层结构很好 —— 但 API 已于 **2026-09-24 关闭**，网上大量教程已经失效。

本仓库每个场景一个文件，**每个模型都有一份原生写法的提示词**，并排放。你可以直接 diff 同一个镜头在九种方言里分别怎么说。

## 🚀 快速开始

```bash
git clone https://github.com/manallen/awesome-ai-video-prompts.git
cd awesome-ai-video-prompts

node bin/cli.mjs list                        # 10 个场景
node bin/cli.mjs show scene-10-wuxia-duel --model kling-3.0
node bin/cli.mjs search "雨夜 人像"
node bin/cli.mjs models --active             # 能力注册表
npm test                                     # 17 项测试
```

浏览器预览：

```bash
npm run build:site && npm run site
# → http://127.0.0.1:8080
```

作为库使用：

```js
import { search, promptFor, translate, validate } from "awesome-ai-video-prompts";

const [best] = search("liquid chrome abstract");
promptFor(best.scene.id, "kling-3.0").prompt;
translate({ prompt: mySoraPrompt, from: "sora-2", to: "veo-3.1" });
validate(myPrompt, "kling-3.0");
```

## 📚 十个场景

| # | 场景 | 类别 | 考验什么 |
|---|------|------|----------|
| 01 | 奢侈品产品英雄镜头 | 产品广告 | 玻璃折射、360° 环绕 |
| 02 | 意式浓缩微距 | 产品广告 | 双流合并、油脂花纹 |
| 03 | 人物肖像 | 肖像 | 面部稳定性、双光源 |
| 04 | 双人对话 | 叙事 | 抢话节奏、情绪转折 |
| 05 | 图生视频 | image-to-video | 保持原图 vs. 添加运动 |
| 06 | 动作迁移 | motion-control | 换人后的身份保持 |
| 07 | 滑板尖翻 | 运动 | 物理、四拍节奏 |
| 08 | 雪山日出延时 | 风景 | 三段式光线推进 |
| 09 | 液态金属 | 抽象 | 表面张力、还原回池 |
| 10 | 竹林武侠对决 | 武侠 | 中文语义、落地物理 |

每个场景文件包含 `anchor`（主体 / 场景 / 动作 / 情绪 / 运镜 / 声音 / 光线七项不变量）和九个模型的提示词，每份都带一句 `notes` 说明该模型要特别注意什么。

## 🧠 五种格式家族

| 家族 | 模型 | 形状 | 写错的后果 |
|------|------|------|-----------|
| 分块标签 | Kling 3.0、Sora 2 ⏹ | `Scene:` / `Characters:` / `Action:` / `Camera:` / `Negative:` | 散文化会丢失运镜与排除项 |
| 四段式 | Wan 2.7 | `Entity:` / `Scene:` / `Motion:` / `Sound:` | 漏掉 `Sound` 自动生成 BGM |
| 散文 + 音频 | Veo 3.1 | 段落 + `Dialogue:` + `Audio:` | 不写 `no music` 会加配乐 |
| 八要素散文 | Seedance 2.0 | 单段密集描述 | 过长会失稳；一个镜头只给一种运镜 |
| 紧凑散文 | HappyHorse 1.0 | 30–55 词 | 超过约 60 词主体被稀释 |
| 克制散文 | Hailuo 02 | 1–3 句 | 堆砌形容词会降低物理准确度 |
| 指令式 | Gemini Omni | 祈使句、可迭代 | 写情绪而非可执行指令 |
| 散文 + 编辑动词 | Runway Gen-4.5 / Aleph | `add` / `remove` / `re-light` | 用生成语言做编辑任务 |

⏹ Sora 2 与 OpenAI Videos API 已于 2026-09-24 关闭，无一对一替代品；提示词保留作历史参考，可用 `aivp translate sora-2 veo-3.1` 迁移。

## 🔁 跨模型翻译

```bash
aivp translate sora-2 kling-3.0 ./my-prompt.txt
aivp translate sora-2 wan-2.7  ./my-prompt.txt
aivp translate sora-2 veo-3.1  ./my-prompt.txt
```

**能力边界，说清楚：**

- 分块标签 → 分块标签：完全确定性。标签本身就是语义。
- 散文源 → **原样返回并给出警告**。没有任何规则能把一段散文映射成 `Characters:`/`Action:`/`Camera:`；硬猜只会产出看起来可信的垃圾。
- 缺失字段 **省略并报告**，绝不凭空补全。

需要语义改写时，[docs/PROMPT-TRANSLATION.md](docs/PROMPT-TRANSLATION.md) 给了直接可用的 LLM 指令 —— 包括"返回 null，然后列出所有 null"这一句，正是它阻止模型用编造填补空白。

## ✅ 生成前先校验

```bash
aivp validate kling-3.0 prompt.txt
aivp validate --all          # 全库 CI 门禁
```

检查项：模板占位符残留、四类矛盾约束（4K+胶片颗粒、慢动作+高速、电影感+手持、"不要变焦"+推镜）、导演风格堆叠、标签缺失、长度越界、音频模型无音频指令、图生视频无保留条款、动作迁移未指定参考视频、已下线模型。

全库 90 条：**0 error，0 warning**。

## 📌 范围与限制

**这是：** 跨模型提示词参考 + 结构性提示词工具。提示词依据厂商文档的公式与通用提示工程实践编写。

**这不是：** 帧级可复现的保证；美学意义上的"最佳"; 厂商文档的替代品（模型行为随版本变化，`prompts/models.json` 带日期戳正是为此）。

**已知缺口：** Kling 的 `Audio & Style` 未拆分声音与风格；Wan 多镜头时间戳语法按散文处理；Seedance `@图像1` 引用原样透传未校验。

## 🔗 相关链接

| | |
|---|---|
| 🌐 产品 | **[freecreate.app](https://freecreate.app)** |
| 🎬 视频工作台 | [视频](https://freecreate.app/video) · [图生视频](https://freecreate.app/image-to-video-generator) · [动作控制](https://freecreate.app/motion-control-ai) |
| 🖼 图片工具 | [freecreate.app/image-tools](https://freecreate.app/image-tools) |
| 💡 特效库 | [freecreate.app/ai-effects](https://freecreate.app/ai-effects) |

**MIT** · 由 [FreeCreate](https://freecreate.app) 维护
