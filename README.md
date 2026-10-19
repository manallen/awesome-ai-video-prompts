<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,2,30&height=200&section=header&text=Awesome%20AI%20Video%20Prompts&fontSize=42&fontColor=ffffff&fontAlignY=38&desc=90%20curated%20%2B%20655%20imported%20%C2%B7%2017%20model%20families%20%C2%B7%20translator%20%2B%20linter&descSize=16&descAlignY=60&descColor=cccccc" alt="Awesome AI Video Prompts" width="100%">

# 🎬 Awesome AI Video Prompts

**Two layers: 90 hand-written prompts that diff the same scene across nine models, and 655 attributed prompts imported from open-source collections. Plus a zero-dependency CLI that translates and lints prompts.**

[![Website](https://img.shields.io/badge/website-freecreate.app-ff5c8a?style=flat-square&logo=safari&logoColor=white)](https://freecreate.app)
[![Curated](https://img.shields.io/badge/curated-90-f97316?style=flat-square)](prompts/generated.json)
[![Imported](https://img.shields.io/badge/imported-655-06b6d4?style=flat-square)](prompts/library.json)
[![Sources](https://img.shields.io/badge/upstream_sources-3-8b5cf6?style=flat-square)](ATTRIBUTION.md)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-37%20passing-22c55e?style=flat-square)](test)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=flat-square)](package.json)

[🌐 Browse online](https://manallen.github.io/awesome-ai-video-prompts/) ·
[🚀 Quick start](#-quick-start) ·
[📚 Curated scenes](#-layer-1--curated-scenes) ·
[🗃 Imported library](#-layer-2--imported-library) ·
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

**Layer 2 — imported.** 655 prompts pulled from three MIT-licensed open-source
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

655 prompts from three MIT-licensed collections, normalized into one schema
without losing provenance.

```bash
$ aivp library
Imported corpus: 655 records from 3 sources (26 rejected at import)

Sources:
  lanshu-video-kit      584  MIT      https://github.com/cclank/lanshu-awesome-ai-video-kit
  zerolu-seedance        24  MIT      https://github.com/ZeroLu/awesome-seedance
  awesome-sora2-prompt   47  MIT      https://github.com/zhangchenchen/awesome_sora2_prompt

By model family:
  seedance  155   happyhorse  100   sora  83   kling  82   veo  40
  minimax    38   runway       24   wan   23   hunyuan 22  jimeng 22
  pika       22   gemini-omni   9   higgsfield 9  cogvideox 8 …
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
| `reputable-3rd-party` | 473 | Curated third-party blogs and review sites |
| `official` | 131 | Vendor-owned domains |
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
        ├─ scripts/importers/markdown.mjs    heading/fence/CJK-label extraction
        ├─ scripts/importers/families.mjs    model → family/variant, non-destructive
        │
        ▼
scripts/import-library.mjs                   gate, dedupe, normalize
        ▼
prompts/library.json        (655 records, provenance intact)
prompts/library-report.json (26 rejections, each with a reason)
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

### Collections considered and not imported

| Collection | Reason |
|---|---|
| `songguoxs/awesome-video-prompts` | No license file |
| `gpt-image2/awesome-gptimage2-prompts` | No license file |
| `itgoyo/awesome-gpt-image2-prompt` | No license file |
| `Anil-matcha/Awesome-GPT-Image-2-API-Prompts` | No license file, near-empty repo |
| `YouMind-OpenLab/awesome-gpt-image-2` | CC BY, but image-only — out of scope for a video library |
| `freestylefly/awesome-gpt-image-2` | MIT, but image-only — out of scope |

Full reasoning in [ATTRIBUTION.md](ATTRIBUTION.md). If you maintain an
MIT/Apache/CC0 video prompt collection, open an issue — adding a source is a
registry entry plus a snapshot.

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
│   ├── library.mjs            # imported-corpus search + attribution
│   ├── translate.mjs          # labeled ↔ four-block ↔ prose renderers
│   ├── validate.mjs           # the lint rules
│   └── index.mjs              # public API
├── scripts/
│   ├── import-library.mjs     # snapshots → library.json
│   ├── importers/             # sources, markdown, families
│   ├── build-data.mjs         # scenes/ → generated.json
│   ├── build-site.mjs         # → site/index.html
│   └── serve-site.mjs         # local preview
├── bin/cli.mjs                # aivp
├── site/index.html            # GitHub Pages (static, no framework)
├── docs/PROMPT-TRANSLATION.md
├── ATTRIBUTION.md
└── test/                      # 37 tests
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
npm test                  # 37 tests
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
