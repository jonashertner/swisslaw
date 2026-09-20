// Public fictional examples only. Run manually when changing the topic catalogue.
// No user questions, account records or practice material are read.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { env, pipeline } from '@huggingface/transformers';
import { seeds } from './intake-seeds.mjs';

const manifest = JSON.parse(await readFile(new URL('../lib/swisslaw-chat/intake-model.json', import.meta.url), 'utf8'));
const scenarios = JSON.parse(await readFile(new URL('./intake-examples.json', import.meta.url), 'utf8'));
const directory = resolve(process.argv[2] ?? '.cache/intake-model');
for (const asset of manifest.artifacts) {
  const path = resolve(directory, asset.file); await mkdir(dirname(path), { recursive: true });
  let bytes;
  try { bytes = await readFile(path); } catch {
    const response = await fetch(asset.url, { signal: AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error('Public asset download failed');
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error(`Pinned asset mismatch: ${asset.file}`);
  await writeFile(path, bytes);
}
env.allowRemoteModels = false; env.allowLocalModels = true; env.useFSCache = false;
const extractor = await pipeline('feature-extraction', directory + '/', { device: 'cpu', dtype: 'q8' });
try {
  const examples = [];
  const records = [...seeds];
  for (const [category, languages] of Object.entries(scenarios)) for (const [language, texts] of Object.entries(languages)) for (const text of texts) records.push([category, language, text]);
  for (const [category, language, text] of records) {
    const output = await extractor(manifest.cataloguePrefix + text, { pooling: 'mean', normalize: true });
    examples.push({ category, language, text, vector: Array.from(output.data, value => Number(value.toFixed(7))) });
  }
  const catalogue = { schemaVersion: 1, model: manifest.model, revision: manifest.revision, prefix: manifest.cataloguePrefix, pooling: 'mean', normalize: true, dimensions: manifest.dimensions, examples };
  await writeFile(new URL('../lib/swisslaw-chat/intake-catalogue.json', import.meta.url), JSON.stringify(catalogue) + '\n');
  console.log(`Generated ${examples.length} public topic vectors.`);
} finally { await extractor.dispose(); }
