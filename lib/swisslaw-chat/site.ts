// Site model: life areas, the letter board, search and shareable fact state.
// Pure functions only (tested under Node); the Vite-specific loading lives in site-data.ts.
import type { KnowledgeLanguage, Situation, SituationFacts } from './knowledge';

export type Channel = 'public' | 'review';
/** Public builds show only reviewed situations; the access-restricted review build shows drafts too. */
export function visibleInChannel(s: Situation, channel: Channel): boolean {
  if (s.status === 'withdrawn') return false;
  return channel === 'review' ? true : s.status === 'public';
}

export const AREAS = ['tenancy', 'employment', 'debt', 'consumer', 'traffic', 'admin', 'data', 'family', 'inheritance', 'social'] as const;
export type AreaId = typeof AREAS[number];

/** Letters people receive, in the order of how often they bring someone here. */
/** Order within an area: most frequent and most deadline-sensitive first. Unlisted situations follow by id. */
export const SITUATION_ORDER: readonly string[] = [
  'tenancy.landlord-notice', 'tenancy.rent-increase', 'tenancy.rent-reduction', 'tenancy.defects', 'tenancy.deposit', 'tenancy.early-exit',
  'employment.dismissal', 'employment.summary-dismissal', 'employment.unpaid-wages', 'employment.sick-pay', 'employment.reference',
  'debt.payment-order', 'debt.garnishment',
  'consumer.defective-purchase', 'consumer.faulty-work', 'consumer.doorstep-withdrawal',
  'traffic.penalty-order', 'traffic.fixed-fine',
  'admin.decision-appeal', 'admin.tax-assessment',
  'data.access-request',
  'family.separation', 'family.divorce', 'family.child-maintenance', 'family.parental-care',
  'social.unemployment', 'social.invalidity-application', 'social.work-accident', 'social.ahv-gaps',
];
export function byImportance(a: { id: string }, b: { id: string }): number {
  const rank = (id: string) => { const i = SITUATION_ORDER.indexOf(id); return i < 0 ? SITUATION_ORDER.length : i; };
  return rank(a.id) - rank(b.id) || a.id.localeCompare(b.id);
}

export const LETTERS: readonly { id: string; situation: string }[] = [
  { id: 'lease-notice', situation: 'tenancy.landlord-notice' },
  { id: 'payment-order', situation: 'debt.payment-order' },
  { id: 'penalty-order', situation: 'traffic.penalty-order' },
  { id: 'rent-increase', situation: 'tenancy.rent-increase' },
  { id: 'job-notice', situation: 'employment.dismissal' },
  { id: 'fixed-fine', situation: 'traffic.fixed-fine' },
  { id: 'tax-assessment', situation: 'admin.tax-assessment' },
  { id: 'decision', situation: 'admin.decision-appeal' },
];

// --- search ------------------------------------------------------------------
export function fold(value: string): string {
  return value.toLocaleLowerCase('de').replace(/ß/g, 'ss').normalize('NFD').replace(/\p{M}+/gu, '');
}
const STOP = new Set('der die das ein eine einer und oder ich mir mich mein meine meinen was wie kann muss habe hat ist bin nicht mit von zu im in am an auf fur für le la les un une et ou je me mon ma mes il lo gli una e o io mi mio the a an and or my i me is was what how can de d s het mi mini wie was'.split(' ').map(fold));
export function tokens(value: string): string[] {
  return (fold(value).match(/[\p{L}\p{N}]+/gu) ?? []).filter(t => t.length > 1 && !STOP.has(t));
}
type Weighted = { text: string; weight: number };
function fields(s: Situation, language: KnowledgeLanguage): Weighted[] {
  const pick = (t: Partial<Record<KnowledgeLanguage, string>>) => [t[language], t.de].filter((v): v is string => !!v).join(' ');
  return [
    { text: pick(s.title), weight: 4 },
    { text: [...(s.examples[language] ?? []), ...s.examples.de].join(' '), weight: 2 },
    { text: pick(s.summary), weight: 1 },
  ];
}
/** Lexical ranking over titles, lay examples (incl. dialect) and summaries. Prefix matches count for longer words. */
export function searchSituations(query: string, situations: readonly Situation[], language: KnowledgeLanguage, limit = 6): Situation[] {
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  const scored = situations.map(s => {
    const fs = fields(s, language).map(f => ({ weight: f.weight, toks: tokens(f.text) }));
    let score = 0, matched = 0;
    for (const term of q) {
      let best = 0;
      for (const f of fs) for (const t of f.toks) {
        const hit = t === term ? 1 : term.length >= 4 && (t.startsWith(term) || term.startsWith(t) && t.length >= 4) ? 0.7 : term.length >= 5 && t.length >= 5 && (t.includes(term) || term.includes(t)) ? 0.5 : 0;
        best = Math.max(best, hit * f.weight);
      }
      if (best) { score += best; matched += 1; }
    }
    return { s, score: score * (matched / q.length) };
  }).filter(x => x.score > 0.9);
  return scored.sort((a, b) => b.score - a.score || a.s.id.localeCompare(b.s.id)).slice(0, limit).map(x => x.s);
}

// --- routes and shareable facts (URL fragment only; never sent to a server) ----
export type Route =
  | { page: 'home' }
  | { page: 'area'; area: AreaId }
  | { page: 'situation'; id: string; facts: SituationFacts }
  | { page: 'ask' }
  | { page: 'about' };
export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'bereich' && (AREAS as readonly string[]).includes(parts[1])) return { page: 'area', area: parts[1] as AreaId };
  if (parts[0] === 's' && /^[a-z]+(\.[a-z0-9-]+)+$/.test(parts[1] ?? '')) {
    const facts: SituationFacts = {};
    for (const pair of query.split('&').filter(Boolean)) {
      const [k, v] = pair.split('=');
      if (/^[a-z][a-z0-9_]*$/.test(k ?? '') && /^[a-z][a-z0-9-]*$/.test(v ?? '')) facts[k] = v;
    }
    return { page: 'situation', id: parts[1], facts };
  }
  if (parts[0] === 'frage') return { page: 'ask' };
  if (parts[0] === 'ueber') return { page: 'about' };
  return { page: 'home' };
}
export function situationHash(id: string, facts: SituationFacts = {}): string {
  const q = Object.entries(facts).filter(([, v]) => v && v !== 'unknown').sort().map(([k, v]) => `${k}=${v}`).join('&');
  return `#/s/${id}${q ? `?${q}` : ''}`;
}
/** Keeps only answers that exist in the situation, so a shared link cannot inject anything. */
export function checkedFacts(s: Situation, facts: SituationFacts): SituationFacts {
  const out: SituationFacts = {};
  for (const f of s.facts) { const v = facts[f.key]; if (v && f.options.some(o => o.value === v)) out[f.key] = v; }
  return out;
}

export const BLOCK_ORDER = ['deadline', 'warning', 'step', 'rule', 'cost', 'escalate', 'free-help'] as const;
