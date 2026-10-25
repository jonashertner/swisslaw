import test from 'node:test';
import assert from 'node:assert/strict';
import { CANTONS, REFERRALS, ReferralSchema, isReviewDue, referralPath, referralTopic, selectReferrals, topicForArea } from '../lib/swisslaw-chat/referrals';
import { REFERRAL_TEXT, REFERRAL_TOPIC_TEXT } from '../lib/swisslaw-chat/referrals-i18n';

test('directory has unique, sourced, fully translated records and no mixed CH scope',()=>{
  assert.ok(REFERRALS.length>=70);
  assert.equal(new Set(REFERRALS.map(r=>r.id)).size,REFERRALS.length);
  for(const r of REFERRALS){
    assert.ok(ReferralSchema.safeParse(r).success,r.id);
    assert.ok(!r.cantons.includes('CH')||r.cantons.length===1,r.id);
    assert.ok(!JSON.stringify(r.copy.de).includes('ß'),r.id);
    assert.ok(r.verifiedAt <= '2026-10-25');
  }
  for(const c of CANTONS) assert.ok(REFERRALS.some(r=>r.cantons.includes(c)),`No direct regional entry: ${c}`);
  for(const entry of [...Object.values(REFERRAL_TEXT),...Object.values(REFERRAL_TOPIC_TEXT)]) for(const l of ['de','fr','it','rm','en'] as const) assert.ok(entry[l]);
});
test('canton and specialty filters do not leak in an unrelated canton or subject',()=>{
  const r=selectReferrals(REFERRALS,{topic:'migration',canton:'TI',freeOnly:false});
  assert.ok(r.some(r=>r.id==='sos-ticino-consultorio'));
  assert.ok(r.some(r=>r.id==='asylex'));
  assert.ok(!r.some(r=>r.id==='csp-geneve'));
  assert.ok(!r.some(r=>r.id==='inclusion-handicap'));
  assert.ok(r.every(r=>r.topics.includes('migration')));
});
test('free only excludes membership, unknown fees and paid advice; it does not remove stated eligibility',()=>{
  const r=selectReferrals(REFERRALS,{topic:'home',canton:'ZH',freeOnly:true});
  assert.ok(!r.some(r=>r.id==='mieterverband-deutschschweiz'));
  assert.ok(r.every(r=>r.cost==='free'||r.freeInitial));
  assert.ok(r.some(r=>r.id==='asi-infoalloggio'));
  const general=selectReferrals(REFERRALS,{topic:'general',canton:'BE',freeOnly:true});
  assert.ok(!general.some(r=>r.id==='bern-anwaltsverband'));
});
test('general clinics remain available as a separate, cost-filtered fallback',()=>{
  const specialized=selectReferrals(REFERRALS,{topic:'consumer',canton:'TI',freeOnly:false});
  const general=selectReferrals(REFERRALS,{topic:'general',canton:'TI',freeOnly:false});
  assert.ok(!specialized.some(r=>r.id==='oati-ticino'));
  assert.ok(general.some(r=>r.id==='oati-ticino'));
  assert.ok(!selectReferrals(REFERRALS,{topic:'general',canton:'TI',freeOnly:true}).some(r=>r.id==='oati-ticino'));
});
test('a regional specialist precedes a national route without ranking professional quality',()=>{
  const r=selectReferrals(REFERRALS,{topic:'migration',canton:'GR',freeOnly:false});
  assert.ok(r.findIndex(r=>r.id==='asylgraubuenden') < r.findIndex(r=>r.id==='asylex'));
});
test('routes accept only a public allowlisted topic, not narrative or injected markup',()=>{
  assert.equal(referralPath('de','home'),'/de/beratung/#topic=home');
  assert.equal(referralTopic('anything private'),'general');
  assert.equal(topicForArea('employment'),'work');
  assert.equal(topicForArea('traffic'),'general');
});
test('source review date becomes visibly stale after 90 days, never silently renewed',()=>{
  assert.equal(isReviewDue('2026-10-25',new Date('2026-11-01T00:00:00Z')),false);
  assert.equal(isReviewDue('2026-10-25',new Date('2027-02-01T00:00:00Z')),true);
});

test('explicit free first contacts remain findable and restricted advice is labelled',()=>{
  for(const id of ['caritas-asyl-auslaenderrecht','procap','zav-rechtsauskunft','schuldenberatung-schweiz']) assert.ok(REFERRALS.find(r=>r.id===id)?.freeInitial,id);
  for(const id of ['fiz-menschenhandel','zwangsheirat','inclusion-handicap']) assert.ok(REFERRALS.find(r=>r.id===id)?.specificAudience,id);
});

test('BeoBot is an external AI route with no promotional tracking or free-personal-advice promise',()=>{
  const r=REFERRALS.find(r=>r.id==='beobachter-beobot')!;
  assert.equal(r.kind,'ai');
  assert.equal(r.url,'https://www.beobachter.ch/beobot');
  assert.equal(r.cost,'conditional');
  assert.equal(r.freeInitial,false);
  assert.ok(r.privacyUrl);
  assert.ok(r.copy.de.privacyNote);
  assert.ok(!selectReferrals(REFERRALS,{topic:'general',canton:'',freeOnly:true}).includes(r));
});
