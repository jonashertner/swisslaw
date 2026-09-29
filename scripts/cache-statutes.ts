// Caches the German text of every statute provision the guides cite, so a guide page can show it beside the citation.
// A text is stored only if its hash matches the one recorded in the guide, i.e. it is the version that was checked.
// Federal legislation is not protected by copyright (URG Art. 5 Abs. 1 lit. a). Run: npx tsx scripts/cache-statutes.ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lawProvision } from '../lib/swisslaw-chat/research';
import { provisionHash } from '../lib/swisslaw-chat/practical';

const dir = 'knowledge/situations';
const out = 'knowledge/statutes.de.json';
type Entry = { sha256: string; url: string; body: string };
const cache: Record<string, Entry> = (() => { try { return JSON.parse(readFileSync(out, 'utf8')); } catch { return {}; } })();
const wanted = new Map<string, { sr: string; article: string; sha256: string }>();
for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const s = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  for (const r of Object.values(s.sources) as any[]) if (r.type === 'statute') wanted.set(`${r.sr}:${r.article}:${r.sha256}`, r);
}
let fetched = 0; const failed: string[] = [];
for (const { sr, article, sha256 } of wanted.values()) {
  const key = `${sr}:${article}`;
  if (cache[key]?.sha256 === sha256) continue;
  try {
    const l = await lawProvision(sr, article);
    if (await provisionHash(l.body) !== sha256) { failed.push(`${key} (text changed since the guide was checked)`); continue; }
    cache[key] = { sha256, url: l.url, body: l.body }; fetched++;
  } catch (e) { failed.push(`${key} (${(e as Error).message})`); }
}
writeFileSync(out, JSON.stringify(Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))), null, 1) + '\n');
console.log(`${Object.keys(cache).length} provisions cached, ${fetched} fetched now.`);
if (failed.length) console.log(`Not cached:\n  ${failed.join('\n  ')}`);
