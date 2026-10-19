#!/usr/bin/env node
/**
 * aivp — Awesome AI Video Prompts CLI
 *
 *   aivp list                          List scenes and covered models
 *   aivp show <scene> [--model <id>]   Print a scene, or one model's prompt
 *   aivp search <query> [--limit N]    Keyword search across scenes
 *   aivp models [--active]             Print the model capability registry
 *   aivp translate <from> <to> <file>  Convert a prompt between model formats
 *   aivp validate <model> <file>       Lint one prompt against a model profile
 *   aivp validate --all                Lint every prompt in the library
 *   aivp export [--format json|md]     Emit the whole dataset
 */
import { readFileSync } from "node:fs";
import { loadModels, loadScenes } from "../src/models.mjs";
import { searchScenes } from "../src/search.mjs";
import { translate } from "../src/translate.mjs";
import { validatePrompt, validateAll } from "../src/validate.mjs";

const argv = process.argv.slice(2);
const command = argv[0];

function flag(name, fallback = undefined) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}

function has(name) {
  return argv.includes(`--${name}`);
}

/** Positional args with every `--flag value` pair removed. */
const VALUE_FLAGS = new Set(["model", "limit", "category", "format", "kind", "out"]);
function positionals() {
  const out = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      if (VALUE_FLAGS.has(token.slice(2))) i += 1;
      continue;
    }
    if (i === 0) continue; // command
    out.push(token);
  }
  return out;
}

function readInput(file) {
  if (!file || file === "-") return readFileSync(0, "utf8");
  return readFileSync(file, "utf8");
}

function json(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

const models = loadModels();
const scenes = loadScenes();

const COMMANDS = {
  list() {
    const modelFilter = flag("model");
    for (const scene of scenes) {
      const covered = Object.keys(scene.prompts ?? {});
      if (modelFilter && !covered.includes(modelFilter)) continue;
      process.stdout.write(`${scene.id.padEnd(32)} ${scene.category.padEnd(20)} ${covered.length} models  ${scene.title}\n`);
    }
    if (has("models")) {
      process.stdout.write("\nModel coverage:\n");
      for (const m of models) {
        const n = scenes.filter((s) => s.prompts?.[m.id]).length;
        process.stdout.write(`  ${m.id.padEnd(18)} ${String(n).padStart(2)}/${scenes.length}  ${m.status}\n`);
      }
    }
  },

  show() {
    const [id] = positionals();
    if (!id) throw new Error("Usage: aivp show <scene-id> [--model <model-id>] [--notes]");
    const scene = scenes.find((s) => s.id === id || s.id.endsWith(id));
    if (!scene) throw new Error(`No scene matching "${id}"`);
    const modelId = flag("model");
    if (modelId) {
      const entry = scene.prompts?.[modelId];
      if (!entry) throw new Error(`Scene "${scene.id}" has no prompt for "${modelId}"`);
      process.stdout.write(`${entry.prompt.trim()}\n`);
      if (entry.notes && has("notes")) process.stdout.write(`\n# ${entry.notes}\n`);
      return;
    }
    json(scene);
  },

  search() {
    const query = positionals().join(" ");
    if (!query) throw new Error("Usage: aivp search <query> [--limit N] [--category c] [--model m]");
    const results = searchScenes(query, scenes, {
      limit: Number(flag("limit", 10)),
      category: flag("category"),
      model: flag("model"),
    });
    if (results.length === 0) {
      process.stdout.write("No matches.\n");
      return;
    }
    for (const { scene, score } of results) {
      process.stdout.write(`${String(score).padStart(7)}  ${scene.id.padEnd(30)} ${scene.title}\n`);
    }
  },

  models() {
    const active = has("active");
    const list = active ? models.filter((m) => m.status === "active") : models;
    for (const m of list) {
      const audio = m.nativeAudio ? "audio" : "silent";
      process.stdout.write(`${m.id.padEnd(18)} ${m.status.padEnd(9)} ${String(m.format).padEnd(15)} ${audio.padEnd(7)} ${m.name}\n`);
    }
  },

  translate() {
    const [from, to, file] = positionals();
    if (!from || !to) throw new Error("Usage: aivp translate <from-model> <to-model> [file|-]");
    const prompt = readInput(file);
    const result = translate({ prompt, from, to }, models);
    if (has("json")) {
      json(result);
      return;
    }
    process.stdout.write(`${result.prompt.trim()}\n`);
    if (result.warnings.length > 0) {
      process.stdout.write("\n");
      for (const w of result.warnings) process.stdout.write(`# ${w}\n`);
    }
    process.stderr.write(`\n[${from} → ${to}] deterministic=${result.deterministic}\n`);
  },

  validate() {
    if (has("all")) {
      const results = validateAll(scenes, models);
      let errors = 0;
      let warnings = 0;
      for (const r of results) {
        const e = r.issues.filter((i) => i.level === "error");
        const w = r.issues.filter((i) => i.level === "warning");
        errors += e.length;
        warnings += w.length;
        if (has("verbose") || e.length > 0) {
          process.stdout.write(`${r.sceneId} / ${r.modelId}  score=${r.score}  words=${r.words}\n`);
          for (const i of r.issues) {
            if (i.level === "info" && !has("verbose")) continue;
            process.stdout.write(`  ${i.level.toUpperCase().padEnd(7)} ${i.id}: ${i.message}\n`);
          }
        }
      }
      process.stdout.write(`\n${results.length} prompts checked — ${errors} errors, ${warnings} warnings\n`);
      if (errors > 0 && !has("allow-errors")) process.exitCode = 1;
      return;
    }

    const [modelId, file] = positionals();
    if (!modelId) throw new Error("Usage: aivp validate <model-id> <file> | aivp validate --all");
    const prompt = readInput(file);
    const kind = flag("kind", "text-to-video");
    const result = validatePrompt(prompt, modelId, models, { kind });
    if (has("json")) {
      json(result);
      return;
    }
    process.stdout.write(`score ${result.score}  words ${result.words}  ${result.ok ? "OK" : "FAIL"}\n`);
    for (const i of result.issues) {
      process.stdout.write(`  ${i.level.toUpperCase().padEnd(7)} ${i.id}: ${i.message}\n`);
    }
    if (!result.ok) process.exitCode = 1;
  },

  export() {
    const format = flag("format", "json");
    if (format === "md") {
      process.stdout.write("# Awesome AI Video Prompts\n\n");
      for (const scene of scenes) {
        process.stdout.write(`## ${scene.title}\n\n\`${scene.id}\` · ${scene.category} · ${scene.useCase}\n\n`);
        for (const [modelId, entry] of Object.entries(scene.prompts ?? {})) {
          process.stdout.write(`### ${modelId}\n\n\`\`\`\n${entry.prompt.trim()}\n\`\`\`\n\n`);
          if (entry.notes) process.stdout.write(`${entry.notes}\n\n`);
        }
      }
      return;
    }
    json({ models, scenes });
  },

  help() {
    process.stdout.write(readFileSync(new URL("./help.txt", import.meta.url), "utf8"));
  },
};

try {
  const fn = COMMANDS[command] ?? (command ? null : COMMANDS.help);
  if (!fn) {
    process.stderr.write(`Unknown command "${command}". Run: aivp help\n`);
    process.exit(2);
  }
  fn();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
