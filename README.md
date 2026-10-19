<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,2,30&height=200&section=header&text=Awesome%20AI%20Video%20Prompts&fontSize=42&fontColor=ffffff&fontAlignY=38&desc=10%20scenes%20%C3%97%209%20models%20%C2%B7%2090%20native%20prompts%20%C2%B7%20translator%20%2B%20linter&descSize=16&descAlignY=60&descColor=cccccc" alt="Awesome AI Video Prompts" width="100%">

# 🎬 Awesome AI Video Prompts

**The same ten scenes, written natively for nine video models — plus a zero-dependency CLI that translates and lints prompts.**

[![Website](https://img.shields.io/badge/website-freecreate.app-ff5c8a?style=flat-square&logo=safari&logoColor=white)](https://freecreate.app)
[![Prompts](https://img.shields.io/badge/prompts-90-f97316?style=flat-square)](prompts/generated.json)
[![Models](https://img.shields.io/badge/models-9-8b5cf6?style=flat-square)](prompts/models.json)
[![Scenes](https://img.shields.io/badge/scenes-10-06b6d4?style=flat-square)](prompts/scenes)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-17%20passing-22c55e?style=flat-square)](test/library.test.mjs)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=flat-square)](package.json)

[🌐 Browse online](https://freecreate.app) ·
[🚀 Quick start](#-quick-start) ·
[📚 The scenes](#-the-ten-scenes) ·
[🧠 Format families](#-format-families) ·
[🔁 Translator](#-cross-model-translation) ·
[✅ Validator](#-validate-before-you-spend-credits) ·
[🤝 Contribute](#-contributing)

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

This repo holds **one scene per file**, with a **natively written prompt for
every model**, side by side. You can diff exactly how the same shot is
requested in nine different dialects. Then a small CLI does the mechanical part
of moving between them.

> **No API keys. No accounts. No build step for the library. `node >= 18`.**

---

## 🚀 Quick start

### Read the library

```bash
git clone https://github.com/manallen/awesome-ai-video-prompts.git
cd awesome-ai-video-prompts

node bin/cli.mjs list                       # 10 scenes
node bin/cli.mjs list --models              # + per-model coverage
node bin/cli.mjs show scene-10-wuxia-duel --model kling-3.0
node bin/cli.mjs search "rain portrait"     # keyword search
node bin/cli.mjs models                     # capability registry
```

### Preview the browser

```bash
npm run build:site && npm run site
# → http://127.0.0.1:8080
```

### Use it as a library

```js
import { search, promptFor, translate, validate } from "awesome-ai-video-prompts";

// 1. Find the scene closest to what you're making
const [best] = search("chrome liquid abstract");
best.scene.id;                    // "scene-09-abstract-liquid"

// 2. Get the prompt in the dialect you're generating with
promptFor("scene-09-abstract-liquid", "kling-3.0").prompt;

// 3. Port a prompt you already have
translate({ prompt: mySoraPrompt, from: "sora-2", to: "veo-3.1" });

// 4. Lint before spending credits
validate(myPrompt, "kling-3.0");
// → { ok: true, score: 92, words: 118, issues: [...] }
```

No install required if you clone — the package has **zero runtime
dependencies**.

---

## 📚 The ten scenes

Ten deliberately different problems. Each one is a file in
[`prompts/scenes/`](prompts/scenes) with all nine model prompts, the shared
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

### What a scene file looks like

```jsonc
{
  "id": "scene-10-wuxia-duel",
  "title": "Wuxia — two swordfighters in a bamboo forest, one exchange",
  "category": "wuxia",
  "useCase": "Period drama teaser, game cinematic, Chinese-language short",
  "anchor": {
    "subject": "Two robed swordsmen facing each other in rain",
    "scene":   "A dense bamboo forest, pale mist, wet leaves",
    "motion":  "One rushes, they exchange blades once, both hold a still beat",
    "mood":    "Restrained, tense, classical",
    "camera":  "Wide locked-off first, then a fast push in on the clash",
    "audio":   "Bamboo creak, rain, a single blade ring",
    "light":   "Flat overcast light with mist layers between the trunks"
  },
  "prompts": {
    "kling-3.0": {
      "prompt": "Scene: …\nCharacters: …\nAction: …\nCamera: …\nAudio & Style: …\nNegative: …",
      "notes": "Kling's Chinese semantic strength makes this the strongest option for wuxia when Negative is explicit."
    }
    // …eight more models
  }
}
```

The `anchor` is the invariant. Every per-model prompt is a rendering of the
same seven facts, so a diff between two models tells you *only* what changed in
the dialect — not what changed in the idea.

---

## 🧠 Format families

Nine models, five genuinely different prompt shapes. This is the table to
internalise.

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
The prompts are kept as historical reference — `aivp translate sora-2 veo-3.1`
migrates them.

### Capability registry

[`prompts/models.json`](prompts/models.json) holds the machine-readable facts
behind the table above: durations, resolutions, aspect ratios, whether native
audio exists, which labels the model expects, and the vendor doc URL for each
claim. Every entry is date-stamped.

```bash
node bin/cli.mjs models --active
# seedance-2.0    active    prose-8e        audio   Seedance 2.0
# kling-3.0       active    labeled-blocks  audio   Kling 3.0
# veo-3.1         active    prose-audio     audio   Veo 3.1
# wan-2.7         active    four-block      audio   Wan 2.7
# hailuo-02       active    terse-prose     audio   MiniMax Hailuo / H3
# gemini-omni     active    instruction     audio   Gemini Omni Flash 1.1
# runway-gen4.5   active    prose-edit      silent  Runway Gen-4.5 / Aleph 2.0
# happyhorse-1.0  active    compact-prose   audio   HappyHorse 1.0
```

---

## 🔁 Cross-model translation

```bash
# Sora 2 → Kling 3.0 (labeled → labeled: fully deterministic)
aivp translate sora-2 kling-3.0 ./my-prompt.txt

# Sora 2 → Wan 2.7 (labeled → four-block)
aivp translate sora-2 wan-2.7 ./my-prompt.txt

# Sora 2 → Veo 3.1 (adds explicit Dialogue/Audio suppression)
aivp translate sora-2 veo-3.1 ./my-prompt.txt

# From stdin, JSON output
cat prompt.txt | aivp translate kling-3.0 seedance-2.0 --json
```

**Scope, stated honestly.** The translator is *structural*, not semantic:

- Labeled → labeled is deterministic. The labels carry the meaning.
- Prose source → **returned unchanged with a warning**. There is no rule that
  maps a paragraph onto `Characters:`/`Action:`/`Camera:`. Guessing produces
  confident-looking garbage.
- Missing fields are **omitted and reported**, never invented.

```text
$ aivp translate sora-2 wan-2.7 banter.txt
Motion: The sister speaks first with an urgent gesture, the brother interrupts, …
Sound: Fridge hum, a dish settling in the sink

# Source prompt has no negative block; the target's negative field falls back to defaults.
# Source prompt supplied no Entity, Scene. The target block is omitted rather than invented — fill it in before generating.
```

If you want semantic rewriting, [docs/PROMPT-TRANSLATION.md](docs/PROMPT-TRANSLATION.md)
gives the exact LLM prompt — including the "return null, then list every null"
clause that stops the model from filling gaps with invention.

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

Rules that are checked:

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
aivp validate --all          # the whole library, as a CI gate
```

The entire 90-prompt library passes with **0 errors, 0 warnings**.

---

## 🗂 Repository layout

```text
awesome-ai-video-prompts/
├── prompts/
│   ├── models.json          # capability registry (date-stamped, cited)
│   ├── generated.json       # built aggregate — do not edit by hand
│   └── scenes/              # ← the source of truth
│       ├── scene-01-product-hero.json
│       └── … scene-10-wuxia-duel.json
├── src/
│   ├── models.mjs           # registry loading
│   ├── search.mjs           # BM25-lite scorer, no index
│   ├── translate.mjs        # labeled ↔ four-block ↔ prose renderers
│   ├── validate.mjs         # the lint rules above
│   └── index.mjs            # public API
├── bin/
│   ├── cli.mjs              # aivp
│   └── help.txt
├── scripts/
│   ├── build-data.mjs       # scenes/ → generated.json, fails on inconsistency
│   ├── build-site.mjs       # → site/index.html
│   └── serve-site.mjs       # local preview
├── site/index.html          # GitHub Pages (static, no framework)
├── docs/
│   └── PROMPT-TRANSLATION.md
└── test/library.test.mjs    # 17 tests
```

---

## 🤝 Contributing

The highest-value contribution is a **scene**, not a style tweak.

1. Copy an existing file in [`prompts/scenes/`](prompts/scenes).
2. Write the `anchor` — seven facts, no model-specific language.
3. Write a prompt **for every model**, in that model's own dialect. If you only
   know one model, open an issue with the scene and we'll fill the rest.
4. Add a `notes` line saying what you had to do differently for that model.
   That note is often more useful than the prompt.
5. Run the gates:

```bash
npm run build:data        # fails on unknown models / empty prompts
npm test                  # 17 tests
node bin/cli.mjs validate --all
```

PRs that add a model to the registry need the vendor documentation URL in
`sources`. Claims without a source get closed — this repo's whole value is that
it is checkable.

---

## 📌 Scope and limits

**What this is:** a cross-model prompt *reference* and a *structural* prompt
tool. Prompts are written from the vendors' documented formulas and general
prompt-engineering practice. They are not benchmarked equivalence tests.

**What this is not:**

- A guarantee that a prompt produces a specific frame.
- A list of "best" prompts in an aesthetic sense — the scenes are chosen to
  stress *different* model behaviours.
- A substitute for the vendor docs. Model behaviour shifts between releases;
  [`prompts/models.json`](prompts/models.json) is date-stamped for exactly
  that reason.

**Known gaps**, tracked as issues:

- Kling's `Audio & Style` block is not split into sound vs. style.
- Wan multi-shot timestamp syntax (`第1个镜头[0-3秒]`) is parsed as plain prose.
- Seedance `@图像1` reference labels pass through verbatim, unvalidated.

---

## 🔗 Links

| | |
|---|---|
| 🌐 Product | **[freecreate.app](https://freecreate.app)** — try these workflows in the browser |
| 🎬 Video workspace | [freecreate.app/video](https://freecreate.app/video) · [image-to-video](https://freecreate.app/image-to-video-generator) · [motion control](https://freecreate.app/motion-control-ai) |
| 🖼 Image tools | [freecreate.app/image-tools](https://freecreate.app/image-tools) |
| 💡 Effects library | [freecreate.app/ai-effects](https://freecreate.app/ai-effects) |
| 📖 Translation guide | [docs/PROMPT-TRANSLATION.md](docs/PROMPT-TRANSLATION.md) |
| 🐛 Issues | [github.com/manallen/awesome-ai-video-prompts/issues](https://github.com/manallen/awesome-ai-video-prompts/issues) |

---

<div align="center">

**MIT** · maintained by [FreeCreate](https://freecreate.app)

If this saved you an afternoon of prompt roulette, a ⭐ helps other people find it.

</div>
