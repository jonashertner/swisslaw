/** A topic suggestion is not a legal classification. The user confirms it in the guide. */
export type PracticalTopic = 'overtime' | 'marriage';
export function practicalTopic(value: unknown): PracticalTopic {
  if (value !== 'overtime' && value !== 'marriage') throw new Error('INVALID_SOURCES');
  return value;
}
export function suggestPracticalTopic(text: string): PracticalTopic | null {
  const s = text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const overtime = /\b(uberzeit|ueberzeit|uberstunden|ueberstunden|uberstuden|overtime|straordinarie?|heures supplementaires|uras supplementaras)\b|\b(zu viel|zuviel|z viel|too many)\b.{0,25}\b(arbeite|arbeiten|stunden|hours)\b/.test(s);
  // Do not route distinct family-law issues merely because they mention marriage.
  const otherFamilyIssue = /\b(scheid\w*|divorc\w*|trenn\w*|separat\w*|ehevertrag|eheguter\w*|zwang\w*|forced|contrat de mariage|contratto matrimoniale)\b/.test(s);
  const marriage = !otherFamilyIssue && /\b(heirat\w*|heirete|marry|married|marriage|marier|mariage|spos\w*|matrimonio|maridar)\b/.test(s);
  return overtime === marriage ? null : overtime ? 'overtime' : 'marriage';
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
