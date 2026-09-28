// The five languages of swisslaw.io. Kept free of dependencies so the browser bundle does not pull in the schema library.
export const KNOWLEDGE_LANGUAGES = ['de', 'fr', 'it', 'rm', 'en'] as const;
export type KnowledgeLanguage = typeof KNOWLEDGE_LANGUAGES[number];
