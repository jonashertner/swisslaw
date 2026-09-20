import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HOUSING_TOPICS, HOUSING_TITLES, EMPTY_HOUSING_FACTS, housingGuide, housingQuestions, checkedHousingFacts } from '../lib/swisslaw-chat/housing';
import { HOUSING_COPY } from '../lib/swisslaw-chat/housing-copy';
import housingTranslations from '../lib/swisslaw-chat/housing-translations.json';
import { housingText } from '../lib/swisslaw-chat/housing-translations';
import { suggestPracticalTopics, practicalCategory, type PracticalTopic } from '../lib/swisslaw-chat/practical';
import { PRACTICAL_REFERENCES } from '../lib/swisslaw-chat/practical-manifest';
import { PublicSourceCache, PUBLIC_PACKET_TTL_MS } from '../lib/swisslaw-chat/public-source-cache';
import { checkedResearchJob } from '../lib/swisslaw-chat/guide';
import { researchPractical } from '../lib/swisslaw-chat/research';
import type { Source } from '../lib/swisslaw-chat/policy';
const laws=JSON.parse(readFileSync(new URL('./fixtures/practical-public-laws.json',import.meta.url),'utf8'));
function packet(topic:PracticalTopic):Source[]{return PRACTICAL_REFERENCES[topic].map(ref=>{const law=laws[`${ref.sr}:${ref.article}`];const a=law.articles.find((a:any)=>a.article_num===ref.article);return{id:`${ref.sr}:${ref.article}`,kind:'law',title:ref.label,url:ref.url,text:[a.heading,a.text].filter(Boolean).join('\n'),jurisdiction:'CH',language:'de',date:''};});}
const prose=(topic:typeof HOUSING_TOPICS[number],facts=EMPTY_HOUSING_FACTS)=>{const g=housingGuide(topic,facts);return [g.intro,...g.steps.map(s=>s.text),...g.rules.map(s=>s.text),g.check].join('\n');};
test('lay housing questions route before any model and preserve multiple possibilities',()=>{
  const cases:[string,PracticalTopic[]][]=[
    ['meine miete wird teurer was tun',['rent-increase']],['min mieti wird türer',['rent-increase']],
    ['the landlord increased my rent',['rent-increase']],['mon loyer augmente',['rent-increase']],['aumento affitto',['rent-increase']],
    ['schimmel in meiner wohnung',['housing-defect']],['heizung kaputt wohnig kalt',['housing-defect']],['mould in my flat',['housing-defect']],['muffa appartamento',['housing-defect']],
    ['vermieter will mich rauswerfen',['tenancy-end']],['ich will usziehe us minere wohnig',['tenancy-end']],['je veux résilier mon bail',['tenancy-end']],['disdetta affitto',['tenancy-end']],
    ['meine miete steigt und es hat schimmel in der wohnung',['rent-increase','housing-defect']],
    ['mein Mietvertrag',['rent-increase','housing-defect','tenancy-end']],['wie kündige ich meinen Arbeitsvertrag',[]],['my mobile subscription is more expensive',[]],
  ];
  for(const [text,expected] of cases)assert.deepEqual(suggestPracticalTopics(text),expected,text);
  const independent = JSON.parse(readFileSync(new URL('./fixtures/housing-router-cases.json',import.meta.url),'utf8'));
  for(const row of independent)assert.deepEqual(suggestPracticalTopics(row.text),row.candidates,row.text);
  assert.deepEqual(suggestPracticalTopics('Schimmel, was tun?', 'home'),['housing-defect']);
  assert.deepEqual(suggestPracticalTopics('Heizung kaputt', 'home'),['housing-defect']);
  assert.deepEqual(suggestPracticalTopics('meinen Arbeitsvertrag kündigen', 'home'),[]);
  for(const topic of HOUSING_TOPICS)assert.equal(practicalCategory(topic),'Home');
});
test('unknown facts and special tenancies never become established ordinary entitlements',()=>{
  assert.deepEqual(Object.values(EMPTY_HOUSING_FACTS),['unknown','unknown','unknown','unknown']);
  assert.throws(()=>checkedHousingFacts({...EMPTY_HOUSING_FACTS,name:'CANARY'}as any));
  for(const topic of HOUSING_TOPICS){const special=housingGuide(topic,{...EMPTY_HOUSING_FACTS,scope:'special'});assert.equal(special.rules.length,0);assert.match(special.intro,/may not apply/);assert.ok(!special.steps.some(s=>s.text.includes('three months')));}
  assert.match(prose('housing-defect',{...EMPTY_HOUSING_FACTS,scope:'home'}),/If you are unsure whether the landlord knows/);
  const initial=housingGuide('rent-increase',{...EMPTY_HOUSING_FACTS,scope:'home',situation:'initial'});assert.equal(initial.rules.length,0);assert.ok(!initial.steps.some(s=>s.refs?.includes('220:270b')));
});
test('deadline triggers, deposit preconditions and early return qualifications survive composition',()=>{
  const rent=prose('rent-increase',{...EMPTY_HOUSING_FACTS,scope:'home',situation:'increase'});assert.match(rent,/within 30 days after legal receipt/);assert.match(rent,/does not preserve/);assert.match(rent,/no earlier than the next permissible termination date/);
  const defect=prose('housing-defect',{...EMPTY_HOUSING_FACTS,scope:'home',notified:'yes'});assert.match(defect,/from when the landlord knew/);assert.match(defect,/remains after that deadline/);assert.match(defect,/first deposited rent becomes due/);assert.match(defect,/not an automatic fixed percentage/);
  const early=prose('tenancy-end',{...EMPTY_HOUSING_FACTS,scope:'home',exit:'early'});assert.match(early,/return of the premises/);assert.match(early,/same terms/);assert.ok(!early.includes('three months'));
  const notice=prose('tenancy-end',{...EMPTY_HOUSING_FACTS,scope:'home',exit:'received'});assert.match(notice,/30-day period after legal receipt/);assert.ok(!notice.includes('statutory default is three months'));
});
test('housing packets and citations are complete, hash-bound and independently reusable',async()=>{
  const cache=new PublicSourceCache();const at=1000000;
  for(const topic of HOUSING_TOPICS){await cache.put(topic,packet(topic),at);assert.ok(cache.get(topic,at));
    for(const scope of ['home','unknown','special']as const)for(const exit of ['own','early','received','unknown']as const){const g=housingGuide(topic,{...EMPTY_HOUSING_FACTS,scope,exit});for(const part of [...g.steps,...g.rules])for(const id of part.refs??[])assert.ok(packet(topic).some(s=>s.id===id),`${topic}: ${id}`);}
  }
  const p=cache.get('rent-increase',at)!;p.sources[0].text='mutation';assert.notEqual(cache.get('rent-increase',at)!.sources[0].text,'mutation');
  assert.equal(cache.get('rent-increase',at+PUBLIC_PACKET_TTL_MS),null);
  assert.equal(cache.get('housing-defect',at-1),null);
  cache.clear();assert.equal(cache.get('tenancy-end',at),null);
});
test('cache rejects changed sources and strips arbitrary caller labels and fields',async()=>{
  const cache=new PublicSourceCache();const original=packet('rent-increase');
  for(const mutation of [(s:Source)=>{s.text+=' changed';},(s:Source)=>{s.url='https://example.com';},(s:Source)=>{s.id='220:259a';},(s:Source)=>{s.language='en';}]){const bad=structuredClone(original);mutation(bad[0]);await assert.rejects(()=>cache.put('rent-increase',bad));}
  const withExtra=structuredClone(original);withExtra[0].title='CANARY';(withExtra[0]as any).question='CANARY';const accepted=await cache.put('rent-increase',withExtra);assert.ok(!JSON.stringify(accepted).includes('CANARY'));
  await assert.rejects(()=>cache.put('rent-increase',original.slice(0,1)));
});
test('MCP receives fixed public references, never housing choices or private narrative',async()=>{
  const requests:any[]=[];const fetcher=(async(_url:unknown,options:RequestInit)=>{const req=JSON.parse(options.body as string);requests.push(req);if(req.method==='notifications/initialized')return new Response(null,{status:202});const result=req.method==='initialize'?{protocolVersion:'2025-03-26'}:{structuredContent:laws[`${req.params.arguments.sr_number}:${req.params.arguments.article}`]};return new Response(JSON.stringify({jsonrpc:'2.0',id:req.id,result}),{headers:{'Content-Type':'application/json'}});})as typeof fetch;
  const sources=await researchPractical('rent-increase',fetcher);assert.equal(sources.length,2);
  assert.deepEqual(requests.filter(r=>r.method==='tools/call').map(r=>r.params),['269d','270b'].map(article=>({name:'get_law',arguments:{sr_number:'220',article,canton:'CH',language:'de'}})));
  for(const bad of [{practical:'rent-increase',facts:EMPTY_HOUSING_FACTS},{practical:'housing-defect',question:'CANARY'},{practical:'tenancy-end',language:'de'}])assert.throws(()=>checkedResearchJob(bad));
});
test('every housing branch and visible control has four prepared Swiss-language translations',()=>{
  const keys=new Set<string>(HOUSING_COPY);
  for(const topic of HOUSING_TOPICS){keys.add(HOUSING_TITLES[topic]);for(const q of housingQuestions(topic)){keys.add(q.title);if(q.help)keys.add(q.help);for(const [,label]of q.options)keys.add(label);}
    for(const scope of ['home','special','unknown']as const)for(const situation of ['increase','initial','unknown']as const)for(const notified of ['yes','no','unknown']as const)for(const exit of ['own','early','received','unknown']as const){const g=housingGuide(topic,{scope,situation,notified,exit});keys.add(g.intro);keys.add(g.check);for(const p of [...g.steps,...g.rules])keys.add(p.text);}
  }
  for(const key of keys)for(const language of ['de','fr','it','rm']as const){assert.ok((housingTranslations as Record<string,string[]>)[key]?.[['de','fr','it','rm'].indexOf(language)],`${language}: ${key}`);if(language==='de')assert.ok(!housingText(key,language).includes('ß'));}
});
