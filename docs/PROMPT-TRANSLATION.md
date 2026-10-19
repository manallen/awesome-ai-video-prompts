# Prompt Translation: moving a prompt between video models

Most "translate my prompt" advice is vibes. This document is the structural
part that is actually mechanical, plus an explicit boundary for the part that
is not.

## The hard boundary

There are two kinds of translation:

**Structural translation — deterministic.** When the source prompt carries its
meaning in labeled blocks (`Style:`, `Cinematography:`, `Actions:`), those
labels *are* the semantics. Moving them into another model's labels is a
lookup, not a rewrite. `aivp translate` does exactly this and nothing more.

**Semantic rewriting — not deterministic.** When the source is unstructured
prose, the only correct statement is: no rule maps it. A model that wants
`Characters:`/`Action:`/`Camera:` needs someone (or an LLM) to decide which
clause is the character and which is the camera. This repo refuses to guess
and returns the original text with a warning.

That refusal is a feature. A translator that silently invents a `Characters:`
block from prose produces plausible-looking prompts that fail in the model.

## Format families

| Family | Models | Shape | Consequence |
| --- | --- | --- | --- |
| Labeled blocks | Sora 2 (retired), Kling 3.0 | `Label: value` lines | Losing a label loses a whole dimension |
| Four-block | Wan 2.7 | `Entity`/`Scene`/`Motion`/`Sound` | Sound is first-class, not an afterthought |
| Prose + audio | Veo 3.1 | Flowing paragraph, then `Dialogue:` and `Audio:` | Audio must be suppressed explicitly |
| Eight-element prose | Seedance 2.0 | One dense paragraph | Structure lives in clause order |
| Compact prose | HappyHorse 1.0 | 30–55 words | Every word must earn its place |
| Terse prose | Hailuo 02 | 1–3 sentences | Padding degrades output |
| Instruction | Gemini Omni | Imperative, editable | Iterate in follow-up turns |
| Prose + edit verbs | Runway | Description, or Aleph verbs | Editing and generation are different tools |

## What actually changes across the families

### 1. Label vocabulary

The same concept has different names:

| Concept | Sora 2 | Kling 3.0 | Wan 2.7 | Veo 3.1 |
| --- | --- | --- | --- | --- |
| Who | (implicit in prose) | `Characters:` | `Entity:` | sentence subject |
| How it moves | `Actions:` | `Action:` | `Motion:` | verb clauses |
| How it's shot | `Cinematography:` | `Camera:` | (in Motion) | clause in body |
| Sound | `Background Sound:` | `Audio & Style:` | `Sound:` | `Audio:` |
| Speech | `Dialogue:` | inside `Audio & Style:` | inside `Sound:` | `Dialogue:` |
| Exclusions | (none) | `Negative:` | `negative_prompt` param | (none documented) |

Kling's `Audio & Style:` is a genuine collision: one field, two concepts. The
translator keeps them together rather than splitting on a guess.

### 2. Density

The same scene wants roughly:

- **HappyHorse** — 30–55 words
- **Hailuo** — 40–90 words, two or three sentences
- **Kling** — 80–140 words across blocks
- **Veo** — 90–150 words including audio
- **Seedance** — 100–160 words, one paragraph
- **Wan** — 90–150 words across four blocks

Truncating a Seedance prompt to 40 words to fit HappyHorse is not translation;
it is deletion. The CLI reports the overflow instead of hiding it.

### 3. Audio policy

This is where most ported prompts fail.

| Model | Default behaviour | What you must write |
| --- | --- | --- |
| Veo 3.1 | Always generates synchronized audio | `no music` or you get a score |
| Wan 2.7 | Auto BGM/SFX when no `audio_url` | Name the ambience, or supply audio |
| Seedance 2.0 | `generate_audio` defaults true | Put lines in double quotes; say "no music" |
| Kling 3.0 | Optional per request | Put sound in `Audio & Style:` |
| Hailuo / HappyHorse | Native audio on tiers that expose it | Name a sound cue; otherwise silent or generic |
| Runway | No native audio | Dub in post |

A prompt translated from Runway to Veo that says nothing about audio will come
back with music you did not ask for.

### 4. Negative constraints

Sora 2 has no negative field. Kling has `Negative:`. Wan has a
`negative_prompt` parameter with its own length cap. Veo documents no negative
parameter at all.

So: translating *into* Kling means wrapping exclusions in `Negative:`;
translating *into* Veo means folding them into the prose body as "avoid…";
translating *into* Wan means producing a separate short string.

### 5. Camera doctrine

Kling and Veo respond to film vocabulary directly. Hailuo and HappyHorse
degrade when the camera sentence competes with the subject sentence. Seedance
wants exactly one camera verb per shot — asking for a push-in *and* a pan in
the same beat makes the frame unstable.

## The workflow that works

1. **Identify the source family.** Is it labeled or prose? If prose, stop: this
   is a semantic rewrite.
2. **Extract the field bag.** Who, what happens, where, how it's shot, what it
   sounds like, what must not appear.
3. **Render into the target family.** Keep labels; never invent a missing one.
4. **Report gaps.** If the source never said how it sounds, the target's audio
   block should say so, not default silently.
5. **Validate.** `aivp validate <model> <file>` catches contradictions,
   placeholders, missing labels, and length overflow.

## Using an LLM for step 2

If you want semantic rewriting, this is the honest instruction to give a model:

```
You are converting a video prompt between models.

Extract these fields from the source prompt. If the source does not state a
field, return null for it — do not invent content:
  characters, actions[], scene, cinematography, style, light,
  backgroundSound, dialogue, negative

Then render those fields into <TARGET> using only these labels:
  <paste the target's label list>

Rules:
- Never add a fact the source does not contain.
- Never drop a fact the source does contain.
- If the target has no field for something (e.g. exclusions on Veo), fold it
  into the prose body explicitly.
- Output the prompt only, then list every field you returned as null.
```

The "return null, then list it" clause is the whole trick. Ask for gaps
explicitly and the model stops filling them.

## Known limits of `aivp translate`

- **Prose in, structured out**: returns the source text unchanged.
- **Kling `Audio & Style`**: kept as one unit; splitting is a judgement call.
- **Wan multi-shot timestamps**: not parsed; treated as plain motion prose.
- **Seedance reference syntax** (`@图像1`): passed through verbatim.
- **Length**: the compact-prose renderer trims at 55 words and tells you. Reword
  before using in production.

These limits are tested in `test/library.test.mjs`. If a limit changes, the
test changes with it.
