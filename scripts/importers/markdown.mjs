/**
 * Markdown prompt extraction.
 *
 * Upstream collections all follow roughly the same shape but disagree on the
 * details: `**Prompt:**`, `**Full Prompt:**`, "提示词", a bare fenced block after
 * a heading. This module handles the shapes actually present in the sources we
 * import, and refuses anything that does not match — a silent zero-result
 * importer is worse than a loud failure.
 */

const PROMPT_LABEL = /^\s*\*\*(?:full\s+)?prompt(?:\s*(?:\(.*?\)))?\s*:?\s*\*\*\s*$/i;
// Accept both ASCII and full-width colon — CJK collections use 「**提示词**：」.
const PROMPT_LABEL_CJK = /^\s*\*\*提示词\s*[:：]?\s*\*\*\s*[:：]?\s*$/;
const FENCE = /^\s*```/;

/**
 * Split a markdown document into { heading, sectionText } blocks.
 * A section runs from its `##`/`###` heading to the next heading of the same
 * or higher level.
 */
export function splitSections(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  const sections = [];
  let current = null;
  let fenceOpen = false;

  for (const line of lines) {
    if (FENCE.test(line)) fenceOpen = !fenceOpen;
    if (fenceOpen) {
      if (current) current.lines.push(line);
      continue;
    }

    const heading = /^(#{2,3})\s+(.*\S)\s*$/.exec(line);
    if (heading) {
      if (current) sections.push(current);
      current = { level: heading[1].length, heading: heading[2].trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);

  return sections.map(({ level, heading, lines: body }) => ({
    level,
    heading,
    text: body.join("\n").trim(),
  }));
}

/** Pull the first fenced code block that follows a `**Prompt:**` label. */
export function extractPromptBlock(sectionText) {
  const lines = String(sectionText).split(/\r?\n/);
  let armed = false;
  let openFence = null;
  let buffer = null;

  for (const line of lines) {
    if (!buffer) {
      if (PROMPT_LABEL.test(line) || PROMPT_LABEL_CJK.test(line)) {
        armed = true;
        continue;
      }
      if (armed) {
        const fence = /^\s*```(\w*)\s*$/.exec(line);
        if (fence) {
          openFence = fence[1] || "text";
          buffer = [];
        }
        continue;
      }
      continue;
    }

    if (FENCE.test(line)) {
      const text = buffer.join("\n").trim();
      return text ? { text, language: openFence } : null;
    }
    buffer.push(line);
  }
  return null;
}

/** First image URL and first source credit in a section. */
export function extractMedia(sectionText) {
  const text = String(sectionText);
  const image = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/.exec(text)?.[1]
    ?? /<img[^>]*\bsrc="(https?:\/\/[^"]+)"/i.exec(text)?.[1]
    ?? null;

  // Sources vary: "**Source:** …", "*Source: …*", "**Post:** …", "**Video Link:** …".
  // Take the first line that looks like a credit, and its first URL.
  const creditLine =
    /^\s*\*{1,2}(?:source|post|credit|author)s?\s*:?\s*\*{1,2}\s*(.+)$/im.exec(text)?.[1] ??
    /^\s*\*source\s*:\s*(.+)\*\s*$/im.exec(text)?.[1] ??
    null;

  // Prefer a status/tweet URL over a bare profile link: a profile does not
  // identify the individual post the credit refers to.
  const links = [...(creditLine ?? "").matchAll(/\((https?:\/\/[^)\s]+)\)/g)]
    .map((m) => m[1])
    .filter((url) => !/\.(?:mp4|webm|mov)(?:$|\?)/i.test(url));
  const url = links.find((u) => /\/(?:status|statuses)\//.test(u)) ?? links[0] ?? null;
  const label = creditLine
    ? plainText(
        creditLine
          .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
          .replace(/\s*\|.*$/, "")
          .replace(/\s*[-–—]\s*(?:post|x\/twitter).*$/i, ""),
      )
    : null;

  return { image, upstreamCredit: label || null, upstreamUrl: url };
}

/** URL-safe slug for headings used as record ids. */
export function slugify(value, maxLength = 60) {
  const slug = plainText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, maxLength).replace(/-+$/g, "") || "untitled";
}

/** Strip inline markdown that would otherwise leak into a title or note. */
export function plainText(value) {
  return String(value ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
