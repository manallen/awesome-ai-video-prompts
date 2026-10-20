# 🎬 Awesome AI Video Prompts

**两层结构：90 条手工撰写的提示词（同一场景在 9 个模型上的原生写法对照），加上 2509 条从 10 个开源库导入、带完整出处与授权的提示词。附零依赖 CLI：跨模型翻译 + 校验。**

[![Website](https://img.shields.io/badge/website-freecreate.app-ff5c8a?style=flat-square&logo=safari&logoColor=white)](https://freecreate.app)
[![Curated](https://img.shields.io/badge/curated-90-f97316?style=flat-square)](prompts/generated.json)
[![Imported](https://img.shields.io/badge/imported-2509-06b6d4?style=flat-square)](prompts/library.json)
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

**第二层 · imported（导入）**：2509 条来自 10 个 MIT 开源库，每条保留来源、授权、原始署名，以及上游自己的置信度分级 —— 不改写、不升格。

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
| LearnPrompt awesome-seedance | [LearnPrompt](https://github.com/LearnPrompt/awesome-seedance) | MIT | 879 |
| awesome-MiniMax-H3-cases | [SkyNotSilent](https://github.com/SkyNotSilent/awesome-MiniMax-H3-cases) | MIT | 684 |
| awesome-ai-video-kit | [cclank](https://github.com/cclank/lanshu-awesome-ai-video-kit) | MIT | 596 |
| awesome_wan-3-0-prompts | [flaqai](https://github.com/flaqai/awesome_wan-3-0-prompts) | MIT | 157 |
| awesome_sora2_prompt | [zhangchenchen](https://github.com/zhangchenchen/awesome_sora2_prompt) | MIT | 47 |
| awesome-seedance-prompts | [HuyLe82US](https://github.com/HuyLe82US/awesome-seedance-prompts) | MIT | 44 |
| wan-prompts | [casimirvance5](https://github.com/casimirvance5/wan-prompts) | MIT | 33 |
| Awesome-Veo3-Prompts | [liu-kaining](https://github.com/liu-kaining/Awesome-Veo3-Prompts) | MIT | 27 |
| awesome-seedance | [ZeroLu](https://github.com/ZeroLu/awesome-seedance) | MIT | 24 |
| awesome-seedance-2.5 | [ZeroLu](https://github.com/ZeroLu/awesome-seedance-2.5) | MIT | 18 |

模型族分布：seedance 1096 · minimax 722 · wan 213 · happyhorse 100 · kling 94 · sora 83 · veo 67 · runway 24 · hunyuan/jimeng/pika 各 22 · 其余 44。

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

被拒绝 87 条，**每条都写明原因**，不静默丢弃。构建确定：连跑两次输出字节相同，因此 CI 可以断言提交产物是最新的。

**考虑过但未导入**（详见 [ATTRIBUTION.md](ATTRIBUTION.md)）：songguoxs/awesome-video-prompts、gpt-image2/awesome-gptimage2-prompts、itgoyo/awesome-gpt-image2-prompt（均无 LICENSE）；YouMind-OpenLab/awesome-seedance-2-prompts、AtlasCloudAI、BaYue-SYJ（NOASSERTION 无法确认授权）；YouMind 与 freestylefly 的 GPT Image 库（授权合规但是图像提示词，超出范围）。

**一条特殊处理**：MiniMax H3 的 2862 条案例中有 2119 条 `promptProvenance: not-published`，即原文根本没有发布提示词。这类记录一律不导入 —— 否则等于我们替作者写提示词再署他的名字。

## 🔁 跨模型翻译

```bash
aivp translate sora-2 kling-3.0 ./my-prompt.txt   # 分块 → 分块：完全确定性
aivp translate sora-2 wan-2.7  ./my-prompt.txt    # 分块 → 四段式
aivp translate sora-2 veo-3.1  ./my-prompt.txt    # 补上 Dialogue/Audio 抑制
```

**能力边界**：分块标签之间是可确定映射；**散文源原样返回并警告**（没有规则能把一段散文映射成 `Characters:`/`Action:`/`Camera:`）；缺失字段**省略并报告**，绝不编造。

## 📊 语料分析

导入库大到可以"测量"而不是"感觉"。`aivp stats` 对 2509 条提示词、16 个模型族做结构化统计。

```bash
$ aivp stats
family              n  words p50  words p90   cams     dur%  med dur   dlg%   aud%   neg%   ref%  timeline%
------------------------------------------------------------------------------------------------------------
seedance         1096        271        815   1.04      47%       15    26%    58%    46%    17%        39%
minimax           722        269       1041   0.81      43%       15    26%    57%    41%    20%        41%
wan               213        150        269   0.47      69%       10    20%    48%    54%    17%        38%
happyhorse        100         35         50   0.48      18%        8     7%    43%     4%     1%        15%
kling              94         88        255   0.71      32%       20    26%    73%    17%     6%        15%
veo                67        145        294   0.58      12%       14    51%    79%    13%    10%        12%
```

完整表与列定义：[docs/CORPUS-ANALYSIS.md](docs/CORPUS-ANALYSIS.md)。

读原始提示词后仍然成立的三个结论：

1. **两种长度文化**。HappyHorse 中位数 **35 词**，Seedance / MiniMax 约 **271 词** —— 差 8 倍。互抄不是丢主体就是丢细节。
2. **音频写法是家族习惯，不是模型能力**。Veo 提示词 51% 写了台词，HappyHorse 只有 7%；两个模型都会生成音频。
3. **负向约束并不通用**。Pika 家族 91% 带排除项，HappyHorse 只有 4%。互相搬运会在"约束过度"和"约束不足"之间横跳。

单条提示词解剖：

```bash
$ aivp inspect "lanshu-video-kit::k4-001"
# 输出运镜类型、音频线索、时长、时间轴、负向约束、结构化标签等
```

### 能力核实分级

语料里的模型比本项目**能核实**的模型多。`aivp families` 列出每个族的能力来源：

```bash
$ aivp families
family          records  audio  verification        name
------------------------------------------------------------------------------
seedance          1096   yes   vendor-documented  Seedance
minimax            722   ?     vendor-documented  MiniMax H3 / Hailuo
kling               94   yes   vendor-documented  Kling
jimeng              22   yes   third-party-only   即梦 / Jimeng
pika                22   no    third-party-only   Pika
higgsfield           9   no    third-party-only   Higgsfield
```

音频字段刻意做成三态：`?` 表示厂商只把音频写成**输入**参考，没说输出带音轨。两个命名陷阱记录在 [prompts/families.json](prompts/families.json)：

- **Kling 4.0**：语料里有 12 条，但 2026-10-20 查阅的厂商模型列表里**没有**它 —— 只能当历史模板看。
- **Luma Ray 3.2**：语料这么写，厂商文档只有 Ray 2。

所有数字都是**字面模式匹配**，描述的是**这个语料库**，不是模型的要求 —— 没写某个线索不等于模型不需要。

---

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
