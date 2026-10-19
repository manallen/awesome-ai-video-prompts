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
 *
 *   aivp library [--family X]          Stats for the imported third-party corpus
 *   aivp find <query> [--family X]     Search 600+ imported prompts
 *   aivp get <record-id>               Print one imported record in full
 *   aivp credits [--source X]          Attribution lines for imported records
 *   aivp stats [--json]                Structural statistics per model family
 *   aivp inspect <record-id>           Prompt anatomy for one imported record
 */
import { readFileSync } from "node:fs";
import { loadModels, loadScenes } from "../src/models.mjs";
import { searchScenes } from "../src/search.mjs";
import { translate } from "../src/translate.mjs";
import { validatePrompt, validateAll } from "../src/validate.mjs";
import {
  loadLibrary,
  libraryIndex,
  searchLibrary,
  libraryRecord,
  attributionLines,
  corpusStats,
  analyzeRecord,
} from "../src/library.mjs";

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
const VALUE_FLAGS = new Set([
  "model", "limit", "category", "format", "kind", "out",
  "family", "source", "language", "tier",
]);
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

  library() {
    const index = libraryIndex();
    if (has("json")) {
      json(index);
      return;
    }
    process.stdout.write(
      `Imported corpus: ${index.counts.records} records from ${index.sources.length} sources ` +
        `(${index.counts.rejected} rejected at import)\n\n`,
    );
    process.stdout.write("Sources:\n");
    for (const source of index.sources) {
      process.stdout.write(
        `  ${source.id.padEnd(20)} ${String(index.bySource[source.id] ?? 0).padStart(4)}  ` +
          `${source.license.padEnd(8)} ${source.repositoryUrl}\n`,
      );
    }
    process.stdout.write("\nBy model family:\n");
    for (const [family, count] of Object.entries(index.byFamily).sort((a, b) => b[1] - a[1])) {
      process.stdout.write(`  ${family.padEnd(16)} ${String(count).padStart(4)}\n`);
    }
    process.stdout.write("\nBy upstream confidence tier:\n");
    for (const [tier, count] of Object.entries(index.byTier).sort((a, b) => b[1] - a[1])) {
      process.stdout.write(`  ${tier.padEnd(24)} ${String(count).padStart(4)}\n`);
    }
    process.stdout.write("\nBy record kind:\n");
    for (const [kind, count] of Object.entries(index.byKind).sort((a, b) => b[1] - a[1])) {
      process.stdout.write(`  ${kind.padEnd(16)} ${String(count).padStart(4)}\n`);
    }
  },

  find() {
    const query = positionals().join(" ");
    if (!query) throw new Error("Usage: aivp find <query> [--family X] [--source Y] [--kind prompt|snippet] [--limit N]");
    const results = searchLibrary(query, {
      limit: Number(flag("limit", 10)),
      family: flag("family"),
      source: flag("source"),
      kind: flag("kind"),
      language: flag("language"),
      tier: flag("tier"),
    });
    if (has("json")) {
      json(results.map(({ record, score }) => ({ id: record.id, title: record.title, model: record.model, score })));
      return;
    }
    if (results.length === 0) {
      process.stdout.write("No matches.\n");
      return;
    }
    for (const { record, score } of results) {
      process.stdout.write(
        `${String(score).padStart(5)}  ${record.model.padEnd(18)} ${record.sourceId.padEnd(20)} ${record.title}\n`,
      );
      process.stdout.write(`${" ".repeat(7)}${record.id}\n`);
    }
  },

  get() {
    const [id] = positionals();
    if (!id) throw new Error("Usage: aivp get <record-id>   (ids look like 'lanshu-video-kit::sd-001')");
    const record = libraryRecord(id);
    if (has("json")) {
      json(record);
      return;
    }
    process.stdout.write(`${record.title}\n`);
    process.stdout.write(
      `model: ${record.model} (${record.modelFamily}${record.modelVariant ? " " + record.modelVariant : ""})  ` +
        `kind: ${record.kind}  lang: ${record.language}\n`,
    );
    process.stdout.write(`source: ${record.sourceName} — ${record.sourceUrl}\n`);
    process.stdout.write(`license: ${record.license}  tier: ${record.upstreamTier}\n`);
    if (record.upstreamCredit) process.stdout.write(`credit: ${record.upstreamCredit}\n`);
    if (record.upstreamUrl) process.stdout.write(`upstream: ${record.upstreamUrl}\n`);
    process.stdout.write("\n");
    process.stdout.write(`${record.prompt.trim()}\n`);
    if (record.notes) process.stdout.write(`\n# ${record.notes}\n`);
  },

  stats() {
    const stats = corpusStats({ minCount: Number(flag("min", 5)) });
    if (has("json")) {
      json(stats);
      return;
    }
    const header = ["family", "n", "words p50", "words p90", "cams", "dur%", "med dur", "dlg%", "aud%", "neg%", "ref%", "timeline%"];
    const width = [14, 6, 10, 10, 6, 8, 8, 6, 6, 6, 6, 10];
    const pad = (v, w) => String(v).padStart(w);
    process.stdout.write(header.map((h, i) => (i === 0 ? h.padEnd(width[i]) : pad(h, width[i]))).join(" ") + "\n");
    process.stdout.write("-".repeat(width.reduce((a, b) => a + b + 1, 0)) + "\n");
    for (const r of stats.families) {
      const cells = [
        r.family,
        r.count,
        r.wordsP50,
        r.wordsP90,
        r.avgCameras,
        `${Math.round(r.durationRate * 100)}%`,
        r.medianDuration ?? "-",
        `${Math.round(r.dialogueRate * 100)}%`,
        `${Math.round(r.audioRate * 100)}%`,
        `${Math.round(r.negativeRate * 100)}%`,
        `${Math.round(r.referenceRate * 100)}%`,
        `${Math.round(r.timelineRate * 100)}%`,
      ];
      process.stdout.write(cells.map((c, i) => (i === 0 ? String(c).padEnd(width[i]) : pad(c, width[i]))).join(" ") + "\n");
    }
    if (stats.excluded.length > 0) {
      process.stdout.write(
        `\nOmitted (fewer than ${stats.minCount} records): ` +
          stats.excluded.map((e) => `${e.family} (${e.count})`).join(", ") +
          "\n",
      );
    }
    process.stdout.write(
      "\nPercentages are the share of prompts in that family matching a literal pattern." +
        " They describe this corpus, not the model's requirements.\n",
    );
  },

  inspect() {
    const [id] = positionals();
    if (!id) throw new Error("Usage: aivp inspect <record-id>");
    const { record, analysis } = analyzeRecord(id);
    if (has("json")) {
      json({ id: record.id, title: record.title, analysis });
      return;
    }
    process.stdout.write(`${record.title}\n${record.id}\n\n`);
    const rows = [
      ["model", record.model],
      ["family", record.modelFamily],
      ["kind", record.kind],
      ["language", record.language],
      ["chars / words", `${analysis.chars} / ${analysis.words}`],
      ["sentences", analysis.sentences],
      ["camera moves", analysis.cameras.join(", ") || "none detected"],
      ["shot sizes", analysis.shotSizes.join(", ") || "none detected"],
      ["audio cues", analysis.audio.join(", ") || "none detected"],
      ["duration", analysis.hasDuration ? `${analysis.durationSeconds}s` : "not stated"],
      ["aspect", analysis.aspect ?? "not stated"],
      ["timeline / beats", analysis.hasTimeline ? "yes" : "no"],
      ["multi-scene", analysis.multiScene ? "yes" : "no"],
      ["reference-driven", analysis.hasReference ? "yes" : "no"],
      ["negative constraints", analysis.hasNegative ? "yes" : "no"],
      ["labeled blocks", analysis.labeledBlocks > 0 ? String(analysis.labeledBlocks) : "none"],
    ];
    for (const [k, v] of rows) process.stdout.write(`${k.padEnd(20)} ${v}\n`);
  },

  credits() {
    const sourceFilter = flag("source");
    const library = loadLibrary();
    const records = sourceFilter
      ? library.prompts.filter((r) => r.sourceId === sourceFilter)
      : library.prompts;
    const lines = attributionLines(records);
    for (const line of lines) {
      process.stdout.write(
        `${line.sourceId}: ${line.attribution} (${line.license}) ${line.sourceUrl}\n` +
          (line.upstreamCredit
            ? `  └─ ${line.upstreamCredit}${line.upstreamUrl ? ` — ${line.upstreamUrl}` : ""} [${line.upstreamTier}]\n`
            : ""),
      );
    }
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
