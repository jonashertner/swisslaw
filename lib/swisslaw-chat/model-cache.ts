import { MODEL_OPTIONS } from './model-config';
import { INTAKE_CACHE } from './intake';

const SCOPES = ['webllm/model', 'webllm/config', 'webllm/wasm'] as const;
export function isModelCacheUrl(url: string): boolean {
  return MODEL_OPTIONS.some(model => url.startsWith(model.repository + '/') || url === model.library);
}

// No model-runtime import and no fetch: even incomplete downloads can be removed.
// Only this origin's entries for the two pinned models are touched. Other cached
// models, application assets and unrelated browser storage are left intact.
export async function removeModelCache(storage: CacheStorage): Promise<number> {
  let removed = 0;
  const names = await storage.keys();
  if (names.includes(INTAKE_CACHE)) {
    const intake = await storage.open(INTAKE_CACHE);
    removed += (await intake.keys()).length;
    if (!await storage.delete(INTAKE_CACHE)) throw new Error('CACHE_REMOVE_FAILED');
  }
  for (const name of SCOPES) {
    if (!names.includes(name)) continue;
    const cache = await storage.open(name);
    for (const request of await cache.keys()) {
      if (isModelCacheUrl(request.url)) {
        if (!await cache.delete(request)) throw new Error('CACHE_REMOVE_FAILED');
        removed++;
      }
    }
  }
  for (const name of await storage.keys()) {
    if (!SCOPES.includes(name as typeof SCOPES[number])) continue;
    if ((await (await storage.open(name)).keys()).some(request => isModelCacheUrl(request.url))) throw new Error('CACHE_REMOVE_FAILED');
  }
  if ((await storage.keys()).includes(INTAKE_CACHE)) throw new Error('CACHE_REMOVE_FAILED');
  return removed;
}
