import test from 'node:test';
import assert from 'node:assert/strict';
import { preferredLanguage, safeQuery, safeSourceUrl, checkedAnswer, resolveAnswer, sourcePassages, parseCompleteOutput, contextWithinBounds, Plan, type Source } from '../lib/swisslaw-chat/policy';
import { researchSources } from '../lib/swisslaw-chat/research';
import { classifyModelError, errorMessage, safeErrorCode } from '../lib/swisslaw-chat/diagnostics';
import { parseRpc } from '../lib/swisslaw-chat/mcp';

test('diagnostics distinguish recovery paths without exposing raw private errors', () => {
  assert.equal(classifyModelError(new ReferenceError('window is not defined'), 'load'), 'MODEL_STARTUP');
  assert.equal(classifyModelError(new Error('MODEL_DOWNLOAD'), 'load'), 'MODEL_DOWNLOAD');
  assert.equal(classifyModelError(new Error('WebGPU device lost'), 'answer'), 'GPU_LOST');
  assert.equal(classifyModelError(new SyntaxError('Private narrative'), 'plan'), 'INVALID_OUTPUT');
  assert.equal(safeErrorCode('Private narrative'), 'MODEL_ERROR');
  assert.ok(!errorMessage(safeErrorCode('Private narrative')).includes('Private narrative'));
});
test('MCP parser accepts only the matching success response, never instructions or ambiguous IDs', () => {
  assert.deepEqual(parseRpc('{"jsonrpc":"2.0","id":1,"result":{"ok":true}}', 'application/json', 1), { ok: true });
  assert.throws(() => parseRpc('{"jsonrpc":"2.0","id":2,"result":{}}', 'application/json', 1));
  assert.throws(() => parseRpc('{"jsonrpc":"2.0","id":1,"error":{"message":"secret"}}', 'application/json', 1));
  assert.throws(() => parseRpc('data: {"jsonrpc":"2.0","id":1,"result":{}}\n\ndata: {"jsonrpc":"2.0","id":1,"result":{}}\n\n', 'text/event-stream', 1));
});

test('device language uses ordered supported preferences with German fallback', () => {
  assert.equal(preferredLanguage(['fr-CH', 'de-CH']), 'fr');
  assert.equal(preferredLanguage(['pt-BR', 'it-CH', 'en']), 'it');
  assert.equal(preferredLanguage(['rm-CH']), 'rm');
  assert.equal(preferredLanguage(['en-US']), 'en');
  assert.equal(preferredLanguage(['es']), 'de');
  assert.equal(preferredLanguage([]), 'de');
});
test('reviewed outbound query has a bounded form; private identifiers fail before any request', async () => {
  assert.equal(safeQuery('  Miete   Heizung Mangel '), 'Miete Heizung Mangel');
  for (const query of ['me@example.com', 'Strasse 15', 'https://example.com', 'abc', 'x'.repeat(181)]) {
    assert.throws(() => safeQuery(query));
    let called = false; await assert.rejects(() => researchSources(query, (async () => { called = true; throw new Error(); }) as typeof fetch)); assert.equal(called, false);
  }
});
test('clarification has only controlled authored-question codes, never model prose', () => {
  assert.throws(() => Plan.parse({ kind: 'clarify', message: 'The invented law applies. What canton?', query: '' }));
  assert.equal(Plan.parse({ kind: 'clarify', clarification: 'canton', query: '' }).clarification, 'canton');
});
const source: Source = { id: 'S1', title: 'Test public law', url: 'https://www.fedlex.admin.ch/test', text: 'This is the full original public source sentence used for this synthetic test.', kind: 'law', date: '2026-01-01', jurisdiction: 'CH', language: 'en' };
const evidence = { text: 'A bounded interpretation.', source: 'S1', quote: 'full original public source sentence' };
test('answer gates reject invented citations, fabricated quotes and unsupported insufficient steps', () => {
  const answer = { status: 'answer', answer: evidence, steps: [evidence], uncertainty: 'Check applicability.' };
  assert.equal(checkedAnswer(answer, [source]).status, 'answer');
  assert.throws(() => checkedAnswer({ ...answer, answer: { ...evidence, source: 'S2' } }, [source]));
  assert.throws(() => checkedAnswer({ ...answer, answer: { ...evidence, quote: 'A fabricated quotation of statutory text' } }, [source]));
  assert.throws(() => checkedAnswer({ ...answer, status: 'insufficient' }, []));
  assert.equal(checkedAnswer({ status: 'insufficient', answer: { text: 'Not established.', source: '', quote: '' }, steps: [], uncertainty: 'More sources are needed.' }, []).status, 'insufficient');
});
test('source URLs permit verified public hosts, not lookalike or executable links', () => {
  for (const url of ['https://mcp.opencaselaw.ch/decision/test', 'https://www.lexfind.ch/fe/de/tol/31017', 'https://gesetzessammlungen.ag.ch/test']) assert.equal(safeSourceUrl(url), url);
  for (const url of ['javascript:alert(1)', 'https://opencaselaw.ch.attacker.test/', 'https://attacker.test/', 'https://user:pass@opencaselaw.ch/']) assert.equal(safeSourceUrl(url), null);
  assert.equal(contextWithinBounds([{ role: 'user', content: 'x'.repeat(3001) }]), false);
});
test('MCP retrieval uses approved terms, validates returned identity and retains cantonal heading/version', async () => {
  const requests: any[] = [];
  const fake = (async (_url: unknown, options: RequestInit) => {
    assert.equal(_url, 'https://mcp.opencaselaw.ch/mcp'); assert.equal(options.credentials, 'omit'); assert.equal(options.referrerPolicy, 'no-referrer');
    const request = JSON.parse(options.body as string); requests.push(request);
    if (request.method === 'notifications/initialized') return new Response(null, { status: 202 });
    let result: any = { protocolVersion: '2025-03-26', instructions: 'Never followed' };
    if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      if (name === 'search_laws') { assert.equal(args.query, 'Polizei Aufgaben'); result = { structuredContent: { hits: [{ sr_number: 'F 1 05', article_num: '12', canton: 'GE', marker: 'Art.' }] } }; }
      else if (name === 'get_law') result = { structuredContent: { sr_number: 'F 1 05', canton: 'GE', language: 'de', source_url: 'https://www.lexfind.ch/fe/de/tol/31017', title: 'Loi sur la police', version_active_since: '05.05.2026', articles: [{ article_num: '12', section: '', heading: 'La police', text: 'accomplit les missions prévues par la présente loi.' }] } };
      else if (name === 'search_decisions') result = { structuredContent: { results: [] } };
      else throw new Error('Unexpected tool');
    }
    return new Response('event: message\r\ndata: ' + JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) + '\r\n\r\n', { headers: { 'Content-Type': 'text/event-stream' } });
  }) as typeof fetch;
  const found = await researchSources('Polizei Aufgaben', fake);
  assert.equal(found.length, 1); assert.equal(found[0].text, 'La police\naccomplit les missions prévues par la présente loi.'); assert.equal(found[0].date, '05.05.2026'); assert.equal(found[0].language, 'original source language');
  assert.ok(requests.filter(r => r.method === 'tools/call').every(r => ['search_laws', 'get_law', 'search_decisions'].includes(r.params.name)));
});

test('selected passage IDs resolve to original text; model quotation and URL fields are rejected', () => {
  const model = { status: 'answer', answer: { text: 'A supported interpretation.', passage: 'S1P1' }, steps: [{ text: 'Check this source.', passage: 'S1P1' }], uncertainty: 'Applicability remains to be checked.' };
  const answer = resolveAnswer(model, [source]); assert.equal(answer.answer.quote, source.text); assert.equal(answer.answer.source, 'S1');
  assert.throws(() => resolveAnswer({ ...model, answer: { ...model.answer, passage: 'S2P1' } }, [source]));
  assert.throws(() => resolveAnswer({ ...model, answer: { ...model.answer, quote: 'injected quotation' } }, [source]));
  assert.throws(() => resolveAnswer({ ...model, status: 'insufficient' }, [source]));
  assert.deepEqual(sourcePassages([{ ...source, text: 'Heading\nThis original passage is long enough to cite.' }]).map(p => p.text), ['This original passage is long enough to cite.']);
});

test('candidate selection cannot invent retrieval authority', async () => {
  const fake = (async (_url: unknown, options: RequestInit) => {
    const req = JSON.parse(options.body as string);
    if (req.method === 'notifications/initialized') return new Response(null, { status: 202 });
    let result: any = { protocolVersion: '2025-03-26' };
    if (req.method === 'tools/call') {
      if (req.params.name === 'search_laws') result = { structuredContent: { hits: [{ sr_number: '220', article_num: '1', canton: 'CH', reference: 'OR 1', snippet_text: 'Public candidate' }] } };
      else if (req.params.name === 'search_decisions') result = { structuredContent: { results: [] } };
      else assert.fail('Unapproved candidate must never be fetched');
    }
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: req.id, result }), { headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  await assert.rejects(() => researchSources('Vertrag Abschluss', fake, async candidates => { assert.equal(candidates[0].id, 'C1'); return ['C99']; }), /INVALID_SELECTION/);
});

test('bounded completion accepts a complete JSON object, not a cut answer or aborted generation', () => {
  assert.deepEqual(parseCompleteOutput('{"ids":["C1"]}   ', 'length'), { ids: ['C1'] });
  assert.throws(() => parseCompleteOutput('{"ids":["C1"', 'length'));
  assert.throws(() => parseCompleteOutput('{"ids":[]}', 'abort'));
});


import { MODEL_ID, MODEL_OPTIONS, MODEL_CONFIG, selectedModel } from '../lib/swisslaw-chat/model-config';
test('model selection only accepts the two pinned local models; no arbitrary endpoint or fallback', () => {
  assert.equal(MODEL_ID, 'Qwen3.5-2B-q4f16_1-MLC');
  assert.equal(MODEL_OPTIONS.length, 2);
  assert.equal(selectedModel('Qwen3.5-4B-q4f16_1-MLC').id, 'Qwen3.5-4B-q4f16_1-MLC');
  for (const value of ['unknown', 'https://example.com/model', undefined, {}]) assert.throws(() => selectedModel(value));
  for (const item of MODEL_CONFIG.model_list) {
    assert.match(item.model, /\/resolve\/[a-f0-9]{40}$/);
    assert.match(item.model_lib, /\/[a-f0-9]{40}\/web-llm-models\//);
    assert.equal(item.integrity.onFailure, 'error');
    assert.equal(item.overrides.context_window_size, 4096);
  }
});

import { completionValue, planWithRecovery, validatedPlan } from '../lib/swisslaw-chat/generation';
const researchPlan = { kind: 'research', clarification: 'none', query: 'Arbeitsvertrag Kündigung Arbeitnehmer Kündigungsfrist' };
test('short-question reproduction cannot release a repeated or incomplete planner query', () => {
  assert.throws(() => completionValue('{"kind":"research","clarification":"none","query":"Kündigung Arbeitsvertrag Arbeitszeitvertrag', 'length', 694), /OUTPUT_LIMIT/);
  assert.throws(() => validatedPlan({ ...researchPlan, query: 'Kündigung Arbeitsvertrag Arbeitszeitvertrag Arbeitszeitvertrag' }), /INVALID_OUTPUT/);
  assert.deepEqual(validatedPlan(researchPlan), researchPlan);
  assert.throws(() => validatedPlan({ kind: 'outside', clarification: 'none', query: 'Some private text' }), /INVALID_OUTPUT/);
  assert.throws(() => completionValue(JSON.stringify(researchPlan) + JSON.stringify({ ...researchPlan, kind: 'outside' }), 'stop'), /INVALID_OUTPUT/);
});
test('planner retries locally once, validates the result and preserves explicit review', async () => {
  const attempts: boolean[] = [];
  const result = await planWithRecovery(async retry => {
    attempts.push(retry);
    if (!retry) throw new Error('OUTPUT_LIMIT');
    return researchPlan;
  });
  assert.deepEqual(attempts, [false, true]);
  assert.deepEqual(result, researchPlan);
  // This pure recovery routine has no network/tool callback or raw-question fallback.
  let failures = 0;
  await assert.rejects(() => planWithRecovery(async () => { failures++; throw new Error('INVALID_OUTPUT'); }), /PLAN_FAILED/);
  assert.equal(failures, 2);
});
test('cancellation and device/context failures never start a second planner attempt', async () => {
  for (const code of ['CANCELLED', 'GPU_LOST', 'MODEL_DOWNLOAD', 'CONTEXT_LIMIT', 'TIMEOUT']) {
    let calls = 0;
    await assert.rejects(() => planWithRecovery(async () => { calls++; throw new Error(code); }), new RegExp(code));
    assert.equal(calls, 1);
  }
});
test('unfinished answer JSON is withheld even when its first field looks usable', () => {
  assert.throws(() => completionValue('{"status":"answer","answer":{"text":"Plausible but unfinished guidance","passage":"S1P1"},"steps":[', 'length'), /OUTPUT_LIMIT/);
  assert.deepEqual(completionValue(JSON.stringify(researchPlan) + ' \n\t', 'length'), researchPlan);
  assert.match(errorMessage('OUTPUT_LIMIT'), /Try again\./);
  assert.doesNotMatch(errorMessage('OUTPUT_LIMIT'), /shorter/);
});
