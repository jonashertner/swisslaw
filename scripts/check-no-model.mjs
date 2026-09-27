// The public site ships no language model: no inference, intake or research workers, and no code that
// downloads model files. Fails the build if any of that reappears in the output.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const dir = process.argv[2] ?? 'dist/assets';
const files = readdirSync(dir);
const workers = files.filter(f => /(engine|intake|research)\.worker/.test(f));
assert.deepEqual(workers, [], `Unexpected model/worker bundles: ${workers.join(', ')}`);
for (const f of files.filter(f => f.endsWith('.js'))) {
  const code = readFileSync(join(dir, f), 'utf8');
  for (const marker of ['huggingface.co', '@mlc-ai/web-llm', 'webllm', 'onnxruntime']) {
    assert.ok(!code.includes(marker), `${f} contains model code (${marker})`);
  }
}
console.log(`No model code in ${files.length} assets.`);
