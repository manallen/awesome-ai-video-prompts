/**
 * Prompt validation.
 *
 * These are heuristics that catch the failure modes we actually see in
 * production: contradictory constraints, missing preservation clauses on
 * image-to-video, missing audio controls on audio-native models, and prose
 * sent to models that need labeled blocks.
 *
 * Nothing here calls a model. Every rule is deterministic and testable.
 */

const CONTRADICTIONS = [
  {
    id: "sharp-vs-grain",
    a: /\b(4k|ultra[- ]?sharp|hyper[- ]?detailed|crystal clear)\b/i,
    b: /\b(film grain|8mm|vhs|vhs grain)\b/i,
    message: "Film-grain/8mm aesthetics conflict with ultra-sharp/4K requests; the model will pick one and drop the other.",
  },
  {
    id: "slow-vs-fast",
    a: /\bslow[- ]?motion\b/i,
    b: /\b(high[- ]?speed|fast[- ]?action|rapid motion)\b/i,
    message: "Slow motion and high-speed action cancel each other out.",
  },
  {
    id: "cinematic-vs-handheld",
    a: /\b(cinematic|anamorphic|dolly|steadicam)\b/i,
    b: /\b(handheld|shaky|verite|vérité)\b/i,
    message: "Cinematic locked-off language fights handheld documentary language; choose one camera doctrine.",
  },
  {
    id: "no-zoom-vs-zoom",
    a: /\bno (zoom|push in|dolly)\b/i,
    b: /\b(slow push in|zoom in|dolly in)\b/i,
    message: "The prompt forbids zoom while also requesting a zoom move.",
  },
];

const ARTIST_STYLES = [
  "wes anderson", "tarantino", "nolan", "villeneuve", "miyazaki", "ghibli",
  "kubrick", "fincher", "spielberg", "jeunet", "burton",
];

const FORBIDDEN_PLACEHOLDER = /\[(?=[^\]"']*[A-Z]{3,})[^\]"']{1,60}\]|<(?=[^>"']*[A-Z]{3,})[^>"']{1,60}>|\{[A-Za-z][A-Za-z ]{2,}\}|\b(BRAND NAME|CHARACTER NAME|PRODUCT NAME|CITY NAME)\b/;

// Deliberately narrow: bare "still" appears in ordinary prose ("he sits still",
// "still holding stars") and must not trigger an image-to-video rule.
const IMAGE_TO_VIDEO_HINTS = /\b(reference image|supplied image|the source image|animate this|animate the still|the supplied still|input_reference)\b/i;
const PRESERVATION_HINTS = /\b(keep|preserve|unchanged|identical|exactly as|same face|same pose)\b/i;

const AUDIO_HINTS = /\b(audio|sound|music|dialogue|voice|sfx|ambien|room tone|wind|rain|silence)\b/i;
const NEGATIVE_MUSIC = /\bno music\b/i;

const NEGATIVE_HINTS = /\b(negative|avoid|no watermark|no subtitles|no logo|no text|do not|don't)\b/i;

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countCJK(text) {
  const matches = text.match(/[一-鿿]/g);
  return matches ? matches.length : 0;
}

/**
 * Validate a single prompt against one model profile.
 * Returns { modelId, ok, score, issues: [{level, id, message}] }
 */
export function validatePrompt(prompt, modelId, models, options = {}) {
  const model = models.find((m) => m.id === modelId);
  if (!model) throw new Error(`Unknown model "${modelId}"`);
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt must be a non-empty string");
  }

  const issues = [];
  const words = countWords(prompt);
  const cjk = countCJK(prompt);
  const kind = options.kind ?? "text-to-video"; // or "image-to-video" | "motion-control"

  const add = (level, id, message) => issues.push({ level, id, message });

  // 1. Placeholder leakage
  if (FORBIDDEN_PLACEHOLDER.test(prompt)) {
    add("error", "placeholder", "Prompt still contains an unresolved template placeholder such as [BRAND NAME] or {CITY}.");
  }

  // 2. Contradictions
  for (const rule of CONTRADICTIONS) {
    if (rule.a.test(prompt) && rule.b.test(prompt)) {
      add("warning", `contradiction:${rule.id}`, rule.message);
    }
  }

  // 3. Too many artist styles
  const artists = ARTIST_STYLES.filter((a) => prompt.toLowerCase().includes(a));
  if (artists.length > 2) {
    add("warning", "style-pileup", `References ${artists.length} director styles (${artists.join(", ")}); models sample from them rather than blending.`);
  }

  // 4. Model-specific structure expectations
  if (model.format === "labeled-blocks" && model.labels.length > 0) {
    const missing = model.labels.filter((label) => {
      const re = new RegExp(`(^|\\n)\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`, "i");
      return !re.test(prompt);
    });
    if (missing.length > 0) {
      add(
        missing.length === model.labels.length ? "error" : "warning",
        "missing-labels",
        `${model.name} expects labeled blocks. Missing: ${missing.join(", ")}.`,
      );
    }
  }

  if (model.format === "four-block") {
    const blocks = ["Entity", "Scene", "Motion", "Sound"];
    const missing = blocks.filter((b) => !new RegExp(`(^|\\n)\\s*${b}\\s*:`, "i").test(prompt));
    if (missing.length > 0) {
      add("warning", "missing-blocks", `${model.name} uses Entity/Scene/Motion/Sound. Missing: ${missing.join(", ")}.`);
    }
  }

  // 5. Length envelopes
  if (model.format === "compact-prose" && words > 60) {
    add("warning", "length", `${model.name} performs best at 30–55 words; this is ${words}.`);
  }
  if (model.format === "terse-prose" && words > 90) {
    add("info", "length", `${model.name} prefers terse prompts; ${words} words may dilute the subject.`);
  }
  if ((model.format === "prose-8e" || model.format === "prose-audio") && words < 40) {
    add("info", "length", `${model.name} benefits from a full eight-element description; this is only ${words} words.`);
  }
  if (cjk > 0 && model.promptLanguage && !model.promptLanguage.includes("zh")) {
    add("warning", "language", `${model.name} is documented in ${model.promptLanguage.join("/")}; ${cjk} CJK characters may reduce fidelity.`);
  }

  // 6. Audio-aware models should say something about audio
  if (model.nativeAudio && !AUDIO_HINTS.test(prompt)) {
    add(
      "info",
      "audio-unspecified",
      `${model.name} generates audio natively; without an audio cue it will invent a music bed.`,
    );
  }
  if (model.nativeAudio && !NEGATIVE_MUSIC.test(prompt) && model.format !== "compact-prose") {
    add("info", "music-unspecified", "No `no music` clause found; audio-native models frequently add a score.");
  }
  if (model.status === "retired") {
    // In library mode, retired entries are archival by design: keep them, but
    // surface them as info so `validate --all` stays a clean gate.
    add(
      options.libraryMode ? "info" : "error",
      "retired",
      `${model.name} was retired on ${model.retiredOn}. Migrate to ${model.migration?.recommendedTargets?.join(" / ") ?? "an active model"}.`,
    );
  }

  // 7. Image-to-video needs a preservation clause
  if (kind === "image-to-video" || IMAGE_TO_VIDEO_HINTS.test(prompt)) {
    if (!PRESERVATION_HINTS.test(prompt)) {
      add("warning", "no-preservation", "Image-to-video prompts should state what must stay unchanged, or the model will redesign the still.");
    }
  }

  // 8. Negative constraints
  if (!NEGATIVE_HINTS.test(prompt) && model.format !== "instruction") {
    add("info", "no-negatives", "No negative constraints found. Adding `no watermark, no subtitles` measurably reduces artifacts.");
  }

  // 9. Motion-control needs an explicit source binding
  if (kind === "motion-control" && !/\b(reference (video|clip)|video 1)\b/i.test(prompt)) {
    add("error", "no-motion-source", "Motion-control prompts must name the reference video/clip they retarget.");
  }

  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;
  const score = Math.max(0, 100 - errors * 25 - warnings * 8 - (issues.length - errors - warnings) * 2);

  return { modelId, ok: errors === 0, score, words, issues };
}

export function validateAll(scenes, models) {
  const results = [];
  for (const scene of scenes) {
    for (const [modelId, entry] of Object.entries(scene.prompts ?? {})) {
      const kind = scene.category === "image-to-video"
        ? "image-to-video"
        : scene.category === "motion-control"
          ? "motion-control"
          : "text-to-video";
      results.push({
        sceneId: scene.id,
        kind,
        ...validatePrompt(entry.prompt, modelId, models, { kind, libraryMode: true }),
      });
    }
  }
  return results;
}
