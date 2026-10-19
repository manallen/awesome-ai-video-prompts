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
];

export function getSource(id) {
  const source = SOURCES.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown source "${id}"`);
  return source;
}

export function compatibleLicense(license) {
  return ["MIT", "Apache-2.0", "CC0-1.0", "CC BY 4.0"].includes(license);
}
