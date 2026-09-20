import { parseRpc, MCP_ENDPOINT, MCP_PROTOCOL } from './mcp';
import { safeQuery, safeSourceUrl, type Source } from './policy';
export type Candidate = { id: string; kind: 'law' | 'decision'; title: string; jurisdiction: string; excerpt: string };
type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_SOURCE'); return value as RecordValue; }
function string(value: unknown, max = 1000): string { return typeof value === 'string' ? value.slice(0, max) : ''; }
const sleep = () => new Promise(resolve => setTimeout(resolve, 350));

export async function researchSources(approvedQuery: string, fetcher: typeof fetch = fetch, select: (candidates: Candidate[]) => Promise<string[]> = async candidates => candidates.slice(0, 3).map(c => c.id)): Promise<Source[]> {
  const query = safeQuery(approvedQuery); let sequence = 0;
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
  const laws = await tool('search_laws', { query, limit: 8 });
  const candidates: Candidate[] = []; const originals = new Map<string, RecordValue>();
  for (const raw of (Array.isArray(laws.hits) ? laws.hits : []).slice(0, 8)) {
    const hit = record(raw); const id = `C${candidates.length + 1}`;
    candidates.push({ id, kind: 'law', title: string(hit.reference, 100) + ' ' + string(hit.heading, 160), jurisdiction: string(hit.canton, 2), excerpt: string(hit.snippet_text, 500) }); originals.set(id, hit);
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
        const law = await tool('get_law', { sr_number: sr, article, canton, language: 'de' });
        if (law.sr_number !== sr || law.canton !== canton || law.language !== 'de') continue;
        const url = safeSourceUrl(law.source_url); if (!url || !Array.isArray(law.articles)) continue;
        const matches = law.articles.map(record).filter(a => a.article_num === article && (a.section === 'main' || a.section === '' || a.section === undefined || a.section === null));
        if (matches.length !== 1) continue;
        const body = [string(matches[0].heading, 3000), string(matches[0].text, 40000)].filter(Boolean).join('\n');
        if (body.length < 30 || body.length > 1800) continue;
        sources.push({ id: `S${sources.length + 1}`, kind: 'law', title: `${string(law.abbreviation, 50) || string(law.title, 140)} ${string(hit.marker, 8) || 'Art.'} ${article}`, text: body, jurisdiction: canton, date: string(law.consolidation_date ?? law.version_active_since, 30), language: canton === 'CH' ? 'de' : 'original source language', url });
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
