#!/usr/bin/env node
/**
 * Regenerate the static docs pages that GitHub Pages serves.
 *
 * We deliberately ship plain HTML with inline JSON instead of a framework:
 * zero build chain, no dependency drift, and the page works from a file://
 * URL for anyone who clones the repo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadModels, loadScenes } from "../src/models.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const siteDir = path.join(root, "site");

const models = loadModels();
const scenes = loadScenes();

const counts = {
  scenes: scenes.length,
  models: models.length,
  active: models.filter((m) => m.status === "active").length,
  prompts: scenes.reduce((n, s) => n + Object.keys(s.prompts ?? {}).length, 0),
};

const payload = { counts, models, scenes };

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Awesome AI Video Prompts — 10 scenes × ${counts.models} models</title>
<meta name="description" content="Cross-model AI video prompt library. ${counts.prompts} production-tested prompts across ${counts.scenes} scenes and ${counts.models} models, with a translator and linter.">
<meta property="og:title" content="Awesome AI Video Prompts">
<meta property="og:description" content="${counts.prompts} prompts · ${counts.scenes} scenes · ${counts.models} models · MIT">
<meta property="og:type" content="website">
<link rel="icon" href="//freecreate.app/favicon.svg">
<style>
  :root {
    --bg: #0b0b0f; --panel: #14141b; --line: #26262f; --text: #ececf1;
    --muted: #9a9aa8; --accent: #ff5c8a; --accent2: #7c5cff; --code: #0f0f14;
  }
  @media (prefers-color-scheme: light) {
    :root { --bg:#fbfbfd; --panel:#fff; --line:#e4e4ee; --text:#14141b; --muted:#5c5c6e; --code:#f5f5fa; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text);
    font: 15px/1.6 ui-sans-serif, -apple-system, "Segoe UI", Inter, system-ui, sans-serif; }
  a { color: inherit; }
  header { padding: 64px 24px 32px; max-width: 1080px; margin: 0 auto; }
  .eyebrow { color: var(--accent); font-weight: 600; letter-spacing: .08em; font-size: 12px; text-transform: uppercase; }
  h1 { font-size: clamp(30px, 5vw, 46px); line-height: 1.1; margin: 12px 0 16px; letter-spacing: -.02em; }
  .lede { color: var(--muted); max-width: 64ch; font-size: 17px; }
  .cta { display:flex; gap:12px; flex-wrap:wrap; margin-top: 24px; }
  .btn { display:inline-block; padding: 10px 18px; border-radius: 10px; text-decoration:none; font-weight:600; font-size:14px; border:1px solid var(--line); }
  .btn.primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); color:#fff; border:0; }
  .stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap:12px; margin: 40px auto 0; max-width:1080px; padding: 0 24px; }
  .stat { background: var(--panel); border:1px solid var(--line); border-radius: 12px; padding: 16px; }
  .stat b { display:block; font-size: 26px; letter-spacing:-.02em; }
  .stat span { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing:.06em; }
  main { max-width: 1080px; margin: 48px auto 96px; padding: 0 24px; }
  .toolbar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 20px; }
  input, select { background: var(--panel); color: var(--text); border:1px solid var(--line);
    border-radius: 10px; padding: 10px 12px; font: inherit; font-size: 14px; }
  input { flex: 1 1 260px; }
  .grid { display:grid; gap:14px; }
  article.scene { background: var(--panel); border:1px solid var(--line); border-radius: 14px; overflow:hidden; }
  article.scene > header { all: unset; display:flex; justify-content:space-between; gap:12px; align-items:baseline;
    padding: 16px 18px; cursor:pointer; }
  article.scene h2 { font-size: 16px; margin:0; letter-spacing:-.01em; }
  .meta { color: var(--muted); font-size: 12px; white-space: nowrap; }
  .tabs { display:flex; gap:6px; flex-wrap:wrap; padding: 0 18px 12px; }
  .tabs button { background: transparent; color: var(--muted); border:1px solid var(--line); border-radius: 999px;
    padding: 5px 11px; font-size: 12px; cursor:pointer; font-family: inherit; }
  .tabs button[aria-selected="true"] { background: var(--text); color: var(--bg); border-color: var(--text); }
  pre { margin: 0; padding: 16px 18px 20px; background: var(--code); overflow-x:auto; font-size: 13px;
    line-height: 1.65; white-space: pre-wrap; word-break: break-word; border-top: 1px solid var(--line);
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace; }
  .notes { padding: 10px 18px 16px; color: var(--muted); font-size: 13px; border-top: 1px dashed var(--line); }
  .empty { color: var(--muted); padding: 40px 0; text-align:center; }
  footer { border-top:1px solid var(--line); padding: 32px 24px 64px; max-width:1080px; margin:0 auto; color: var(--muted); font-size: 13px; }
  footer a { color: var(--text); }
  .badge { display:inline-block; font-size:11px; padding:2px 7px; border-radius:999px; border:1px solid var(--line); color:var(--muted); }
  .badge.retired { border-color:#6b2b3a; color:#ff8fa8; }
</style>
</head>
<body>
<header>
  <div class="eyebrow">Open source · MIT</div>
  <h1>Awesome AI Video Prompts</h1>
  <p class="lede">
    The same ten scenes, written natively for ${counts.models} video models. Not a rewritten
    copy — each prompt follows that model's documented structure, so you can diff how
    Seedance, Kling, Veo, Wan and the rest actually want to be asked.
  </p>
  <div class="cta">
    <a class="btn primary" href="https://freecreate.app" rel="noopener">Try them on FreeCreate →</a>
    <a class="btn" href="https://github.com/manallen/awesome-ai-video-prompts" rel="noopener">GitHub</a>
    <a class="btn" href="https://github.com/manallen/awesome-ai-video-prompts/blob/main/docs/PROMPT-TRANSLATION.md" rel="noopener">Translation guide</a>
  </div>
</header>

<div class="stats">
  <div class="stat"><b>${counts.prompts}</b><span>prompts</span></div>
  <div class="stat"><b>${counts.scenes}</b><span>scenes</span></div>
  <div class="stat"><b>${counts.models}</b><span>models</span></div>
  <div class="stat"><b>${counts.active}</b><span>active models</span></div>
</div>

<main>
  <div class="toolbar">
    <input id="q" type="search" placeholder="Search scenes — 'wuxia', 'chrome', 'portrait', 'dialogue'…" autocomplete="off">
    <select id="cat"><option value="">All categories</option></select>
    <select id="model"><option value="">All models</option></select>
  </div>
  <div class="grid" id="grid"></div>
  <div class="empty" id="empty" hidden>No scenes match.</div>
</main>

<footer>
  Every prompt here is MIT-licensed and free to copy. Model capability notes are date-stamped
  ${new Date().toISOString().slice(0, 10)} and cite vendor documentation — verify before shipping.
  Built and maintained by <a href="https://freecreate.app" rel="noopener">FreeCreate</a>.
</footer>

<script id="data" type="application/json">${JSON.stringify(payload).replace(/</g, "\\u003c")}</script>
<script>
(() => {
  const { models, scenes, counts } = JSON.parse(document.getElementById("data").textContent);
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const q = document.getElementById("q");
  const cat = document.getElementById("cat");
  const modelSel = document.getElementById("model");
  const status = new Map(models.map(m => [m.id, m.status]));

  for (const c of [...new Set(scenes.map(s => s.category))].sort()) {
    cat.insertAdjacentHTML("beforeend", '<option value="' + c + '">' + c + '</option>');
  }
  for (const m of models) {
    const tag = m.status === "retired" ? " (retired)" : "";
    modelSel.insertAdjacentHTML("beforeend", '<option value="' + m.id + '">' + m.id + tag + '</option>');
  }

  const esc = (s) => s.replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

  function render() {
    const term = q.value.trim().toLowerCase();
    const c = cat.value;
    const m = modelSel.value;
    let shown = 0;

    grid.innerHTML = "";
    for (const scene of scenes) {
      if (c && scene.category !== c) continue;
      if (m && !scene.prompts[m]) continue;
      const hay = (scene.title + " " + scene.id + " " + scene.category + " " + scene.useCase + " " +
        Object.values(scene.anchor || {}).join(" ")).toLowerCase();
      if (term && !hay.includes(term)) continue;
      shown++;

      const ids = Object.keys(scene.prompts);
      const first = m || ids[0];
      const art = document.createElement("article");
      art.className = "scene";
      art.innerHTML =
        '<header><h2>' + esc(scene.title) + '</h2>' +
        '<span class="meta">' + esc(scene.category) + ' · ' + ids.length + ' models</span></header>' +
        '<div class="tabs">' + ids.map(id =>
          '<button data-model="' + id + '" aria-selected="' + (id === first) + '">' + id +
          (status.get(id) === "retired" ? " ⏹" : "") + '</button>').join("") + '</div>' +
        '<pre></pre><div class="notes"></div>';

      const pre = art.querySelector("pre");
      const notes = art.querySelector(".notes");
      const paint = (id) => {
        const entry = scene.prompts[id];
        pre.textContent = entry.prompt.trim();
        notes.textContent = entry.notes || "";
        art.querySelectorAll(".tabs button").forEach(b =>
          b.setAttribute("aria-selected", String(b.dataset.model === id)));
      };
      art.querySelectorAll(".tabs button").forEach(b =>
        b.addEventListener("click", () => paint(b.dataset.model)));
      paint(first);
      grid.appendChild(art);
    }
    empty.hidden = shown > 0;
  }

  q.addEventListener("input", render);
  cat.addEventListener("change", render);
  modelSel.addEventListener("change", render);
  render();
})();
</script>
</body>
</html>
`;

writeFileSync(path.join(siteDir, "index.html"), html);
console.log(`Wrote site/index.html — ${counts.scenes} scenes, ${counts.models} models, ${counts.prompts} prompts`);
