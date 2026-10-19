import test from "node:test";
import assert from "node:assert/strict";

import { loadModels, loadScenes } from "../src/models.mjs";
import { searchScenes, tokenize } from "../src/search.mjs";
import { translate, parseLabeled, parseFourBlock, renderFor } from "../src/translate.mjs";
import { validatePrompt, validateAll, countWords } from "../src/validate.mjs";

const models = loadModels();
const scenes = loadScenes();

test("dataset: 10 scenes, every scene covers every model", () => {
  assert.equal(scenes.length, 10);
  for (const scene of scenes) {
    assert.ok(scene.id, "scene id");
    assert.ok(scene.title, "scene title");
    for (const model of models) {
      assert.ok(scene.prompts[model.id], `${scene.id} missing ${model.id}`);
      assert.ok(scene.prompts[model.id].prompt.trim().length > 20, `${scene.id}/${model.id} too short`);
    }
  }
});

test("dataset: model ids are unique and statuses are known", () => {
  const ids = models.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const m of models) assert.ok(["active", "retired"].includes(m.status), m.id);
});

test("validator: library is clean apart from retired archival entries", () => {
  const results = validateAll(scenes, models);
  const errors = results.filter((r) => !r.ok);
  assert.deepEqual(errors, [], "library should have zero validation errors");
  const retiredInfo = results.filter((r) => r.issues.some((i) => i.id === "retired"));
  assert.equal(retiredInfo.length, scenes.length, "every scene carries the retired sora-2 note");
});

test("validator: catches contradiction and placeholder", () => {
  const bad = "Cinematic 4K ultra sharp video with heavy film grain in [BRAND NAME] style.";
  const result = validatePrompt(bad, "veo-3.1", models);
  const ids = result.issues.map((i) => i.id);
  assert.ok(ids.includes("placeholder"));
  assert.ok(ids.includes("contradiction:sharp-vs-grain"));
  assert.equal(result.ok, false);
});

test("validator: image-to-video needs a preservation clause", () => {
  const imageScene = scenes.find((s) => s.category === "image-to-video");
  // The probe must trip the i2v detector; archive prompts already pass.
  const noPreserve = validatePrompt(
    "Use the supplied image. The woman lifts her cup and drinks.",
    "veo-3.1",
    models,
    { kind: "image-to-video" },
  );
  assert.ok(noPreserve.issues.some((i) => i.id === "no-preservation"));
  assert.ok(imageScene.prompts["veo-3.1"]);
});

test("validator: retired model is an error outside library mode", () => {
  const result = validatePrompt("Anything at all, a short prompt.", "sora-2", models);
  assert.ok(result.issues.some((i) => i.id === "retired" && i.level === "error"));
});

test("search: ranks the right scene first", () => {
  const cases = [
    ["rainy portrait", "scene-03-character-portrait"],
    ["bamboo sword fight", "scene-10-wuxia-duel"],
    ["skateboard kickflip", "scene-07-action-sports"],
    ["mountain sunrise timelapse", "scene-08-nature-timelapse"],
    ["chrome liquid", "scene-09-abstract-liquid"],
  ];
  for (const [query, expected] of cases) {
    const [top] = searchScenes(query, scenes, { limit: 1 });
    assert.equal(top?.scene.id, expected, `query "${query}"`);
  }
});

test("search: category and model filters apply", () => {
  const onlyAbstract = searchScenes("motion", scenes, { category: "abstract" });
  assert.ok(onlyAbstract.every((r) => r.scene.category === "abstract"));
});

test("tokenize: strips punctuation and stopwords", () => {
  assert.deepEqual(tokenize("The rain, and the window!"), ["rain", "window"]);
});

test("translate: Sora blocks → Kling blocks keeps semantics", () => {
  const sora = scenes.find((s) => s.id === "scene-10-wuxia-duel").prompts["sora-2"].prompt;
  const out = translate({ prompt: sora, from: "sora-2", to: "kling-3.0" }, models);
  assert.equal(out.deterministic, true);
  assert.match(out.prompt, /^Action: /m);
  assert.match(out.prompt, /^Camera: /m);
  assert.match(out.prompt, /^Negative: /m);
  assert.match(out.prompt, /grey-robed swordsman/);
  assert.match(out.prompt, /Bamboo creak/);
});

test("translate: Sora blocks → Wan four-block", () => {
  const sora = scenes.find((s) => s.id === "scene-01-product-hero").prompts["sora-2"].prompt;
  const out = translate({ prompt: sora, from: "sora-2", to: "wan-2.7" }, models);
  assert.match(out.prompt, /^Motion: /m);
  assert.match(out.prompt, /^Sound: /m);
  assert.ok(out.missing.includes("Entity"));
});

test("translate: prose source is returned unchanged and flagged", () => {
  const out = translate(
    { prompt: "A dog runs on a beach at sunset.", from: "veo-3.1", to: "kling-3.0" },
    models,
  );
  assert.equal(out.deterministic, false);
  assert.equal(out.prompt, "A dog runs on a beach at sunset.");
  assert.ok(out.warnings.some((w) => /no labeled structure/i.test(w)));
});

test("translate: never invents missing blocks", () => {
  const out = translate(
    { prompt: "Style: noir\nCinematography: wide", from: "sora-2", to: "wan-2.7" },
    models,
  );
  assert.doesNotMatch(out.prompt, /Entity:/);
  assert.ok(out.missing.includes("Entity"));
  assert.ok(out.missing.includes("Motion"));
});

test("translate: empty dialogue is not rendered as a word", () => {
  const out = translate(
    { prompt: "Dialogue: none.\nBackground Sound: rain on tin.", from: "sora-2", to: "veo-3.1" },
    models,
  );
  assert.match(out.prompt, /Dialogue: none\./);
  assert.doesNotMatch(out.prompt, /none\. rain/);
});

test("parseLabeled: bullets become discrete beats", () => {
  const parsed = parseLabeled("Actions:\n- One\n- Two\n- Three");
  assert.deepEqual(parsed.actions, ["One", "Two", "Three"]);
});

test("parseFourBlock: Entity maps onto characters", () => {
  const parsed = parseFourBlock("Entity: a fox\nScene: a wood\nMotion: it trots\nSound: wind");
  assert.equal(parsed.characters, "a fox");
  assert.equal(parsed.scene, "a wood");
  assert.equal(parsed.backgroundSound, "wind");
});

test("renderFor: compact prose respects the word ceiling", () => {
  const kling = models.find((m) => m.id === "kling-3.0");
  const hh = models.find((m) => m.id === "happyhorse-1.0");
  const source = scenes.find((s) => s.id === "scene-10-wuxia-duel").prompts["kling-3.0"].prompt;
  const out = translate({ prompt: source, from: kling.id, to: hh.id }, models);
  assert.ok(countWords(out.prompt) <= 56, `got ${countWords(out.prompt)} words`);
});
