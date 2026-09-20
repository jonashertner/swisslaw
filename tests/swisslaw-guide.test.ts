import test from 'node:test';
import assert from 'node:assert/strict';
import { checkedResearchJob, recipeForFacts, type GuideFacts } from '../lib/swisslaw-chat/guide';
import { researchReferences } from '../lib/swisslaw-chat/research';

const canary = 'PRIVATE-CANARY name@example.test employer salary medical details';
function fakeMcp(mutate: (law: any, article: string) => void = () => {}) {
  const requests: any[] = [];
  const fetcher = async (url: unknown, options: RequestInit) => {
    assert.equal(url, 'https://mcp.opencaselaw.ch/mcp');
    assert.equal(options.credentials, 'omit'); assert.equal(options.referrerPolicy, 'no-referrer');
    assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store');
    assert.ok(!JSON.stringify({url, options}).includes(canary));
    const request = JSON.parse(options.body as string); requests.push(request);
    if (request.method === 'notifications/initialized') return new Response(null, {status:202});
    let result: any = {protocolVersion:'2025-03-26'};
    if (request.method === 'tools/call') {
      assert.equal(request.params.name,'get_law');
      const args = request.params.arguments;
      assert.deepEqual(args,{sr_number:'220',article:args.article,canton:'CH',language:'de'});
      const law = {sr_number:'220',canton:'CH',language:'de',title:'Obligationenrecht',source_url:'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de',articles:[{article_num:args.article,section:'main',heading:'Complete fictional provision',text:'1 This complete public provision contains the applicable rule.\n2 This essential qualification must remain.'}]};
      mutate(law,args.article); result={structuredContent:law};
    }
    return new Response(JSON.stringify({jsonrpc:'2.0',id:request.id,result}),{headers:{'Content-Type':'application/json'}});
  };
  return {requests,fetcher:fetcher as typeof fetch};
}

test('closed recipe envelope rejects private extras and unknown identifiers before any network', async () => {
  assert.deepEqual(checkedResearchJob({recipe:'employee-notice'}), {recipe:'employee-notice'});
  for (const value of [{recipe:'employee-notice',facts:canary},{recipe:'employee-notice',query:canary},{recipe:canary},{recipe:'__proto__'},{recipe:'https://attacker.test/'},null]) assert.throws(()=>checkedResearchJob(value));
  let calls=0;
  await assert.rejects(()=>researchReferences(canary as never,(async()=>{calls++;throw new Error('unexpected network')}) as typeof fetch));
  assert.equal(calls,0);
});

test('local facts select only fixed public provisions; no text search or private payload is sent', async () => {
  const facts: GuideFacts = {regime:'private',term:'indefinite',probation:'unknown'};
  const recipe=recipeForFacts(facts)!;
  const envelope=checkedResearchJob({recipe});
  assert.deepEqual(Object.keys(envelope),['recipe']);
  assert.equal(recipeForFacts({...facts,regime:'public'}),null);
  assert.equal(recipeForFacts({...facts,regime:'unknown'}),null);
  const fake=fakeMcp(); const sources=await researchReferences(recipe,fake.fetcher);
  assert.deepEqual(fake.requests.filter(r=>r.method==='tools/call').map(r=>r.params.arguments.article), ['335','335b','335c']);
  assert.equal(sources.length,3);
  assert.ok(sources.every(s=>s.text.endsWith('2 This essential qualification must remain.')));
  const sent=JSON.stringify(fake.requests);
  for (const privateField of ['probation','regime','term',canary]) assert.ok(!sent.includes(privateField));
});

test('wrong identities, missing provisions and oversized exceptions fail the entire recipe', async () => {
  for (const mutate of [
    (law:any,article:string)=>{if(article==='335c')law.sr_number='192.126';},
    (law:any,article:string)=>{if(article==='335c')law.articles=[];},
    (law:any,article:string)=>{if(article==='335c'){law.articles[0].text=null;law.articles[0].heading='This long heading must never be promoted to complete legal evidence';}},
    (law:any,article:string)=>{if(article==='335c')law.articles[0].text_status='heading_only';},
    (law:any,article:string)=>{if(article==='335c')law.articles[0].text='Rule. '.repeat(400)+' Important final exception.';},
  ]) {
    const fake=fakeMcp(mutate);
    await assert.rejects(()=>researchReferences('employee-notice',fake.fetcher),/INVALID_SOURCES/);
    assert.deepEqual(fake.requests.filter(r=>r.method==='tools/call').map(r=>r.params.arguments.article),['335','335c']);
  }
});

import { assertPromptBudget } from '../lib/swisslaw-chat/prompt-budget';
test('measured prompt reserves output capacity without dropping source qualifications', () => {
  assert.doesNotThrow(() => assertPromptBudget(2900, 1100));
  for (const size of [2901, 4096, undefined, NaN, -1, 0, 10.5]) assert.throws(() => assertPromptBudget(size, 1100), /CONTEXT_LIMIT/);
});
test('the guide preserves uncertainty and never infers probation for fixed contracts', () => {
  for (const probation of ['yes', 'no', 'unknown'] as const) {
    assert.equal(recipeForFacts({regime:'private',term:'fixed',probation}), 'employee-fixed-term');
    assert.equal(recipeForFacts({regime:'private',term:'unknown',probation}), 'employee-term-unsure');
  }
  assert.equal(recipeForFacts({regime:'private',term:'indefinite',probation:'no'}), 'employee-notice');
  assert.equal(recipeForFacts({regime:'private',term:'indefinite',probation:'yes'}), 'employee-probation');
  assert.throws(() => recipeForFacts({regime:'private',term:'indefinite',probation:'maybe'} as never));
});

import { researchSources } from '../lib/swisslaw-chat/research';
test('selection sees the full act scope and translation duplicates cannot crowd out another act', async () => {
  const fetcher = (async (_url: unknown, options: RequestInit) => {
    const request = JSON.parse(options.body as string);
    if (request.method === 'notifications/initialized') return new Response(null, {status:202});
    let result: any = {protocolVersion:'2025-03-26'};
    if (request.method === 'tools/call') {
      const {name, arguments:args}=request.params;
      if (name === 'search_laws') result={structuredContent:{hits:[
        {canton:'CH',sr_number:'192.126',article_num:'35',language:'de',reference:'PHV 35',law_title:'Verordnung über private Hausangestellte',snippet_text:'Kündigung'},
        {canton:'CH',sr_number:'192.126',article_num:'35',language:'it',reference:'PHV 35',law_title:'Translated special regulation',snippet_text:'Disdetta'},
        {canton:'CH',sr_number:'220',article_num:'335c',language:'de',reference:'OR 335c',law_title:'Obligationenrecht',snippet_text:'Kündigung'},
      ]}};
      else if(name==='search_decisions') result={structuredContent:{results:[]}};
      else if(name==='get_law') {
        assert.equal(args.sr_number,'220');
        result={structuredContent:{sr_number:'220',canton:'CH',language:'de',abbreviation:'OR',title:'Obligationenrecht',source_url:'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_335c',articles:[{article_num:'335c',text:'This fictional complete provision retains its essential qualifications.'}]}};
      } else assert.fail('Unexpected tool');
    }
    return new Response(JSON.stringify({jsonrpc:'2.0',id:request.id,result}),{headers:{'Content-Type':'application/json'}});
  }) as typeof fetch;
  const sources=await researchSources('Kündigung Arbeitnehmer',fetcher,async candidates=>{
    assert.equal(candidates.length,2);
    assert.match(candidates[0].title,/private Hausangestellte.*192\.126/);
    assert.match(candidates[1].title,/Obligationenrecht.*335c.*220/);
    return ['C2'];
  });
  assert.match(sources[0].title,/Obligationenrecht.*OR.*SR 220.*335c/);
});
