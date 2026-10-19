/**
 * Cross-model translator.
 *
 * Honest scope: this is a *structural* translator, not a semantic rewriter.
 * It converts between labeled formats (Sora 2 → Kling 3.0 → Wan 2.7) because
 * those carry semantics in field names. When the source is unstructured prose
 * it extracts what it can and reports exactly what it could not map — it never
 * silently invents content.
 *
 * For semantic rewriting, feed `fields` into an LLM with
 * docs/PROMPT-TRANSLATION.md as the instruction set.
 */

import { countWords } from "./validate.mjs";

const FIELD_ALIASES = {
  style: ["style", "visual style", "look", "grade", "aesthetic"],
  cinematography: ["cinematography", "camera", "shot", "framing", "lens"],
  actions: ["actions", "action", "beats", "motion", "movement"],
  backgroundSound: ["background sound", "sound", "audio", "sfx", "ambience", "ambient"],
  dialogue: ["dialogue", "speech", "lines", "voices"],
  scene: ["scene", "setting", "environment", "location"],
  characters: ["characters", "character", "subject", "subjects", "cast"],
  entity: ["entity", "entities"],
  negative: ["negative", "negative prompt", "avoid", "constraints", "exclusions"],
  light: ["light", "lighting", "key light"],
  audioStyle: ["audio & style", "audio and style"],
};

const LABEL_LOOKUP = new Map();
for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
  for (const alias of aliases) LABEL_LOOKUP.set(alias.toLowerCase(), canonical);
}

/** Parse "Label: value" blocks, where the label is any known alias. */
export function parseLabeled(prompt) {
  const out = {};
  let current = null;

  for (const line of String(prompt).split(/\r?\n/)) {
    const match = /^\s*([A-Za-z][A-Za-z &'-]{1,24})\s*:\s*(.*)$/.exec(line);
    const canonical = match ? LABEL_LOOKUP.get(match[1].trim().toLowerCase()) : null;

    if (canonical) {
      current = canonical;
      const value = match[2].trim();
      if (value) out[current] = out[current] ? `${out[current]}\n${value}` : value;
      else out[current] = out[current] ?? "";
    } else if (current) {
      out[current] = `${out[current]}\n${line}`.trim();
    }
  }

  if (typeof out.actions === "string") {
    out.actions = out.actions
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean);
  }

  return out;
}

/** Parse four-block Wan style into the canonical field bag. */
export function parseFourBlock(prompt) {
  const parsed = parseLabeled(prompt);
  const fields = {};
  if (parsed.entity) fields.characters = parsed.entity;
  if (parsed.scene) fields.scene = parsed.scene;
  if (parsed.actions) fields.actions = parsed.actions;
  if (parsed.backgroundSound) fields.backgroundSound = parsed.backgroundSound;
  return fields;
}

export function extractSemantics(prompt, sourceModel, models) {
  const model = models.find((m) => m.id === sourceModel);
  const warnings = [];

  let fields;
  if (model?.format === "four-block") {
    fields = parseFourBlock(prompt);
  } else if (model?.format === "labeled-blocks") {
    fields = parseLabeled(prompt);
    if (fields.audioStyle) {
      warnings.push("`Audio & Style` packs two concepts; sound and visual style are kept together rather than guessed apart.");
    }
  } else {
    const parsed = parseLabeled(prompt);
    if (Object.keys(parsed).length > 0) {
      fields = parsed;
      warnings.push(`Source ${sourceModel} is a prose format, but the prompt is labeled; parsed it as labeled.`);
    } else {
      fields = { raw: String(prompt).trim() };
      warnings.push(
        `Source ${sourceModel} has no labeled structure. Prose cannot be translated deterministically — ` +
          `use docs/PROMPT-TRANSLATION.md with an LLM for a semantic rewrite.`,
      );
    }
  }

  if (!fields.negative) {
    warnings.push("Source prompt has no negative block; the target's negative field falls back to defaults.");
  }

  return { fields, warnings };
}

// --- value helpers ---------------------------------------------------------

const NONE = /^(none|n\/a|no dialogue|no audio|nobody)\.?$/i;

/** A usable value: a non-empty string that is not an explicit "none". */
function usable(value) {
  return typeof value === "string" && value.trim() !== "" && !NONE.test(value.trim());
}

/**
 * Trim a value without destroying its sentence punctuation.
 * Only a single trailing period is removed, so "He runs. She waits."
 * keeps its inner punctuation.
 */
function trimEnd(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+$/, "").replace(/(?<![.!?])\.$/, "");
}

/** Trim then guarantee exactly one terminal period. */
function period(value) {
  const text = trimEnd(value);
  return text ? `${text}.` : "";
}

function asSentences(actions) {
  const text = Array.isArray(actions)
    ? actions.map(trimEnd).filter(Boolean).join(". ")
    : trimEnd(actions);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function joinSentences(parts) {
  const clean = parts.filter(usable).map(trimEnd).filter(Boolean);
  if (clean.length === 0) return "";
  return `${clean.join(". ")}.`;
}

/** Canonical sound text: ambience then dialogue, minus placeholder values. */
function soundText(fields) {
  return [fields.backgroundSound, fields.dialogue].filter(usable).map(trimEnd).join(". ");
}

// --- renderers -------------------------------------------------------------

/** Render canonical fields into a target model's expected shape. */
export function renderFor(targetModel, fields, options = {}) {
  const notes = [];
  const missing = [];

  const negative = usable(fields.negative)
    ? trimEnd(fields.negative)
    : "no watermark, no subtitles, no logo, no text, no morphing";

  switch (targetModel.format) {
    case "labeled-blocks": {
      const lines = [];
      // `put` receives an already-normalized (period-terminated) value.
      const put = (label, value) => {
        if (typeof value === "string" && value.trim() !== "") lines.push(`${label}: ${value.trim()}`);
      };
      put("Scene", period(fields.scene));
      put("Characters", period(fields.characters));
      const action = asSentences(fields.actions);
      if (action) lines.push(`Action: ${action}`);
      put("Camera", period(fields.cinematography));
      put("Light", period(fields.light));

      const audioStyle = [soundText(fields), usable(fields.style) ? trimEnd(fields.style) : ""]
        .filter(Boolean)
        .join(". ");
      if (audioStyle) lines.push(`Audio & Style: ${period(audioStyle)}`);

      lines.push(`Negative: ${period(negative)}`);

      for (const [label, value] of [["Scene", fields.scene], ["Characters", fields.characters], ["Action", action], ["Camera", fields.cinematography]]) {
        if (!value) missing.push(label);
      }
      return finish(lines.join("\n"), missing, notes);
    }

    case "four-block": {
      const lines = [];
      const entity = fields.characters ?? fields.entity;
      if (usable(entity)) lines.push(`Entity: ${period(entity)}`);
      else missing.push("Entity");

      if (usable(fields.scene)) lines.push(`Scene: ${period(fields.scene)}`);
      else missing.push("Scene");

      const motion = asSentences(fields.actions);
      if (motion) lines.push(`Motion: ${motion}`);
      else missing.push("Motion");

      lines.push(`Sound: ${period(soundText(fields) || "natural ambience, no music")}`);
      return finish(lines.join("\n"), missing, notes);
    }

    case "prose-audio": {
      const body = joinSentences([
        fields.scene,
        fields.characters,
        asSentences(fields.actions),
        fields.cinematography,
        fields.style,
        fields.light,
      ]);
      const dialogue = usable(fields.dialogue) ? trimEnd(fields.dialogue) : "none";
      const audio = usable(fields.backgroundSound) ? trimEnd(fields.backgroundSound) : "natural ambience, no music";
      return finish(`${body}\n\nDialogue: ${dialogue}.\nAudio: ${audio}.`, missing, notes);
    }

    case "prose-8e": {
      const body = joinSentences([
        fields.characters,
        asSentences(fields.actions),
        fields.scene,
        fields.light,
        fields.cinematography,
        fields.style,
        soundText(fields),
        negative,
      ]);
      return finish(body, missing, notes);
    }

    case "compact-prose": {
      // 30–55 words: densest fields first, whole sentences only.
      const lead = Array.isArray(fields.actions) ? fields.actions[0] : fields.actions;
      const parts = [fields.characters, lead, fields.scene, fields.cinematography]
        .filter(usable)
        .map(trimEnd);
      let out = parts.join(", ");
      const words = out.split(/\s+/).filter(Boolean);
      if (words.length > 55) {
        out = `${words.slice(0, 55).join(" ")}`;
        notes.push(`Trimmed to 55 words; ${targetModel.name} prefers 30–55. Re-word rather than truncate for production.`);
      }
      return finish(`${out}.`, missing, notes);
    }

    case "terse-prose": {
      const lead = Array.isArray(fields.actions) ? fields.actions[0] : fields.actions;
      const parts = [fields.characters, lead, fields.scene].filter(usable).map(trimEnd);
      return finish(`${parts.join(", ")}.`, missing, notes);
    }

    case "instruction": {
      const body = joinSentences([
        "Reproduce the following scene and apply any edits described",
        fields.scene,
        fields.characters,
        asSentences(fields.actions),
        fields.cinematography,
        fields.style,
        usable(fields.backgroundSound) ? `Audio: ${trimEnd(fields.backgroundSound)}` : "",
      ]);
      return finish(body, missing, notes);
    }

    case "prose-edit":
    default: {
      const body = joinSentences([
        fields.characters,
        asSentences(fields.actions),
        fields.scene,
        fields.light,
        fields.cinematography,
        fields.style,
        usable(fields.negative) ? `Avoid: ${trimEnd(fields.negative)}` : "",
      ]);
      return finish(body, missing, notes);
    }
  }
}

function finish(text, missing, notes) {
  const result = { prompt: text, notes: [...notes] };
  if (missing.length > 0) {
    result.notes.push(
      `Source prompt supplied no ${missing.join(", ")}. The target block is omitted rather than invented — fill it in before generating.`,
    );
  }
  result.missing = missing;
  return result;
}

export function translate({ prompt, from, to }, models) {
  const source = models.find((m) => m.id === from);
  const target = models.find((m) => m.id === to);
  if (!source) throw new Error(`Unknown source model "${from}"`);
  if (!target) throw new Error(`Unknown target model "${to}"`);

  const { fields, warnings } = extractSemantics(prompt, from, models);

  if (fields.raw) {
    return {
      from,
      to,
      prompt: fields.raw,
      fields,
      warnings: [...warnings, "No structural mapping was possible; the source text is returned unchanged."],
      missing: [],
      deterministic: false,
    };
  }

  const { prompt: rendered, notes, missing } = renderFor(target, fields);
  const allWarnings = [...warnings, ...notes];

  if (target.status === "retired") {
    allWarnings.push(`${target.name} is retired (${target.retiredOn}). Choose an active target.`);
  }
  if (source.status === "retired") {
    allWarnings.push(`${source.name} was retired on ${source.retiredOn}; the source prompt is historical only.`);
  }
  if (target.format === "compact-prose" && countWords(rendered) > 60) {
    allWarnings.push(`Rendered ${countWords(rendered)} words; ${target.name} prefers 30–55.`);
  }

  return {
    from,
    to,
    prompt: rendered,
    fields,
    warnings: allWarnings,
    missing,
    deterministic: true,
  };
}
