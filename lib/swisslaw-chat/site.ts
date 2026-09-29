// Site model: life areas, the letter board, search and shareable fact state.
// Pure functions only (tested under Node); the Vite-specific loading lives in site-data.ts.
import { KNOWLEDGE_LANGUAGES, type KnowledgeLanguage } from './languages';
import type { Situation, SituationFacts } from './knowledge';

export type Channel = 'public' | 'review';
/** Public builds show only reviewed situations; the access-restricted review build shows drafts too. */
export function visibleInChannel(s: Situation, channel: Channel): boolean {
  if (s.status === 'withdrawn') return false;
  return channel === 'review' ? true : s.status === 'public';
}

/** Public builds carry only reviewed languages; unreviewed translations stay on the review site. */
export function withPublishedLanguages(s: Situation, channel: Channel): Situation {
  if (channel === 'review') return s;
  const keep = new Set<string>(['de', ...s.review.languages_reviewed]);
  const isLangMap = (o: Record<string, unknown>) => 'de' in o && Object.keys(o).every(k => (KNOWLEDGE_LANGUAGES as readonly string[]).includes(k));
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (!v || typeof v !== 'object') return v;
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.entries(o).filter(([k]) => !isLangMap(o) || keep.has(k)).map(([k, x]) => [k, strip(x)]));
  };
  return strip(s) as Situation;
}
/** True where a page shows a translation that no reviewer has checked yet (review site only). */
export function unreviewedTranslation(s: Situation, language: KnowledgeLanguage): boolean {
  return language !== 'de' && !!s.title[language] && !s.review.languages_reviewed.includes(language);
}

// --- sources in the reader's language ---------------------------------------------
// Official Fedlex abbreviations. Romansh and English readers get the German text and abbreviations.
const LAW_ABBR: Record<string, { fr: string; it: string }> = {
  OR: { fr: 'CO', it: 'CO' }, ZPO: { fr: 'CPC', it: 'CPC' }, SchKG: { fr: 'LP', it: 'LEF' }, StPO: { fr: 'CPP', it: 'CPP' },
  VwVG: { fr: 'PA', it: 'PA' }, DSG: { fr: 'LPD', it: 'LPD' }, DSV: { fr: 'OPDo', it: 'OPDa' }, AVIG: { fr: 'LACI', it: 'LADI' },
  DBG: { fr: 'LIFD', it: 'LIFD' }, StHG: { fr: 'LHID', it: 'LAID' }, SVG: { fr: 'LCR', it: 'LCStr' }, OBG: { fr: 'LAO', it: 'LMD' },
  VMWG: { fr: 'OBLF', it: 'OLAL' },
};
const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
};
type Source = Situation['sources'][string];
export function sourceLabel(r: Source, language: KnowledgeLanguage): string {
  if (language !== 'fr' && language !== 'it') return r.type === 'statute' ? r.label : `${r.citation}${r.e ? `, E. ${r.e}` : ''}`;
  if (r.type === 'statute') {
    const m = /^(\S+) · Art\. (.+)$/.exec(r.label);
    const abbr = m && LAW_ABBR[m[1]]?.[language];
    return abbr ? `${abbr} · art. ${m[2]}` : r.label;
  }
  let c = r.citation.replace(/^BGE /, language === 'fr' ? 'ATF ' : 'DTF ');
  const d = /^BGer (\S+) vom (\d{1,2})\. (\p{L}+) (\d{4})$/u.exec(r.citation);
  const month = d ? MONTHS_DE.indexOf(d[3]) : -1;
  if (d && month >= 0) c = `TF ${d[1]} ${language === 'fr' ? 'du' : 'del'} ${language === 'fr' && d[2] === '1' ? '1er' : d[2]} ${MONTHS[language][month]} ${d[4]}`;
  return `${c}${r.e ? `, consid. ${r.e}` : ''}`;
}
/** Fedlex publishes every federal act in German, French and Italian. */
export function sourceUrl(r: Source, language: KnowledgeLanguage): string {
  return r.type === 'statute' && (language === 'fr' || language === 'it') ? r.url.replace(/\/de(#|$)/, `/${language}$1`) : r.url;
}

export const AREAS = ['tenancy', 'employment', 'debt', 'consumer', 'traffic', 'admin', 'data', 'family', 'inheritance', 'social', 'health', 'protection'] as const;
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
  'inheritance.refusal', 'inheritance.debts', 'inheritance.will', 'inheritance.compulsory-shares', 'inheritance.power-of-attorney',
  'health.refused-bill', 'health.switching', 'health.supplementary',
  'protection.domestic-violence', 'protection.victim-support', 'protection.police-questioning',
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
