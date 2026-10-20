/**
 * Imported library access.
 *
 * The curated scenes in prompts/scenes are hand-written and small. This module
 * exposes the much larger third-party corpus in prompts/library.json, with the
 * provenance intact so a consumer can always answer "who said this, under what
 * license, and how confident were they?".
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { analyzePrompt, summarize } from "./analyze.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const libraryPath = path.resolve(here, "..", "prompts", "library.json");
const familiesPath = path.resolve(here, "..", "prompts", "families.json");

let cached = null;
let familiesCached = null;

export function loadLibrary() {
  if (!cached) {
    cached = JSON.parse(readFileSync(libraryPath, "utf8"));
  }
  return cached;
}

export function libraryIndex() {
  const library = loadLibrary();
  return {
    counts: library.counts,
    bySource: library.bySource,
    byFamily: library.byFamily,
    byTier: library.byTier,
    byKind: library.byKind,
    sources: library.sources,
  };
}

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into",
  "is", "it", "of", "on", "or", "that", "the", "to", "with", "without",
]);

function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Search the imported library.
 *
 * @param {string} query
 * @param {{
 *   limit?: number,
 *   family?: string,
 *   source?: string,
 *   kind?: "prompt" | "snippet",
 *   language?: string,
 *   tier?: string,
 * }} options
 */
export function searchLibrary(query, options = {}) {
  const { limit = 10, family, source, kind, language, tier } = options;
  const library = loadLibrary();
  const tokens = tokenize(query);

  let pool = library.prompts;
  if (family) pool = pool.filter((p) => p.modelFamily === family);
  if (source) pool = pool.filter((p) => p.sourceId === source);
  if (kind) pool = pool.filter((p) => p.kind === kind);
  if (language) pool = pool.filter((p) => p.language === language);
  if (tier) pool = pool.filter((p) => p.upstreamTier === tier);

  if (tokens.length === 0) {
    return pool.slice(0, limit).map((record) => ({ record, score: 0 }));
  }

  const phrase = query.trim().toLowerCase();

  return pool
    .map((record) => {
      const title = record.title.toLowerCase();
      const tags = (record.tags ?? []).join(" ").toLowerCase();
      const prompt = record.prompt.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (title.includes(token)) score += 6;
        if (tags.includes(token)) score += 4;
        if (record.model.toLowerCase().includes(token)) score += 5;
        if (record.modelFamily.includes(token)) score += 4;
        if (record.category.toLowerCase().includes(token)) score += 3;
        // Body matches are real but weak; cap so a long prompt cannot dominate.
        if (prompt.includes(token)) score += 1;
      }
      if (title.includes(phrase)) score += 10;
      return { record, score: Number(score.toFixed(3)) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
    .slice(0, limit);
}

export function libraryRecord(id) {
  const record = loadLibrary().prompts.find((p) => p.id === id);
  if (!record) throw new Error(`No library record "${id}"`);
  return record;
}

/** Attribution lines for a set of records, de-duplicated and sorted. */
export function attributionLines(records) {
  const seen = new Set();
  const lines = [];
  for (const record of records) {
    const key = `${record.sourceId}|${record.upstreamCredit ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push({
      sourceId: record.sourceId,
      sourceUrl: record.sourceUrl,
      license: record.license,
      attribution: record.attribution,
      upstreamCredit: record.upstreamCredit ?? null,
      upstreamUrl: record.upstreamUrl ?? null,
      upstreamTier: record.upstreamTier,
    });
  }
  return lines;
}

// --- corpus statistics -----------------------------------------------------

let analysisCache = null;

function analysesFor(records) {
  const map = new Map();
  for (const record of records) map.set(record.id, analyzePrompt(record.prompt, record.modelFamily));
  return map;
}

/** Per-family structural statistics over the whole imported corpus. */
export function corpusStats(options = {}) {
  const library = loadLibrary();
  if (!analysisCache) analysisCache = analysesFor(library.prompts);
  const rows = summarize(library.prompts, analysisCache);

  const minCount = options.minCount ?? 5;
  return {
    total: library.prompts.length,
    minCount,
    families: rows.filter((r) => r.count >= minCount),
    excluded: rows.filter((r) => r.count < minCount).map((r) => ({ family: r.family, count: r.count })),
  };
}

/** Analysis for one record, by id. */
export function analyzeRecord(id) {
  const record = libraryRecord(id);
  return { record, analysis: analyzePrompt(record.prompt, record.modelFamily) };
}

// --- family registry -------------------------------------------------------

/** The capability registry for the imported corpus (prompts/families.json). */
export function loadFamilies() {
  if (!familiesCached) familiesCached = JSON.parse(readFileSync(familiesPath, "utf8"));
  return familiesCached;
}

/**
 * Families whose capabilities could not be vendor-verified. These are fine to
 * import but must not be described as documented behaviour.
 */
export function unverifiedFamilies() {
  const registry = loadFamilies();
  return registry.families
    .filter((f) => f.verification !== "vendor-documented")
    .map((f) => ({ family: f.family, name: f.name, verification: f.verification, note: f.note }));
}

/** Every family present in the corpus, joined with its registry entry. */
export function familyCoverage() {
  const library = loadLibrary();
  const registry = loadFamilies();
  const byFamily = new Map(registry.families.map((f) => [f.family, f]));
  return Object.entries(library.byFamily)
    .sort((a, b) => b[1] - a[1])
    .map(([family, count]) => {
      const entry = byFamily.get(family);
      return {
        family,
        count,
        registered: Boolean(entry),
        name: entry?.name ?? null,
        vendor: entry?.vendor ?? null,
        verification: entry?.verification ?? "unregistered",
        nativeAudio: entry?.nativeAudio ?? null,
        note: entry?.note ?? null,
      };
    });
}
