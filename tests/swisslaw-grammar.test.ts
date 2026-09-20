import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {PLAN_GRAMMAR,selectionGrammar,answerGrammar,CANONICAL_INSUFFICIENT} from '../lib/swisslaw-chat/grammar';
// Exercise the compiler actually bundled with the pinned runtime. This test-only
// adapter must be reviewed when upgrading WebLLM; application code uses its public API.
const sdk = new URL(import.meta.resolve('@mlc-ai/web-llm'));
test('actual bundled grammar compiler rejects runaway outputs across all stages', async () => {
const context: any={URL,TextEncoder,TextDecoder,console,atob,btoa,setTimeout,clearTimeout,performance,navigator:{},location:{href:'https://example.test/worker.js'},fetch:async()=>{throw Error('NO_NETWORK')},importScripts:()=>{}};context.self=context;
vm.runInNewContext(readFileSync(sdk,'utf8').replace(/^export \{[^\n]+\};$/m,'globalThis.xg=libExports$1;'),context,{timeout:10000});
let count=0;
async function check(grammar: any, name: string, value: unknown, expected = true){
 const text=typeof value==='string'?value:JSON.stringify(value);
 const actual=await context.xg.Testings.isGrammarAcceptString(grammar,text);
 assert.equal(actual,expected,name);count++;
}
const plan=await context.xg.Grammar.fromEBNF(PLAN_GRAMMAR);
const planner=(query: string)=>({kind:'research',clarification:'none',query});
await check(plan,'German umlauts',planner('Kündigung Arbeitsvertrag Kündigungsfrist'));
await check(plan,'all six German umlauts',planner('ÄÖÜäöü'));
await check(plan,'five words of 32 letters',planner(Array(5).fill('a'.repeat(32)).join(' ')));
await check(plan,'six words rejected',planner('eins zwei drei vier fünf sechs'),false);
await check(plan,'33-letter word rejected',planner('a'.repeat(33)),false);
await check(plan,'long runaway query rejected',planner('Arbeitszeitvertrag '.repeat(50)),false);
await check(plan,'query digit rejected',planner('Kündigung zwei2'),false);
await check(plan,'query quotes rejected',planner('Kündigung "jetzt"'),false);
await check(plan,'whitespace1000 rejected','{'+ ' '.repeat(1000)+'"kind":"outside","clarification":"none","query":""}',false);
await check(plan,'clarify allowed',{kind:'clarify',clarification:'date',query:''});
await check(plan,'clarify cannot hold query',{kind:'clarify',clarification:'date',query:'Kündigung'},false);
await check(plan,'outside canonical',{kind:'outside',clarification:'none',query:''});plan.dispose();
const select=await context.xg.Grammar.fromEBNF(selectionGrammar(['C1','C2','C3','C4']));
await check(select,'selection empty',{ids:[]});await check(select,'selection three',{ids:['C1','C2','C3']});
await check(select,'selection unknown rejected',{ids:['C9']},false);await check(select,'selection four rejected',{ids:['C1','C2','C3','C4']},false);
await check(select,'selection whitespace1000 rejected','{"ids":['+' '.repeat(1000)+']}',false);select.dispose();
const answer=await context.xg.Grammar.fromEBNF(answerGrammar(['S1P1','S2P2']));
const evidence=(text: string)=>({text,passage:'S1P1'});
const result=(text='Prüfen Sie die Kündigungsfrist.',uncertainty='Die Umstände können entscheidend sein.')=>({status:'answer',answer:evidence(text),steps:[evidence('Lesen Sie Ihren Arbeitsvertrag.')],uncertainty});
await check(answer,'answer German umlauts',result());
await check(answer,'answer French Italian Romansh Unicode',result('Vérifiez le délai. È importante. Prüvar il contract.'));
await check(answer,'answer 280 ASCII characters',result('a'.repeat(280)));
await check(answer,'answer 281 ASCII rejected',result('a'.repeat(281)),false);
await check(answer,'answer Unicode 280 characters',result('ü'.repeat(280)));
await check(answer,'answer Unicode 281 rejected',result('ü'.repeat(281)),false);
await check(answer,'answer uncertainty200',result('Prüfen.', 'a'.repeat(200)));
await check(answer,'answer uncertainty201 rejected',result('Prüfen.', 'a'.repeat(201)),false);
await check(answer,'answer quote escape rejected',result('Sagen Sie "Hallo".'),false);
await check(answer,'answer control escape rejected',result('Erste Zeile\nZweite Zeile'),false);
await check(answer,'answer no steps rejected',{...result(),steps:[]},false);
await check(answer,'answer third step rejected',{...result(),steps:[evidence('Ein Schritt.'),evidence('Zweiter Schritt.'),evidence('Dritter Schritt.')]},false);
await check(answer,'answer unknown passage rejected',{...result(),answer:{text:'Prüfen.',passage:'S9P1'}},false);
await check(answer,'canonical insufficient',CANONICAL_INSUFFICIENT);
await check(answer,'insufficient with steps rejected',{...CANONICAL_INSUFFICIENT,steps:[evidence('Prüfen.')]},false);
await check(answer,'insufficient AI prose rejected',{...CANONICAL_INSUFFICIENT,answer:{text:'An invented explanation.',passage:''}},false);
await check(answer,'answer whitespace1000 rejected','{'+ ' '.repeat(1000)+JSON.stringify(result()).slice(1),false);
answer.dispose();
// Reject injection through dynamic grammar literals before grammar compilation.
for (const ids of [['C1\"}evil'], ['C1', 'C1'], ['C99']]) assert.throws(() => selectionGrammar(ids));
for (const ids of [['S1P1\"}evil'], ['S1P1', 'S1P1'], ['S9P1']]) assert.throws(() => answerGrammar(ids));

// Test whitespace at every position outside a JSON string, not only after {.
for (const [name, grammarText, value] of [
  ['plan', PLAN_GRAMMAR, planner('Kündigung Arbeitsvertrag')],
  ['select', selectionGrammar(['C1','C2']), {ids:['C1','C2']}],
  ['answer', answerGrammar(['S1P1']), result()],
  ['insufficient', answerGrammar(['S1P1']), CANONICAL_INSUFFICIENT],
] as const) {
  const g=await context.xg.Grammar.fromEBNF(grammarText), text=JSON.stringify(value);
  let inString=false, escaped=false, tested=0;
  for(let i=0;i<=text.length;i++) {
    if(!inString){assert.equal(await context.xg.Testings.isGrammarAcceptString(g,text.slice(0,i)+' '.repeat(1000)+text.slice(i)),false,name+' structural whitespace at '+i);tested++;}
    const ch=text[i];if(escaped)escaped=false;else if(inString&&ch==='\\')escaped=true;else if(ch==='\"')inString=!inString;
  }
  g.dispose();count+=tested;
}
assert.equal(count, 121);
});
