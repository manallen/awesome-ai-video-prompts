import test from "node:test";
import assert from "node:assert/strict";

import {
  loadFamilies,
  familyCoverage,
  unverifiedFamilies,
  loadLibrary,
} from "../src/library.mjs";

const registry = loadFamilies();
const library = loadLibrary();

test("families: registry is versioned and dated", () => {
  assert.equal(registry.schemaVersion, 1);
  assert.match(registry.updated, /^\d{4}-\d{2}-\d{2}$/);
});

test("families: every family in the corpus has a registry entry", () => {
  const registered = new Set(registry.families.map((f) => f.family));
  for (const family of Object.keys(library.byFamily)) {
    assert.ok(registered.has(family), `family "${family}" has no registry entry`);
  }
  // And the registry should not list families absent from the corpus.
  for (const family of registered) {
    assert.ok(library.byFamily[family] > 0, `registry lists "${family}" but the corpus has none`);
  }
});

test("families: verification values come from the declared set", () => {
  const allowed = new Set(Object.keys(registry.verificationLevels));
  for (const family of registry.families) {
    assert.ok(allowed.has(family.verification), `${family.family}: ${family.verification}`);
  }
});

test("families: vendor-documented entries cite at least one source", () => {
  for (const family of registry.families) {
    if (family.verification === "vendor-documented") {
      assert.ok(
        Array.isArray(family.sources) && family.sources.length > 0,
        `${family.family} claims vendor documentation with no source URL`,
      );
      for (const url of family.sources) {
        assert.match(url, /^https:\/\//, `${family.family} source is not https: ${url}`);
      }
    }
  }
});

test("families: third-party-only entries explain themselves", () => {
  for (const family of registry.families) {
    if (family.verification !== "vendor-documented") {
      assert.ok(family.note && family.note.length > 20, `${family.family} lacks an explanatory note`);
    }
  }
});

test("families: unknown audio is null, never a guess", () => {
  // `nativeAudio` is tri-state on purpose: yes / no / unknown.
  for (const family of registry.families) {
    assert.ok(
      typeof family.nativeAudio === "boolean" || family.nativeAudio === null,
      `${family.family} nativeAudio must be true, false or null`,
    );
  }
  const minimax = registry.families.find((f) => f.family === "minimax");
  assert.equal(minimax.nativeAudio, null, "vendor documents audio as input only, not output");
});

test("families: kling 4.0 is flagged as unconfirmed", () => {
  const kling = registry.families.find((f) => f.family === "kling");
  assert.match(kling.note, /kling-4\.0/i);
  assert.match(kling.note, /NOT listed/i);
});

test("families: retired sora keeps a retirement date", () => {
  const sora = registry.families.find((f) => f.family === "sora");
  assert.equal(sora.status, "retired");
  assert.match(sora.retiredOn, /^\d{4}-\d{2}-\d{2}$/);
});

test("familyCoverage: counts match the library byFamily totals", () => {
  const coverage = familyCoverage();
  const total = coverage.reduce((n, row) => n + row.count, 0);
  assert.equal(total, library.prompts.length);
  for (const row of coverage) {
    assert.equal(row.count, library.byFamily[row.family]);
    assert.equal(row.registered, true);
  }
});

test("unverifiedFamilies: returns only non-vendor entries with notes", () => {
  const unverified = unverifiedFamilies();
  assert.ok(unverified.length > 0);
  for (const family of unverified) {
    assert.notEqual(family.verification, "vendor-documented");
    assert.ok(family.note);
  }
  const names = unverified.map((f) => f.family);
  assert.ok(names.includes("pika"), "pika has no retrievable vendor docs");
  assert.ok(!names.includes("veo"), "veo is vendor-documented");
});
