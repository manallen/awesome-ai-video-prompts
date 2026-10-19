import test from "node:test";
import assert from "node:assert/strict";

import { analyzePrompt, summarize } from "../src/analyze.mjs";
import { loadLibrary, corpusStats, analyzeRecord } from "../src/library.mjs";

// --- duration extraction ---------------------------------------------------

test("analyze: labelled duration wins", () => {
  assert.equal(analyzePrompt("Duration: 15s").durationSeconds, 15);
  assert.equal(analyzePrompt("【时长】8 秒 / duration: 8s").durationSeconds, 8);
});

test("analyze: CJK duration", () => {
  assert.equal(analyzePrompt("15秒,2.39:1,克制的现实主义").durationSeconds, 15);
});

test("analyze: shot timestamps are not clip durations", () => {
  assert.equal(analyzePrompt("[00-05s] then [05-10s]").durationSeconds, null);
  assert.equal(analyzePrompt("Shot 1: 0-3s.\nShot 2: 3-6s.").durationSeconds, null);
});

test("analyze: decades and hyphenated phrases are not durations", () => {
  assert.equal(analyzePrompt("A 1920s style ballroom, no clip length given.").durationSeconds, null);
  assert.equal(analyzePrompt("A 10-second music video with beat syncing.").durationSeconds, null);
});

test("analyze: a real duration later in the text still wins", () => {
  assert.equal(analyzePrompt("0–3s macro; 12 seconds total").durationSeconds, 12);
  assert.equal(analyzePrompt("1920s style, 8s clip").durationSeconds, 8);
});

test("analyze: ranges report the upper bound", () => {
  assert.equal(analyzePrompt("3-15 seconds").durationSeconds, 15);
  assert.equal(analyzePrompt("Duration: 4-15 seconds").durationSeconds, 15);
});

// --- camera / audio / structure --------------------------------------------

test("analyze: detects English camera terms", () => {
  const a = analyzePrompt("Slow push-in on the glass, then a steady orbit around the bottle.");
  assert.ok(a.cameras.includes("push-in"));
  assert.ok(a.cameras.includes("orbit"));
  assert.ok(a.cameraCount >= 2);
});

test("analyze: detects CJK camera terms", () => {
  const a = analyzePrompt("镜头缓慢推近,随后环绕产品一周,固定机位收尾。");
  assert.ok(a.cameras.includes("push-in"), JSON.stringify(a.cameras));
  assert.ok(a.cameras.includes("orbit"), JSON.stringify(a.cameras));
  assert.ok(a.cameras.includes("locked-off"), JSON.stringify(a.cameras));
});

test("analyze: audio classes are distinguished", () => {
  const a = analyzePrompt("She says \"you never called\" over a low fridge hum, no music.");
  assert.ok(a.audio.includes("dialogue"));
  assert.ok(a.audio.includes("ambience"));
  assert.ok(a.audio.includes("silence"));
  assert.equal(a.hasDialogue, true);
});

test("analyze: negative constraints are detected in both languages", () => {
  assert.equal(analyzePrompt("No watermark, no subtitles, no morphing.").hasNegative, true);
  assert.equal(analyzePrompt("不要水印、无字幕、避免变形。").hasNegative, true);
  assert.equal(analyzePrompt("A calm lake at dawn.").hasNegative, false);
});

test("analyze: labeled blocks vs prose", () => {
  const labeled = analyzePrompt("Scene: a kitchen.\nCharacters: two siblings.\nCamera: chest height.");
  assert.equal(labeled.labeledBlocks, 3);
  const prose = analyzePrompt("Two siblings argue in a kitchen while the camera holds at chest height.");
  assert.equal(prose.labeledBlocks, 0);
});

test("analyze: multi-scene needs at least two transitions", () => {
  assert.equal(analyzePrompt("A single locked-off shot of rain on a window.").multiScene, false);
  assert.equal(analyzePrompt("Shot 1: rain. Cut to Shot 2: a street.").multiScene, true);
});

test("analyze: reference-driven prompts are detected", () => {
  assert.equal(analyzePrompt("Use the uploaded image as the first frame.").hasReference, true);
  assert.equal(analyzePrompt("Keep the character from reference video 1.").hasReference, true);
  assert.equal(analyzePrompt("A dog runs on a beach.").hasReference, false);
});

// --- corpus statistics -----------------------------------------------------

test("corpusStats: covers every family with enough records", () => {
  const stats = corpusStats({ minCount: 5 });
  assert.ok(stats.total > 2000);
  const families = stats.families.map((f) => f.family);
  for (const expected of ["seedance", "minimax", "wan", "kling", "veo", "sora"]) {
    assert.ok(families.includes(expected), `${expected} missing from stats`);
  }
});

test("corpusStats: rates are bounded and medians are plausible", () => {
  for (const row of corpusStats({ minCount: 5 }).families) {
    for (const key of ["durationRate", "dialogueRate", "audioRate", "negativeRate", "referenceRate"]) {
      assert.ok(row[key] >= 0 && row[key] <= 1, `${row.family}.${key}=${row[key]}`);
    }
    if (row.medianDuration != null) {
      assert.ok(row.medianDuration >= 1 && row.medianDuration <= 120, `${row.family} median ${row.medianDuration}`);
    }
  }
});

test("corpusStats: happyhorse prompts really are shorter than seedance", () => {
  // This is the claim the curated README makes; assert it stays true.
  const rows = corpusStats({ minCount: 5 }).families;
  const hh = rows.find((r) => r.family === "happyhorse");
  const sd = rows.find((r) => r.family === "seedance");
  assert.ok(hh && sd);
  assert.ok(hh.wordsP50 < sd.wordsP50, `happyhorse p50 ${hh.wordsP50} vs seedance ${sd.wordsP50}`);
  assert.ok(hh.wordsP90 < 120, "happyhorse 90th percentile should stay well under 120 words");
});

test("analyzeRecord: returns record plus analysis", () => {
  const library = loadLibrary();
  const sample = library.prompts.find((p) => p.kind === "prompt" && p.language === "en");
  const { record, analysis } = analyzeRecord(sample.id);
  assert.equal(record.id, sample.id);
  assert.equal(analysis.modelFamily, record.modelFamily);
  assert.ok(analysis.words > 0);
});

test("summarize: groups by family and keeps insertion independence", () => {
  const records = [
    { id: "a" },
    { id: "b" },
    { id: "c" },
  ];
  const analyses = new Map([
    ["a", { modelFamily: "x", words: 10, cameraCount: 0, hasDuration: false, hasDialogue: false, hasAudioCue: false, hasNegative: false, hasReference: false, hasTimeline: false, multiScene: false, labeledBlocks: 0, durationSeconds: null }],
    ["b", { modelFamily: "x", words: 20, cameraCount: 1, hasDuration: true, hasDialogue: false, hasAudioCue: true, hasNegative: true, hasReference: false, hasTimeline: false, multiScene: false, labeledBlocks: 2, durationSeconds: 8 }],
    ["c", { modelFamily: "y", words: 30, cameraCount: 2, hasDuration: true, hasDialogue: true, hasAudioCue: true, hasNegative: true, hasReference: true, hasTimeline: true, multiScene: true, labeledBlocks: 0, durationSeconds: 12 }],
  ]);
  const rows = summarize(records, analyses);
  assert.equal(rows.length, 2);
  const x = rows.find((r) => r.family === "x");
  assert.equal(x.count, 2);
  assert.equal(x.durationRate, 0.5);
  assert.equal(x.medianDuration, 8);
});
