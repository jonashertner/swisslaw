import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import manifest from './intake-model.json';
import catalogue from './intake-catalogue.json';
import { INTAKE_CACHE, isIntakeTopic, meaningfulDraft, rankedTopics, type TopicScore } from './intake';

// These URLs are bundled public runtime assets, independent of any user input.
const runtimeUrls = [
  new URL('../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs', import.meta.url).href,
  new URL('../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm', import.meta.url).href,
];
const nativeFetch = globalThis.fetch.bind(globalThis);
const denyFetch: typeof fetch = async () => { throw new Error('NETWORK_CLOSED'); };
globalThis.fetch = denyFetch;
const deny = class { constructor() { throw new Error('NETWORK_CLOSED'); } };
for (const key of ['XMLHttpRequest', 'WebSocket', 'EventSource']) Object.defineProperty(globalThis, key, { value: deny, writable: false });
env.allowRemoteModels = false; env.allowLocalModels = true;
env.localModelPath = '/intake-model/';
env.useBrowserCache = false; env.useFSCache = false; env.useCustomCache = false;
env.backends.onnx.wasm!.numThreads = 1;
env.backends.onnx.wasm!.proxy = false;
let extractor: FeatureExtractionPipeline | null = null;
let started = false; let ready = false; let busy = false;

type Asset = { file: string; bytes: number; sha256: string; url: string };
async function verified(bytes: ArrayBuffer, asset: Asset) {
  if (bytes.byteLength !== asset.bytes) return false;
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, '0')).join('') === asset.sha256;
}
async function prepare() {
  if (catalogue.revision !== manifest.revision || catalogue.dimensions !== manifest.dimensions || catalogue.prefix !== manifest.cataloguePrefix) throw new Error('MODEL_MISMATCH');
  const assets: Asset[] = [...manifest.artifacts, ...manifest.runtimeArtifacts.map((a, i) => ({ ...a, url: runtimeUrls[i] }))];
  const buffers: Record<string, ArrayBuffer> = {};
  const total = assets.reduce((n, a) => n + a.bytes, 0); let completed = 0;
  let cache: Cache | null = null;
  try { cache = await caches.open(INTAKE_CACHE); } catch { /* Private browsing can still use memory. */ }
  for (const asset of assets) {
    let bytes: ArrayBuffer | undefined;
    try { const saved = await cache?.match(asset.url); if (saved) { const b = await saved.arrayBuffer(); if (await verified(b, asset)) bytes = b; else await cache?.delete(asset.url); } } catch { /* Download a verified replacement. */ }
    if (!bytes) {
      const response = await nativeFetch(asset.url, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(180000) });
      if (!response.ok || !response.body) throw new Error('MODEL_DOWNLOAD');
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0; let last = 0;
      while (true) {
        const result = await reader.read(); if (result.done) break;
        length += result.value.byteLength;
        if (length > asset.bytes) { await reader.cancel(); throw new Error('MODEL_INTEGRITY'); }
        chunks.push(result.value);
        if (performance.now() - last > 100) { last = performance.now(); postMessage({ type: 'progress', value: Math.round(100 * (completed + length) / total) }); }
      }
      const joined = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length; }
      bytes = joined.buffer;
      if (!await verified(bytes, asset)) throw new Error('MODEL_INTEGRITY');
      try { await cache?.put(asset.url, new Response(bytes)); } catch { /* Quota exhaustion must not block use. */ }
    }
    buffers[asset.file] = bytes;
    completed += asset.bytes; postMessage({ type: 'progress', value: Math.round(100 * completed / total) });
  }
  postMessage({ type: 'preparing' });
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, self.location.origin);
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    if (method !== 'GET' || init?.body || (input instanceof Request && input.body) || url.origin !== self.location.origin) throw new Error('NETWORK_CLOSED');
    const prefix = '/intake-model/multilingual-e5-small/';
    const key = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname === '/intake-runtime.wasm' ? manifest.runtimeArtifacts[1].file : '';
    if (!key || !buffers[key]) throw new Error('NETWORK_CLOSED');
    return new Response(buffers[key], { headers: { 'Content-Type': key.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' } });
  };
  const moduleUrl = URL.createObjectURL(new Blob([buffers[manifest.runtimeArtifacts[0].file]], { type: 'text/javascript' }));
  try {
    env.backends.onnx.wasm!.wasmPaths = { mjs: moduleUrl, wasm: new URL('/intake-runtime.wasm', self.location.origin).href };
    extractor = await pipeline<'feature-extraction'>('feature-extraction', 'multilingual-e5-small', { device: 'wasm', dtype: 'q8' });
    await extractor(manifest.queryPrefix + 'public model preparation', { pooling: 'mean', normalize: true });
  } finally {
    globalThis.fetch = denyFetch; URL.revokeObjectURL(moduleUrl);
    for (const key of Object.keys(buffers)) delete buffers[key];
  }
  ready = true; postMessage({ type: 'ready' });
}
self.onmessage = async event => {
  const data = event.data;
  if (!data || busy) return;
  busy = true;
  try {
    if (data.type === 'load' && !started && Object.keys(data).length === 1) { started = true; await prepare(); }
    else if (data.type === 'classify' && ready && extractor && Number.isSafeInteger(data.id) && typeof data.text === 'string' && data.text.length <= 1200 && meaningfulDraft(data.text)) {
      const began = performance.now();
      const output = await extractor(manifest.queryPrefix + data.text, { pooling: 'mean', normalize: true });
      const vector = output.tolist()[0] as number[];
      const scores = new Map<string, number>();
      for (const example of catalogue.examples) {
        if (example.vector.length !== vector.length) throw new Error('MODEL_MISMATCH');
        const score = example.vector.reduce((n, v, i) => n + v * vector[i], 0);
        scores.set(example.category, Math.max(scores.get(example.category) ?? -1, score));
      }
      const ranked = [...scores].filter(([topic]) => isIntakeTopic(topic) || topic === 'other').map(([topic, score]) => ({ topic, score })) as TopicScore[];
      postMessage({ type: 'result', id: data.id, topics: rankedTopics(ranked), inferenceMs: Math.round(performance.now() - began) });
    }
  } catch {
    globalThis.fetch = denyFetch; ready = false;
    postMessage({ type: 'unavailable' });
  } finally { busy = false; }
};
