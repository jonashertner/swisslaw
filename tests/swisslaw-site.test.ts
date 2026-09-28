import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { SituationSchema, type Situation } from '../lib/swisslaw-chat/knowledge';
import { checkedFacts, LETTERS, parseRoute, searchSituations, situationHash, visibleInChannel } from '../lib/swisslaw-chat/site';
import { AREA_TEXT, LETTER_TEXT, SITE_TEXT } from '../lib/swisslaw-chat/site-i18n';
import { LATER, WAVE_1, WAVE_2 } from '../lib/swisslaw-chat/coverage';

const dir = new URL('../knowledge/situations/', import.meta.url);
const all: Situation[] = readdirSync(dir).filter(f => f.endsWith('.json'))
  .flatMap(f => { const r = SituationSchema.safeParse(JSON.parse(readFileSync(new URL(f, dir), 'utf8'))); return r.success ? [r.data] : []; });
const top = (q: string) => searchSituations(q, all, 'de')[0]?.id;

test('search finds situations from lay and dialect wording', () => {
  assert.equal(top('Vermieter hat mir gekündigt'), 'tenancy.landlord-notice');
  assert.equal(top('de Vermieter het mir d Wohnig kündet'), 'tenancy.landlord-notice');
  assert.deepEqual(searchSituations('', all, 'de'), []);
  assert.deepEqual(searchSituations('xyzzy qwerty', all, 'de'), []);
});

test('routes parse safely and facts round-trip through the fragment', () => {
  assert.deepEqual(parseRoute('#/'), { page: 'home' });
  assert.deepEqual(parseRoute('#/bereich/tenancy'), { page: 'area', area: 'tenancy' });
  assert.deepEqual(parseRoute('#/bereich/nope'), { page: 'home' });
  assert.deepEqual(parseRoute('#/frage'), { page: 'ask' });
  const r = parseRoute('#/s/tenancy.landlord-notice?form=no&x=<script>&scope=home');
  assert.equal(r.page, 'situation');
  if (r.page === 'situation') assert.deepEqual(r.facts, { form: 'no', scope: 'home' });
  assert.equal(situationHash('tenancy.landlord-notice', { scope: 'home', form: 'unknown', family: 'single' }), '#/s/tenancy.landlord-notice?family=single&scope=home');
});

test('shared links cannot inject answers that do not exist', () => {
  const s = all.find(x => x.id === 'tenancy.landlord-notice')!;
  assert.deepEqual(checkedFacts(s, { scope: 'home', form: 'maybe', nothere: 'yes' }), { scope: 'home' });
});

test('public channel shows reviewed situations only', () => {
  const s = all.find(x => x.id === 'tenancy.landlord-notice')!;
  assert.equal(visibleInChannel(s, 'public'), s.status === 'public');
  assert.equal(visibleInChannel(s, 'review'), true);
  assert.equal(visibleInChannel({ ...s, status: 'withdrawn' }, 'review'), false);
});

test('interface text exists in all five languages', () => {
  for (const [key, entry] of Object.entries(SITE_TEXT)) {
    if (key === 'note_expired') continue;
    for (const lang of ['de', 'fr', 'it', 'rm', 'en'] as const) assert.ok(entry[lang], `${key}.${lang}`);
  }
  for (const entry of Object.values(AREA_TEXT)) for (const lang of ['de', 'fr', 'it', 'rm', 'en'] as const) assert.ok(entry[lang]);
  for (const l of LETTERS) assert.ok(LETTER_TEXT[l.id], l.id);
});

test('coverage lists every situation once, in all five languages', () => {
  const ids = [...WAVE_1, ...WAVE_2].flatMap(g => g.topics.map(x => x.id));
  assert.deepEqual([...ids].sort(), all.map(s => s.id).sort());
  for (const g of [...WAVE_1, ...WAVE_2, ...LATER]) {
    const label = g.label ?? AREA_TEXT[g.area];
    for (const lang of ['de', 'fr', 'it', 'rm', 'en'] as const) {
      assert.ok(label?.[lang], `${g.area}.${lang}`);
      for (const x of g.topics) assert.ok(x.title[lang], `${x.id ?? x.title.de}.${lang}`);
    }
  }
});
