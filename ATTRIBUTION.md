# Attribution and source provenance

This repository has two layers, and they have different provenance.

## 1. Curated scenes (`prompts/scenes/`)

Original work by this project, released under the repository [MIT license](LICENSE).
The prompts follow each vendor's documented prompt structure; the scenes,
anchors and authoring notes are ours.

Vendor capability claims in `prompts/models.json` cite the vendor documentation
in each entry's `sources` array.

## 2. Imported library (`prompts/library.json`)

Imported from third-party open-source collections. **Every record keeps:**

| Field | Meaning |
|---|---|
| `sourceId` / `sourceName` / `sourceUrl` | Which collection it came from |
| `license` | That collection's license |
| `upstreamId` | The record's id inside the upstream collection |
| `upstreamCredit` / `upstreamUrl` | The original author or platform the upstream collection credits |
| `upstreamTier` | The upstream collection's own confidence label, preserved verbatim |

We do not re-grade the upstream confidence labels. An `unverified-3rd-party`
entry stays labeled that way here.

### Sources

All ten are MIT. Counts are illustrative — run `aivp library` for current numbers.

| Source | Repository | Records |
|---|---|---:|
| LearnPrompt awesome-seedance | https://github.com/LearnPrompt/awesome-seedance | 879 |
| awesome-MiniMax-H3-cases | https://github.com/SkyNotSilent/awesome-MiniMax-H3-cases | 684 |
| awesome-ai-video-kit | https://github.com/cclank/lanshu-awesome-ai-video-kit | 596 |
| awesome_wan-3-0-prompts | https://github.com/flaqai/awesome_wan-3-0-prompts | 157 |
| awesome_sora2_prompt | https://github.com/zhangchenchen/awesome_sora2_prompt | 47 |
| awesome-seedance-prompts | https://github.com/HuyLe82US/awesome-seedance-prompts | 44 |
| wan-prompts | https://github.com/casimirvance5/wan-prompts | 33 |
| Awesome-Veo3-Prompts | https://github.com/liu-kaining/Awesome-Veo3-Prompts | 27 |
| awesome-seedance | https://github.com/ZeroLu/awesome-seedance | 24 |
| awesome-seedance-2.5 | https://github.com/ZeroLu/awesome-seedance-2.5 | 18 |

### What the importer refuses

An upstream collection is only accepted when:

1. Its license is MIT, Apache-2.0, CC0-1.0 or CC BY 4.0.
2. Its raw bytes are committed under `data/snapshots/`, so imports are
   reproducible offline and auditable against exact source bytes.

Records are rejected at import when they contain unresolved template
placeholders, raw HTML, are URL-only, are too short to be a prompt, or duplicate
an already-imported prompt. Rejection reasons are written to
`prompts/library-report.json` — nothing is dropped silently.

One special case worth stating plainly: **2119 of the 2862 MiniMax H3 cases are
not imported.** Those records carry `promptProvenance: "not-published"` and no
prompt text. Importing them would mean writing prompts and attributing them to
their authors, so we import only the 743 records whose prompt was published
upstream.

### Collections considered and not imported

| Collection | Reason |
|---|---|
| `songguoxs/awesome-video-prompts` | No license file |
| `gpt-image2/awesome-gptimage2-prompts` | No license file |
| `itgoyo/awesome-gpt-image2-prompt` | No license file |
| `Anil-matcha/Awesome-GPT-Image-2-API-Prompts` | No license file, near-empty repository |
| `YouMind-OpenLab/awesome-seedance-2-prompts` | NOASSERTION — license could not be resolved |
| `AtlasCloudAI/awesome-seedance-2.5-prompts-skills` | NOASSERTION |
| `BaYue-SYJ/shuixian-prompts` | NOASSERTION |
| `YouMind-OpenLab/awesome-gpt-image-2` | CC BY, but image-only — out of scope here |
| `freestylefly/awesome-gpt-image-2` | MIT, but image-only — out of scope |
| `Emily2040/seedance-2.0` | MIT, but a skill/guide set with no prompt corpus |
| `dexhunter/seedance2-skill` | MIT, but a single guidance SKILL.md |
| `OSideMedia/higgsfield-ai-prompt-skill` | MIT, prompt rules rather than prompts |

Out-of-scope means image prompts, not video. If you want those, the two MIT
image collections above are good starting points.

## Removing an imported record

If you are the author of an upstream prompt and want it removed, open an issue
identifying the `sourceId` and `upstreamId`. Removal means dropping the record
and, where relevant, dropping the entire source from
`scripts/importers/sources.mjs`. The snapshot under `data/snapshots/` is deleted
in the same commit.
