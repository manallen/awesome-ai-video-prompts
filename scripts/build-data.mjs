#!/usr/bin/env node
/**
 * Build prompts/generated.json from prompts/scenes/*.json.
 *
 * Also refuses to write when the library is internally inconsistent, so CI
 * never publishes a broken dataset.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const promptsDir = path.resolve(here, "..", "prompts");
const scenesDir = path.join(promptsDir, "scenes");

const modelsRaw = JSON.parse(readFileSync(path.join(promptsDir, "models.json"), "utf8"));
const models = modelsRaw.models;
const modelIds = new Set(models.map((m) => m.id));

const files = readdirSync(scenesDir).filter((f) => f.endsWith(".json")).sort();
const scenes = [];
const problems = [];

for (const file of files) {
  const scene = JSON.parse(readFileSync(path.join(scenesDir, file), "utf8"));
  if (!scene.id || !scene.title || !scene.prompts) {
    problems.push(`${file}: missing id/title/prompts`);
    continue;
  }
  for (const [modelId, entry] of Object.entries(scene.prompts)) {
    if (!modelIds.has(modelId)) problems.push(`${scene.id}: unknown model "${modelId}"`);
    if (!entry?.prompt || typeof entry.prompt !== "string") {
      problems.push(`${scene.id}/${modelId}: empty prompt`);
    }
  }
  scenes.push(scene);
}

if (problems.length > 0) {
  console.error("Dataset problems:\n  " + problems.join("\n  "));
  process.exit(1);
}

const coverage = Object.fromEntries(
  models.map((m) => [m.id, {
    status: m.status,
    scenes: scenes.filter((s) => s.prompts?.[m.id]).length,
  }]),
);

const out = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  counts: {
    scenes: scenes.length,
    models: models.length,
    prompts: scenes.reduce((n, s) => n + Object.keys(s.prompts).length, 0),
  },
  coverage,
  models,
  scenes,
};

writeFileSync(path.join(promptsDir, "generated.json"), `${JSON.stringify(out, null, 2)}\n`);
console.log(
  `Wrote prompts/generated.json — ${out.counts.scenes} scenes, ${out.counts.models} models, ${out.counts.prompts} prompts`,
);
