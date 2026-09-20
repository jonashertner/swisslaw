import { publicLegalQuery } from './public-query';
import { practicalTopic, provisionHash, type PracticalTopic } from './practical';
import { PRACTICAL_REFERENCES } from './practical-manifest';
import { parseRpc, MCP_ENDPOINT, MCP_PROTOCOL } from './mcp';
import { safeQuery, safeSourceUrl, type Source } from './policy';
import { REFERENCE_RECIPES, recipeId, type RecipeId } from './guide';
export type Candidate = { id: string; kind: 'law' | 'decision'; title: string; jurisdiction: string; excerpt: string };
type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_SOURCE'); return value as RecordValue; }
function string(value: unknown, max = 1000): string { return typeof value === 'string' ? value.slice(0, max) : ''; }
const sleep = () => new Promise(resolve => setTimeout(resolve, 350));

async function connection(fetcher: typeof fetch) {
  let sequence = 0;
  const rpc = async (method: string, params?: object) => {
    const id = method === 'notifications/initialized' ? undefined : ++sequence;
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetcher(MCP_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store', signal: controller.signal, body: JSON.stringify({ jsonrpc: '2.0', ...(id === undefined ? {} : { id }), method, ...(params ? { params } : {}) }) });
      if (!response.ok) throw new Error('SEARCH_UNAVAILABLE');
      if (id === undefined) { if (![202, 204].includes(response.status)) throw new Error('BAD_NOTIFICATION'); await response.body?.cancel(); return {}; }
      if (!response.body || Number(response.headers.get('content-length')) > 1048576) throw new Error('SOURCE_TOO_LARGE');
      reader = response.body.getReader(); const decoder = new TextDecoder(); let body = ''; let bytes = 0;
      for (;;) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.byteLength; if (bytes > 1048576) throw new Error('SOURCE_TOO_LARGE'); body += decoder.decode(chunk.value, { stream: true }); }
      body += decoder.decode(); return parseRpc(body, response.headers.get('content-type') ?? '', id);
    } finally { clearTimeout(timeout); await reader?.cancel().catch(() => {}); }
  };
  const tool = async (name: 'search_laws' | 'get_law' | 'search_decisions' | 'get_erwaegung', args: object) => { await sleep(); const result = await rpc('tools/call', { name, arguments: args }); const value = record(result.structuredContent); if (value.error) throw new Error('INVALID_SOURCE'); return value; };
  const init = await rpc('initialize', { protocolVersion: MCP_PROTOCOL, capabilities: {}, clientInfo: { name: 'swisslaw-reviewed-search', version: '1.0.0' } });
  if (init.protocolVersion !== MCP_PROTOCOL) throw new Error('UNSUPPORTED_PROTOCOL');
  await rpc('notifications/initialized');
  return tool;
}

export async function researchSources(approvedQuery: string, fetcher: typeof fetch = fetch, select: (candidates: Candidate[]) => Promise<string[]> = async candidates => candidates.slice(0, 3).map(c => c.id)): Promise<Source[]> {
  const query = publicLegalQuery(safeQuery(approvedQuery));
  const tool = await connection(fetcher);
  const laws = await tool('search_laws', { query, limit: 8 });
  const candidates: Candidate[] = []; const originals = new Map<string, RecordValue>(); const seenArticles = new Set<string>();
  for (const raw of (Array.isArray(laws.hits) ? laws.hits : []).slice(0, 8)) {
    const hit = record(raw); const identity = `${string(hit.canton, 2)}|${string(hit.sr_number, 30)}|${string(hit.article_num, 20)}`;
    if (seenArticles.has(identity)) continue; seenArticles.add(identity);
    const id = `C${candidates.length + 1}`;
    candidates.push({ id, kind: 'law', title: [string(hit.law_title || hit.title, 220), string(hit.reference, 100), string(hit.heading, 100), `SR ${string(hit.sr_number, 30)} · ${string(hit.language, 2)}`].filter(Boolean).join(' · '), jurisdiction: string(hit.canton, 2), excerpt: string(hit.snippet_text, 500) }); originals.set(id, hit);
  }
  try {
    const cases = await tool('search_decisions', { query, limit: 3, fields: 'full', include_pinpoint: true });
    for (const raw of (Array.isArray(cases.results) ? cases.results : []).slice(0, 3)) {
      const hit = record(raw); if (!hit.pinpoint || !string(record(hit.pinpoint).e_number, 20)) continue;
      const id = `C${candidates.length + 1}`;
      candidates.push({ id, kind: 'decision', title: string(hit.citation_string_de, 120), jurisdiction: string(hit.canton, 2), excerpt: string(hit.regeste || hit.snippet, 500) }); originals.set(id, hit);
    }
  } catch { /* Statute candidates remain available; no completeness claim is made. */ }
  if (!candidates.length) return [];
  const selected = await select(candidates);
  if (!Array.isArray(selected) || selected.length > 3 || new Set(selected).size !== selected.length || selected.some(id => !originals.has(id))) throw new Error('INVALID_SELECTION');
  const sources: Source[] = [];
  for (const selectedId of selected) {
    const hit = originals.get(selectedId)!; const candidate = candidates.find(c => c.id === selectedId)!;
    try {
      if (candidate.kind === 'law') {
        const sr = string(hit.sr_number, 30); const article = string(hit.article_num, 20); const canton = string(hit.canton, 2);
        if (!/^[A-Za-z\d][A-Za-z\d .-]{0,29}$/.test(sr) || !/^[\d]+[a-z]*$/i.test(article) || !/^(CH|ZH|BE|LU|UR|SZ|OW|NW|GL|ZG|FR|SO|BS|BL|SH|AR|AI|SG|GR|AG|TG|TI|VD|VS|NE|GE|JU)$/.test(canton)) continue;
        const language = ['de', 'fr', 'it', 'rm'].includes(string(hit.language, 2)) ? string(hit.language, 2) : 'de';
        const law = await tool('get_law', { sr_number: sr, article, canton, language });
        if (law.sr_number !== sr || law.canton !== canton || law.language !== language) continue;
        const url = safeSourceUrl(law.source_url); if (!url || !Array.isArray(law.articles)) continue;
        const matches = law.articles.map(record).filter(a => a.article_num === article && (a.section === 'main' || a.section === '' || a.section === undefined || a.section === null));
        if (matches.length !== 1 || typeof matches[0].text !== 'string' || matches[0].text.trim().length < 18 || matches[0].text_status && matches[0].text_status !== 'ok') continue;
        const body = [string(matches[0].heading, 3000), string(matches[0].text, 40000)].filter(Boolean).join('\n');
        if (body.length < 30 || body.length > 1800) continue;
        sources.push({ id: `S${sources.length + 1}`, kind: 'law', title: lawTitle(law, sr, article), text: body, jurisdiction: canton, date: string(law.consolidation_date ?? law.version_active_since, 30), language: string(hit.language, 2) || (canton === 'CH' ? 'de' : 'original source language'), url });
      } else {
        const id = string(hit.decision_id, 120); const number = string(record(hit.pinpoint).e_number, 20);
        if (!/^[\w./-]{3,120}$/.test(id) || !/^\d+(\.\d+)*$/.test(number)) continue;
        const passage = await tool('get_erwaegung', { decision_id: id, e_number: number });
        if (passage.decision_id !== id || passage.e_number !== number) continue;
        const text = string(passage.text, 40000); const url = safeSourceUrl(passage.canonical_url);
        if (!url || text.length < 50 || text.length > 1800) continue;
        sources.push({ id: `S${sources.length + 1}`, kind: 'decision', title: `${string(hit.docket_number, 70)} E. ${number} (excerpt)`, text, jurisdiction: string(hit.canton, 2), date: string(hit.decision_date, 30), language: string(passage.language, 2), url });
      }
    } catch { /* Missing candidates never become search-snippet evidence. */ }
  }
  return sources;
}

function lawTitle(law: RecordValue, sr: string, article: string) {
  return `${string(law.title, 260)}${law.abbreviation ? ` (${string(law.abbreviation, 30)})` : ''} · SR ${sr} · Art. ${article}`;
}

// This branch receives only an allowlisted public recipe ID. No user facts or
// search text cross its boundary. Every required provision must be present.
export async function researchReferences(value: RecipeId, fetcher: typeof fetch = fetch): Promise<Source[]> {
  const articles = REFERENCE_RECIPES[recipeId(value)];
  const tool = await connection(fetcher);
  const sources: Source[] = [];
  for (const article of articles) {
    const law = await tool('get_law', { sr_number: '220', article, canton: 'CH', language: 'de' });
    if (law.sr_number !== '220' || law.canton !== 'CH' || law.language !== 'de' || !string(law.title, 260)) throw new Error('INVALID_SOURCES');
    const url = safeSourceUrl(law.source_url);
    const matches = Array.isArray(law.articles) ? law.articles.map(record).filter(a => a.article_num === article && [undefined, null, '', 'main'].includes(a.section as string)) : [];
    if (!url || matches.length !== 1 || typeof matches[0].text !== 'string' || matches[0].text.trim().length < 18 || matches[0].text_status && matches[0].text_status !== 'ok') throw new Error('INVALID_SOURCES');
    // Reject oversized provisions whole. Never slice away an exception.
    const body = [matches[0].heading, matches[0].text].filter(v => typeof v === 'string' && v).join('\n');
    if (body.length < 30 || body.length > 1800) throw new Error('INVALID_SOURCES');
    sources.push({ id: `S${sources.length + 1}`, kind: 'law', title: lawTitle(law, '220', article), text: body, jurisdiction: 'CH', language: 'de', date: string(law.consolidation_date ?? law.version_active_since, 30), url });
  }
  return sources;
}

/** Fixed public references, validated as a whole before an authored guide may be shown. */
export async function researchPractical(value: PracticalTopic, fetcher: typeof fetch = fetch): Promise<Source[]> {
  const references = PRACTICAL_REFERENCES[practicalTopic(value)];
  const tool = await connection(fetcher);
  const sources: Source[] = [];
  for (const ref of references) {
    const law = await tool('get_law', { sr_number: ref.sr, article: ref.article, canton: 'CH', language: 'de' });
    if (law.sr_number !== ref.sr || law.canton !== 'CH' || law.language !== 'de' || law.source_url !== ref.url || !string(law.title, 260)) throw new Error('INVALID_SOURCES');
    const matches = Array.isArray(law.articles) ? law.articles.map(record).filter(a => a.article_num === ref.article && [undefined, null, '', 'main'].includes(a.section as string)) : [];
    if (matches.length !== 1 || typeof matches[0].text !== 'string' || matches[0].text.trim().length < 18 || matches[0].text_status && matches[0].text_status !== 'ok') throw new Error('INVALID_SOURCES');
    const body = [matches[0].heading, matches[0].text].filter(v => typeof v === 'string' && v).join('\n');
    if (body.length > 5000 || await provisionHash(body) !== ref.sha256) throw new Error('INVALID_SOURCES');
    sources.push({ id: `${ref.sr}:${ref.article}`, kind: 'law', title: ref.label, text: body, jurisdiction: 'CH', language: 'de', date: string(law.consolidation_date ?? law.version_active_since, 30), url: ref.url });
  }
  return sources;
}
