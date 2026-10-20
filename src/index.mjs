/**
 * Public API surface.
 *
 *   import { search, translate, validate, models, scenes } from "awesome-ai-video-prompts";
 */
import { loadModels, loadScenes, getModel, activeModels, retiredModels } from "./models.mjs";
import { searchScenes } from "./search.mjs";
import { translate } from "./translate.mjs";
import { validatePrompt, validateAll, countWords, countCJK } from "./validate.mjs";
import {
  loadLibrary,
  libraryIndex,
  searchLibrary,
  libraryRecord,
  attributionLines,
  corpusStats,
  analyzeRecord,
  loadFamilies,
  familyCoverage,
  unverifiedFamilies,
} from "./library.mjs";
import { analyzePrompt } from "./analyze.mjs";

export const models = loadModels();
export const scenes = loadScenes();

export function search(query, options) {
  return searchScenes(query, scenes, options);
}

export function getScene(id) {
  const scene = scenes.find((s) => s.id === id);
  if (!scene) throw new Error(`Unknown scene "${id}"`);
  return scene;
}

export function promptFor(sceneId, modelId) {
  const scene = getScene(sceneId);
  const entry = scene.prompts?.[modelId];
  if (!entry) throw new Error(`Scene "${sceneId}" has no prompt for "${modelId}"`);
  return entry;
}

export function validate(prompt, modelId, options) {
  return validatePrompt(prompt, modelId, models, options);
}

// --- imported third-party corpus (prompts/library.json) ---
export {
  loadLibrary,
  libraryIndex,
  searchLibrary,
  libraryRecord,
  attributionLines,
  corpusStats,
  analyzeRecord,
  analyzePrompt,
  loadFamilies,
  familyCoverage,
  unverifiedFamilies,
};

export { translate, validateAll, countWords, countCJK, getModel, activeModels, retiredModels };
export { parseLabeled, parseFourBlock, extractSemantics, renderFor } from "./translate.mjs";

export default {
  models,
  scenes,
  search,
  getScene,
  promptFor,
  validate,
  translate,
  validateAll,
  searchLibrary,
  libraryRecord,
  libraryIndex,
  corpusStats,
  analyzePrompt,
  familyCoverage,
};
