import type { KnowledgeLanguage } from '../lib/swisslaw-chat/knowledge';
import { FULL_DATE_LOCALE } from '../lib/swisslaw-chat/site-i18n';

export function formatDate(iso: string, lang: KnowledgeLanguage, weekday = true): string {
  const [y, m, d] = iso.split('-').map(Number);
  const opts: Intl.DateTimeFormatOptions = { ...(weekday ? { weekday: 'long' } : {}), day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  const date = new Date(Date.UTC(y, m - 1, d));
  try { return new Intl.DateTimeFormat(FULL_DATE_LOCALE[lang], opts).format(date); }
  catch { return new Intl.DateTimeFormat('de-CH', opts).format(date); }
}
