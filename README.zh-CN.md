# 🎬 Awesome AI Video Prompts

**两层结构：90 条手工撰写的提示词（同一场景在 9 个模型上的原生写法对照），加上 655 条从开源库导入、带完整出处与授权的提示词。附零依赖 CLI：跨模型翻译 + 校验。**

[![Website](https://img.shields.io/badge/website-freecreate.app-ff5c8a?style=flat-square&logo=safari&logoColor=white)](https://freecreate.app)
[![Curated](https://img.shields.io/badge/curated-90-f97316?style=flat-square)](prompts/generated.json)
[![Imported](https://img.shields.io/badge/imported-655-06b6d4?style=flat-square)](prompts/library.json)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

[English README →](README.md) · [🌐 在线浏览](https://manallen.github.io/awesome-ai-video-prompts/)

## 为什么做这个

GitHub 上的"提示词合集"绝大多数是：一个人用一种写法，复制粘贴到所有模型。
**这不管用，因为模型要的根本不是同一样东西**：

- Veo 3.1 会自动生成同步音频。不说"不要音乐"，它就自己加配乐。
- HappyHorse 1.0 超过约 55 词就开始稀释主体。Seedance 的提示词直接粘贴过去，主体就没了。
- Kling 3.0 读的是分块标签。压成散文，运镜指令就消失。
- Wan 2.7 把声音当作一等公民。不写 `Sound`，自动生成 BGM。
- Sora 2 的分层结构很好 —— 但 API 已于 **2026-09-24 关闭**，网上大量教程已失效。

本仓库用两层来回答：

**第一层 ·  curated（原创）**：每个场景一个文件，9 个模型各一份原生写法，并排对照。

**第二层 · imported（导入）**：655 条来自 3 个 MIT 开源库，每条保留来源、授权、原始署名，以及上游自己的置信度分级 —— 不改写、不升格。

## 🚀 快速开始

```bash
git clone https://github.com/manallen/awesome-ai-video-prompts.git
cd awesome-ai-video-prompts

# 原创层
node bin/cli.mjs list --models
node bin/cli.mjs show scene-10-wuxia-duel --model kling-3.0
node bin/cli.mjs search "雨夜 人像"

# 导入层
node bin/cli.mjs library                    # 来源 / 模型族 / 置信度统计
node bin/cli.mjs find "rain neon" --limit 5
node bin/cli.mjs find "产品" --family kling
node bin/cli.mjs get "lanshu-video-kit::sd-001"
node bin/cli.mjs credits                    # 全部署名

# 站点
npm run build:site && npm run site          # → http://127.0.0.1:8080
```

作为库使用（零运行时依赖）：

```js
import {
  search, promptFor, translate, validate,      // 原创层
  searchLibrary, libraryRecord, libraryIndex,  // 导入层
} from "awesome-ai-video-prompts";

searchLibrary("王家卫", { family: "seedance" });
libraryRecord("lanshu-video-kit::sd-001").upstreamCredit;
```

## 📚 第一层 · 十个场景

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

每个场景文件包含 `anchor`（七项不变量）和 9 个模型的提示词，每份带一句 `notes`。**anchor 是不变量**：两个模型的 diff 只反映方言差异，不反映创意差异。

## 🗃 第二层 · 导入库

| 来源 | 仓库 | 授权 | 条数 |
|---|---|---|---:|
| lanshu-awesome-ai-video-kit | [cclank](https://github.com/cclank/lanshu-awesome-ai-video-kit) | MIT | 584 |
| awesome-seedance | [ZeroLu](https://github.com/ZeroLu/awesome-seedance) | MIT | 24 |
| awesome_sora2_prompt | [zhangchenchen](https://github.com/zhangchenchen/awesome_sora2_prompt) | MIT | 47 |

模型族分布：seedance 155 · happyhorse 100 · sora 83 · kling 82 · veo 40 · minimax 38 · runway 24 · wan 23 · hunyuan 22 · jimeng 22 · pika 22 · 其他 52。

**每条记录保留**：来源 ID / 仓库 URL / 授权 / 上游 ID / 原始署名 / 原始 URL / 上游置信度分级 / 上游模型字符串（逐字）。模型族与版本号是**派生**的，与原始字符串并存，不替代。

导入流程：

```text
data/snapshots/  ← 提交入库的上游原始字节（可离线复现，可审计）
       │
       ├─ 授权闸门：仅接受 MIT / Apache-2.0 / CC0-1.0 / CC BY 4.0
       ├─ 解析：标题 / 代码围栏 / 中文「提示词」标签
       ├─ 质量闸门：占位符、HTML、纯 URL、过短、重复 → 拒绝并记录原因
       ▼
prompts/library.json + prompts/library-report.json
```

被拒绝 26 条，**每条都写明原因**，不静默丢弃。构建确定：连跑两次输出字节相同，因此 CI 可以断言提交产物是最新的。

**考虑过但未导入**（详见 [ATTRIBUTION.md](ATTRIBUTION.md)）：songguoxs/awesome-video-prompts（无 LICENSE）、gpt-image2/awesome-gptimage2-prompts（无 LICENSE）、itgoyo/awesome-gpt-image2-prompt（无 LICENSE）、YouMind-OpenLab 与 freestylefly（有授权但为图像提示词，超出范围）。

## 🔁 跨模型翻译

```bash
aivp translate sora-2 kling-3.0 ./my-prompt.txt   # 分块 → 分块：完全确定性
aivp translate sora-2 wan-2.7  ./my-prompt.txt    # 分块 → 四段式
aivp translate sora-2 veo-3.1  ./my-prompt.txt    # 补上 Dialogue/Audio 抑制
```

**能力边界**：分块标签之间是可确定映射；**散文源原样返回并警告**（没有规则能把一段散文映射成 `Characters:`/`Action:`/`Camera:`）；缺失字段**省略并报告**，绝不编造。

## ✅ 校验

```bash
aivp validate kling-3.0 prompt.txt
aivp validate --all          # 全库门禁：0 error，0 warning
```

检查项：模板占位符残留、四类矛盾约束、导演风格堆叠、标签缺失、长度越界、音频模型无音频指令、图生视频无保留条款、动作迁移未指定参考视频、已下线模型。

## 📜 署名与合规

原创场景为本项目 MIT 授权作品。导入提示词保留上游授权与署名，`aivp credits` 可列出全部。若你是上游作者并希望移除某条记录，请提交 issue 并注明 `sourceId` 与 `upstreamId`。

## 📌 范围与限制

**这是**：跨模型提示词参考 + 带出处的语料 + 结构性提示词工具。
**这不是**：帧级可复现保证；美学"最佳"；厂商文档替代品；对每条导入提示词的背书（`upstreamTier` 原样可见正是为此）。
**已知缺口**：Kling `Audio & Style` 未拆分声音与风格；Wan 多镜头时间戳按散文处理；Seedance `@图像1` 原样透传未校验；导入提示词只做存储规范化，不强制跑校验器。

## 🔗 链接

| | |
|---|---|
| 🌐 在线浏览 | [manallen.github.io/awesome-ai-video-prompts](https://manallen.github.io/awesome-ai-video-prompts/) |
| 🌐 产品 | **[freecreate.app](https://freecreate.app)** |
| 🎬 视频工作台 | [视频](https://freecreate.app/video) · [图生视频](https://freecreate.app/image-to-video-generator) · [动作控制](https://freecreate.app/motion-control-ai) |
| 🖼 图片工具 | [freecreate.app/image-tools](https://freecreate.app/image-tools) |
| 📖 翻译指南 | [docs/PROMPT-TRANSLATION.md](docs/PROMPT-TRANSLATION.md) |

**MIT** · 由 [FreeCreate](https://freecreate.app) 维护
