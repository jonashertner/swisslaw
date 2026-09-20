export function assertPromptBudget(promptTokens: unknown, outputTokens: number, contextWindow = 4096) {
  if (!Number.isSafeInteger(promptTokens) || (promptTokens as number) <= 0 || !Number.isSafeInteger(outputTokens) || outputTokens < 1 || (promptTokens as number) + outputTokens + 96 > contextWindow) throw new Error('CONTEXT_LIMIT');
}
