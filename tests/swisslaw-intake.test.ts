import test from 'node:test';
import assert from 'node:assert/strict';
import { isIntakeTopic, lexicalTopics, meaningfulDraft, rankedTopics, stableTopics, INTAKE_CACHE } from '../lib/swisslaw-chat/intake';
import { removeModelCache } from '../lib/swisslaw-chat/model-cache';
import catalogue from '../lib/swisslaw-chat/intake-catalogue.json';
import manifest from '../lib/swisslaw-chat/intake-model.json';

test('live intake is optional and short or unknown input does not force a topic', () => {
  for (const text of ['', 'help', '!!! 🙃', '123456789', 'what is the weather tomorrow']) assert.deepEqual(lexicalTopics(text), []);
  assert.equal(meaningfulDraft('123456789'), false);
  assert.equal(isIntakeTopic('home; fetch something'), false);
  assert.equal(isIntakeTopic('__proto__'), false);
});
test('cold-start matching covers rough language and leaves mixed topics visible', () => {
  assert.ok(lexicalTopics('mein arbeitsvertrag künden').includes('work'));
  assert.ok(lexicalTopics('was muss ich tun für heiraten').includes('family'));
  assert.ok(lexicalTopics('la mia casa in affitto ha la muffa').includes('home'));
  assert.deepEqual(lexicalTopics('ich will künden'), ['work', 'home']);
  const mixed = lexicalTopics('mein vermieter erhöht die miete und mein chef zahlt nicht');
  assert.ok(mixed.includes('home')); assert.ok(mixed.includes('work'));
});
test('semantic scores permit abstention and alternatives rather than compulsory classification', () => {
  assert.deepEqual(rankedTopics([{ topic: 'work', score: .82 }, { topic: 'other', score: .70 }]), []);
  assert.deepEqual(rankedTopics([{ topic: 'work', score: .9 }, { topic: 'other', score: .9 }]), []);
  assert.deepEqual(rankedTopics([{ topic: 'work', score: .91 }, { topic: 'home', score: .90 }, { topic: 'money', score: .80 }, { topic: 'other', score: .75 }]), ['work', 'home']);
  assert.deepEqual(rankedTopics([{ topic: 'work', score: NaN }, { topic: 'other', score: .75 }]), []);
  assert.deepEqual(stableTopics(['home', 'work'], ['work', 'home', 'money']), ['home', 'work', 'money']);
});
test('public vectors match the pinned embedding contract and are finite normalised 384-vectors', () => {
  assert.equal(catalogue.model, manifest.model); assert.equal(catalogue.revision, manifest.revision);
  assert.equal(catalogue.prefix, manifest.queryPrefix); assert.equal(catalogue.prefix, manifest.cataloguePrefix);
  assert.equal(catalogue.dimensions, 384);
  for (const example of catalogue.examples) {
    assert.ok(isIntakeTopic(example.category) || example.category === 'other');
    assert.equal(example.vector.length, 384); assert.ok(example.vector.every(Number.isFinite));
    const norm = Math.sqrt(example.vector.reduce((n, x) => n + x*x, 0));
    assert.ok(Math.abs(norm - 1) < .001);
  }
  for (const asset of manifest.artifacts) {
    assert.ok(asset.url.startsWith(`https://huggingface.co/${manifest.model}/resolve/${manifest.revision}/`));
    assert.match(asset.sha256, /^[0-9a-f]{64}$/); assert.ok(asset.bytes > 0);
  }
});
test('cache removal deletes the complete suggestion cache without touching unrelated storage', async () => {
  const names = new Set([INTAKE_CACHE, 'unrelated']); const opened: string[] = [];
  const storage = {
    keys: async () => [...names],
    open: async (name: string) => { opened.push(name); return { keys: async () => [new Request('https://example.test/public-model')] }; },
    delete: async (name: string) => names.delete(name),
  } as unknown as CacheStorage;
  assert.equal(await removeModelCache(storage), 1);
  assert.deepEqual([...names], ['unrelated']); assert.deepEqual(opened, [INTAKE_CACHE]);
  assert.equal(await removeModelCache(storage), 0);
});
test('failed encoder-cache deletion cannot be reported as success', async () => {
  const storage = {
    keys: async () => [INTAKE_CACHE], open: async () => ({ keys: async () => [] }), delete: async () => false,
  } as unknown as CacheStorage;
  await assert.rejects(removeModelCache(storage), /CACHE_REMOVE_FAILED/);
});
