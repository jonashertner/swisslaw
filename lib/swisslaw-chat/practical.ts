/** A topic suggestion is not a legal classification. The user confirms it in the guide. */
import { HOUSING_TITLES, isHousingTopic, type HousingTopic } from './housing';
export type PracticalTopic = 'overtime' | 'marriage' | HousingTopic;
export const PRACTICAL_TITLES: Record<PracticalTopic, string> = { overtime: 'Extra working hours', marriage: 'Getting married', ...HOUSING_TITLES };
export function practicalCategory(topic: PracticalTopic): string { return isHousingTopic(topic) ? 'Home' : topic === 'overtime' ? 'Work' : 'Family'; }
export function practicalTopic(value: unknown): PracticalTopic {
  if (value !== 'overtime' && value !== 'marriage' && !(typeof value === 'string' && isHousingTopic(value))) throw new Error('INVALID_SOURCES');
  return value as PracticalTopic;
}
export function suggestPracticalTopics(text: string, category?: 'home'): PracticalTopic[] {
  const s = text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const positive = (pattern: RegExp) => [...s.matchAll(new RegExp(pattern.source, 'g'))].some(match => {
    const before = s.slice(Math.max(0,match.index! - 40),match.index).split(/[.,;!?]|\b(?:aber|but|mais|ma|sondern)\b/).at(-1)!;
    return !/\b(?:kein\w*|nicht|not|never|no|non|pas)\b(?:\s+\w+){0,4}\s*$/.test(before);
  });
  const overtime = positive(/\b(uberzeit|ueberzeit|uberstunden|ueberstunden|uberstuden|overtime|straordinarie?|heures supplementaires|uras supplementaras)\b|\b(zu viel|zuviel|z viel|too many)\b.{0,25}\b(arbeite|arbeiten|stunden|hours)\b/);
  // Do not route distinct family-law issues merely because they mention marriage.
  const otherFamilyIssue = /\b(scheid\w*|divorc\w*|trenn\w*|separat\w*|ehevertrag|eheguter\w*|zwang\w*|forced|contrat de mariage|contratto matrimoniale)\b/.test(s);
  const marriage = !otherFamilyIssue && /\b(heirat\w*|heirete|marry|married|marriage|marier|mariage|spos\w*|matrimonio|maridar)\b/.test(s);
  const topics: PracticalTopic[] = [];
  if (overtime) topics.push('overtime'); if (marriage) topics.push('marriage');
  const excludedHousing = /\b(autovermiet\w*|mietauto\w*|mietwagen\w*|wohnmobil\w*|eigentu\w*wohnung|rental car|car|handy|mobile phone)\b|\bi own my (?:apartment|flat|home|house)\b/.test(s);
  const explicitOther = /\b(arbeits\w*|job|employer|employment|salaire|travail|lavoro|heirat\w*|marriage|scheidung|divorce|handy|subscription)\b/.test(s);
  const home = !excludedHousing && (category === 'home' && !explicitOther || /\b(miet\w*|vermiet\w*|wohn\w*|wohnung|wohnig|huus|landlord|tenant|tenancy|apartment|flat|rent|loyer|bail\w*|locataire|logement|appartement|affitto|affitt\w*|locazione|inquilino|appartamento|locaziun|abitaziun|chasa)\b/.test(s));
  const rentIncrease = !excludedHousing && (positive(/\b(mietzins\w*erhoh\w*|mieterhoh\w*|miet\w*erhoeh\w*)\b/) || home && positive(/\b(erhoh\w*|erhoeh\w*|teuer\w*|teurer\w*|steig\w*|turer|mehr zahlen|mehr zahle|hoher\w*|increas\w*|higher|went up|going up|augment\w*|hausse|aument\w*|pli aut\w*)\b/));
  const defect = home && /\b(schimmel\w*|mangel\w*|maengel\w*|kaputt|heiz\w*|heisswasser|warmwasser|kein warmes wasser|feucht\w*|undicht\w*|mould|mold|broken|leak\w*|heating|defect\w*|no hot water|moisi\w*|chauffage|humid\w*|muffa|riscaldamento|guast\w*|defet\w*)\b/.test(s);
  const end = home && positive(/\b(gekundig\w*|gekuendig\w*|kundig\w*|kuendig\w*|auszieh\w*|uszieh\w*|raus\w*|rausschm\w*|nachmiet\w*|ersatzmiet\w*|move out|moving out|leave|leaving|notice|evict\w*|terminat\w*|resil\w*|conge|quitter|disd\w*|sfratt\w*|trasloc\w*|bandunar|desdit\w*)\b/);
  if (rentIncrease) topics.push('rent-increase'); if (defect) topics.push('housing-defect'); if (end) topics.push('tenancy-end');
  // A recognisable housing question without a specific supported issue gets a
  // local choice, not an invented classification or an automatic model download.
  if (home && !rentIncrease && !defect && !end && (!topics.length || /\b(mieten|renting|louer|affittare)\b/.test(s))) topics.push('rent-increase','housing-defect','tenancy-end');
  return topics;
}
export function suggestPracticalTopic(text: string): PracticalTopic | null {
  const topics = suggestPracticalTopics(text); return topics.length === 1 ? topics[0] : null;
}
export type PracticalFacts = {
  role: 'employee' | 'employer' | 'self' | 'unknown';
  regime: 'private' | 'public' | 'unknown';
  goal: 'less' | 'time' | 'pay' | 'options';
  location: 'ch' | 'abroad' | 'unknown';
  residence: 'yes' | 'no' | 'unknown';
};
export const EMPTY_PRACTICAL_FACTS: PracticalFacts = { role: 'unknown', regime: 'unknown', goal: 'options', location: 'unknown', residence: 'unknown' };
export function checkedPracticalFacts(value: PracticalFacts): PracticalFacts {
  if (!value || Object.keys(value).length !== 5 || !['employee','employer','self','unknown'].includes(value.role) || !['private','public','unknown'].includes(value.regime) || !['less','time','pay','options'].includes(value.goal) || !['ch','abroad','unknown'].includes(value.location) || !['yes','no','unknown'].includes(value.residence)) throw new Error('INVALID_CONTEXT');
  return {...value};
}
export function normalizeProvision(text: string): string { return text.normalize('NFC').replace(/\s+/gu, ' ').trim(); }
export async function provisionHash(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeProvision(text));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2,'0')).join('');
}
