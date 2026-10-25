import { z } from 'zod';
import raw from './referrals-data.json';

export const REFERRAL_TOPICS = ['general', 'work', 'home', 'family', 'money', 'consumer', 'migration', 'social', 'violence', 'discrimination', 'health'] as const;
export type ReferralTopic = typeof REFERRAL_TOPICS[number];
export const CANTONS = ['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'] as const;
export const CANTON_NAMES: Record<typeof CANTONS[number], string> = {
  AG:'Aargau', AI:'Appenzell Innerrhoden', AR:'Appenzell Ausserrhoden', BE:'Bern / Berne', BL:'Basel-Landschaft', BS:'Basel-Stadt', FR:'Fribourg / Freiburg', GE:'Genève', GL:'Glarus', GR:'Graubünden / Grigioni / Grischun', JU:'Jura', LU:'Luzern', NE:'Neuchâtel', NW:'Nidwalden', OW:'Obwalden', SG:'St. Gallen', SH:'Schaffhausen', SO:'Solothurn', SZ:'Schwyz', TG:'Thurgau', TI:'Ticino', UR:'Uri', VD:'Vaud', VS:'Valais / Wallis', ZG:'Zug', ZH:'Zürich',
};
const publicUrl = z.string().url().refine(v => { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password; }, 'Public HTTPS URL required');
const text = z.object({ description:z.string().min(1), access:z.string().min(1), costNote:z.string().min(1), privacyNote:z.string().min(1).optional() });
export const ReferralSchema = z.object({
  id:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name:z.string().min(1), url:publicUrl, sourceUrl:publicUrl, privacyUrl:publicUrl.optional(),
  topics:z.array(z.enum(REFERRAL_TOPICS)).min(1), cantons:z.array(z.enum(['CH', ...CANTONS])).min(1),
  kind:z.enum(['advice','directory','authority','mediation','ai']), cost:z.enum(['free','conditional','paid','unknown']),
  verifiedAt:z.iso.date(), copy:z.object({de:text,fr:text,it:text,rm:text,en:text}),
  specificAudience:z.boolean().default(false),
  freeInitial:z.boolean().default(false),
});
export type Referral = z.infer<typeof ReferralSchema>;
export const REFERRALS: readonly Referral[] = z.array(ReferralSchema).parse(raw);
export type ReferralFilters = {topic:ReferralTopic; canton:string; freeOnly:boolean};

/** Narrow by declared coverage, never infer eligibility or rank professional quality. */
export function selectReferrals(items:readonly Referral[], filters:ReferralFilters): Referral[] {
  return items.filter(r => (!filters.canton || r.cantons.includes('CH') || r.cantons.some(c => c === filters.canton))
    && (!filters.freeOnly || r.cost === 'free' || r.freeInitial)
    && (filters.topic === 'general' ? r.topics.includes('general') : r.topics.includes(filters.topic)))
    .sort((a,b) => {
      // Local direct routes before nationwide networks; alphabetical within the same class.
      const local = (r:Referral) => filters.canton && r.cantons.some(c => c === filters.canton) ? 1 : 0;
      return local(b)-local(a) || a.name.localeCompare(b.name, 'de');
    });
}
export function isReviewDue(date:string, now = new Date()):boolean {
  return now.getTime() - Date.parse(`${date}T00:00:00Z`) > 90 * 86400000;
}
export function referralTopic(value:string):ReferralTopic {
  return (REFERRAL_TOPICS as readonly string[]).includes(value) ? value as ReferralTopic : 'general';
}
export function topicForArea(area:string):ReferralTopic {
  const mapping:Record<string,ReferralTopic> = {tenancy:'home',employment:'work',debt:'money',consumer:'consumer',family:'family',social:'social',health:'health',migration:'migration'};
  return mapping[area] ?? 'general';
}
export function referralPath(lang:'de'|'fr'|'it'|'rm'|'en', topic:ReferralTopic = 'general'):string { return `/${lang}/beratung/#topic=${topic}`; }
