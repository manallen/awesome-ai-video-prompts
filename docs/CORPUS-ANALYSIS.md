# Corpus analysis

Generated from `prompts/library.json` (2509 records) by
`scripts/build-analysis.mjs`. Do not edit by hand — run `npm run build`.

These are **literal pattern measurements over this corpus**, not statements about
what a model requires. "46% carry a negative constraint" means 46% of the
Seedance-family prompts here contain a phrase like *avoid* or *no watermark*. It
does not mean Seedance needs one. A prompt that omits a cue is not evidence the
model can do without it.

## Sources

| Collection | Owner | Records | Licence |
|---|---|---:|---|
| lanshu-awesome-ai-video-kit | [cclank](https://github.com/cclank/lanshu-awesome-ai-video-kit) | 596 | MIT |
| awesome-seedance | [ZeroLu](https://github.com/ZeroLu/awesome-seedance) | 24 | MIT |
| awesome_sora2_prompt | [zhangchenchen](https://github.com/zhangchenchen/awesome_sora2_prompt) | 47 | MIT |
| LearnPrompt awesome-seedance | [LearnPrompt](https://github.com/LearnPrompt/awesome-seedance) | 879 | MIT |
| awesome-MiniMax-H3-cases | [SkyNotSilent](https://github.com/SkyNotSilent/awesome-MiniMax-H3-cases) | 684 | MIT |
| wan-prompts | [casimirvance5](https://github.com/casimirvance5/wan-prompts) | 33 | MIT |
| awesome-seedance-2.5 | [ZeroLu](https://github.com/ZeroLu/awesome-seedance-2.5) | 18 | MIT |
| awesome-seedance-prompts | [HuyLe82US](https://github.com/HuyLe82US/awesome-seedance-prompts) | 44 | MIT |
| Awesome-Veo3-Prompts | [liu-kaining](https://github.com/liu-kaining/Awesome-Veo3-Prompts) | 27 | MIT |
| awesome_wan-3-0-prompts | [flaqai](https://github.com/flaqai/awesome_wan-3-0-prompts) | 157 | MIT |

## Capability verification

The corpus is larger than the set of models whose behaviour this project can
actually verify. Each family below is tagged with how its capabilities were
established. Native audio is deliberately tri-state — **yes / no / unknown** —
because a vendor page that documents audio as an *input* does not establish that
output carries an audio track.

| Family | Records | Native audio | Verification | Note |
|---|---:|---|---|---|
| seedance | 1096 | yes | vendor-documented | Seedance 2.5 raises the ceiling to 30 s and accepts up to 30 images / 10 videos / 10 audio clips as references. |
| minimax | 722 | unknown | vendor-documented | The vendor page documents audio as an *input* reference (up to 3 clips, ≤15 s total). It does not state whether generated output carries an audio track, so `nativeAudio:  |
| wan | 213 | yes | vendor-documented | 3.0 and 3.0 Prime list built-in audio. 2.7 accepts an `audio_url` to replace generated sound. |
| happyhorse | 100 | yes | vendor-documented | Corpus median is 35 words, the shortest of any family. Audio is listed as built-in. |
| kling | 94 | yes | vendor-documented | Kling 3.0 Standard / Pro / 4K are documented. `kling-4.0` appears in 12 imported prompts from a third-party collection but is NOT listed on the vendor model page consulte |
| sora | 83 | yes | vendor-documented | The Videos API shut down on 2026-09-24 with no one-to-one replacement. These prompts are archival. |
| veo | 67 | yes | vendor-documented | Audio is generated on every request; there is no documented negative-prompt parameter. |
| runway | 24 | no | vendor-documented | Aleph adds edit verbs (add / remove / change / replace / re-light / re-style); Gen-4 is text-to-video. No native audio. |
| hunyuan | 22 | no | vendor-documented | The base model generates no audio. HunyuanVideo-Avatar is audio-*driven* (audio in, not out) — a different variant, not a capability of the base model. |
| jimeng | 22 | yes | third-party-only | No vendor documentation was retrievable on 2026-10-20. Every claim in the corpus about this family is third-party. |
| pika | 22 | no | third-party-only | The vendor docs endpoint did not respond on 2026-10-20. The corpus's 91% negative-constraint rate reflects the `no morphing` convention, not a vendor requirement. |
| gemini-omni | 9 | yes | vendor-documented | Accepted as an instruction-style, iterable surface. |
| higgsfield | 9 | no | third-party-only | The product site describes Genjutsu as motion transfer and object swapping but publishes no per-model duration or audio spec. |
| cogvideox | 8 | no | vendor-documented | Frame counts follow 16N+1 (1.5) or 8N+1 (2B/5B). No audio generation is documented. |
| ltx-video | 8 | unknown | vendor-documented | Audio belongs to LTX-2, not the earlier LTX-Video releases. The repository describes LTX-2 as the audio-video model; do not assume the 13B long-shot build generates sound |
| mochi | 8 | no | vendor-documented | Duration cannot be derived from the vendor material available on 2026-10-20; the frame count alone is not a duration without a frame rate. |
| luma | 2 | no | third-party-only | The corpus names `luma-ray-3.2`. The vendor documentation consulted on 2026-10-20 lists Ray 2 and Ray 2 Flash only, so the 3.2 naming is unconfirmed. |

Families whose capabilities are **not** vendor-documented. Imported prompts from
these are still usable; they just cannot be described as documented behaviour:

- **luma** (third-party-only) — The corpus names `luma-ray-3.2`. The vendor documentation consulted on 2026-10-20 lists Ray 2 and Ray 2 Flash only, so the 3.2 naming is unconfirmed.
- **jimeng** (third-party-only) — No vendor documentation was retrievable on 2026-10-20. Every claim in the corpus about this family is third-party.
- **pika** (third-party-only) — The vendor docs endpoint did not respond on 2026-10-20. The corpus's 91% negative-constraint rate reflects the `no morphing` convention, not a vendor requirement.
- **higgsfield** (third-party-only) — The product site describes Genjutsu as motion transfer and object swapping but publishes no per-model duration or audio spec.

Two entries carry a caveat worth repeating:

- **kling** — the corpus contains 12 prompts labelled `kling-4.0`, but Kling 4.0
  is not on the vendor model list consulted on 2026-10-20. Treat those as
  retrospective templates, not documented behaviour.
- **minimax** — the vendor documents audio as a *reference input* (≤3 clips,
  ≤15 s). Whether generated output includes an audio track is not stated, so the
  registry records *unknown* rather than guessing.

## Structural profile by model family

| Family | n | words p50 | words p90 | avg camera moves | states duration | median duration (s) | dialogue | any audio cue | negative constraint | reference-driven | timeline/beats | labeled blocks |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| seedance | 1096 | 271 | 815 | 1.04 | 47% | 15 | 26% | 58% | 46% | 17% | 39% | 46% |
| minimax | 722 | 269 | 1041 | 0.81 | 43% | 15 | 26% | 57% | 41% | 20% | 41% | 30% |
| wan | 213 | 150 | 269 | 0.47 | 69% | 10 | 20% | 48% | 54% | 17% | 38% | 31% |
| happyhorse | 100 | 35 | 50 | 0.48 | 18% | 8 | 7% | 43% | 4% | 1% | 15% | 3% |
| kling | 94 | 88 | 255 | 0.71 | 32% | 20 | 26% | 73% | 17% | 6% | 15% | 93% |
| sora | 83 | 83 | 173 | 0.52 | 12% | 20 | 7% | 46% | 2% | 7% | 12% | 45% |
| veo | 67 | 145 | 294 | 0.58 | 12% | 14 | 51% | 79% | 13% | 10% | 12% | 27% |
| runway | 24 | 59 | 74 | 0.71 | 8% | 30 | 0% | 13% | 50% | 8% | 4% | 0% |
| hunyuan | 22 | 85 | 115 | 0.68 | 9% | 30 | 9% | 36% | 0% | 0% | 5% | 0% |
| jimeng | 22 | 85 | 262 | 0.91 | 0% | — | 0% | 0% | 0% | 0% | 18% | 0% |
| pika | 22 | 43 | 48 | 0.45 | 9% | 30 | 0% | 9% | 91% | 0% | 9% | 0% |
| gemini-omni | 9 | 13 | 102 | 0.11 | 0% | — | 0% | 11% | 0% | 11% | 0% | 0% |
| higgsfield | 9 | 45 | 542 | 0.56 | 0% | — | 0% | 56% | 22% | 11% | 22% | 11% |
| cogvideox | 8 | 73 | 118 | 0 | 0% | — | 0% | 25% | 13% | 0% | 0% | 0% |
| ltx-video | 8 | 63 | 136 | 0.13 | 0% | — | 13% | 50% | 13% | 0% | 0% | 0% |
| mochi | 8 | 43 | 48 | 0 | 0% | — | 0% | 13% | 0% | 0% | 0% | 0% |

Families with fewer than 5 records are omitted: luma (2).

## How to read these columns

| Column | Meaning |
|---|---|
| **words p50 / p90** | Median and 90th-percentile length. p90 is the number that matters for "will this fit the model's sweet spot". |
| **avg camera moves** | Distinct camera verbs per prompt (push-in, orbit, tracking, handheld, …). Above ~1.5 suggests a multi-shot or camera-heavy prompt. |
| **states duration** | Share of prompts that name a clip length. Low values do not mean the model has no default — they mean the author left it to the platform. |
| **median duration** | Median of the durations that *were* stated. |
| **dialogue** | Share naming speech, narration or lip-sync. |
| **any audio cue** | Dialogue, SFX, ambience, music, or an explicit "no music". Note that "no music" counts as an audio cue: saying nothing is different from saying silence. |
| **negative constraint** | Share with an explicit exclusion ("no watermark", "avoid morphing", 「不要」). |
| **reference-driven** | Share that references an uploaded image/video, first/last frame, or `@图像1` syntax. |
| **timeline/beats** | Share with timestamps, `[Shot N]`, or 「镜头N」 markers. |
| **labeled blocks** | Share using `Label:` structured fields. |

## What the numbers say

Three observations that hold up when you read the prompts behind them:

**1. Two distinct length cultures.** HappyHorse sits at a 35-word median; Seedance
and MiniMax sit near 271. That is a factor of eight. Copy-pasting between them
loses either the subject (short → long) or the detail (long → short), which is
exactly why this repo keeps per-model prompts rather than one canonical text.

**2. Audio direction correlates with family, not with "having audio".** Veo's
prompts name dialogue in 51% of cases; HappyHorse's in 7%. Both families include
audio-capable models. The difference is that Veo authors expect to write speech,
while HappyHorse authors expect to describe a moment and let the sound follow.

**3. Negative constraints are not universal.** Pika-family prompts in this corpus
carry exclusions 91% of the time (the *no morphing* habit), while HappyHorse is at
4%. A prompt ported between them arrives either over-constrained or
under-constrained, depending on direction.

## Reproducing

```bash
npm run build          # regenerates prompts/library.json and this file
node bin/cli.mjs stats # same numbers as a terminal table
node bin/cli.mjs families  # capability registry with verification levels
node bin/cli.mjs inspect <record-id>   # anatomy of a single prompt
```
