/** Topic hypotheses only. These IDs never establish facts or trigger research. */
export const TOPIC_LABELS = { work: 'Work', home: 'Home', family: 'Family', money: 'Money', purchases: 'Purchases' } as const;
export type IntakeTopic = keyof typeof TOPIC_LABELS;
export type TopicScore = { topic: IntakeTopic | 'other'; score: number };
export const INTAKE_CACHE = 'swisslaw/intake-v1';
export function isIntakeTopic(value: unknown): value is IntakeTopic {
  return typeof value === 'string' && Object.hasOwn(TOPIC_LABELS, value);
}
export function meaningfulDraft(text: string): boolean {
  return text.trim().length >= 8 && (text.match(/\p{L}/gu)?.length ?? 0) >= 6;
}
/** Cold-start aid; deliberately modest. Unknown is always a valid result. */
export function lexicalTopics(text: string): IntakeTopic[] {
  if (!meaningfulDraft(text)) return [];
  const value = text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const patterns: [IntakeTopic, RegExp][] = [
    ['work', /\b(arbeit\w*|arbeits\w*|job\w*|chef\w*|lohn\w*|uberzeit|uberstunden|kundigung|kundigen|kunden|travail\w*|emploi\w*|employeur\w*|salaire\w*|licenci\w*|lavor\w*|stipendio|salari\w*|datore|lavur\w*|pay|wages?|dismiss\w*)\b/],
    ['home', /\b(miet\w*|vermiet\w*|wohnung\w*|schimmel\w*|heizung\w*|bail\w*|loyer\w*|locataire\w*|logement\w*|appart\w*|affitto|inquilin\w*|locatore|abitazion\w*|rent\w*|tenant\w*|landlord\w*|chasa|locaziun)\b/],
    ['family', /\b(heirat\w*|heiraten|ehe\w*|scheidung\w*|kind\w*|eltern\w*|erbschaft\w*|testament\w*|mari\w*|divorc\w*|enfant\w*|famill\w*|spos\w*|figli\w*|eredita|famigl\w*|marry|marriage|child\w*|custody|inherit\w*|lètg|letg)\b/],
    ['money', /\b(schuld\w*|betreib\w*|zahlungsbefehl|rechnung\w*|kredit\w*|dette\w*|poursuite\w*|facture\w*|debiti?|esecuzione|fattura|debt\w*|loan\w*|bill\w*|daners|scussiun)\b/],
    ['purchases', /\b(kauf\w*|gekauft|bestell\w*|garantie\w*|ruckgabe|ruckerstatt\w*|achat\w*|achete\w*|commande\w*|rembours\w*|acquist\w*|comprat\w*|ordine|rimborso|bought|purchase\w*|refund\w*|warranty|cumpr\w*)\b/],
  ];
  const matches = patterns.filter(([, pattern]) => pattern.test(value)).map(([topic]) => topic);
  if (/\bstund\w*\b/.test(value) && /\bgschaff\w*\b/.test(value) && !matches.includes('work')) matches.push('work');
  // An ambiguous termination fragment should not silently mean employment.
  if (/\b(kunden|kundigen|kundigung|resilier|disdire|terminate)\b/.test(value) && !matches.includes('home')) matches.push('home');
  return matches.slice(0, 3);
}
/** Scores are similarity, not probabilities. Conservative experimental cutoffs. */
export function rankedTopics(scores: TopicScore[]): IntakeTopic[] {
  const valid = scores.filter(s => Number.isFinite(s.score));
  const other = valid.find(s => s.topic === 'other')?.score ?? 1;
  const ranked = valid.filter((s): s is TopicScore & { topic: IntakeTopic } => isIntakeTopic(s.topic)).sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ?? 0;
  if (best < 0.84 || best < other + 0.015) return [];
  return ranked.filter(s => s.score >= Math.max(0.84, best - 0.03) && s.score >= other + 0.015).slice(0, 3).map(s => s.topic);
}
/** Preserve the order of still-relevant chips so focus targets do not jump. */
export function stableTopics(previous: IntakeTopic[], next: IntakeTopic[]): IntakeTopic[] {
  return [...previous.filter(topic => next.includes(topic)), ...next.filter(topic => !previous.includes(topic))].slice(0, 3);
}
