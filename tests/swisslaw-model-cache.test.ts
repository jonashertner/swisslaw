import test from 'node:test';
import assert from 'node:assert/strict';
import { isModelCacheUrl, removeModelCache } from '../lib/swisslaw-chat/model-cache';
import { MODEL_OPTIONS } from '../lib/swisslaw-chat/model-config';

const [small, large] = MODEL_OPTIONS;
const modelUrl = (model: typeof small | typeof large, name: string) => `${model.repository}/${name}`;
const scopes = ['webllm/model', 'webllm/config', 'webllm/wasm'] as const;
type ScopeName = typeof scopes[number];
type FakeOptions = {
  deleteFalse?: string;
  deleteReject?: string;
  rejectStorageKeys?: boolean;
  rejectOpen?: string;
  rejectCacheKeys?: string;
  afterDelete?: (scope: string, url: string, entries: Map<string, Set<string>>) => void;
  beforeCacheKeys?: (scope: string, count: number, entries: Map<string, Set<string>>) => void;
  beforeStorageKeys?: (count: number, entries: Map<string, Set<string>>) => void;
};
function fakeStorage(initial: Record<string, string[]>, options: FakeOptions = {}) {
  const entries = new Map(Object.entries(initial).map(([name, urls]) => [name, new Set(urls)]));
  const opened: string[] = [];
  const deleted: [string, string][] = [];
  let newCaches = 0, networkCalls = 0, storageKeyCalls = 0;
  const keyCalls = new Map<string, number>();
  const storage = {
    async keys() {
      storageKeyCalls++;
      if (options.rejectStorageKeys) throw new Error('synthetic storage unavailable');
      options.beforeStorageKeys?.(storageKeyCalls, entries);
      return [...entries.keys()];
    },
    async open(name: string) {
      opened.push(name);
      if (options.rejectOpen === name) throw new Error('synthetic cache access failure');
      if (!entries.has(name)) { newCaches++; entries.set(name, new Set()); }
      const urls = entries.get(name)!;
      return {
        async keys() {
          if (options.rejectCacheKeys === name) throw new Error('synthetic cache enumeration failure');
          const count = (keyCalls.get(name) ?? 0) + 1; keyCalls.set(name, count);
          options.beforeCacheKeys?.(name, count, entries);
          return [...urls].map(url => new Request(url));
        },
        async delete(request: Request) {
          deleted.push([name, request.url]);
          if (options.deleteReject === request.url) throw new Error('synthetic delete failure');
          if (options.deleteFalse === request.url) return false;
          const result = urls.delete(request.url);
          options.afterDelete?.(name, request.url, entries);
          return result;
        },
        async add() { networkCalls++; throw new Error('A deletion must not fetch'); },
        async addAll() { networkCalls++; throw new Error('A deletion must not fetch'); },
      };
    },
  } as unknown as CacheStorage;
  return { storage, entries, opened, deleted, get newCaches() { return newCaches; }, get networkCalls() { return networkCalls; } };
}

test('URL authority is limited to the two exact pinned repositories and runtime files', () => {
  for (const model of MODEL_OPTIONS) {
    for (const file of ['params_shard_0.bin', 'params_shard_999.bin', 'tokenizer.json', 'tensor-cache.json', 'mlc-chat-config.json']) assert.equal(isModelCacheUrl(modelUrl(model, file)), true);
    assert.equal(isModelCacheUrl(model.library), true);
    for (const value of [model.repository, model.repository + '-different/params.bin', model.repository.replace('/resolve/', '/resolve/other-') + '/params.bin', model.library + '?another-version', model.library + '.other', model.repository.replace('huggingface.co', 'huggingface.co.attacker.invalid') + '/params.bin']) assert.equal(isModelCacheUrl(value), false, value);
  }
  assert.equal(isModelCacheUrl('https://example.invalid/unrelated'), false);
});

test('removes both models, manifests, tokenizers and incomplete/orphan shards while preserving unrelated data', async t => {
  const targetModelFiles = MODEL_OPTIONS.flatMap(model => ['params_shard_0.bin', 'params_shard_999.bin', 'tensor-cache.json', 'tensor-cache-b16.json', 'tokenizer.json'].map(file => modelUrl(model, file)));
  const targetConfigs = MODEL_OPTIONS.map(model => modelUrl(model, 'mlc-chat-config.json'));
  const targetWasm = MODEL_OPTIONS.map(model => model.library);
  const unrelated = 'https://example.invalid/another-model/params.bin';
  const olderRevision = small.repository.replace(/[^/]+$/, 'older-public-revision') + '/params_shard_0.bin';
  const f = fakeStorage({ 'webllm/model': [...targetModelFiles, unrelated, olderRevision], 'webllm/config': [...targetConfigs, unrelated], 'webllm/wasm': [...targetWasm, unrelated], 'another-app': [modelUrl(small, 'params_shard_0.bin'), unrelated] });
  let externalFetches = 0; const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { externalFetches++; throw new Error('Unexpected network access'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  assert.equal(await removeModelCache(f.storage), targetModelFiles.length + targetConfigs.length + targetWasm.length);
  assert.deepEqual([...f.entries.get('webllm/model')!], [unrelated, olderRevision]);
  assert.deepEqual([...f.entries.get('webllm/config')!], [unrelated]);
  assert.deepEqual([...f.entries.get('webllm/wasm')!], [unrelated]);
  assert.deepEqual([...f.entries.get('another-app')!], [modelUrl(small, 'params_shard_0.bin'), unrelated]);
  assert.ok(f.opened.every(name => scopes.includes(name as ScopeName)));
  assert.equal(f.newCaches, 0); assert.equal(f.networkCalls, 0); assert.equal(externalFetches, 0);
});

test('empty or unrelated-only storage is unchanged and no WebLLM caches are created', async () => {
  for (const initial of [{}, { 'another-app': ['https://example.invalid/asset.js'] }] as Record<string, string[]>[]) {
    const f = fakeStorage(initial);
    assert.equal(await removeModelCache(f.storage), 0);
    assert.deepEqual(f.opened, []); assert.deepEqual(f.deleted, []);
    assert.equal(f.newCaches, 0); assert.equal(f.networkCalls, 0);
  }
});

test('partial download with no manifest is removed without retrieving a manifest', async () => {
  const target = modelUrl(large, 'params_shard_77.bin');
  const f = fakeStorage({ 'webllm/model': [target] });
  assert.equal(await removeModelCache(f.storage), 1);
  assert.equal(f.entries.get('webllm/model')!.size, 0);
  assert.equal(f.newCaches, 0); assert.equal(f.networkCalls, 0);
});

test('false or rejected deletion never reports successful removal', async () => {
  const target = modelUrl(small, 'params_shard_0.bin');
  for (const options of [{ deleteFalse: target }, { deleteReject: target }]) {
    const f = fakeStorage({ 'webllm/model': [target] }, options);
    await assert.rejects(() => removeModelCache(f.storage));
    assert.ok(f.entries.get('webllm/model')!.has(target));
    assert.equal(f.networkCalls, 0);
  }
});

test('storage discovery, opening and enumeration failures never become a success result', async () => {
  for (const options of [{ rejectStorageKeys: true }, { rejectOpen: 'webllm/model' }, { rejectCacheKeys: 'webllm/model' }]) {
    const f = fakeStorage({ 'webllm/model': [modelUrl(small, 'params_shard_0.bin')] }, options);
    await assert.rejects(() => removeModelCache(f.storage));
  }
});

test('final recheck detects a matching artifact written back by another operation', async () => {
  const target = modelUrl(small, 'params_shard_0.bin');
  const f = fakeStorage({ 'webllm/model': [target] }, { beforeCacheKeys(scope, count, entries) { if (scope === 'webllm/model' && count === 2) entries.get(scope)!.add(target); } });
  await assert.rejects(() => removeModelCache(f.storage), /CACHE_REMOVE_FAILED/);
  assert.ok(f.entries.get('webllm/model')!.has(target));
});

test('final storage recheck also detects a newly created approved scope containing a matching artifact', async () => {
  const f = fakeStorage({}, { beforeStorageKeys(count, entries) { if (count === 2) entries.set('webllm/wasm', new Set([large.library])); } });
  await assert.rejects(() => removeModelCache(f.storage), /CACHE_REMOVE_FAILED/);
  assert.equal(f.newCaches, 0);
});

test('a second removal is idempotent and preserves remaining unrelated records', async () => {
  const unrelated = 'https://example.invalid/other-model';
  const f = fakeStorage({ 'webllm/model': [modelUrl(large, 'params_shard_0.bin'), unrelated] });
  assert.equal(await removeModelCache(f.storage), 1);
  assert.equal(await removeModelCache(f.storage), 0);
  assert.deepEqual([...f.entries.get('webllm/model')!], [unrelated]);
});
