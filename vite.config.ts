import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Knowledge-base situations are filtered at build time, so a public build never contains draft text.
// Public (default): status "public" only. Review (VITE_CHANNEL=review): everything except "withdrawn".
function situations(): Plugin {
  const id = 'virtual:swisslaw-situations';
  const dir = fileURLToPath(new URL('./knowledge/situations/', import.meta.url));
  return {
    name: 'swisslaw-situations',
    resolveId: source => (source === id ? `\0${id}` : undefined),
    load(resolved) {
      if (resolved !== `\0${id}`) return undefined;
      const review = process.env.VITE_CHANNEL === 'review';
      const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
      for (const f of files) this.addWatchFile(join(dir, f));
      const list = files.map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')))
        .filter(s => s.status !== 'withdrawn' && (review || s.status === 'public'));
      return `export default ${JSON.stringify(list)};`;
    },
  };
}

export default defineConfig({ plugins: [react(), situations()], publicDir: false, resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } }, worker: { format: 'iife' }, build: { sourcemap: false } });
