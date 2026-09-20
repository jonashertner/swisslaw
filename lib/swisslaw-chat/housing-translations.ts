import type { Language } from './policy';
import copy from './housing-translations.json';
/** Prepared draft translations, including Rumantsch Grischun; independent review remains open. */
export function housingText(key: string, language: Language): string {
  if (language === 'en') return key;
  const values = (copy as Record<string, string[]>)[key];
  return values?.[(['de','fr','it','rm'] as const).indexOf(language)] ?? key;
}
