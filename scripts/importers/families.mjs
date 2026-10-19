/**
 * Model family mapping.
 *
 * Upstream collections name models loosely and inconsistently ("veo-3",
 * "wan-2.5", "runway-gen4"). We keep the upstream string verbatim — it is
 * evidence — and derive a family plus a variant so library search can group
 * revisions without pretending they are the same model.
 */
export const FAMILY_PATTERNS = [
  [/^seedance/i, "seedance"],
  [/^kling/i, "kling"],
  [/^veo/i, "veo"],
  [/^sora/i, "sora"],
  [/^wan/i, "wan"],
  [/^hailuo|^minimax/i, "minimax"],
  [/^gemini[- ]?omni/i, "gemini-omni"],
  [/^runway|^aleph/i, "runway"],
  [/^pika/i, "pika"],
  [/^happyhorse/i, "happyhorse"],
  [/^hunyuan/i, "hunyuan"],
  [/^jimeng|^即梦/i, "jimeng"],
  [/^cogvideo/i, "cogvideox"],
  [/^ltx/i, "ltx-video"],
  [/^mochi/i, "mochi"],
  [/^higgsfield/i, "higgsfield"],
  [/^luma/i, "luma"],
];

export function modelFamily(modelId) {
  const id = String(modelId ?? "").trim().toLowerCase();
  for (const [pattern, family] of FAMILY_PATTERNS) {
    if (pattern.test(id)) return family;
  }
  return "other";
}

/** Extract the revision digits, e.g. "wan-2.5" → "2.5", "veo-3" → "3". */
export function modelVariant(modelId) {
  const match = /(\d+(?:\.\d+)?)/.exec(String(modelId ?? ""));
  return match ? match[1] : null;
}
