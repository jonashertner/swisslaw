import { readdir, writeFile } from 'node:fs/promises';
import { commonHeaders, contentPolicy } from './security-headers.mjs';
const assets = await readdir(new URL('../dist/assets/', import.meta.url));
const paths = ['/', '/index.html', ...assets.map(name => '/assets/' + name)];
const base = '/*\n' + Object.entries(commonHeaders).map(([name, value]) => `  ${name}: ${value}\n`).join('');
const policies = paths.filter(path => contentPolicy(path)).map(path => `\n${path}\n  Content-Security-Policy: ${contentPolicy(path)}\n  Cache-Control: no-cache\n`).join('');
await writeFile(new URL('../dist/_headers', import.meta.url), base + policies);
await writeFile(new URL('../dist/favicon.svg', import.meta.url), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#fdfdfd"/><path d="M14 7h4v7h7v4h-7v7h-4v-7H7v-4h7z" fill="#191919"/></svg>');
