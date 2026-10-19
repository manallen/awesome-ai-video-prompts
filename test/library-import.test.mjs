import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadLibrary,
  libraryIndex,
  searchLibrary,
  libraryRecord,
  attributionLines,
} from "../src/library.mjs";
import { modelFamily, modelVariant } from "../scripts/importers/families.mjs";
import { splitSections, extractPromptBlock, extractMedia, slugify } from "../scripts/importers/markdown.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const library = loadLibrary();

test("library: loads and is internally consistent", () => {
  assert.ok(library.prompts.length > 500, `expected >500 records, got ${library.prompts.length}`);
  assert.equal(library.prompts.length, library.counts.records);
  assert.ok(library.sources.length >= 3);
});

test("library: every record keeps license, attribution and provenance", () => {
  for (const record of library.prompts) {
    assert.ok(record.sourceId, `${record.id} missing sourceId`);
    assert.ok(record.sourceUrl, `${record.id} missing sourceUrl`);
    assert.ok(record.license, `${record.id} missing license`);
    assert.ok(record.attribution, `${record.id} missing attribution`);
    assert.ok(record.upstreamId, `${record.id} missing upstreamId`);
    assert.ok(["MIT", "Apache-2.0", "CC0-1.0", "CC BY 4.0"].includes(record.license), `${record.id} unexpected license`);
  }
});

test("library: only compatible licenses are imported", () => {
  const allowed = new Set(["MIT", "Apache-2.0", "CC0-1.0", "CC BY 4.0"]);
  for (const source of library.sources) {
    assert.ok(allowed.has(source.license), `${source.id} has non-importable license ${source.license}`);
  }
});

test("library: record ids are unique and shell-safe", () => {
  const ids = library.prompts.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate ids");
  for (const id of ids) {
    assert.match(id, /^[A-Za-z0-9_:#.\-]+$/, `unsafe id "${id}"`);
  }
});

test("library: no placeholder or HTML leakage survived the gate", () => {
  const placeholder = /\[(?=[^\]"']*[A-Z]{3,})[^\]"']{1,60}\]|\{[A-Za-z][A-Za-z ]{2,}\}|BRAND NAME/;
  const html = /<\/?(?:div|p|span|img|br)\b/i;
  for (const record of library.prompts) {
    assert.doesNotMatch(record.prompt, placeholder, `${record.id} has a placeholder`);
    assert.doesNotMatch(record.prompt, html, `${record.id} has raw HTML`);
  }
});

test("library: every record carries a derived family", () => {
  for (const record of library.prompts) {
    assert.ok(record.modelFamily, `${record.id} missing family`);
    assert.notEqual(record.modelFamily, "other", `${record.id} model "${record.model}" has no family`);
  }
});

test("library: upstream tier is preserved verbatim, never upgraded", () => {
  const allowed = new Set([
    "official",
    "official-platform",
    "reputable-3rd-party",
    "unverified-3rd-party",
    "unknown",
  ]);
  for (const record of library.prompts) {
    assert.ok(allowed.has(record.upstreamTier), `${record.id} unknown tier "${record.upstreamTier}"`);
  }
  // The importer must not have invented a "verified" tier.
  assert.ok(!library.prompts.some((r) => r.upstreamTier === "verified"));
});

test("library: snapshots backing each source are committed", () => {
  const report = JSON.parse(readFileSync(path.join(root, "prompts", "library-report.json"), "utf8"));
  for (const source of library.sources) {
    assert.ok(report.bySource[source.id] > 0, `${source.id} imported nothing`);
  }
  // Rejections must be accounted for, not silently dropped.
  assert.ok(report.rejected.length === library.counts.rejected);
  for (const rejection of report.rejected) {
    assert.ok(rejection.reason, "rejection without a reason");
  }
});

test("models families: canonical ids map correctly", () => {
  assert.equal(modelFamily("kling-3.0"), "kling");
  assert.equal(modelFamily("wan-2.5"), "wan");
  assert.equal(modelFamily("veo-3"), "veo");
  assert.equal(modelFamily("minimax-h3"), "minimax");
  assert.equal(modelFamily("hunyuan-video"), "hunyuan");
  assert.equal(modelVariant("wan-2.5"), "2.5");
  assert.equal(modelVariant("veo-3"), "3");
  assert.equal(modelVariant("kling"), null);
});

test("search library: finds by title, model and family", () => {
  const hits = searchLibrary("wong kar-wai", { limit: 3 });
  assert.ok(hits.length > 0);
  assert.match(hits[0].record.title.toLowerCase() + " " + hits[0].record.prompt.toLowerCase(), /wong kar-wai|王家卫/);
});

test("search library: family and kind filters are applied", () => {
  const kling = searchLibrary("", { family: "kling", limit: 5 });
  assert.ok(kling.every((h) => h.record.modelFamily === "kling"));

  const snippets = searchLibrary("", { kind: "snippet", limit: 5 });
  assert.ok(snippets.every((h) => h.record.kind === "snippet"));
});

test("search library: language filter works", () => {
  const zh = searchLibrary("", { language: "zh", limit: 5 });
  assert.ok(zh.every((h) => h.record.language === "zh"));
});

test("libraryRecord: throws on unknown id", () => {
  assert.throws(() => libraryRecord("does-not-exist"), /No library record/);
});

test("attributionLines: de-duplicates and keeps tier", () => {
  const sample = library.prompts.slice(0, 40);
  const lines = attributionLines(sample);
  assert.ok(lines.length > 0 && lines.length <= sample.length);
  for (const line of lines) {
    assert.ok(line.sourceUrl);
    assert.ok(line.license);
    assert.ok(line.upstreamTier);
  }
});

test("libraryIndex: exposes counts without the payload", () => {
  const index = libraryIndex();
  assert.ok(!index.prompts, "index must not include the prompt array");
  assert.equal(index.counts.records, library.counts.records);
});

// --- markdown importer unit tests ---

test("markdown: splitSections respects heading levels and fences", () => {
  const md = [
    "# Title",
    "## Group",
    "### First",
    "**Prompt:**",
    "```",
    "inside a fence, ### not a heading",
    "```",
    "### Second",
    "body",
  ].join("\n");
  const sections = splitSections(md);
  assert.deepEqual(sections.map((s) => s.heading), ["Group", "First", "Second"]);
});

test("markdown: extractPromptBlock reads the fenced prompt", () => {
  const text = ["**Prompt:**", "```text", "A cat walks.", "```"].join("\n");
  assert.deepEqual(extractPromptBlock(text), { text: "A cat walks.", language: "text" });
});

test("markdown: extractPromptBlock handles CJK label", () => {
  const text = ["**提示词**：", "```", "一只猫走过。", "```"].join("\n");
  assert.equal(extractPromptBlock(text)?.text, "一只猫走过。");
});

test("markdown: extractMedia pulls credit and source URL", () => {
  const text = ['![alt](https://img.example/a.png)', "", "*Source: John ([@john](https://x.com/john)) - [Post](https://x.com/john/status/1)*"].join("\n");
  const media = extractMedia(text);
  assert.equal(media.image, "https://img.example/a.png");
  assert.match(media.upstreamCredit, /John/);
  assert.equal(media.upstreamUrl, "https://x.com/john/status/1");
});

test("markdown: slugify keeps CJK and drops punctuation", () => {
  assert.equal(slugify("1.3. Wong Kar-wai Style (Rainy)"), "1-3-wong-kar-wai-style-rainy");
  assert.equal(slugify("王家卫式港片复古"), "王家卫式港片复古");
  assert.equal(slugify("!!!"), "untitled");
});
