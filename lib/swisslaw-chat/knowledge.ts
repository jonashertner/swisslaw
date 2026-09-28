// Public knowledge base: one reviewed legal situation per file under knowledge/situations.
// Situations are data (CC BY 4.0), not code. The browser applies them deterministically:
// no model writes legal substance. See knowledge/README.md for the format and lifecycle.
import { z } from 'zod';
import { DEADLINE_RULES } from './deadlines';

export const KNOWLEDGE_LANGUAGES = ['de', 'fr', 'it', 'rm', 'en'] as const;
export type KnowledgeLanguage = typeof KNOWLEDGE_LANGUAGES[number];

const text = z.string().trim().min(1).max(1600);
// German is the master text; other languages are added after translation and review.
const LText = z.object({ de: text, fr: text.optional(), it: text.optional(), rm: text.optional(), en: text.optional() }).strict();
const hex64 = z.string().regex(/^[0-9a-f]{64}$/);
const httpsUrl = z.string().url().refine(u => u.startsWith('https://'), 'https only');

const StatuteSource = z.object({
  type: z.literal('statute'), sr: z.string().regex(/^[0-9.]+$/), article: z.string().regex(/^[0-9]+[a-z]*$/),
  label: z.string().min(3).max(60), url: httpsUrl, sha256: hex64,
}).strict();
const DecisionSource = z.object({
  type: z.literal('decision'), decision_id: z.string().min(3).max(80), citation: z.string().min(3).max(60),
  e: z.string().regex(/^[0-9]+[a-z]?(\.[0-9a-z]+)*$/).optional(), url: httpsUrl,
}).strict();
const Source = z.discriminatedUnion('type', [StatuteSource, DecisionSource]);

const Fact = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/), question: LText, help: LText.optional(),
  options: z.array(z.object({ value: z.string().regex(/^[a-z][a-z0-9-]*$/), label: LText }).strict()).min(2).max(6),
}).strict();

export const BLOCK_KINDS = ['deadline', 'warning', 'step', 'rule', 'cost', 'escalate', 'free-help'] as const;
const Block = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/), kind: z.enum(BLOCK_KINDS),
  when: z.record(z.string(), z.array(z.string()).min(1)).optional(),
  text: LText, sources: z.array(z.string()).optional(),
  deadline_rules: z.array(z.string()).optional(),
}).strict();

export const SituationSchema = z.object({
  schema: z.literal(1),
  id: z.string().regex(/^[a-z]+(\.[a-z0-9-]+)+$/),
  domain: z.string().regex(/^[a-z-]+$/),
  version: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['draft', 'live-review', 'public', 'withdrawn']),
  licence: z.literal('CC-BY-4.0'),
  title: LText, summary: LText,
  examples: z.object({ de: z.array(text).min(3) }).catchall(z.array(text)),
  scope: z.object({ covers: LText, excludes: LText }).strict(),
  facts: z.array(Fact).max(8),
  blocks: z.array(Block).min(1),
  sources: z.record(z.string().regex(/^[a-z0-9-]+$/), Source),
  official_links: z.array(z.object({ label: LText, url: httpsUrl }).strict()),
  review: z.object({
    prepared_by: z.string().min(2), prepared_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reviewed_by: z.string().nullable(), reviewed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    languages_reviewed: z.array(z.enum(KNOWLEDGE_LANGUAGES)),
  }).strict(),
}).strict();
export type Situation = z.infer<typeof SituationSchema>;
export type SituationFacts = Record<string, string>;

// --- guards ------------------------------------------------------------------
// Public guidance never names commentaries or pinpoints into them (marginal numbers).
const COMMENTARY_PATTERNS: RegExp[] = [
  /\b(?:BSK|BK|ZK|CHK|KuKo|OFK|SHK|StHK|CR|CPra|CommR)\b/u,
  /\b(?:Basler|Berner|Zürcher|Zuercher)\s+Kommentar\b/iu,
  /\b(?:Handkommentar|Kurzkommentar|Praxiskommentar|Commentaire romand|Commentario)\b/iu,
  /\b(?:N|Rz|Rn)\.?\s?\d+\b/u,
  /\bn(?:°|o\.)\s?\d+/iu,
];
export function commentaryReferences(value: string, names: readonly string[] = []): string[] {
  const hits = COMMENTARY_PATTERNS.flatMap(p => { const m = p.exec(value); return m ? [m[0]] : []; });
  for (const n of names) if (n.trim().length >= 3 && value.toLocaleLowerCase('de').includes(n.trim().toLocaleLowerCase('de'))) hits.push(n);
  return hits;
}

const words = (value: string) => value.normalize('NFC').toLocaleLowerCase('de').match(/[\p{L}\p{N}]+/gu) ?? [];
/** Word runs of length >= n that `candidate` shares with any consulted page (verbatim-overlap guard). */
export function sharedRuns(candidate: string, consulted: readonly string[], n = 8): string[] {
  const grams = new Set<string>();
  for (const page of consulted) { const w = words(page); for (let i = 0; i + n <= w.length; i++) grams.add(w.slice(i, i + n).join(' ')); }
  const w = words(candidate); const hits: string[] = [];
  for (let i = 0; i + n <= w.length; i++) { const g = w.slice(i, i + n).join(' '); if (grams.has(g)) hits.push(g); }
  return [...new Set(hits)];
}

export function allTexts(s: Situation): string[] {
  const lt = (t: Record<string, string | undefined>) => Object.values(t).filter((v): v is string => !!v);
  return [
    ...lt(s.title), ...lt(s.summary), ...Object.values(s.examples).flat(), ...lt(s.scope.covers), ...lt(s.scope.excludes),
    ...s.facts.flatMap(f => [...lt(f.question), ...(f.help ? lt(f.help) : []), ...f.options.flatMap(o => lt(o.label))]),
    ...s.blocks.flatMap(b => lt(b.text)), ...s.official_links.flatMap(l => lt(l.label)),
  ];
}

// --- validation ---------------------------------------------------------------
/** Structural and referential checks. Returns problems; an empty list means valid. */
export function validateSituation(raw: unknown, options: { privateNames?: readonly string[]; consultedPages?: readonly string[] } = {}): string[] {
  const parsed = SituationSchema.safeParse(raw);
  if (!parsed.success) return parsed.error.issues.map(i => `schema: ${i.path.join('.')}: ${i.message}`);
  const s = parsed.data; const problems: string[] = [];
  const facts = new Map(s.facts.map(f => [f.key, new Set(f.options.map(o => o.value))]));
  if (facts.size !== s.facts.length) problems.push('facts: duplicate key');
  for (const f of s.facts) if (!f.options.some(o => o.value === 'unknown')) problems.push(`facts.${f.key}: needs an "unknown" option`);
  const blockIds = new Set<string>(); const used = new Set<string>();
  for (const b of s.blocks) {
    if (blockIds.has(b.id)) problems.push(`blocks.${b.id}: duplicate id`); blockIds.add(b.id);
    for (const [key, values] of Object.entries(b.when ?? {})) {
      const allowed = facts.get(key);
      if (!allowed) { problems.push(`blocks.${b.id}: unknown fact ${key}`); continue; }
      for (const v of values) if (!allowed.has(v)) problems.push(`blocks.${b.id}: ${key} has no option ${v}`);
    }
    for (const src of b.sources ?? []) { if (!s.sources[src]) problems.push(`blocks.${b.id}: unknown source ${src}`); used.add(src); }
    if (b.kind === 'deadline' && !b.deadline_rules?.length) problems.push(`blocks.${b.id}: deadline block without deadline_rules`);
    if (b.kind !== 'deadline' && b.deadline_rules?.length) problems.push(`blocks.${b.id}: deadline_rules only on deadline blocks`);
    for (const r of b.deadline_rules ?? []) if (!DEADLINE_RULES.has(r)) problems.push(`blocks.${b.id}: unknown deadline rule ${r}`);
    if (['rule', 'warning', 'deadline', 'cost'].includes(b.kind) && !b.sources?.length) problems.push(`blocks.${b.id}: ${b.kind} block needs sources`);
  }
  for (const id of Object.keys(s.sources)) if (!used.has(id)) problems.push(`sources.${id}: never used`);
  if (s.status === 'public' && !(s.review.reviewed_by && s.review.reviewed_at && s.review.languages_reviewed.includes('de'))) problems.push('review: public requires a reviewer, date and reviewed German text');
  for (const t of allTexts(s)) {
    for (const hit of commentaryReferences(t, options.privateNames)) problems.push(`text: commentary reference "${hit}" in "${t.slice(0, 60)}…"`);
    for (const run of sharedRuns(t, options.consultedPages ?? [])) problems.push(`text: verbatim overlap with a consulted page: "${run}"`);
  }
  return problems;
}

// --- application --------------------------------------------------------------
export function applicableBlocks(s: Situation, facts: SituationFacts): Situation['blocks'] {
  return s.blocks.filter(b => Object.entries(b.when ?? {}).every(([key, values]) => values.includes(facts[key] ?? 'unknown')));
}
export function localText(t: Partial<Record<KnowledgeLanguage, string>> & { de: string }, language: KnowledgeLanguage): { text: string; language: KnowledgeLanguage } {
  const v = t[language];
  return v ? { text: v, language } : { text: t.de, language: 'de' };
}
