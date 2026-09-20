import type { Language } from './policy';
import de from './de.json'; import fr from './fr.json'; import it from './it.json'; import rm from './rm.json';
const dictionaries: Record<Exclude<Language, 'en'>, Record<string, string>> = { de, fr, it, rm };
export function chatText(value: string, language: Language) { return language === 'en' ? value : dictionaries[language][value] ?? value; }
