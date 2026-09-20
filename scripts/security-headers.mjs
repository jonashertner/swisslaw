export const commonHeaders = {
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};
export const documentCsp = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export const engineCsp = "default-src 'none'; script-src 'self' blob: 'wasm-unsafe-eval'; connect-src https://huggingface.co https://*.hf.co https://raw.githubusercontent.com; worker-src 'none'";
export const intakeCsp = "default-src 'none'; script-src 'self' blob: 'wasm-unsafe-eval'; connect-src 'self' https://huggingface.co https://*.hf.co; worker-src 'none'";
export const researchCsp = "default-src 'none'; script-src 'none'; connect-src https://mcp.opencaselaw.ch/mcp; worker-src 'none'";
export function contentPolicy(path) {
  if (path.startsWith('/assets/engine.worker-') && path.endsWith('.js')) return engineCsp;
  if (path.startsWith('/assets/intake.worker-') && path.endsWith('.js')) return intakeCsp;
  if (path.startsWith('/assets/research.worker-') && path.endsWith('.js')) return researchCsp;
  if (path === '/' || path.endsWith('.html')) return documentCsp;
  return undefined;
}
