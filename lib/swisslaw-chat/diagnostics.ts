// Only these authored codes cross the worker boundary. Never expose raw errors:
// provider/runtime messages can contain prompts, source text or private facts.
export const ERROR_CODES = ['MODEL_DOWNLOAD', 'MODEL_STARTUP', 'GPU_UNSUPPORTED', 'GPU_LOST', 'TIMEOUT', 'CONTEXT_LIMIT', 'OUTPUT_LIMIT', 'INCOMPLETE', 'INVALID_OUTPUT', 'INVALID_SOURCES', 'INVALID_CONTEXT', 'INVALID_EVIDENCE', 'INVALID_INSUFFICIENT', 'SEARCH_ERROR', 'SEARCH_TIMEOUT', 'MODEL_ERROR'] as const;
export type ErrorCode = typeof ERROR_CODES[number];
export function safeErrorCode(value: unknown): ErrorCode {
  return ERROR_CODES.includes(value as ErrorCode) ? value as ErrorCode : 'MODEL_ERROR';
}
export function classifyModelError(error: unknown, stage: string): ErrorCode {
  const message = error instanceof Error ? error.message : '';
  if (ERROR_CODES.includes(message as ErrorCode)) return message as ErrorCode;
  if (/device.{0,30}lost|out of memory|GPUOutOfMemory|buffer.{0,40}(allocation|size)|GPU device/i.test(message)) return 'GPU_LOST';
  if (/context.{0,40}(length|window|exceed)|prompt.{0,40}(long|exceed)/i.test(message)) return 'CONTEXT_LIMIT';
  if (stage === 'load') return 'MODEL_STARTUP';
  if (error instanceof SyntaxError || (error instanceof Error && error.name === 'ZodError')) return 'INVALID_OUTPUT';
  return 'MODEL_ERROR';
}
export function errorMessage(code: ErrorCode): string {
  switch (code) {
    case 'MODEL_DOWNLOAD': return 'The model could not be downloaded. Check your connection and available storage, then try again.';
    case 'MODEL_STARTUP': case 'GPU_UNSUPPORTED': return 'The model could not start in this browser. Reload the page and try again, or use another WebGPU-compatible browser.';
    case 'GPU_LOST': return 'The device ran out of graphics resources or lost its graphics connection. Close other demanding tabs, then try again.';
    case 'TIMEOUT': return 'This step took too long. Try again, or shorten your question.';
    case 'CONTEXT_LIMIT': case 'INVALID_CONTEXT': return 'This conversation exceeds the local model’s capacity. Start again with a shorter question.';
    case 'OUTPUT_LIMIT': case 'INCOMPLETE': return 'The model returned an incomplete response. Try again with a shorter question.';
    case 'SEARCH_ERROR': case 'SEARCH_TIMEOUT': return 'The public-source search failed. Your conversation was not sent. Check your connection and try again.';
    case 'INVALID_EVIDENCE': case 'INVALID_INSUFFICIENT': case 'INVALID_SOURCES': return 'The answer could not be verified against the retrieved sources. Refine the search or your question.';
    default: return 'The model returned a response that could not be validated. Try again or rephrase your question.';
  }
}
