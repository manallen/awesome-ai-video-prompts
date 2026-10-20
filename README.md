<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,2,30&height=200&section=header&text=Awesome%20AI%20Video%20Prompts&fontSize=42&fontColor=ffffff&fontAlignY=38&desc=90%20curated%20%2B%202509%20imported%20%C2%B7%2017%20model%20families%20%C2%B7%20translator%20%2B%20linter&descSize=16&descAlignY=60&descColor=cccccc" alt="Awesome AI Video Prompts" width="100%">

# 🎬 Awesome AI Video Prompts

**Two layers: 90 hand-written prompts that diff the same scene across nine models, and 2509 attributed prompts imported from ten open-source collections. Plus a zero-dependency CLI that translates and lints prompts.**

[![Website](https://img.shields.io/badge/website-freecreate.app-ff5c8a?style=flat-square&logo=safari&logoColor=white)](https://freecreate.app)
[![Curated](https://img.shields.io/badge/curated-90-f97316?style=flat-square)](prompts/generated.json)
[![Imported](https://img.shields.io/badge/imported-2509-06b6d4?style=flat-square)](prompts/library.json)
[![Sources](https://img.shields.io/badge/upstream_sources-10-8b5cf6?style=flat-square)](ATTRIBUTION.md)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-55%20passing-22c55e?style=flat-square)](test)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=flat-square)](package.json)

[🌐 Browse online](https://manallen.github.io/awesome-ai-video-prompts/) ·
[🚀 Quick start](#-quick-start) ·
[📚 Curated scenes](#-layer-1--curated-scenes) ·
[🗃 Imported library](#-layer-2--imported-library) ·
[📊 Corpus analysis](docs/CORPUS-ANALYSIS.md) ·
[🔁 Translator](#-cross-model-translation) ·
[✅ Validator](#-validate-before-you-spend-credits) ·
[📜 Attribution](#-attribution)

</div>

---

## Why this exists

Every "prompt collection" on GitHub is one person writing in one style and
copy-pasting it across models. That does not work, because **the models do not
want the same thing**:

- Veo 3.1 generates synchronized dialogue automatically. Say nothing about
  audio and you get a music bed you never asked for.
- HappyHorse 1.0 degrades past ~55 words. A Seedance prompt copy-pasted into it
  loses its subject.
- Kling 3.0 reads labeled blocks. Flatten them into prose and the camera
  instruction dissolves.
- Wan 2.7 treats sound as a first-class block. Omit it and it invents BGM.
- Sora 2's layered structure was excellent — and the API was shut down on
  **24 September 2026**, so half the tutorials online are already dead.

This repo answers that in two ways:

**Layer 1 — curated.** One scene per file, with a natively written prompt for
every model, side by side. Diff the same shot across nine dialects.

**Layer 2 — imported.** 2509 prompts pulled from ten MIT-licensed open-source
collections, each keeping its source, license, original credit, and the
upstream collection's own confidence tier. Nothing is re-graded or laundered.

> **No API keys. No accounts. No build step to consume the data. `node >= 18`.**

---

## 🚀 Quick start

```bash
git clone https://github.com/manallen/awesome-ai-video-prompts.git
cd awesome-ai-video-prompts

# Curated layer
node bin/cli.mjs list --models
node bin/cli.mjs show scene-10-wuxia-duel --model kling-3.0
node bin/cli.mjs search "rain portrait"

# Imported layer
node bin/cli.mjs library                      # sources, families, confidence tiers
node bin/cli.mjs find "rain neon" --limit 5
node bin/cli.mjs find "product" --family kling
node bin/cli.mjs get "lanshu-video-kit::sd-001"
node bin/cli.mjs credits --source zerolu-seedance

# Site
npm run build:site && npm run site            # → http://127.0.0.1:8080
```

As a library:

```js
import {
  search, promptFor, translate, validate,      // curated layer
  searchLibrary, libraryRecord, libraryIndex,  // imported layer
} from "awesome-ai-video-prompts";

search("chrome liquid abstract")[0].scene.id;          // "scene-09-abstract-liquid"
promptFor("scene-09-abstract-liquid", "kling-3.0");

searchLibrary("wong kar-wai", { family: "seedance" });
libraryRecord("lanshu-video-kit::sd-001").upstreamCredit;

translate({ prompt: mySoraPrompt, from: "sora-2", to: "veo-3.1" });
validate(myPrompt, "kling-3.0");
```

Zero runtime dependencies.

---

## 📚 Layer 1 — Curated scenes

Ten deliberately different problems. Each file in
[`prompts/scenes/`](prompts/scenes) holds all nine model prompts, the shared
"anchor" (subject, scene, motion, mood, camera, audio, light), and an authoring
note per model explaining what that model needs.

| # | Scene | Category | What it stresses | Hardest part |
|---|-------|----------|------------------|--------------|
| 01 | [Luxury product hero](prompts/scenes/scene-01-product-hero.json) | product-commercial | Glass refraction, 360° orbit | Keeping the label locked while the bottle turns |
| 02 | [Espresso macro](prompts/scenes/scene-02-food-macro.json) | product-commercial | Liquid merging, crema | Two streams merging into one, cleanly |
| 03 | [Character portrait](prompts/scenes/scene-03-character-portrait.json) | portrait | Face stability, two-source lighting | Not inventing a different face each run |
| 04 | [Two-person dialogue](prompts/scenes/scene-04-two-person-dialogue.json) | narrative | Overlapping speech, emotional turn | Who speaks when, and who laughs first |
| 05 | [Image to video](prompts/scenes/scene-05-image-to-video.json) | image-to-video | Preservation vs. motion | Saying what must *not* change |
| 06 | [Motion control](prompts/scenes/scene-06-motion-control.json) | motion-control | Retargeting choreography | Identity survival through limb transfer |
| 07 | [Skate kickflip](prompts/scenes/scene-07-action-sports.json) | action-sports | Physics, four-beat timing | The pop that makes the flip readable |
| 08 | [Mountain time-lapse](prompts/scenes/scene-08-nature-timelapse.json) | landscape | Light progression | Three stages of dawn in one take |
| 09 | [Liquid chrome](prompts/scenes/scene-09-abstract-liquid.json) | abstract | Surface tension, return-to-pool | Ending the shot instead of freezing |
| 10 | [Wuxia duel](prompts/scenes/scene-10-wuxia-duel.json) | wuxia | Chinese semantics, grounded physics | Forbidding wire work that models love to add |

The `anchor` is the invariant. Every per-model prompt renders the same seven
facts, so a diff between two models shows *only* what changed in the dialect —
not what changed in the idea.

### Format families

| Family | Models | Shape | Failure if you get it wrong |
|--------|--------|-------|------------------------------|
| **Labeled blocks** | Kling 3.0, Sora 2 ⏹ | `Scene:` / `Characters:` / `Action:` / `Camera:` / `Negative:` | Prose-ifying loses the camera and exclusions |
| **Four-block** | Wan 2.7 | `Entity:` / `Scene:` / `Motion:` / `Sound:` | Omitting `Sound` auto-generates BGM |
| **Prose + audio** | Veo 3.1 | Paragraph, then `Dialogue:` + `Audio:` | No `no music` → unsolicited score |
| **Eight-element prose** | Seedance 2.0 | One dense paragraph | Long prose destabilises; keep one camera verb |
| **Compact prose** | HappyHorse 1.0 | 30–55 words | Past ~60 words the subject dilutes |
| **Terse prose** | Hailuo 02 | 1–3 sentences | Padding degrades physics accuracy |
| **Instruction** | Gemini Omni | Imperative, iterable | Describing a vibe instead of an instruction |
| **Prose + edit verbs** | Runway Gen-4.5 / Aleph | Description or `add`/`remove`/`re-light` | Using generation language for an edit task |

⏹ = retired. Sora 2 and the OpenAI Videos API were shut down on **2026-09-24**
with [no one-to-one replacement](https://developers.openai.com/api/docs/guides/video-generation).
Those prompts are kept as historical reference — `aivp translate sora-2 veo-3.1`
migrates them.

### Capability registry

[`prompts/models.json`](prompts/models.json) holds the machine-readable facts
behind that table: durations, resolutions, aspect ratios, native audio, expected
labels, and the vendor doc URL for each claim. Every entry is date-stamped.

---

## 🗃 Layer 2 — Imported library

2509 prompts from ten MIT-licensed collections, normalized into one schema
without losing provenance.

```bash
$ aivp library
Imported corpus: 2509 records from 10 sources (87 rejected at import)

Sources:
  lanshu-video-kit       596  MIT  https://github.com/cclank/lanshu-awesome-ai-video-kit
  learnprompt-seedance   879  MIT  https://github.com/LearnPrompt/awesome-seedance
  minimax-h3-cases       684  MIT  https://github.com/SkyNotSilent/awesome-MiniMax-H3-cases
  wan-3.0-prompts        157  MIT  https://github.com/flaqai/awesome_wan-3-0-prompts
  awesome-sora2-prompt    47  MIT  https://github.com/zhangchenchen/awesome_sora2_prompt
  huy-seedance-prompts    44  MIT  https://github.com/HuyLe82US/awesome-seedance-prompts
  wan-prompts             33  MIT  https://github.com/casimirvance5/wan-prompts
  veo3-prompts            27  MIT  https://github.com/liu-kaining/Awesome-Veo3-Prompts
  zerolu-seedance         24  MIT  https://github.com/ZeroLu/awesome-seedance
  zerolu-seedance-2.5     18  MIT  https://github.com/ZeroLu/awesome-seedance-2.5

By model family:
  seedance 1096 · minimax 722 · wan 213 · happyhorse 100 · kling 94
  sora 83 · veo 67 · runway 24 · hunyuan 22 · jimeng 22 · pika 22
  gemini-omni 9 · higgsfield 9 · cogvideox 8 · ltx-video 8 · mochi 8 · luma 2
```

### What every imported record carries

| Field | Meaning |
|---|---|
| `sourceId` / `sourceUrl` | Which collection, exactly |
| `license` | That collection's license |
| `upstreamId` | The record's id inside the upstream collection |
| `upstreamCredit` / `upstreamUrl` | The original author or platform the collection credits |
| `upstreamTier` | The collection's own confidence label, **preserved verbatim** |
| `model` | Upstream model string, verbatim |
| `modelFamily` / `modelVariant` | Derived, alongside — never instead of |
| `kind` | `prompt` (a scene prompt) vs `snippet` (an instruction fragment) |

Confidence tiers seen in the data:

| Tier | Count | Meaning |
|---|---:|---|
| `reputable-3rd-party` | 2324 | Curated third-party blogs, review sites, community cases |
| `official` | 134 | Vendor-owned domains / vendor-published prompts |
| `official-platform` | 41 | Official GitHub / HuggingFace / Replicate |
| `unverified-3rd-party` | 9 | Kept, labeled, not endorsed |
| `unknown` | 1 | No URL |

We do not upgrade anyone's tier. An `unverified-3rd-party` prompt stays labeled
that way here.

### Import pipeline

```text
data/snapshots/      ← committed upstream bytes (git-cloneable, offline-reproducible)
        │
        ├─ scripts/importers/sources.mjs     license gate + source registry
        ├─ scripts/importers/markdown.mjs    heading / fence / CJK-label extraction
        ├─ scripts/importers/families.mjs    model → family/variant, non-destructive
        │
        ▼
scripts/import-library.mjs                   8 parsers: JSON, JSONL, markdown bundles
        │                                   gate → dedupe → normalize → safe ids
        ▼
        ▼
prompts/library.json        (2509 records, provenance intact)
prompts/library-report.json (87 rejections, each with a reason)
```

The importer refuses a source whose license is not MIT, Apache-2.0, CC0-1.0 or
CC BY 4.0, and refuses records with unresolved placeholders, raw HTML, URL-only
bodies, or duplicate text. Rejections are counted and written to the report —
**nothing is dropped silently**.

```bash
npm run build:library       # rebuild from committed snapshots (no network)
npm run refresh:library     # re-download snapshots from upstream, then rebuild
```

Builds are deterministic: `npm run build` twice produces byte-identical output,
which is why CI can assert the committed artifacts are current.

### Parser coverage

Each upstream collection stores prompts differently. Rather than force one
shape, the importer has a parser per shape and records which one ran.

| Source | Shape | Parser | Notable handling |
|---|---|---|---|
| lanshu-video-kit | JSON records + cross-model matrix | `lanshu-prompts`, `lanshu-matrix` | Keeps each record's `source.tier` and credit verbatim |
| LearnPrompt awesome-seedance | 886 JSON cases | `learnprompt-cases` | Keeps evidence level (L0–L2) and retest verdicts as tags/notes |
| awesome-MiniMax-H3-cases | 2862 JSON cases | `minimax-cases` | **Imports only** the 743 records whose prompt is published upstream (`creator-verbatim` / `official-verbatim`) |
| awesome_wan-3-0-prompts | Markdown, `## NN｜Title` | `markdown-bundle-categorized` | Parses the mode/suggestion line into `params` |
| Awesome-Veo3-Prompts | Markdown wrapping structured JSON | `markdown-bundle-json` | **Keeps JSON verbatim** — flattening it would destroy the shot spec |
| awesome-seedance-prompts (HuyLe82US) | One markdown file per prompt | `markdown-bundle` | Carries each file's X-author credit |
| wan-prompts | JSONL | `wan-jsonl` | Each record's structural `tip` becomes the note |
| awesome-seedance-2.5 | Bilingual JSON | `zerolu-seedance25` | English body canonical, Chinese retained as alternate |
| awesome-seedance, awesome_sora2_prompt | Markdown | `markdown-heading-prompt` | Generic heading + fenced-block extraction |

### Collections considered and not imported


| Collection | Reason |
|---|---|
| `songguoxs/awesome-video-prompts` | No license file |
| `gpt-image2/awesome-gptimage2-prompts` | No license file |
| `itgoyo/awesome-gpt-image2-prompt` | No license file |
| `Anil-matcha/Awesome-GPT-Image-2-API-Prompts` | No license file, near-empty repo |
| `YouMind-OpenLab/awesome-gpt-image-2` | CC BY, but image-only — out of scope for a video library |
| `freestylefly/awesome-gpt-image-2` | MIT, but image-only — out of scope |
| `YouMind-OpenLab/awesome-seedance-2-prompts` | NOASSERTION license (unresolvable) |
| `AtlasCloudAI/awesome-seedance-2.5-prompts-skills` | NOASSERTION license |
| `BaYue-SYJ/shuixian-prompts` | NOASSERTION license |
| `Emily2040/seedance-2.0` | MIT, but the repo is a skill/guide set with no prompt corpus |
| `dexhunter/seedance2-skill` | MIT, but a single SKILL.md of guidance, not a prompt corpus |
| `OSideMedia/higgsfield-ai-prompt-skill` | MIT, prompt *rules* rather than prompts |

Full reasoning in [ATTRIBUTION.md](ATTRIBUTION.md). If you maintain an
MIT/Apache/CC0 video prompt collection, open an issue — adding a source is a
registry entry plus a snapshot.

---

## 📊 Corpus analysis

The imported corpus is large enough to measure instead of argue. `aivp stats`
computes structural facts across 2509 prompts and 16 model families.

```bash
$ aivp stats
family              n  words p50  words p90   cams     dur%  med dur   dlg%   aud%   neg%   ref%  timeline%
------------------------------------------------------------------------------------------------------------
seedance         1096        271        815   1.04      47%       15    26%    58%    46%    17%        39%
minimax           722        269       1041   0.81      43%       15    26%    57%    41%    20%        41%
wan               213        150        269   0.47      69%       10    20%    48%    54%    17%        38%
happyhorse        100         35         50   0.48      18%        8     7%    43%     4%     1%        15%
kling              94         88        255   0.71      32%       20    26%    73%    17%     6%        15%
sora               83         83        173   0.52      12%       20     7%    46%     2%     7%        12%
veo                67        145        294   0.58      12%       14    51%    79%    13%    10%        12%
```

Full breakdown with column definitions: **[docs/CORPUS-ANALYSIS.md](docs/CORPUS-ANALYSIS.md)**.

Three findings that survive reading the underlying prompts:

1. **Two length cultures.** HappyHorse sits at a **35-word median**; Seedance and
   MiniMax near **271**. An eightfold gap — copy-pasting between them loses either
   the subject or the detail.
2. **Audio direction is a family habit, not a capability.** Veo prompts name
   dialogue 51% of the time; HappyHorse prompts 7%. Both families include
   audio-capable models — the difference is authoring habit, not hardware.
3. **Negative constraints are not universal.** Pika-family prompts carry
   exclusions 91% of the time; HappyHorse 4%. Porting a prompt between them flips
   you between over- and under-constrained.

Inspect one prompt's anatomy:

```bash
$ aivp inspect "lanshu-video-kit::k4-001"
Kling 4.0 四世界罗盘 Match Cut
model                kling-4.0
family               kling
chars / words        1834 / 272
camera moves         push-in, macro
audio cues           ambience
duration             12s
timeline / beats     yes
negative constraints yes
labeled blocks       none
```

Every figure is a literal pattern match. The tables describe **this corpus**, not
what any model requires — a prompt that omits a cue is not evidence the model can
do without it.

### Capability verification

Not every family in the corpus can be vendor-verified. `aivp families` shows how
each one was established:

```bash
$ aivp families
family          records  audio  verification        name
------------------------------------------------------------------------------
seedance          1096   yes   vendor-documented  Seedance
minimax            722   ?     vendor-documented  MiniMax H3 / Hailuo
wan                213   yes   vendor-documented  Wan
happyhorse         100   yes   vendor-documented  HappyHorse 1.0
kling               94   yes   vendor-documented  Kling
sora                83   yes   vendor-documented  Sora 2
veo                 67   yes   vendor-documented  Veo
jimeng              22   yes   third-party-only   即梦 / Jimeng
pika                22   no    third-party-only   Pika
higgsfield           9   no    third-party-only   Higgsfield
```

Audio is tri-state on purpose: `?` means the vendor documents audio as an
**input** reference without stating that output carries a track. Two naming
caveats live in [prompts/families.json](prompts/families.json):

- **Kling 4.0** appears in 12 imported prompts but is **not** on the vendor model
  list consulted on 2026-10-20 — treat those as retrospective templates.
- **Luma Ray 3.2** appears in the corpus; the vendor documents Ray 2 only.

---

## 🔁 Cross-model translation

```bash
aivp translate sora-2 kling-3.0 ./my-prompt.txt   # labeled → labeled: deterministic
aivp translate sora-2 wan-2.7  ./my-prompt.txt    # labeled → four-block
aivp translate sora-2 veo-3.1  ./my-prompt.txt    # adds explicit Dialogue/Audio
cat prompt.txt | aivp translate kling-3.0 seedance-2.0 --json
```

**Scope, stated honestly.** The translator is *structural*, not semantic:

- Labeled → labeled is deterministic. The labels carry the meaning.
- Prose source → **returned unchanged with a warning**. No rule maps a
  paragraph onto `Characters:`/`Action:`/`Camera:`; guessing produces
  confident-looking garbage.
- Missing fields are **omitted and reported**, never invented.

```text
$ aivp translate sora-2 wan-2.7 banter.txt
Motion: The sister speaks first with an urgent gesture, the brother interrupts, …
Sound: Fridge hum, a dish settling in the sink

# Source prompt has no negative block; the target's negative field falls back to defaults.
# Source prompt supplied no Entity, Scene. The target block is omitted rather than invented — fill it in before generating.
```

For semantic rewriting, [docs/PROMPT-TRANSLATION.md](docs/PROMPT-TRANSLATION.md)
gives the exact LLM prompt — including the "return null, then list every null"
clause that stops the model filling gaps with invention.

---

## ✅ Validate before you spend credits

```bash
$ aivp validate kling-3.0 prompt.txt
score 84  words 118  OK
  INFO    music-unspecified: No `no music` clause found; audio-native models frequently add a score.

$ aivp validate veo-3.1 bad.txt
score 37  words 44  FAIL
  ERROR   placeholder: Prompt still contains an unresolved template placeholder such as [BRAND NAME].
  WARNING contradiction:sharp-vs-grain: Film-grain/8mm aesthetics conflict with ultra-sharp/4K requests.
  WARNING no-preservation: Image-to-video prompts should state what must stay unchanged.
```

| Check | Catches |
|-------|---------|
| `placeholder` | `[BRAND NAME]`, `<CITY>`, `{CHARACTER}` leaking from templates |
| `contradiction:*` | 4K + film grain · slow-mo + high-speed · cinematic + handheld · "no zoom" + "push in" |
| `style-pileup` | More than two director references (models sample, not blend) |
| `missing-labels` / `missing-blocks` | Labeled model fed prose |
| `length` | Above the model's productive word band |
| `audio-unspecified` / `music-unspecified` | Audio-native model with no audio direction |
| `no-preservation` | Image-to-video without a "keep unchanged" clause |
| `no-motion-source` | Motion-control without naming the reference clip |
| `retired` | Generating against a model that no longer exists |

```bash
aivp validate --all     # the curated library, as a CI gate (0 errors, 0 warnings)
```

---

## 🗂 Repository layout

```text
awesome-ai-video-prompts/
├── prompts/
│   ├── models.json            # capability registry (date-stamped, cited)
│   ├── generated.json         # curated aggregate — built, do not hand-edit
│   ├── library.json           # imported corpus with provenance — built
│   ├── library-report.json    # importer rejections with reasons — built
│   └── scenes/                # ← curated source of truth
├── data/snapshots/            # ← committed upstream bytes (import inputs)
├── src/
│   ├── models.mjs             # registry loading
│   ├── search.mjs             # BM25-lite scorer for curated scenes
│   ├── library.mjs            # imported-corpus search + attribution + stats
│   ├── analyze.mjs            # prompt anatomy: camera, audio, duration, structure
│   ├── translate.mjs          # labeled ↔ four-block ↔ prose renderers
│   ├── validate.mjs           # the lint rules
│   └── index.mjs              # public API
├── scripts/
│   ├── import-library.mjs     # snapshots → library.json
│   ├── importers/             # sources, markdown, families
│   ├── build-data.mjs         # scenes/ → generated.json
│   ├── build-analysis.mjs     # library.json → docs/CORPUS-ANALYSIS.md
│   ├── build-site.mjs         # → site/index.html
│   └── serve-site.mjs         # local preview
├── bin/cli.mjs                # aivp
├── site/index.html            # GitHub Pages (static, no framework)
├── docs/
│   ├── PROMPT-TRANSLATION.md
│   └── CORPUS-ANALYSIS.md     # generated statistics
├── ATTRIBUTION.md
└── test/                      # 55 tests
```

---

## 📜 Attribution

Curated scenes are original work under the repository's [MIT license](LICENSE).
Imported prompts retain their upstream license and attribution; every record
names its source, and `upstreamCredit` names the author the upstream collection
itself credited.

```bash
aivp credits                      # every source + credit line
aivp credits --source zerolu-seedance
```

Full detail, including the removal process for upstream authors, is in
[ATTRIBUTION.md](ATTRIBUTION.md).

---

## 🤝 Contributing

The highest-value contribution is a **curated scene**, not a style tweak.

1. Copy an existing file in [`prompts/scenes/`](prompts/scenes).
2. Write the `anchor` — seven facts, no model-specific language.
3. Write a prompt **for every model**, in that model's own dialect. If you only
   know one model, open an issue with the scene and we fill the rest.
4. Add a `notes` line saying what you had to do differently. That note is often
   more useful than the prompt.
5. Run the gates:

```bash
npm run build             # curated + imported + site
npm test                  # 55 tests
node bin/cli.mjs validate --all
```

To propose a new **import source**, open an issue with the repository URL and a
license link. Sources without a detectable compatible license are refused.

---

## 📌 Scope and limits

**This is:** a cross-model prompt *reference* (curated), an *attributed corpus*
(imported), and a *structural* prompt tool.

**It is not:** a guarantee that a prompt produces a specific frame; an aesthetic
"best of"; a substitute for vendor docs; an endorsement of every imported
prompt. The imported corpus is deliberately heterogenous — that is the point of
keeping `upstreamTier` visible.

**Known gaps**, tracked as issues:

- Kling's `Audio & Style` block is not split into sound vs. style.
- Wan multi-shot timestamp syntax (`第1个镜头[0-3秒]`) is parsed as plain prose.
- Seedance `@图像1` reference labels pass through verbatim, unvalidated.
- Imported prompts are normalized for storage only — they are not run through
  the validator, because many upstream prompts are intentionally minimal.

---

## 🔗 Links

| | |
|---|---|
| 🌐 Browse | [manallen.github.io/awesome-ai-video-prompts](https://manallen.github.io/awesome-ai-video-prompts/) |
| 🌐 Product | **[freecreate.app](https://freecreate.app)** — run these workflows in the browser |
| 🎬 Video workspace | [freecreate.app/video](https://freecreate.app/video) · [image-to-video](https://freecreate.app/image-to-video-generator) · [motion control](https://freecreate.app/motion-control-ai) |
| 🖼 Image tools | [freecreate.app/image-tools](https://freecreate.app/image-tools) |
| 💡 Effects library | [freecreate.app/ai-effects](https://freecreate.app/ai-effects) |
| 📖 Translation guide | [docs/PROMPT-TRANSLATION.md](docs/PROMPT-TRANSLATION.md) |
| 📜 Attribution | [ATTRIBUTION.md](ATTRIBUTION.md) |

---

<div align="center">

**MIT** · maintained by [FreeCreate](https://freecreate.app)

If this saved you an afternoon of prompt roulette, a ⭐ helps other people find it.

</div>
