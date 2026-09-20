/** Compact grammars for WebLLM 0.2.85 / bundled web-xgrammar 0.1.27.
 * Constrain output shape and size, not truth, relevance or legal correctness.
 * Continue to apply strict Zod, ID/evidence and outbound-query validation.
 * Never add a whitespace-star rule: all structural whitespace is forbidden.
 */
const literal = (value: string): string => JSON.stringify(value);
const alternatives = (values: readonly string[]): string => values.map(literal).join(' | ');
function checkedIds(ids: readonly string[], pattern: RegExp, maximum: number): string[] {
  if (!Array.isArray(ids) || ids.length > maximum || ids.some(id => typeof id !== 'string' || !pattern.test(id))) throw new Error('INVALID_SOURCES');
  if (new Set(ids).size !== ids.length) throw new Error('INVALID_SOURCES');
  return [...ids];
}

// 1–5 complete German search words, each 2–32 letters/hyphens; <=164 characters.
// Umlauts are literal alternatives because this pinned XGrammar build handles
// literal UTF-8 correctly but does not match them reliably inside [a-ü] classes.
export const PLAN_GRAMMAR = [
  'root ::= research | clarify | outside',
  `research ::= ${literal('{"kind":"research","clarification":"none","query":"')} word (${literal(' ')} word){0,4} ${literal('"}')}`,
  `clarify ::= ${literal('{"kind":"clarify","clarification":"')} clarification ${literal('","query":""}')}`,
  `outside ::= ${literal('{"kind":"outside","clarification":"none","query":""}')}`,
  `clarification ::= ${alternatives(['canton', 'date', 'role', 'goal', 'facts'])}`,
  'word ::= letter (letter | "-"){0,30} letter',
  `letter ::= [A-Za-z] | ${alternatives(['Ä', 'Ö', 'Ü', 'ä', 'ö', 'ü'])}`,
].join('\n');

export function selectionGrammar(candidateIds: readonly string[]): string {
  const ids = checkedIds(candidateIds, /^C(?:[1-9]|1[01])$/, 11);
  if (!ids.length) return `root ::= ${literal('{"ids":[]}')}`;
  // The retained candidate-map controller must continue rejecting duplicates.
  return [
    `root ::= ${literal('{"ids":[')} (candidate (${literal(',')} candidate){0,2})? ${literal(']}')}`,
    `candidate ::= ${alternatives(ids.map(id => JSON.stringify(id)))}`,
  ].join('\n');
}

export const CANONICAL_INSUFFICIENT = {
  status: 'insufficient',
  answer: { text: 'Not established.', passage: '' },
  steps: [],
  uncertainty: '',
} as const;

export function answerGrammar(passageIds: readonly string[]): string {
  const ids = checkedIds(passageIds, /^S[1-5]P[1-9]\d{0,2}$/, 500);
  const insufficient = literal(JSON.stringify(CANONICAL_INSUFFICIENT));
  if (!ids.length) return `root ::= ${insufficient}`;
  return [
    'root ::= answer | insufficient',
    `answer ::= ${literal('{"status":"answer","answer":')} evidence ${literal(',"steps":[')} evidence (${literal(',')} evidence)? ${literal('],"uncertainty":')} uncertainty ${literal('}')}`,
    `insufficient ::= ${insufficient}`,
    `evidence ::= ${literal('{"text":')} text ${literal(',"passage":')} passage ${literal('}')}`,
    `passage ::= ${alternatives(ids.map(id => JSON.stringify(id)))}`,
    `text ::= ${literal('"')} prose-char{1,280} ${literal('"')}`,
    `uncertainty ::= ${literal('"')} prose-char{0,200} ${literal('"')}`,
    // Plain JSON strings: quotes/backslashes and C0/DEL controls are disallowed.
    // Unicode prose is permitted; controller supplies exact source quotations.
    String.raw`prose-char ::= [^"\\\u0000-\u001f\u007f]`,
  ].join('\n');
}
