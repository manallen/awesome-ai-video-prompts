#!/usr/bin/env node
/**
 * Fetch, snapshot and normalize prompts from upstream open-source collections.
 *
 *   node scripts/import-library.mjs            # use committed snapshots
 *   node scripts/import-library.mjs --refresh  # re-download snapshots first
 *
 * Design decisions:
 *   - Snapshots are committed to data/snapshots/. Builds never touch the
 *     network, CI stays deterministic, and every imported prompt remains
 *     auditable against the exact bytes it came from.
 *   - Upstream model strings are preserved verbatim. A family and variant are
 *     derived alongside them, never in place of them.
 *   - Records that fail quality gates are counted and reported, not silently
 *     dropped. The report is written to prompts/library-report.json.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SOURCES, compatibleLicense } from "./importers/sources.mjs";
import { modelFamily, modelVariant } from "./importers/families.mjs";
import { splitSections, extractPromptBlock, extractMedia, plainText, slugify } from "./importers/markdown.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const snapshotDir = path.join(root, "data", "snapshots");
const rawDir = path.join(root, "data", "raw");

const refresh = process.argv.includes("--refresh");

// --- quality gates ---------------------------------------------------------

const MIN_PROMPT_CHARS = 40;
// A few upstream entries are long multi-shot specs, which are legitimately
// useful rather than noise. Cap well above the 99th percentile so only true
// dumps get dropped.
const MAX_PROMPT_CHARS = 20000;

// Template placeholders that never resolve — these are prompt *shapes*, not
// prompts, and they produce nothing usable in a real generation.
const PLACEHOLDER = /\[(?=[^\]"']*[A-Z]{3,})[^\]"']{1,60}\]|\{[A-Za-z][A-Za-z ]{2,}\}|\b(BRAND NAME|CHARACTER NAME|PRODUCT NAME|CITY NAME|ICONIC OBJECT)\b/;
/**
 * A bracketed ALL-CAPS token on its own line is a *section header*
 * (`[OUTPUT]`, `[TIMED SHOTS]`), which is real prompt structure, not an
 * unfilled placeholder. Mid-sentence brackets remain suspicious.
 */
const SECTION_HEADER = /^\s*\[[A-Z0-9][A-Z0-9 /&'’+–—-]{1,40}\]\s*$/;
const HTML_MARKUP = /<\/?(?:div|p|span|img|br|center|figure|table)\b/i;
const URL_ONLY = /^(?:https?:\/\/|www\.)\S+$/i;
const NON_PROMPT_TITLE = /^(table of contents|introduction|overview|sponsor|faq|license|contributing|changelog|resources)/i;

/** Lines that are pure section headers carry no placeholder signal. */
function stripSectionHeaders(prompt) {
  return prompt
    .split(/\r?\n/)
    .filter((line) => !SECTION_HEADER.test(line))
    .join("\n");
}

function hasCJK(text) {
  return /[一-鿿]/.test(text);
}

function promptHash(prompt) {
  return createHash("sha256").update(prompt.replace(/\s+/g, " ").trim().toLowerCase()).digest("hex").slice(0, 16);
}

/**
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
function gate(record) {
  const prompt = record.prompt ?? "";
  if (!prompt || prompt.length < MIN_PROMPT_CHARS) return { ok: false, reason: "too_short" };
  if (prompt.length > MAX_PROMPT_CHARS) return { ok: false, reason: "too_long" };
  if (URL_ONLY.test(prompt)) return { ok: false, reason: "url_only" };
  if (PLACEHOLDER.test(stripSectionHeaders(prompt))) return { ok: false, reason: "placeholder" };
  if (HTML_MARKUP.test(prompt)) return { ok: false, reason: "html_markup" };
  if (!record.title || record.title.length < 3) return { ok: false, reason: "missing_title" };
  if (NON_PROMPT_TITLE.test(record.title)) return { ok: false, reason: "non_prompt_section" };
  if (!record.model) return { ok: false, reason: "missing_model" };
  // De-duplicate boilerplate intros that happen to be short paragraphs.
  // Only short preambles are boilerplate; a long body that happens to open
  // with "The following was generated…" is a real prompt.
  if (prompt.length < 200 && /^(this document|this section|these prompts)/i.test(prompt)) {
    return { ok: false, reason: "boilerplate" };
  }
  return { ok: true };
}

/**
 * Record ids are copied into shell arguments (`aivp get <id>`), so the only
 * allowed characters are those that survive without quoting. Upstream paths
 * contain '/', spaces and Unicode — normalize them here.
 */
function safeId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_.:\-#]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function baseRecord(source, file, fields) {
  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: source.repositoryUrl,
    sourceFile: file.path,
    license: source.license,
    attribution: source.attribution,
    requireAttribution: Boolean(source.requireAttribution),
    ...fields,
  };
}

// --- parsers ---------------------------------------------------------------

function parseLanshuPrompts(json) {
  const data = JSON.parse(json);
  return data.prompts.map((entry) =>
    baseRecord(
      { id: "lanshu-video-kit", name: "lanshu-awesome-ai-video-kit", repositoryUrl: "https://github.com/cclank/lanshu-awesome-ai-video-kit", license: "MIT", attribution: "lanshu / cclank — awesome-ai-video-kit (MIT)", requireAttribution: true },
      { path: "prompts/data/all-prompts.json" },
      {
        upstreamId: entry.id,
        model: entry.model,
        category: entry.category,
        title: entry.title,
        prompt: entry.prompt,
        tags: entry.tags ?? [],
        params: entry.params ?? {},
        upstreamTier: entry.source?.tier ?? "unknown",
        upstreamName: entry.source?.name ?? null,
        upstreamUrl: entry.source?.url ?? null,
        upstreamCredit: entry.source?.name ?? null,
        notes: entry.notes ?? null,
      },
    ),
  );
}

function parseLanshuMatrix(json) {
  const data = JSON.parse(json);
  const rows = [];
  for (const scenario of data.scenarios ?? []) {
    for (const [model, entry] of Object.entries(scenario.by_model ?? {})) {
      rows.push(
        baseRecord(
          { id: "lanshu-video-kit", name: "lanshu-awesome-ai-video-kit", repositoryUrl: "https://github.com/cclank/lanshu-awesome-ai-video-kit", license: "MIT", attribution: "lanshu / cclank — awesome-ai-video-kit (MIT)", requireAttribution: true },
          { path: "prompts/data/cross-model-matrix.json" },
          {
            upstreamId: `${scenario.id}__${model}`,
            model,
            category: scenario.category,
            title: scenario.title,
            prompt: entry.prompt,
            tags: ["cross-model-benchmark", scenario.id],
            params: {},
            upstreamTier: "reputable-3rd-party",
            upstreamName: "cross-model matrix",
            upstreamUrl: "https://github.com/cclank/lanshu-awesome-ai-video-kit",
            upstreamCredit: entry.method ?? null,
            notes: entry.method ? `Authoring method: ${entry.method}` : null,
          },
        ),
      );
    }
  }
  return rows;
}

/**
 * Generic markdown importer. The model is inferred from the document or from
 * an optional override on the file definition.
 */
function parseMarkdownPrompts(markdown, source, file, defaultModel) {
  const rows = [];
  for (const section of splitSections(markdown)) {
    if (section.level < 3) continue;
    const block = extractPromptBlock(section.text);
    if (!block) continue;
    const media = extractMedia(section.text);
    const model = file.model ?? defaultModel ?? "unspecified";
    rows.push(
      baseRecord(source, file, {
        // Stable, readable, and free of spaces/punctuation so it survives
        // copy-paste into a shell argument.
        upstreamId: `${file.snapshot.replace(/\.md$/i, "")}#${slugify(section.heading)}`,
        model,
        category: file.category ?? "imported",
        title: plainText(section.heading),
        prompt: block.text,
        tags: file.tags ?? [],
        params: {},
        upstreamTier: "reputable-3rd-party",
        upstreamName: source.name,
        upstreamUrl: media.upstreamUrl ?? source.repositoryUrl,
        upstreamCredit: media.upstreamCredit,
        notes: null,
        image: media.image,
      }),
    );
  }
  return rows;
}

// --- additional parsers ----------------------------------------------------

// Image-model entries appear inside video prompt datasets; they are evidence
// that the same case was also run on an image model, not video prompts.
const IMAGE_MODELS = new Set(["GPT Image", "Nano Banana", "Midjourney", "DALL·E", "DALL-E", "Flux", "Ideogram"]);

/** Pick a bilingual {fallback:{zh,en}} or plain string. */
function bilingual(value, prefer = "en") {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value[prefer] === "string") return value[prefer];
    if (value.fallback) {
      return value.fallback[prefer] ?? value.fallback.zh ?? value.fallback.en ?? null;
    }
  }
  return null;
}

function parseLearnPromptCases(text) {
  const data = JSON.parse(text);
  const rows = [];
  const SOURCE = {
    id: "learnprompt-seedance",
    name: "LearnPrompt awesome-seedance",
    repositoryUrl: "https://github.com/LearnPrompt/awesome-seedance",
    license: "MIT",
    attribution: "LearnPrompt — awesome-seedance (MIT)",
    requireAttribution: true,
  };
  for (const c of data.cases ?? []) {
    const prompt = c.promptFull;
    if (!prompt) continue;
    // `models` lists every model the case was tried on. Take the first video
    // model; image models are recorded as a tag rather than a separate record.
    const models = (c.models ?? []).filter((m) => !IMAGE_MODELS.has(m));
    const model = models[0] ?? "seedance-2.0";
    const tags = [...(c.tags ?? [])];
    if (c.evidenceLevel) tags.push(`evidence:${c.evidenceLevel}`);
    if (c.stabilityScore != null) tags.push(`stability:${c.stabilityScore}`);

    rows.push(
      baseRecord(SOURCE, { path: "data/cases.json" }, {
        upstreamId: c.slug,
        model,
        category: "seedance-case",
        title: c.titleEn || c.title || c.slug,
        prompt,
        tags,
        params: {},
        // The collection states provenance was verified for every case and
        // grades evidence as L0–L2; that is a curated third-party tier.
        upstreamTier: "reputable-3rd-party",
        upstreamName: SOURCE.name,
        upstreamUrl: c.sourceUrl ?? null,
        upstreamCredit: c.creator ?? null,
        // Keep every model the case was tried on; `model` above is the primary.
        modelsAll: (c.models ?? []).filter((m) => !IMAGE_MODELS.has(m)),
        notes: (c.retestSummary ?? null) && c.retestSummary.runs > 0
          ? `Upstream re-ran this case on ${c.retestSummary.latest?.model ?? "another model"}: ${c.retestSummary.latest?.verdict ?? "unknown"}.`
          : null,
        image: c.posterUrl ?? null,
      }),
    );
  }
  return rows;
}

function parseMiniMaxCases(text) {
  const cases = JSON.parse(text);
  const rows = [];
  const SOURCE = {
    id: "minimax-h3-cases",
    name: "awesome-MiniMax-H3-cases",
    repositoryUrl: "https://github.com/SkyNotSilent/awesome-MiniMax-H3-cases",
    license: "MIT",
    attribution: "SkyNotSilent — awesome-MiniMax-H3-cases (MIT)",
    requireAttribution: true,
  };
  for (const c of cases) {
    // 2119 of 2862 records have promptProvenance "not-published" and no prompt
    // text. Importing them would mean generating content and calling it theirs.
    if (!["creator-verbatim", "official-verbatim"].includes(c.promptProvenance)) continue;
    if (!c.prompt) continue;

    rows.push(
      baseRecord(SOURCE, { path: "data/cases.json" }, {
        upstreamId: c.id,
        model: c.model ?? "minimax-h3",
        category: c.category ?? "imported",
        title: c.titleEn || c.title || c.id,
        prompt: c.prompt,
        tags: [...(c.tags ?? []), ...(c.styles ?? []), ...(c.scenes ?? [])].filter(Boolean),
        params: {
          ...(c.duration ? { duration: c.duration } : {}),
          ...(c.aspectRatio ? { aspect: c.aspectRatio } : {}),
          ...(c.resolution ? { resolution: c.resolution } : {}),
          ...(c.mode ? { mode: c.mode } : {}),
        },
        upstreamTier: c.verified ? "official" : "reputable-3rd-party",
        upstreamName: SOURCE.name,
        upstreamUrl: c.sourceUrl ?? null,
        upstreamCredit: c.author ?? c.sourceLabel ?? null,
        notes: c.promptProvenance === "official-verbatim" ? "Prompt published verbatim by the vendor." : null,
        image: c.posterUrl ?? null,
      }),
    );
  }
  return rows;
}

function parseWanJsonl(text) {
  const rows = [];
  const SOURCE = {
    id: "wan-prompts",
    name: "wan-prompts",
    repositoryUrl: "https://github.com/casimirvance5/wan-prompts",
    license: "MIT",
    attribution: "casimirvance5 — wan-prompts (MIT)",
    requireAttribution: true,
  };
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    rows.push(
      baseRecord(SOURCE, { path: "library.jsonl" }, {
        upstreamId: `n${entry.n}`,
        model: entry.model ?? "wan-3",
        category: entry.category ?? "imported",
        title: entry.title ?? `Wan recipe ${entry.n}`,
        prompt: entry.prompt ?? "",
        tags: [entry.mode, entry.category].filter(Boolean),
        params: {
          ...(entry.duration ? { duration: `${entry.duration}s` } : {}),
          ...(entry.aspect_ratio ? { aspect: entry.aspect_ratio } : {}),
          ...(entry.resolution ? { resolution: entry.resolution } : {}),
        },
        upstreamTier: "reputable-3rd-party",
        upstreamName: SOURCE.name,
        upstreamUrl: SOURCE.repositoryUrl,
        upstreamCredit: "casimirvance5",
        notes: entry.tip ?? null,
      }),
    );
  }
  return rows;
}

function parseZeroLuSeedance25(text) {
  const cases = JSON.parse(text);
  const rows = [];
  const SOURCE = {
    id: "zerolu-seedance-2.5",
    name: "awesome-seedance-2.5",
    repositoryUrl: "https://github.com/ZeroLu/awesome-seedance-2.5",
    license: "MIT",
    attribution: "ZeroLu — awesome-seedance-2.5 (MIT)",
    requireAttribution: true,
  };
  for (const c of cases) {
    const prompt = bilingual(c.prompt, c.prompt?.originalLanguage === "zh" ? "zh" : "en");
    if (!prompt) continue;
    rows.push(
      baseRecord(SOURCE, { path: "data/community-x-seedance-cases.json" }, {
        upstreamId: c.id,
        model: "seedance-2.5",
        category: c.category ?? "community",
        title: bilingual(c.title, "en") ?? c.id,
        prompt,
        tags: [c.category ?? "community", "x-community"].filter(Boolean),
        params: {},
        upstreamTier: "reputable-3rd-party",
        upstreamName: SOURCE.name,
        upstreamUrl: c.source?.tweetUrl ?? SOURCE.repositoryUrl,
        upstreamCredit: c.source?.author?.username
          ? `@${c.source.author.username}`
          : c.source?.author?.name ?? null,
        notes: c.source?.promptStatus && c.source.promptStatus !== "complete"
          ? `Upstream prompt status: ${c.source.promptStatus}.`
          : null,
      }),
    );
  }
  return rows;
}

/**
 * Markdown bundles are a JSON map of { relativePath: markdown }. One file may
 * hold many prompts, so each section is a candidate record.
 */
function parseMarkdownBundle(text, source, file, mode) {
  const bundle = JSON.parse(text);
  const rows = [];
  const categoryFromPath = (p) => {
    const dir = p.split("/").slice(-2, -1)[0] ?? "imported";
    return dir.replace(/^\d+-/, "");
  };

  for (const [filePath, markdown] of Object.entries(bundle)) {
    // Skip index/README files: they list prompts rather than holding one.
    if (/readme/i.test(filePath)) continue;

    if (mode === "json") {
      // liu-kaining style: one file, one structured JSON shot spec.
      const heading = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim();
      const fence = /```json\s*\n([\s\S]*?)\n```/.exec(markdown);
      if (!fence) continue;
      rows.push(
        baseRecord(source, file, {
          upstreamId: filePath.replace(/^prompts\//, "").replace(/\.md$/, ""),
          model: "veo-3",
          category: categoryFromPath(filePath),
          title: plainText(heading ?? filePath),
          prompt: fence[1].trim(),
          tags: ["structured-json"],
          params: {},
          upstreamTier: "reputable-3rd-party",
          upstreamName: source.name,
          upstreamUrl: source.repositoryUrl,
          upstreamCredit: source.name,
          notes: "Structured JSON shot spec — kept as JSON, not flattened to prose.",
        }),
      );
      continue;
    }

    // HuyLe82US style: one file per prompt, one fenced block, one credit line.
    const block = extractPromptBlock(markdown) ?? (() => {
      const m = /```(?:text|)\s*\n([\s\S]*?)\n```/.exec(markdown);
      return m ? { text: m[1].trim() } : null;
    })();
    if (!block) continue;

    const media = extractMedia(markdown);
    const heading = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim();
    rows.push(
      baseRecord(source, file, {
        upstreamId: filePath.replace(/^prompts\//, "").replace(/\.md$/, ""),
        model: file.model ?? "seedance-2.0",
        category: categoryFromPath(filePath),
        title: plainText(heading ?? filePath),
        prompt: block.text,
        tags: [],
        params: {},
        upstreamTier: "reputable-3rd-party",
        upstreamName: source.name,
        upstreamUrl: media.upstreamUrl ?? source.repositoryUrl,
        upstreamCredit: media.upstreamCredit,
        notes: null,
        image: media.image,
      }),
    );
  }
  return rows;
}

/** flaqai style: category files, `## NN｜Title` headings, bare fenced prompts. */
function parseMarkdownCategorized(text, source, file) {
  const bundle = JSON.parse(text);
  const rows = [];
  for (const [filePath, markdown] of Object.entries(bundle)) {
    if (/readme/i.test(filePath)) continue;
    const category = path.basename(filePath, ".md");
    for (const section of splitSections(markdown)) {
      if (section.level !== 2) continue;
      const fence = /```(?:text|)\s*\n([\s\S]*?)\n```/.exec(section.text);
      if (!fence) continue;
      // "## 01｜末班渡轮上的未寄信" → title after the full-width bar
      const title = section.heading.split(/[｜|]/).slice(1).join("｜").trim() || section.heading;
      const modeLine = /\*\*模式\*\*[:：]\s*(.+?)(?:\n|$)/.exec(section.text)?.[1] ?? "";
      const suggest = /\*\*建议\*\*[:：]\s*(.+?)(?:\n|$)/.exec(section.text)?.[1] ?? "";
      rows.push(
        baseRecord(source, file, {
          upstreamId: `${category}#${slugify(section.heading)}`,
          model: "wan-3.0",
          category,
          title: plainText(title),
          prompt: fence[1].trim(),
          tags: modeLine ? modeLine.split(/[/、]/).map((s) => s.trim()).filter(Boolean) : [],
          params: suggest ? { suggestion: plainText(suggest) } : {},
          upstreamTier: "reputable-3rd-party",
          upstreamName: source.name,
          upstreamUrl: source.repositoryUrl,
          upstreamCredit: source.name,
          notes: null,
        }),
      );
    }
  }
  return rows;
}

// --- fetch -----------------------------------------------------------------

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function refreshSnapshots() {
  mkdirSync(snapshotDir, { recursive: true });
  for (const source of SOURCES) {
    if (!compatibleLicense(source.license)) {
      throw new Error(`Refusing to import ${source.id}: license ${source.license} is not compatible.`);
    }
    for (const file of source.files) {
      const url = `https://raw.githubusercontent.com/${source.owner}/${source.repositoryUrl.split("/").pop()}/HEAD/${file.path}`;
      process.stderr.write(`fetch ${source.id}/${file.path}\n`);
      const text = await fetchText(url);
      writeFileSync(path.join(snapshotDir, file.snapshot), text);
      process.stderr.write(`  ${text.length} bytes → ${file.snapshot}\n`);
    }
  }
}

function readSnapshot(file) {
  const target = path.join(snapshotDir, file.snapshot);
  if (!existsSync(target)) {
    throw new Error(`Missing snapshot ${file.snapshot}. Run: node scripts/import-library.mjs --refresh`);
  }
  return readFileSync(target, "utf8");
}

// --- main ------------------------------------------------------------------

const PARSERS = {
  "lanshu-prompts": (text) => parseLanshuPrompts(text),
  "lanshu-matrix": (text) => parseLanshuMatrix(text),
  "markdown-heading-prompt": (text, source, file) => parseMarkdownPrompts(text, source, file),
  "learnprompt-cases": (text) => parseLearnPromptCases(text),
  "minimax-cases": (text) => parseMiniMaxCases(text),
  "wan-jsonl": (text) => parseWanJsonl(text),
  "zerolu-seedance25": (text) => parseZeroLuSeedance25(text),
  "markdown-bundle": (text, source, file) => parseMarkdownBundle(text, source, file, "text"),
  "markdown-bundle-json": (text, source, file) => parseMarkdownBundle(text, source, file, "json"),
  "markdown-bundle-categorized": (text, source, file) => parseMarkdownCategorized(text, source, file),
};

// Markdown sources need a default model because the documents do not always
// name one per section.
const MARKDOWN_MODEL = {
  "zerolu-seedance": "seedance-2.0",
  "awesome-sora2-prompt": "sora-2",
};

async function main() {
  if (refresh) await refreshSnapshots();

  const records = [];
  const rejected = [];
  const seenHashes = new Map();

  for (const source of SOURCES) {
    if (!compatibleLicense(source.license)) {
      rejected.push({ sourceId: source.id, reason: "license_incompatible", license: source.license });
      continue;
    }

    for (const file of source.files) {
      const text = readSnapshot(file);
      const parser = PARSERS[file.parser];
      if (!parser) throw new Error(`No parser "${file.parser}"`);

      let rows;
      try {
        // The legacy per-file markdown parser needs source + file context;
        // everything else takes the raw text only.
        rows = file.parser.startsWith("markdown")
          ? parser(text, source, { ...file, model: file.model ?? MARKDOWN_MODEL[source.id] }, MARKDOWN_MODEL[source.id])
          : parser(text);
      } catch (error) {
        rejected.push({ sourceId: source.id, file: file.path, reason: "parse_error", message: error.message });
        continue;
      }

      for (const row of rows) {
        const verdict = gate(row);
        if (!verdict.ok) {
          rejected.push({ sourceId: source.id, upstreamId: row.upstreamId, reason: verdict.reason });
          continue;
        }

        const hash = promptHash(row.prompt);
        if (seenHashes.has(hash)) {
          rejected.push({ sourceId: source.id, upstreamId: row.upstreamId, reason: "duplicate", duplicateOf: seenHashes.get(hash) });
          continue;
        }
        seenHashes.set(hash, `${source.id}:${row.upstreamId}`);

        const family = modelFamily(row.model);
        // Some upstream entries are instruction *snippets* ("using image1 as a
        // reference for the visual style") rather than full scene prompts. They
        // are useful, but they are not interchangeable with a scene prompt, so
        // the distinction travels with the record.
        const kind =
          row.category === "technique-snippet" || row.prompt.length < 120 ? "snippet" : "prompt";
        records.push({
          id: `${source.id}::${safeId(row.upstreamId)}`,
          ...row,
          kind,
          modelFamily: family,
          modelVariant: modelVariant(row.model),
          language: hasCJK(row.prompt) ? "zh" : "en",
          promptHash: hash,
          charCount: row.prompt.length,
        });
      }
    }
  }

  records.sort((a, b) => a.id.localeCompare(b.id));

  const byFamily = {};
  const bySource = {};
  const byTier = {};
  const byKind = {};
  for (const record of records) {
    byFamily[record.modelFamily] = (byFamily[record.modelFamily] ?? 0) + 1;
    bySource[record.sourceId] = (bySource[record.sourceId] ?? 0) + 1;
    byTier[record.upstreamTier] = (byTier[record.upstreamTier] ?? 0) + 1;
    byKind[record.kind] = (byKind[record.kind] ?? 0) + 1;
  }

  const rejectReasons = {};
  for (const item of rejected) rejectReasons[item.reason] = (rejectReasons[item.reason] ?? 0) + 1;

  mkdirSync(rawDir, { recursive: true });
  const library = {
    schemaVersion: 1,
    description:
      "Prompts imported from third-party open-source collections. Model strings are upstream-verbatim; family and variant are derived. Every record keeps its source, license and attribution.",
    counts: { records: records.length, rejected: rejected.length },
    bySource,
    byFamily,
    byTier,
    byKind,
    rejectReasons,
    sources: SOURCES.map(({ id, name, owner, repositoryUrl, license, licenseStatus, attribution, notes }) => ({
      id, name, owner, repositoryUrl, license, licenseStatus, attribution, notes,
    })),
    prompts: records,
  };

  writeFileSync(path.join(root, "prompts", "library.json"), `${JSON.stringify(library, null, 2)}\n`);

  const report = {
    generatedFrom: "data/snapshots",
    counts: library.counts,
    bySource,
    byFamily,
    byTier,
    byKind,
    rejectReasons,
    rejected,
  };
  writeFileSync(path.join(root, "prompts", "library-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Imported ${records.length} prompts from ${SOURCES.length} sources (${rejected.length} rejected)`);
  console.log("  by source:", JSON.stringify(bySource));
  console.log("  by family:", JSON.stringify(byFamily));
  console.log("  by kind:", JSON.stringify(byKind));
  console.log("  reject reasons:", JSON.stringify(rejectReasons));
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exit(1);
});
