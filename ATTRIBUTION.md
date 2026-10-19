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

| Source | Repository | License | Records |
|---|---|---|---|
| lanshu-awesome-ai-video-kit | https://github.com/cclank/lanshu-awesome-ai-video-kit | MIT | 584 |
| awesome-seedance | https://github.com/ZeroLu/awesome-seedance | MIT | 24 |
| awesome_sora2_prompt | https://github.com/zhangchenchen/awesome_sora2_prompt | MIT | 47 |

Counts reflect the build at the time of writing; run `aivp library` for the
current numbers.

### What the importer refuses

An upstream collection is only accepted when:

1. Its license is MIT, Apache-2.0, CC0-1.0 or CC BY 4.0.
2. Its raw bytes are committed under `data/snapshots/`, so imports are
   reproducible offline and auditable against exact source bytes.

Records are rejected at import when they contain unresolved template
placeholders, raw HTML, are URL-only, are too short to be a prompt, or duplicate
an already-imported prompt. Rejection reasons are written to
`prompts/library-report.json` — nothing is dropped silently.

### Collections considered and not imported

| Collection | Reason |
|---|---|
| `songguoxs/awesome-video-prompts` | No license file |
| `YouMind-OpenLab/awesome-gpt-image-2` | CC BY 4.0 — image-only prompts, out of scope here |
| `freestylefly/awesome-gpt-image-2` | MIT but image-only prompts, out of scope |
| `gpt-image2/awesome-gptimage2-prompts` | No license file |
| `itgoyo/awesome-gpt-image2-prompt` | No license file |
| `Anil-matcha/Awesome-GPT-Image-2-API-Prompts` | No license file, near-empty repository |

Out-of-scope here means image prompts, not video. If you want those, the two
MIT image collections above are good starting points.

## Removing an imported record

If you are the author of an upstream prompt and want it removed, open an issue
identifying the `sourceId` and `upstreamId`. Removal means dropping the record
and, where relevant, dropping the entire source from `scripts/importers/sources.mjs`.
The snapshot under `data/snapshots/` is deleted in the same commit.
