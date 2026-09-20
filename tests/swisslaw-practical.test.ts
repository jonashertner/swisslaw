import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { researchPractical, researchSources } from '../lib/swisslaw-chat/research';
import { practicalGuide } from '../lib/swisslaw-chat/practical-content';
import { practicalContentText } from '../lib/swisslaw-chat/practical-content-translations';
import { EMPTY_PRACTICAL_FACTS, suggestPracticalTopic, provisionHash } from '../lib/swisslaw-chat/practical';
import { checkedResearchJob } from '../lib/swisslaw-chat/guide';
import { publicLegalQuery } from '../lib/swisslaw-chat/public-query';
const laws=JSON.parse(readFileSync(new URL('./fixtures/practical-public-laws.json',import.meta.url),'utf8'));
function mcp(mutate:(law:any)=>void=()=>{}) {
  const requests:any[]=[];
  const fetcher=(async(url:unknown,options:RequestInit)=>{
    assert.equal(url,'https://mcp.opencaselaw.ch/mcp');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');
    const request=JSON.parse(options.body as string);requests.push(request);
    if(request.method==='notifications/initialized')return new Response(null,{status:202});
    let result:any={protocolVersion:'2025-03-26'};
    if(request.method==='tools/call'){
      assert.equal(request.params.name,'get_law');const args=request.params.arguments;
      assert.deepEqual(Object.keys(args).sort(),['article','canton','language','sr_number']);assert.equal(args.canton,'CH');assert.equal(args.language,'de');
      const law=structuredClone(laws[`${args.sr_number}:${args.article}`]);assert.ok(law);mutate(law);result={structuredContent:law};
    }
    return new Response(JSON.stringify({jsonrpc:'2.0',id:request.id,result}),{headers:{'Content-Type':'application/json'}});
  }) as typeof fetch;
  return {fetcher,requests};
}
test('reported lay questions get topic suggestions without establishing a role or legal regime',()=>{
  for(const question of ['ich habe zu viel überzeit, was muss ich tun?','z viel ueberstunden','overtime payment','heures supplémentaires','ore straordinarie']) assert.equal(suggestPracticalTopic(question),'overtime');
  for(const question of ['was muss ich tun für heiraten','wie kann ich heirete','how do we get married','je veux me marier'])assert.equal(suggestPracticalTopic(question),'marriage');
  for(const question of ['Ehevertrag vor Heirat','divorce after marriage','ich habe Überzeit und will heiraten','mein Mietvertrag'])assert.equal(suggestPracticalTopic(question),null);
  assert.equal(EMPTY_PRACTICAL_FACTS.regime,'unknown');assert.equal(EMPTY_PRACTICAL_FACTS.role,'unknown');
});
test('automatic public searches project to constants, not private identifiers or input order',()=>{
  assert.equal(publicLegalQuery('John Doe john@example.org +41 123: Mietvertrag Kündigung'),publicLegalQuery('Kündigung Mietvertrag Mietvertrag'));
  assert.equal(publicLegalQuery('Vertrag JohnMietvertrag'), 'Vertrag');
  for(const input of ['JohnMietvertrag','mietvertrag@example.org','https://host/Kündigung','John Doe','123','Anna Zug','Schweiz','öffentlich'])assert.throws(()=>publicLegalQuery(input));
  assert.equal(publicLegalQuery('Ku\u0308ndigung'),'Kündigung');
  assert.equal(publicLegalQuery('IV'),'Schweiz IV');
});
test('the worker boundary repeats projection and rejects private-only payloads before any network',async()=>{
  let calls=0;
  for(const input of ['John Doe','me@example.org','https://host/Miete'])await assert.rejects(()=>researchSources(input,(async()=>{calls++;throw new Error();})as typeof fetch));
  assert.equal(calls,0);
  for(const input of [{practical:'marriage',facts:'private'},{practical:'__proto__'},{practical:'overtime',query:'private'}])assert.throws(()=>checkedResearchJob(input));
});
test('each practical guide retrieves complete source snapshots using only fixed public references',async()=>{
  for(const topic of ['overtime','marriage'] as const){const fake=mcp();const sources=await researchPractical(topic,fake.fetcher);assert.equal(sources.length,topic==='overtime'?4:5);assert.ok(sources.every(s=>s.text.length>100));const wire=JSON.stringify(fake.requests);assert.ok(!wire.includes('regime'));assert.ok(!wire.includes('residence'));assert.ok(!wire.includes('question'));}
});
test('changed qualification, wrong identity, missing or truncated text withholds the whole guide',async()=>{
  await Promise.all([
    (law:any)=>{law.sr_number='172.220.1';},
    (law:any)=>{law.articles[0].text=law.articles[0].text.replace('notwendig','nicht notwendig');},
    (law:any)=>{law.articles[0].text=law.articles[0].text.slice(0,100);},
    (law:any)=>{law.articles[0].text_status='heading_only';},
    (law:any)=>{law.articles=[];},
    (law:any)=>{law.source_url='https://www.fedlex.admin.ch/wrong';},
  ].map(async mutate=>{const fake=mcp(mutate);await assert.rejects(()=>researchPractical('overtime',fake.fetcher),/INVALID_SOURCES/);}));
});
test('only insignificant whitespace and canonical Unicode normalization preserve source hashes',async()=>{
  assert.equal(await provisionHash(' Kündigung\n\t Absatz 2 '),await provisionHash('Ku\u0308ndigung Absatz 2'));
  assert.notEqual(await provisionHash('Absatz 2'),await provisionHash('Absatz 3'));
});
test('unknown and public employment never become a private-law entitlement',()=>{
  const unknown=practicalGuide('overtime',EMPTY_PRACTICAL_FACTS);assert.match(unknown.rules[1].text,/If private employment law applies/);assert.match(unknown.check,/does not establish/);
  const publicGuide=practicalGuide('overtime',{...EMPTY_PRACTICAL_FACTS,role:'employee',regime:'public'});assert.equal(publicGuide.rules.length,0);assert.match(publicGuide.intro,/does not automatically apply/);
  const compensation=unknown.rules.at(-1)!;assert.match(compensation.text,/first 60 hours unpaid/);assert.deepEqual(compensation.refs,['822.11:13','220:321c']);
});
test('marriage residence and country branches point to the right next authority without personal assumptions',()=>{
  const ch=practicalGuide('marriage',{...EMPTY_PRACTICAL_FACTS,location:'ch',residence:'yes'});assert.match(ch.steps[0].text,/place of residence/);assert.match(ch.steps[2].text,/must take place within three months/);
  const nonresident=practicalGuide('marriage',{...EMPTY_PRACTICAL_FACTS,location:'ch',residence:'no'});assert.match(nonresident.steps[0].text,/where you want the ceremony/);
  const abroad=practicalGuide('marriage',{...EMPTY_PRACTICAL_FACTS,location:'abroad'});assert.match(abroad.intro,/does not automatically apply abroad/);assert.equal(abroad.rules.length,0);
});
test('all conditional guide variants have translated prose in the four Swiss interface languages',()=>{
  for(const topic of ['marriage','overtime']as const)for(const role of ['employee','employer','self','unknown']as const)for(const regime of ['private','public','unknown']as const)for(const goal of ['less','time','pay','options']as const)for(const location of ['ch','abroad','unknown']as const)for(const residence of ['yes','no','unknown']as const){
    const guide=practicalGuide(topic,{role,regime,goal,location,residence});
    for(const text of [guide.intro,guide.check,...guide.steps.map(s=>s.text),...guide.rules.map(s=>s.text)])for(const language of ['de','fr','it','rm']as const)assert.notEqual(practicalContentText(text,language),text);
  }
});
