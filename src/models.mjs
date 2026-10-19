/**
 * Model registry access.
 *
 * The registry is plain JSON on disk so it can be consumed by any language.
 * Everything here is a thin, dependency-free wrapper.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "..", "prompts");

export function loadModels() {
  const raw = JSON.parse(readFileSync(path.join(dataDir, "models.json"), "utf8"));
  return raw.models;
}

export function loadScenes() {
  // generated.json is produced by scripts/build-data.mjs; scenes/*.json is the source of truth.
  const generated = path.join(dataDir, "generated.json");
  try {
    return JSON.parse(readFileSync(generated, "utf8")).scenes;
  } catch {
    const dir = path.join(dataDir, "scenes");
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")));
  }
}

export function getModel(models, id) {
  const model = models.find((m) => m.id === id);
  if (!model) {
    const available = models.map((m) => m.id).join(", ");
    throw new Error(`Unknown model "${id}". Available: ${available}`);
  }
  return model;
}

export function activeModels(models) {
  return models.filter((m) => m.status === "active");
}

export function retiredModels(models) {
  return models.filter((m) => m.status === "retired");
}
