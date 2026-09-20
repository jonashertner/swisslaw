// The guide supplies facts; it does not predict the law from a keyword.
export type GuideFacts = {
  regime: 'private' | 'public' | 'unknown';
  term: 'indefinite' | 'fixed' | 'unknown';
  probation: 'yes' | 'no' | 'unknown';
};
export const REFERENCE_RECIPES = {
  'employee-notice': ['335', '335c'],
  'employee-probation': ['335', '335b'],
  'employee-probation-unsure': ['335', '335b', '335c'],
  'employee-fixed-term': ['334'],
  'employee-term-unsure': ['334', '335'],
} as const;
export type RecipeId = keyof typeof REFERENCE_RECIPES;
export function recipeId(value: unknown): RecipeId {
  if (typeof value !== 'string' || !Object.hasOwn(REFERENCE_RECIPES, value)) throw new Error('INVALID_SOURCES');
  return value as RecipeId;
}
export function checkedGuideFacts(value: unknown): GuideFacts {
  const facts = value as GuideFacts;
  if (!facts || Object.keys(facts).length !== 3 || !['private', 'public', 'unknown'].includes(facts.regime) || !['indefinite', 'fixed', 'unknown'].includes(facts.term) || !['yes', 'no', 'unknown'].includes(facts.probation)) throw new Error('INVALID_CONTEXT');
  return { regime: facts.regime, term: facts.term, probation: facts.probation };
}
export function recipeForFacts(value: GuideFacts): RecipeId | null {
  const facts = checkedGuideFacts(value);
  if (facts.regime !== 'private') return null;
  if (facts.term === 'fixed') return 'employee-fixed-term';
  if (facts.term === 'unknown') return 'employee-term-unsure';
  return facts.probation === 'yes' ? 'employee-probation' : facts.probation === 'no' ? 'employee-notice' : 'employee-probation-unsure';
}
export function guideContext(value: GuideFacts): string {
  const facts = checkedGuideFacts(value);
  return `How can I resign from my job? I want a general explanation of ordinary resignation, not a personal exit-date calculation. I am an employee in Switzerland. I confirmed these facts in the guide: employment law regime=${facts.regime}; contract end=${facts.term}; currently in an agreed probation period=${facts.probation}. I have not supplied dates, length of service or contract notice clauses. Explain which rules I should check.`;
}
// Curated scope instructions, never an invented user fact or a substitute source.
export function recipeScope(value: RecipeId): string {
  const id = recipeId(value);
  const common = 'This guide concerns the employee resigning, not employer dismissal. The requested answer is a conditional overview of the statutory rules, not a definitive personal notice period. Unknown contract clauses and service length do not prevent explaining these defaults with clear qualifications. Explain only what these complete provisions establish. Do not compute an end date. Art.335(2) concerns written REASONS on request; it does not require all resignation NOTICES to be written. Do not invent a form requirement, contract clause, service length or duty to justify resignation. Contract, collective and standard employment terms may matter. Special contracts and immediate termination are outside this guide. ';
  if (id === 'employee-fixed-term') return common + 'Fixed-term contract: explain automatic expiry under Art.334 and ask the user to check for an agreed early-termination clause. Do not say ordinary early resignation is always possible. No automatic probation period or seven-day notice can be inferred.';
  if (id === 'employee-term-unsure') return common + 'Whether the contract has a fixed end date is unknown. Explain the distinction under Art.334 and335 conditionally; the practical next step is to check the contract end date. Do not give a notice period.';
  if (id === 'employee-probation') return common + 'Confirmed indefinite private-law contract during probation: explain the statutory seven-day default and the permitted deviations in Art.335b. Ask the user to check their applicable notice terms.';
  if (id === 'employee-notice') return common + 'Confirmed indefinite private-law contract after probation: explain the Art.335c statutory defaults as conditional on service length and differing applicable terms. Its paragraph3 concerns employer dismissal, not this employee resignation. Ask the user to check contract terms and service length.';
  return common + 'Probation is unknown. Explain that different notice rules apply during and after probation, and ask the user to establish probation status from the contract. Do not pick one period as applicable.';
}
export type ResearchJob = { query: string } | { recipe: RecipeId };
export function checkedResearchJob(value: unknown): ResearchJob {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== 1) throw new Error('INVALID_SOURCES');
  if (Object.hasOwn(value, 'recipe') && 'recipe' in value) return { recipe: recipeId(value.recipe) };
  if (Object.hasOwn(value, 'query') && 'query' in value && typeof value.query === 'string') return { query: value.query };
  throw new Error('INVALID_SOURCES');
}
