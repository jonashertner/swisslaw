import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { applicableBlocks, commentaryReferences, localText, sharedRuns, SituationSchema, validateSituation } from '../lib/swisslaw-chat/knowledge';

const dir = new URL('../knowledge/situations/', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.json'));
const load = (f: string) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

test('every situation file validates and is named after its id', () => {
  assert.ok(files.length >= 1);
  for (const f of files) {
    const raw = load(f);
    assert.deepEqual(validateSituation(raw), [], f);
    assert.equal(`${raw.id}.json`, f);
  }
});

test('landlord notice: blocks follow the facts', () => {
  const s = SituationSchema.parse(load('tenancy.landlord-notice.json'));
  const ids = (facts: Record<string, string>) => applicableBlocks(s, facts).map(b => b.id);
  const unknown = ids({});
  assert.ok(unknown.includes('deadline') && unknown.includes('how-to-file') && unknown.includes('form-unknown'));
  assert.ok(!unknown.includes('special-scope') && !unknown.includes('arrears'));
  const special = ids({ scope: 'special' });
  assert.ok(special.includes('special-scope') && !special.includes('deadline'));
  const arrears = ids({ scope: 'home', reason: 'arrears' });
  assert.ok(arrears.includes('arrears') && arrears.includes('deadline') && !arrears.includes('extension'));
  assert.ok(ids({ form: 'no' }).includes('form-missing'));
  assert.ok(ids({ family: 'single' }).includes('family-single'));
  assert.ok(!ids({ goal: 'stay' }).includes('agreed-extension'));
  assert.ok(applicableBlocks(s, {}).every(b => b.kind !== 'deadline' || b.deadline_rules?.length));
});

test('schema rejects missing unknown option, dangling references and unreviewed public status', () => {
  const s = load('tenancy.landlord-notice.json');
  const noUnknown = structuredClone(s); noUnknown.facts[0].options = noUnknown.facts[0].options.filter((o: { value: string }) => o.value !== 'unknown');
  assert.ok(validateSituation(noUnknown).some(p => p.includes('"unknown"')));
  const dangling = structuredClone(s); dangling.blocks[1].sources.push('nope');
  assert.ok(validateSituation(dangling).some(p => p.includes('unknown source nope')));
  const badRule = structuredClone(s); badRule.blocks[1].deadline_rules = ['no_such_rule'];
  assert.ok(validateSituation(badRule).some(p => p.includes('unknown deadline rule')));
  const unreviewed = structuredClone(s); unreviewed.status = 'public'; unreviewed.review = { ...s.review, reviewed_by: null, reviewed_at: null, languages_reviewed: [] };
  assert.ok(validateSituation(unreviewed).some(p => p.startsWith('review:')));
});

test('guards: commentary references and verbatim overlap block publication', () => {
  assert.deepEqual(commentaryReferences('Die Frist beträgt 30 Tage.'), []);
  assert.ok(commentaryReferences('siehe BSK OR I, Art. 271 N 12').length >= 2);
  assert.ok(commentaryReferences('Rz. 7').length === 1);
  assert.ok(commentaryReferences('laut Muster-Autorin', ['Muster-Autorin']).length === 1);
  const page = 'Die Kündigung ist nach herrschender Auffassung auch dann anfechtbar wenn der Vermieter keinen Grund nennt';
  assert.ok(sharedRuns('Wichtig: die Kündigung ist nach herrschender Auffassung auch dann anfechtbar wenn etwas', [page]).length > 0);
  assert.deepEqual(sharedRuns('Eine Kündigung kann angefochten werden, wenn sie gegen Treu und Glauben verstösst.', [page]), []);
  const s = load('tenancy.landlord-notice.json');
  const leaked = structuredClone(s); leaked.blocks[5].text.de += ' Vgl. Basler Kommentar.';
  assert.ok(validateSituation(leaked).some(p => p.includes('commentary reference')));
  assert.ok(validateSituation(s, { consultedPages: [s.blocks[5].text.de] }).some(p => p.includes('verbatim overlap')));
});

test('language fallback marks the language actually shown', () => {
  assert.deepEqual(localText({ de: 'Hallo' }, 'fr'), { text: 'Hallo', language: 'de' });
  assert.deepEqual(localText({ de: 'Hallo', fr: 'Bonjour' }, 'fr'), { text: 'Bonjour', language: 'fr' });
});
