import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] ?? 'dist/client/_next/static/workers');
const files = (await readdir(directory)).filter(name => /^(engine|research)\.worker-.*\.js$/.test(name));
assert.equal(files.length, 2, 'Expected exactly one inference and one research worker');
for (const file of files) {
  let requests = 0;
  const context = {
    URL, URLSearchParams, TextEncoder, TextDecoder, console, atob, btoa,
    setTimeout, clearTimeout, performance, navigator: {},
    location: { href: 'https://example.test/worker.js' },
    fetch: async () => { requests++; throw new Error('Unexpected boot request'); },
    postMessage: () => {}, importScripts: () => { throw new Error('Unexpected boot import'); },
  };
  context.self = context;
  // Real browser workers have no window/document. Testing the emitted artifact
  // catches framework substitutions that a TypeScript unit test cannot detect.
  vm.runInNewContext(await readFile(resolve(directory, file), 'utf8'), context, { timeout: 10000 });
  assert.equal(typeof context.onmessage, 'function', `${file} must boot in a worker`);
  assert.equal(requests, 0, 'Boot must not transmit or download anything');
  console.log(`${file}: worker bootstrap passed`);
}
