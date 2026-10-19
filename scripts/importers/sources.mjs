/**
 * Upstream source registry for the imported prompt library.
 *
 * Rules this registry enforces:
 *   1. Every source must have a detectable, compatible license. MIT, Apache-2.0
 *      and CC0 are importable as-is; CC BY requires visible attribution and is
 *      recorded as such; anything else is refused.
 *   2. Every source must declare where its raw snapshot is committed, so CI can
 *      rebuild without network access and every imported prompt stays auditable.
 *   3. Upstream provenance (which vendor doc, tweet, or platform a prompt came
 *      from) travels with each entry. We do not launder third-party content into
 *      an unattributed blob.
 */
export const SOURCES = [
  {
    id: "lanshu-video-kit",
    name: "lanshu-awesome-ai-video-kit",
    owner: "cclank",
    repositoryUrl: "https://github.com/cclank/lanshu-awesome-ai-video-kit",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "lanshu / cclank — awesome-ai-video-kit (MIT)",
    files: [
      { path: "prompts/data/all-prompts.json", snapshot: "lanshu-all-prompts.json", parser: "lanshu-prompts" },
      { path: "prompts/data/cross-model-matrix.json", snapshot: "lanshu-cross-model-matrix.json", parser: "lanshu-matrix" },
    ],
    notes:
      "Each record carries its own upstream `source.tier` (official / official-platform / reputable-3rd-party / unverified-3rd-party / unknown) and `source.url`. The tier is preserved verbatim; this project does not upgrade anyone's confidence level.",
  },
  {
    id: "zerolu-seedance",
    name: "awesome-seedance",
    owner: "ZeroLu",
    repositoryUrl: "https://github.com/ZeroLu/awesome-seedance",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "ZeroLu — awesome-seedance (MIT)",
    files: [
      { path: "README.md", snapshot: "zerolu-seedance-README.md", parser: "markdown-heading-prompt" },
    ],
    notes:
      "Prompts are grouped by filming style. Many entries credit a specific X/Twitter author; those credits are carried through as `upstreamCredit`.",
  },
  {
    id: "awesome-sora2-prompt",
    name: "awesome_sora2_prompt",
    owner: "zhangchenchen",
    repositoryUrl: "https://github.com/zhangchenchen/awesome_sora2_prompt",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "zhangchenchen — awesome_sora2_prompt (MIT)",
    files: [
      { path: "prompts/official-prompts.md", snapshot: "sora2-official-prompts.md", parser: "markdown-heading-prompt" },
      { path: "prompts/sora2-viral-prompts.md", snapshot: "sora2-viral-prompts.md", parser: "markdown-heading-prompt" },
      { path: "prompts/hyperrealism-landscapes.md", snapshot: "sora2-hyperrealism-landscapes.md", parser: "markdown-heading-prompt" },
    ],
    notes:
      "Includes the official OpenAI Sora showcase prompts and a curated viral set. Sora 2 is retired; these are archival reference and are marked `modelStatus: retired`.",
  },
  {
    id: "learnprompt-seedance",
    name: "LearnPrompt awesome-seedance",
    owner: "LearnPrompt",
    repositoryUrl: "https://github.com/LearnPrompt/awesome-seedance",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "LearnPrompt — awesome-seedance (MIT)",
    files: [
      { path: "data/cases.json", snapshot: "learnprompt-seedance-cases.json", parser: "learnprompt-cases" },
    ],
    notes:
      "886 Seedance cases with per-case creator credit, an evidence level (L0/L1/L2) and, where a case was re-run on another model, the retest verdict. `provenanceVerified` is true for every case. Model strings come from the `models` array; image-model entries in that array are ignored.",
  },
  {
    id: "minimax-h3-cases",
    name: "awesome-MiniMax-H3-cases",
    owner: "SkyNotSilent",
    repositoryUrl: "https://github.com/SkyNotSilent/awesome-MiniMax-H3-cases",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "SkyNotSilent — awesome-MiniMax-H3-cases (MIT)",
    files: [
      { path: "data/cases.json", snapshot: "skynotsilent-minimax-cases.json", parser: "minimax-cases" },
    ],
    notes:
      "2862 MiniMax H3 cases from X. Only records whose prompt is published upstream are imported: `promptProvenance` must be `creator-verbatim` or `official-verbatim`. The remaining 2119 records carry `not-published` and no prompt text, so importing them would mean inventing content.",
  },
  {
    id: "wan-prompts",
    name: "wan-prompts",
    owner: "casimirvance5",
    repositoryUrl: "https://github.com/casimirvance5/wan-prompts",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "casimirvance5 — wan-prompts (MIT)",
    files: [
      { path: "library.jsonl", snapshot: "wan-prompts-library.jsonl", parser: "wan-jsonl" },
    ],
    notes:
      "33 Wan 3.0 recipes with the settings each was written for. Each record carries a `tip` explaining the structural decision, preserved as the record's note.",
  },
  {
    id: "zerolu-seedance-2.5",
    name: "awesome-seedance-2.5",
    owner: "ZeroLu",
    repositoryUrl: "https://github.com/ZeroLu/awesome-seedance-2.5",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "ZeroLu — awesome-seedance-2.5 (MIT)",
    files: [
      { path: "data/community-x-seedance-cases.json", snapshot: "zerolu-seedance25-cases.json", parser: "zerolu-seedance25" },
    ],
    notes:
      "Community X cases for Seedance 2.5. Titles and prompts are bilingual objects; the English body is canonical and the Chinese is kept as `titleAlt`.",
  },
  {
    id: "huy-seedance-prompts",
    name: "awesome-seedance-prompts",
    owner: "HuyLe82US",
    repositoryUrl: "https://github.com/HuyLe82US/awesome-seedance-prompts",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "HuyLe82US — awesome-seedance-prompts (MIT)",
    files: [
      { path: "prompts/", snapshot: "huy-seedance-md.json", parser: "markdown-bundle" },
    ],
    notes:
      "57 single-prompt markdown files, one category per directory. Every file credits its original X author, which is carried through as `upstreamCredit`.",
  },
  {
    id: "veo3-prompts",
    name: "Awesome-Veo3-Prompts",
    owner: "liu-kaining",
    repositoryUrl: "https://github.com/liu-kaining/Awesome-Veo3-Prompts",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "liu-kaining — Awesome-Veo3-Prompts (MIT)",
    files: [
      { path: "prompts/", snapshot: "liu-veo3-md.json", parser: "markdown-bundle-json" },
    ],
    notes:
      "Veo 3 prompts written as structured JSON shot specs (camera / subject / scene / visual_style blocks) rather than prose. The JSON is kept verbatim — reformatting it into prose would destroy the structure that makes it useful.",
  },
  {
    id: "wan-3.0-prompts",
    name: "awesome_wan-3-0-prompts",
    owner: "flaqai",
    repositoryUrl: "https://github.com/flaqai/awesome_wan-3-0-prompts",
    license: "MIT",
    licenseStatus: "verified",
    requireAttribution: true,
    attribution: "flaqai — awesome_wan-3-0-prompts (MIT)",
    files: [
      { path: "prompts/", snapshot: "flaqai-wan3-md.json", parser: "markdown-bundle-categorized" },
    ],
    notes:
      "Wan 3.0 recipes grouped by category file. Each entry opens with a mode line (`T2V / R2V`, suggested duration and aspect ratio) which is captured as the record's params.",
  },
];

export function getSource(id) {
  const source = SOURCES.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown source "${id}"`);
  return source;
}

export function compatibleLicense(license) {
  return ["MIT", "Apache-2.0", "CC0-1.0", "CC BY 4.0"].includes(license);
}
