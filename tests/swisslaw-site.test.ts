import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { SituationSchema, type Situation } from '../lib/swisslaw-chat/knowledge';
import { checkedFacts, LETTERS, parseRoute, searchSituations, situationHash, sourceLabel, sourceUrl, unreviewedTranslation, visibleInChannel, withPublishedLanguages } from '../lib/swisslaw-chat/site';
import { AREA_TEXT, LETTER_TEXT, SITE_TEXT } from '../lib/swisslaw-chat/site-i18n';
import { LATER, WAVE_1 } from '../lib/swisslaw-chat/coverage';

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
  const ids = WAVE_1.flatMap(g => g.topics.map(x => x.id));
  assert.deepEqual([...ids].sort(), all.map(s => s.id).sort());
  for (const g of [...WAVE_1, ...LATER]) {
    const label = g.label ?? AREA_TEXT[g.area];
    for (const lang of ['de', 'fr', 'it', 'rm', 'en'] as const) {
      assert.ok(label?.[lang], `${g.area}.${lang}`);
      for (const x of g.topics) assert.ok(x.title[lang], `${x.id ?? x.title.de}.${lang}`);
    }
  }
});

test('unreviewed translations stay off the public site', () => {
  const s = structuredClone(all.find(x => x.id === 'tenancy.early-exit')!);
  s.title.fr = 'Je veux partir avant la fin du délai de congé'; s.blocks[0].text.fr = 'Texte'; s.examples.fr = ['Partir plus tôt']; delete s.title.it;
  s.review.languages_reviewed = ['de'];
  const pub = withPublishedLanguages(s, 'public');
  assert.equal(pub.title.fr, undefined); assert.equal(pub.blocks[0].text.fr, undefined); assert.equal(pub.examples.fr, undefined);
  assert.equal(pub.sources['or-264'].url, s.sources['or-264'].url);
  assert.equal(withPublishedLanguages(s, 'review').title.fr, s.title.fr);
  assert.ok(unreviewedTranslation(s, 'fr')); assert.ok(!unreviewedTranslation(s, 'it'));
  s.review.languages_reviewed = ['de', 'fr'];
  assert.equal(withPublishedLanguages(s, 'public').title.fr, s.title.fr); assert.ok(!unreviewedTranslation(s, 'fr'));
});

test('sources use the reader\'s official abbreviations and Fedlex language', () => {
  const s = all.find(x => x.id === 'tenancy.early-exit')!;
  assert.equal(sourceLabel(s.sources['or-264'], 'fr'), 'CO · art. 264');
  assert.equal(sourceUrl(s.sources['or-264'], 'it'), 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/it#art_264');
  assert.equal(sourceLabel(s.sources['or-264'], 'en'), 'OR · Art. 264');
  assert.equal(sourceLabel(s.sources['bge-119-ii-36'], 'it'), 'DTF 119 II 36, consid. 3d');
  assert.equal(sourceLabel(s.sources['bger-4a-452-2019'], 'fr'), 'TF 4A_452/2019 du 1er juillet 2020, consid. 4.6');
  assert.equal(sourceLabel(s.sources['bger-4a-452-2019'], 'de'), 'BGer 4A_452/2019 vom 1. Juli 2020, E. 4.6');
});
