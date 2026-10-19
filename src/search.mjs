/**
 * Scene search.
 *
 * A deliberately small BM25-lite scorer: exact phrase > token overlap, with
 * field weighting so that category and title match harder than free prose.
 * No index, no dependencies, ~130 lines. Good to a few thousand scenes.
 */

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into",
  "is", "it", "of", "on", "or", "that", "the", "to", "with", "without", "this",
]);

export function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function fieldTokens(scene) {
  return {
    id: tokenize(scene.id),
    title: tokenize(scene.title),
    category: tokenize(`${scene.category} ${(scene.tags ?? []).join(" ")}`),
    useCase: tokenize(scene.useCase),
    anchor: tokenize(
      [
        scene.anchor?.subject,
        scene.anchor?.scene,
        scene.anchor?.motion,
        scene.anchor?.mood,
        scene.anchor?.camera,
        scene.anchor?.audio,
        scene.anchor?.light,
      ]
        .filter(Boolean)
        .join(" "),
    ),
  };
}

const WEIGHTS = { id: 6, title: 5, category: 4, useCase: 3, anchor: 1 };

export function scoreScene(scene, queryTokens) {
  if (queryTokens.length === 0) return 0;
  const fields = fieldTokens(scene);
  let score = 0;
  for (const [field, tokens] of Object.entries(fields)) {
    if (tokens.length === 0) continue;
    const bag = new Map();
    for (const t of tokens) bag.set(t, (bag.get(t) ?? 0) + 1);
    for (const q of queryTokens) {
      const hit = bag.get(q);
      if (hit) score += WEIGHTS[field] * (1 + Math.log2(1 + hit));
      // prefix match, cheaper than exact
      else if (q.length > 3) {
        for (const t of bag.keys()) {
          if (t.startsWith(q)) {
            score += WEIGHTS[field] * 0.4;
            break;
          }
        }
      }
    }
  }
  return score;
}

/**
 * @param {string} query
 * @param {Array} scenes
 * @param {{limit?: number, category?: string, model?: string}} options
 */
export function searchScenes(query, scenes, options = {}) {
  const { limit = 10, category, model } = options;
  let pool = scenes;
  if (category) {
    pool = pool.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  }
  if (model) {
    pool = pool.filter((s) => Object.prototype.hasOwnProperty.call(s.prompts ?? {}, model));
  }

  const qTokens = tokenize(query);
  if (qTokens.length === 0) {
    return pool.slice(0, limit).map((scene) => ({ scene, score: 0 }));
  }

  // exact phrase bonus
  const phrase = query.trim().toLowerCase();

  return pool
    .map((scene) => {
      let score = scoreScene(scene, qTokens);
      const hay = `${scene.title} ${scene.id} ${scene.category} ${scene.useCase}`.toLowerCase();
      if (hay.includes(phrase)) score += 12;
      return { scene, score: Number(score.toFixed(3)) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.scene.id.localeCompare(b.scene.id))
    .slice(0, limit);
}
