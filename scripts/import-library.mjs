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
// useful rather than noise. Cap well above the 95th percentile so only true
// dumps get dropped.
const MAX_PROMPT_CHARS = 9000;

// Template placeholders that never resolve — these are prompt *shapes*, not
// prompts, and they produce nothing usable in a real generation.
const PLACEHOLDER = /\[(?=[^\]"']*[A-Z]{3,})[^\]"']{1,60}\]|\{[A-Za-z][A-Za-z ]{2,}\}|\b(BRAND NAME|CHARACTER NAME|PRODUCT NAME|CITY NAME|ICONIC OBJECT)\b/;
const HTML_MARKUP = /<\/?(?:div|p|span|img|br|center|figure|table)\b/i;
const URL_ONLY = /^(?:https?:\/\/|www\.)\S+$/i;
const NON_PROMPT_TITLE = /^(table of contents|introduction|overview|sponsor|faq|license|contributing|changelog|resources)/i;

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
  if (PLACEHOLDER.test(prompt)) return { ok: false, reason: "placeholder" };
  if (HTML_MARKUP.test(prompt)) return { ok: false, reason: "html_markup" };
  if (!record.title || record.title.length < 3) return { ok: false, reason: "missing_title" };
  if (NON_PROMPT_TITLE.test(record.title)) return { ok: false, reason: "non_prompt_section" };
  if (!record.model) return { ok: false, reason: "missing_model" };
  // De-duplicate boilerplate intros that happen to be short paragraphs.
  if (/^(this document|this section|these prompts|the following)/i.test(prompt)) {
    return { ok: false, reason: "boilerplate" };
  }
  return { ok: true };
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
          id: `${source.id}::${row.upstreamId}`,
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
