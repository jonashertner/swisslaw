// Validates every situation under knowledge/situations.
//   npm run check:knowledge            offline: schema, references, commentary and overlap guards
//   npm run check:knowledge -- --online  also re-fetches each cited provision via OpenCaseLaw and compares hashes
//   ... -- --online --print-hashes       prints current hashes (for preparing a new situation; never auto-writes)
// Private inputs (gitignored, optional): knowledge/.private/names.txt (one work/author per line) and
// knowledge/.private/pages/*.txt (consulted pages). They feed the guards and never leave this machine.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SituationSchema, validateSituation } from '../lib/swisslaw-chat/knowledge';
import { provisionHash } from '../lib/swisslaw-chat/practical';
import { lawProvision } from '../lib/swisslaw-chat/research';

const root = new URL('../knowledge/', import.meta.url).pathname;
const online = process.argv.includes('--online');
const printHashes = process.argv.includes('--print-hashes');
const privateDir = join(root, '.private');
const privateNames = existsSync(join(privateDir, 'names.txt')) ? readFileSync(join(privateDir, 'names.txt'), 'utf8').split('\n').map(s => s.trim()).filter(Boolean) : [];
const pagesDir = join(privateDir, 'pages');
const consultedPages = existsSync(pagesDir) ? readdirSync(pagesDir).filter(f => f.endsWith('.txt')).map(f => readFileSync(join(pagesDir, f), 'utf8')) : [];

let failed = false;
for (const file of readdirSync(join(root, 'situations')).filter(f => f.endsWith('.json')).sort()) {
  const raw = JSON.parse(readFileSync(join(root, 'situations', file), 'utf8'));
  const problems = validateSituation(raw, { privateNames, consultedPages });
  if (raw.id && `${raw.id}.json` !== file) problems.push(`file name must be ${raw.id}.json`);
  if (online && !problems.length) {
    const s = SituationSchema.parse(raw);
    for (const [id, src] of Object.entries(s.sources)) {
      if (src.type !== 'statute') continue;
      try {
        const law = await lawProvision(src.sr, src.article);
        const hash = await provisionHash(law.body);
        if (printHashes) console.log(`${file} ${id} ${src.sr}:${src.article} ${hash} (${law.date})`);
        if (hash !== src.sha256) problems.push(`sources.${id}: text changed at source (review required)`);
        if (law.url !== src.url) problems.push(`sources.${id}: url changed to ${law.url}`);
      } catch (e) { problems.push(`sources.${id}: unavailable (${(e as Error).message})`); }
    }
  }
  console.log(problems.length ? `✗ ${file}\n  - ${problems.join('\n  - ')}` : `✓ ${file}`);
  if (problems.length) failed = true;
}
if (failed) process.exitCode = 1;
