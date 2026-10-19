/**
 * Prompt anatomy.
 *
 * Measures structural properties of a prompt — not its quality. The point is
 * to answer questions like "do prompts for this model usually carry a negative
 * constraint?" with counts from the corpus rather than opinion.
 *
 * Every signal here is a literal pattern match on the prompt text. When a
 * pattern does not match, the field is false/empty; that is an observation
 * about the text, not a claim that the prompt lacks the concept.
 */

// Chinese terms matter here: several sources write prompts in Chinese, and an
// English-only lexicon silently reports zero camera moves for them.
const CAMERA_TERMS = [
  ["push-in", /\b(push[- ]?in|dolly in|slow push|zoom in)\b|推镜|推近|缓慢推|镜头推进/i],
  ["pull-back", /\b(pull[- ]?back|dolly out|pull out|zoom out)\b|拉镜|拉远|镜头后拉/i],
  ["orbit", /\b(orbit|arc shot|circular (move|camera)|360[°-]?\s*(orbit|rotation|turn))\b|环绕|绕拍|360度旋转/i],
  ["tracking", /\b(tracking shot|follow(s|ing)? (the )?(subject|character|car)|tracking camera)\b|跟拍|跟随|跟镜/i],
  ["handheld", /\b(handheld|hand-held|shaky cam|vérité|verite)\b|手持|手抖/i],
  ["crane", /\b(crane (up|down|shot)|jib (up|down))\b|升降|摇臂/i],
  ["pan", /\b(pan left|pan right|pans? (left|right)|horizontal pan)\b|横移|横摇|摇镜/i],
  ["tilt", /\b(tilt (up|down)|tilts? (up|down))\b|俯仰|上摇|下摇/i],
  ["aerial", /\b(aerial|drone shot|fpv|bird'?s[- ]eye)\b|航拍|无人机|鸟瞰/i],
  ["locked-off", /\b(locked[- ]off|static camera|fixed camera|lock ?off|tripod)\b|固定机位|固定镜头|机位固定/i],
  ["macro", /\b(macro|extreme close[- ]up|ecu)\b|微距|极特写/i],
  ["rack-focus", /\b(rack focus|focus pull|pull focus)\b|变焦|焦点转换|拉焦/i],
];

const SHOT_SIZES = [
  ["ecu", /\b(extreme close[- ]?up|ecu)\b/i],
  ["cu", /\b(close[- ]?up|\bcu\b)\b/i],
  ["mcu", /\b(medium close[- ]?up|mcu)\b/i],
  ["ms", /\b(medium shot|\bms\b)\b/i],
  ["ws", /\b(wide shot|\bws\b|long shot)\b/i],
  ["ews", /\b(extreme wide|establishing shot|\bews\b)\b/i],
];

const AUDIO_CUES = [
  ["dialogue", /\b(dialogue|says|speaks?|voice|narrat|lip[- ]?sync)\b/i],
  ["sfx", /\b(sfx|sound effect|foley|trickle|clink|impact|footstep)\b/i],
  ["ambience", /\b(ambien|room tone|wind|rain|traffic|birds|hum|chatter|murmur)\b/i],
  ["music", /\b(music|score|soundtrack|bgm|beat)\b/i],
  ["silence", /\b(no music|silent|without music|无配乐|环境音)\b/i],
];

// Han script has no ASCII word boundary, so CJK alternatives get their own
// pattern rather than a shared \b … \b wrapper that silently never matches.
const NEGATIVE_CUES_EN = /\b(avoid|do not|don't|no watermark|no subtitles|no text|no logo|no morphing|negative prompt|without)\b/i;
const NEGATIVE_CUES_CJK = /(禁止|不要|避免|不得|无字幕|无水印|无文字|无 ?logo|无品牌)/i;

// Durations must be plausible for a video prompt. Without a sanity bound the
// bare `\d+s` pattern happily reads "1920s" or "8s" inside a URL as a duration.
const DURATION_PATTERNS = [
  // Explicitly labelled duration: strongest signal.
  /\bduration\s*[:：]\s*(\d+(?:\.\d+)?)\s*(?:seconds?|sec|s\b|秒)/gi,
  // "12 seconds total" / "15秒". Exclude timestamps: a number preceded by a
  // dash/bracket is a shot boundary ("0–3s", "[00-05s]"), not the clip length.
  // Run this before the range pattern so "0–3s macro; 12 seconds total" reports
  // 12, not the shot boundary.
  /(?<![-–—\[\d.:])(\d+(?:\.\d+)?)\s*(?:s\b|sec(?:onds?)?\b|秒)/gi,
  // A stated range is the weakest signal; the upper bound is the max length.
  // A range that follows "Shot 1: " or "[00-" is a shot boundary, not the clip
  // length. The `[\[\d]` guard also blocks the engine from retrying one
  // character later inside a timestamp ("[00-05s]" → "0-05s").
  /(?<![\d\[])(?<!\d+\s*:\s*)(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:s\b|sec|seconds?|秒)/gi,
];

const MIN_PLAUSIBLE_SECONDS = 1;
const MAX_PLAUSIBLE_SECONDS = 120;

function plausibleDuration(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= MIN_PLAUSIBLE_SECONDS && n <= MAX_PLAUSIBLE_SECONDS ? n : null;
}

/**
 * Scan every match of every pattern, returning the first plausible duration.
 * For a range, report the upper bound — that is the clip's maximum length.
 * Stopping at the first *match* rather than the first *plausible* match would
 * misread "1920s style, 8s clip" as having no duration at all.
 */
function extractDuration(text) {
  for (const pattern of DURATION_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      // Range patterns capture two groups; prefer the upper bound.
      const candidates = [match[2], match[1]];
      for (const raw of candidates) {
        const value = plausibleDuration(raw);
        if (value != null) return value;
      }
    }
  }
  return null;
}

const TIMELINE = /(^|\n)\s*(?:\[)?\d+(?:\.\d+)?\s*(?:s|–|-|to|秒)|\b\d{1,2}:\d{2}\b|\[Shot \d+\]|镜头\s*\d/i;

const REFERENCE =
  /\b(reference (image|video|clip)|uploaded (image|video)|image ?1|video ?1|@图像|@视频|the supplied (image|video)|i2v|r2v|first[- ]frame|last[- ]frame|首帧|尾帧|参考图)\b/i;

const ASPECT = /\b(\d{1,2}:\d{2})\b/;

function words(text) {
  const latin = text.match(/[A-Za-z][A-Za-z'-]*/g)?.length ?? 0;
  const cjk = text.match(/[一-鿿]/g)?.length ?? 0;
  return latin + cjk;
}

/** @param {string} prompt */
export function analyzePrompt(prompt, modelFamily) {
  const text = String(prompt ?? "");
  const lower = text.toLowerCase();

  const cameras = CAMERA_TERMS.filter(([, re]) => re.test(text)).map(([name]) => name);
  const shots = SHOT_SIZES.filter(([, re]) => re.test(text)).map(([name]) => name);
  const audio = AUDIO_CUES.filter(([, re]) => re.test(text)).map(([name]) => name);

  const duration = extractDuration(text);

  const aspect = ASPECT.exec(text)?.[1] ?? null;

  return {
    chars: text.length,
    words: words(text),
    // Rough sentence density: how much is packed per sentence.
    sentences: (text.match(/[.!?。！？]+/g)?.length ?? 0) || 1,
    hasCJK: /[一-鿿]/.test(text),
    cameras,
    cameraCount: cameras.length,
    shotSizes: shots,
    audio,
    hasDialogue: audio.includes("dialogue"),
    hasAudioCue: audio.length > 0,
    hasNegative: NEGATIVE_CUES_EN.test(text) || NEGATIVE_CUES_CJK.test(text),
    hasDuration: duration != null,
    durationSeconds: duration,
    hasTimeline: TIMELINE.test(text),
    hasReference: REFERENCE.test(text),
    aspect,
    // Structured prompts carry labels; prose prompts do not.
    labeledBlocks: (/^\s*[A-Z][A-Za-z &-]{2,24}\s*:/m.test(text) ? (text.match(/^\s*[A-Z][A-Za-z &-]{2,24}\s*:/gm)?.length ?? 0) : 0),
    modelFamily: modelFamily ?? null,
    // A cheap heuristic, labled as such: most prompts in this corpus are
    // single-scene. Multi-scene prompts name multiple shot transitions.
    multiScene: (text.match(/\b(cut to|hard cut|match cut|shot \d|镜头\s*\d|scene \d)/gi)?.length ?? 0) >= 2,
  };
}

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const rate = (items, key) => (items.length ? items.filter((i) => i[key]).length / items.length : 0);

/** Aggregate analyses into per-group statistics. */
export function summarize(records, analysesByKey) {
  const groups = new Map();
  for (const record of records) {
    const analysis = analysesByKey.get(record.id);
    if (!analysis) continue;
    const key = analysis.modelFamily ?? "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(analysis);
  }

  const rows = [];
  for (const [family, items] of groups) {
    const wordCounts = items.map((i) => i.words).sort((a, b) => a - b);
    const durations = items.map((i) => i.durationSeconds).filter((d) => typeof d === "number");
    const cameraCounts = items.map((i) => i.cameraCount);
    rows.push({
      family,
      count: items.length,
      wordsP50: percentile(wordCounts, 0.5),
      wordsP90: percentile(wordCounts, 0.9),
      avgCameras: Number(mean(cameraCounts).toFixed(2)),
      durationRate: Number(rate(items, "hasDuration").toFixed(2)),
      medianDuration: durations.length
        ? percentile([...durations].sort((a, b) => a - b), 0.5)
        : null,
      dialogueRate: Number(rate(items, "hasDialogue").toFixed(2)),
      audioRate: Number(rate(items, "hasAudioCue").toFixed(2)),
      negativeRate: Number(rate(items, "hasNegative").toFixed(2)),
      referenceRate: Number(rate(items, "hasReference").toFixed(2)),
      timelineRate: Number(rate(items, "hasTimeline").toFixed(2)),
      multiSceneRate: Number(rate(items, "multiScene").toFixed(2)),
      labeledRate: Number((items.filter((i) => i.labeledBlocks > 0).length / items.length).toFixed(2)),
    });
  }
  return rows.sort((a, b) => b.count - a.count);
}
