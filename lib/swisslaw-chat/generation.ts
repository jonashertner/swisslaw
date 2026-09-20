import { classifyModelError } from './diagnostics';
import { parseCompleteOutput, Plan, safeQuery, type Turn } from './policy';

export function completionValue(content: string, reason: string | null | undefined, totalTokens = 0): unknown {
  try { return parseCompleteOutput(content, reason); }
  catch {
    if (reason !== 'stop' && reason !== 'length') throw new Error('INCOMPLETE');
    throw new Error(reason === 'length' ? (totalTokens >= 4000 ? 'CONTEXT_LIMIT' : 'OUTPUT_LIMIT') : 'INVALID_OUTPUT');
  }
}

export function validatedPlan(value: unknown): Plan {
  const result = Plan.parse(value);
  if (result.kind === 'research') {
    let query: string;
    try { query = safeQuery(result.query); } catch { throw new Error('INVALID_OUTPUT'); }
    const words = query.toLocaleLowerCase('de-CH').split(' ');
    if (result.clarification !== 'none' || words.length > 5 || new Set(words).size !== words.length) throw new Error('INVALID_OUTPUT');
    return { ...result, query };
  }
  if (result.query || (result.kind === 'outside' ? result.clarification !== 'none' : result.clarification === 'none')) throw new Error('INVALID_OUTPUT');
  return result;
}

// A retry stays inside the same local worker. It receives the same conversation
// and uses a shorter instruction. No unfinished output is repaired or released.
export async function planWithRecovery(generate: (retry: boolean) => Promise<unknown>): Promise<Plan> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return validatedPlan(await generate(attempt === 1)); }
    catch (error) {
      const code = classifyModelError(error, 'plan');
      if (!['OUTPUT_LIMIT', 'INCOMPLETE', 'INVALID_OUTPUT'].includes(code)) throw error;
      if (attempt === 1) throw new Error('PLAN_FAILED');
    }
  }
  throw new Error('PLAN_FAILED');
}

// Concrete demonstrations, never placeholder text the model could copy as a query.
export const INTAKE_EXAMPLES: Turn[] = [
  { role: 'user', content: 'ich will min job künde wie gaht das' },
  { role: 'assistant', content: '{"kind":"research","clarification":"none","query":"Arbeitsvertrag Kündigung Arbeitnehmer Kündigungsfrist"}' },
  { role: 'user', content: 'mini wohnig isch eiskalt und de vermieter macht nüt' },
  { role: 'assistant', content: '{"kind":"research","clarification":"none","query":"Miete Heizung Mangel Beseitigung"}' },
  { role: 'user', content: 'han so en zahligsbefehl becho aber schulde nüt' },
  { role: 'assistant', content: '{"kind":"research","clarification":"none","query":"Betreibung Zahlungsbefehl Rechtsvorschlag Forderung"}' },
  { role: 'user', content: 'ich will künden' },
  { role: 'assistant', content: '{"kind":"clarify","clarification":"facts","query":""}' },
  { role: 'user', content: 'ich weiss nicht mehr weiter bitte hilf' },
  { role: 'assistant', content: '{"kind":"clarify","clarification":"facts","query":""}' },
  { role: 'user', content: 'schreib mir ein rezept für suppe' },
  { role: 'assistant', content: '{"kind":"outside","clarification":"none","query":""}' },
];
