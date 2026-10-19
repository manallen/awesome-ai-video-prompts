#!/usr/bin/env node
/**
 * Regenerate the static docs page that GitHub Pages serves.
 *
 * We deliberately ship plain HTML with inline JSON instead of a framework:
 * zero build chain, no dependency drift, and the page works from a file:// URL
 * for anyone who clones the repo.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadModels, loadScenes } from "../src/models.mjs";
import { loadLibrary } from "../src/library.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(here, "..", "site");

const models = loadModels();
const scenes = loadScenes();
const library = loadLibrary();

const counts = {
  scenes: scenes.length,
  models: models.length,
  active: models.filter((m) => m.status === "active").length,
  curated: scenes.reduce((n, s) => n + Object.keys(s.prompts ?? {}).length, 0),
  imported: library.counts.records,
  sources: library.sources.length,
};

// The imported corpus is large. Trim to the fields the page renders so the
// document stays a reasonable size; the full JSON stays in the repo.
const imported = library.prompts.map((p) => ({
  id: p.id,
  t: p.title,
  m: p.model,
  f: p.modelFamily,
  c: p.category,
  k: p.kind,
  l: p.language,
  s: p.sourceId,
  p: p.prompt,
  u: p.upstreamUrl,
  a: p.upstreamCredit,
  tier: p.upstreamTier,
}));

const payload = {
  counts,
  models,
  scenes,
  imported,
  sources: library.sources,
  bySource: library.bySource,
  byFamily: library.byFamily,
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Awesome AI Video Prompts — ${counts.curated} curated + ${counts.imported} imported prompts</title>
<meta name="description" content="Cross-model AI video prompt library: ${counts.curated} hand-written prompts across ${counts.scenes} scenes and ${counts.models} models, plus ${counts.imported} attributed prompts imported from open-source collections. Translator and linter included.">
<meta property="og:title" content="Awesome AI Video Prompts">
<meta property="og:description" content="${counts.curated} curated + ${counts.imported} imported prompts · ${counts.models} models · MIT">
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
  header.top { padding: 64px 24px 24px; max-width: 1080px; margin: 0 auto; }
  .eyebrow { color: var(--accent); font-weight: 600; letter-spacing: .08em; font-size: 12px; text-transform: uppercase; }
  h1 { font-size: clamp(30px, 5vw, 46px); line-height: 1.1; margin: 12px 0 16px; letter-spacing: -.02em; }
  .lede { color: var(--muted); max-width: 66ch; font-size: 17px; }
  .cta { display:flex; gap:12px; flex-wrap:wrap; margin-top: 24px; }
  .btn { display:inline-block; padding: 10px 18px; border-radius: 10px; text-decoration:none; font-weight:600; font-size:14px; border:1px solid var(--line); }
  .btn.primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); color:#fff; border:0; }
  .stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(130px,1fr)); gap:12px; margin: 32px auto 0; max-width:1080px; padding: 0 24px; }
  .stat { background: var(--panel); border:1px solid var(--line); border-radius: 12px; padding: 16px; }
  .stat b { display:block; font-size: 26px; letter-spacing:-.02em; }
  .stat span { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing:.06em; }
  main { max-width: 1080px; margin: 36px auto 96px; padding: 0 24px; }
  .tabs-main { display:flex; gap:8px; margin-bottom: 18px; border-bottom:1px solid var(--line); }
  .tabs-main button { background:none; border:0; border-bottom:2px solid transparent; color:var(--muted);
    padding: 10px 4px; margin-right: 14px; font: inherit; font-size: 14px; font-weight:600; cursor:pointer; }
  .tabs-main button[aria-selected="true"] { color: var(--text); border-bottom-color: var(--accent); }
  .toolbar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 20px; }
  input, select { background: var(--panel); color: var(--text); border:1px solid var(--line);
    border-radius: 10px; padding: 10px 12px; font: inherit; font-size: 14px; }
  input { flex: 1 1 260px; }
  .grid { display:grid; gap:14px; }
  article.scene { background: var(--panel); border:1px solid var(--line); border-radius: 14px; overflow:hidden; }
  article.scene > header { all: unset; display:flex; justify-content:space-between; gap:12px; align-items:baseline; padding: 16px 18px; }
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
  .notes:empty { display:none; }
  .empty { color: var(--muted); padding: 40px 0; text-align:center; }
  .credit { color: var(--muted); font-size: 12px; padding: 0 18px 14px; }
  .credit a { text-decoration: underline; text-underline-offset: 2px; }
  .pill { display:inline-block; font-size:11px; padding:1px 7px; border-radius:999px; border:1px solid var(--line); color:var(--muted); margin-right:6px; }
  .pill.snippet { border-color:#5a4a1e; color:#d6b25e; }
  .pill.unofficial { border-color:#5a2a2a; color:#e08a8a; }
  .more { display:block; margin: 20px auto 0; padding: 10px 22px; border-radius: 10px;
    border:1px solid var(--line); background: var(--panel); color: var(--text); font: inherit; cursor:pointer; }
  footer { border-top:1px solid var(--line); padding: 32px 24px 64px; max-width:1080px; margin:0 auto; color: var(--muted); font-size: 13px; }
  footer a { color: var(--text); }
  .sources { color: var(--muted); font-size: 13px; margin-top: 14px; }
  .sources li { margin: 4px 0; }
</style>
</head>
<body>
<header class="top">
  <div class="eyebrow">Open source · MIT</div>
  <h1>Awesome AI Video Prompts</h1>
  <p class="lede">
    Two layers. <strong>Curated</strong>: ${counts.scenes} scenes written natively for
    ${counts.models} models, so you can diff how each one actually wants to be asked.
    <strong>Imported</strong>: ${counts.imported} prompts pulled from open-source collections,
    every one carrying its source, license and confidence tier.
  </p>
  <div class="cta">
    <a class="btn primary" href="https://freecreate.app" rel="noopener">Try them on FreeCreate →</a>
    <a class="btn" href="https://github.com/manallen/awesome-ai-video-prompts" rel="noopener">GitHub</a>
    <a class="btn" href="https://github.com/manallen/awesome-ai-video-prompts/blob/main/docs/PROMPT-TRANSLATION.md" rel="noopener">Translation guide</a>
  </div>
</header>

<div class="stats">
  <div class="stat"><b>${counts.curated}</b><span>curated prompts</span></div>
  <div class="stat"><b>${counts.scenes}</b><span>scenes</span></div>
  <div class="stat"><b>${counts.imported}</b><span>imported prompts</span></div>
  <div class="stat"><b>${counts.sources}</b><span>upstream sources</span></div>
  <div class="stat"><b>${counts.models}</b><span>models</span></div>
</div>

<main>
  <div class="tabs-main" role="tablist">
    <button role="tab" data-view="curated" aria-selected="true">Curated scenes (${counts.curated})</button>
    <button role="tab" data-view="imported" aria-selected="false">Imported library (${counts.imported})</button>
  </div>

  <section id="view-curated">
    <div class="toolbar">
      <input id="q" type="search" placeholder="Search scenes — 'wuxia', 'chrome', 'portrait', 'dialogue'…" autocomplete="off">
      <select id="cat"><option value="">All categories</option></select>
      <select id="model"><option value="">All models</option></select>
    </div>
    <div class="grid" id="grid"></div>
    <div class="empty" id="empty" hidden>No scenes match.</div>
  </section>

  <section id="view-imported" hidden>
    <div class="toolbar">
      <input id="lq" type="search" placeholder="Search ${counts.imported} imported prompts — title, model, body…" autocomplete="off">
      <select id="lfam"><option value="">All model families</option></select>
      <select id="lsrc"><option value="">All sources</option></select>
      <select id="lkind">
        <option value="">Prompts + snippets</option>
        <option value="prompt">Full prompts only</option>
        <option value="snippet">Snippets only</option>
      </select>
    </div>
    <div class="grid" id="lgrid"></div>
    <div class="empty" id="lempty" hidden>No prompts match.</div>
    <button class="more" id="lmore" hidden>Load more</button>
    <ul class="sources" id="lsources"></ul>
  </section>
</main>

<footer>
  Curated prompts are original to this project. Imported prompts retain their upstream license and
  attribution — see <code>aivp credits</code> or <code>prompts/library.json</code>.
  Model capability notes are date-stamped and cite vendor documentation; verify before shipping.
  Built and maintained by <a href="https://freecreate.app" rel="noopener">FreeCreate</a>.
</footer>

<script id="data" type="application/json">${JSON.stringify(payload).replace(/</g, "\\u003c")}</script>
<script>
(() => {
  const { models, scenes, imported, sources, counts, bySource } = JSON.parse(document.getElementById("data").textContent);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  const modelStatus = new Map(models.map(m => [m.id, m.status]));
  const tierLabel = (t) => t === "official" || t === "official-platform" ? t
    : t === "unverified-3rd-party" ? "unverified" : t;

  // ---- tabs
  const tabs = [...document.querySelectorAll(".tabs-main button")];
  const views = { curated: document.getElementById("view-curated"), imported: document.getElementById("view-imported") };
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const t of tabs) t.setAttribute("aria-selected", String(t === tab));
      for (const [name, el] of Object.entries(views)) el.hidden = name !== tab.dataset.view;
    });
  }

  // ---- curated
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const q = document.getElementById("q");
  const cat = document.getElementById("cat");
  const modelSel = document.getElementById("model");

  for (const c of [...new Set(scenes.map(s => s.category))].sort()) {
    cat.insertAdjacentHTML("beforeend", '<option value="' + esc(c) + '">' + esc(c) + '</option>');
  }
  for (const m of models) {
    modelSel.insertAdjacentHTML("beforeend", '<option value="' + esc(m.id) + '">' + esc(m.id) +
      (m.status === "retired" ? " (retired)" : "") + '</option>');
  }

  function renderCurated() {
    const term = q.value.trim().toLowerCase();
    const c = cat.value, m = modelSel.value;
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
          '<button data-model="' + esc(id) + '" aria-selected="' + (id === first) + '">' + esc(id) +
          (modelStatus.get(id) === "retired" ? " ⏹" : "") + '</button>').join("") + '</div>' +
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

  q.addEventListener("input", renderCurated);
  cat.addEventListener("change", renderCurated);
  modelSel.addEventListener("change", renderCurated);
  renderCurated();

  // ---- imported
  const lgrid = document.getElementById("lgrid");
  const lempty = document.getElementById("lempty");
  const lq = document.getElementById("lq");
  const lfam = document.getElementById("lfam");
  const lsrc = document.getElementById("lsrc");
  const lkind = document.getElementById("lkind");
  const lmore = document.getElementById("lmore");
  const PAGE = 24;
  let shownCount = PAGE;

  const families = [...new Set(imported.map(p => p.f))].sort();
  for (const f of families) {
    lfam.insertAdjacentHTML("beforeend", '<option value="' + esc(f) + '">' + esc(f) + ' (' +
      imported.filter(p => p.f === f).length + ')</option>');
  }
  for (const s of sources) {
    lsrc.insertAdjacentHTML("beforeend", '<option value="' + esc(s.id) + '">' + esc(s.name) +
      ' (' + (bySource?.[s.id] ?? 0) + ')</option>');
  }

  const sourceById = new Map(sources.map(s => [s.id, s]));

  function matched() {
    const term = lq.value.trim().toLowerCase();
    const f = lfam.value, s = lsrc.value, k = lkind.value;
    const out = [];
    for (const p of imported) {
      if (f && p.f !== f) continue;
      if (s && p.s !== s) continue;
      if (k && p.k !== k) continue;
      if (term) {
        const hay = (p.t + " " + p.m + " " + p.c + " " + p.p).toLowerCase();
        if (!hay.includes(term)) continue;
      }
      out.push(p);
    }
    return out;
  }

  function renderImported(reset) {
    if (reset) shownCount = PAGE;
    const all = matched();
    lempty.hidden = all.length > 0;
    const slice = all.slice(0, shownCount);
    lgrid.innerHTML = "";
    for (const p of slice) {
      const src = sourceById.get(p.s);
      const art = document.createElement("article");
      art.className = "scene";
      const pills =
        '<span class="pill' + (p.k === "snippet" ? " snippet" : "") + '">' + esc(p.k) + '</span>' +
        '<span class="pill">' + esc(tierLabel(p.tier)) + '</span>' +
        '<span class="pill">' + esc(p.m) + '</span>';
      const creditBits = [];
      if (p.a) creditBits.push(esc(p.a));
      if (p.u) creditBits.push('<a href="' + esc(p.u) + '" rel="noopener nofollow">upstream</a>');
      if (src) creditBits.push('<a href="' + esc(src.repositoryUrl) + '" rel="noopener">' +
        esc(src.id) + '</a> · ' + esc(src.license));
      art.innerHTML =
        '<header><h2>' + esc(p.t) + '</h2><span class="meta">' + esc(p.c) + '</span></header>' +
        '<div class="tabs">' + pills + '</div>' +
        '<pre>' + esc(p.p.trim()) + '</pre>' +
        '<div class="notes">' + (p.a ? esc(p.a) : "") + '</div>' +
        '<div class="credit">' + creditBits.join(" · ") + '</div>';
      lgrid.appendChild(art);
    }
    lmore.hidden = all.length <= shownCount;
    lmore.textContent = "Load " + Math.min(PAGE, all.length - shownCount) + " more (" +
      (all.length - shownCount) + " remaining)";
  }

  lq.addEventListener("input", () => renderImported(true));
  lfam.addEventListener("change", () => renderImported(true));
  lsrc.addEventListener("change", () => renderImported(true));
  lkind.addEventListener("change", () => renderImported(true));
  lmore.addEventListener("click", () => { shownCount += PAGE; renderImported(false); });
  renderImported(true);

  // ---- sources footer
  const lsources = document.getElementById("lsources");
  lsources.innerHTML = "<li><strong>Imported from</strong></li>" + sources.map(s =>
    '<li>' + esc(s.name) + ' — <a href="' + esc(s.repositoryUrl) + '" rel="noopener">' +
    esc(s.repositoryUrl) + '</a> · ' + esc(s.license) + ' · ' + esc(bySource?.[s.id] ?? "") + '</li>').join("");
})();
</script>
</body>
</html>
`;

writeFileSync(path.join(siteDir, "index.html"), html);
console.log(
  `Wrote site/index.html — ${counts.curated} curated + ${counts.imported} imported prompts`,
);
