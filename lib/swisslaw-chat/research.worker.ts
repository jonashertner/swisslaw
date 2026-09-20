import { researchSources, type Candidate } from './research';
let busy = false; let choose: ((ids: string[]) => void) | null = null;
self.onmessage = async event => {
  if (busy) {
    if (choose && event.data && Object.keys(event.data).length === 1 && Array.isArray(event.data.selection)) { const accept = choose; choose = null; accept(event.data.selection); }
    return;
  }
  if (!event.data || Object.keys(event.data).length !== 1 || typeof event.data.query !== 'string') return;
  busy = true;
  try {
    const select = (candidates: Candidate[]) => new Promise<string[]>(resolve => { choose = resolve; postMessage({ type: 'candidates', candidates }); });
    postMessage({ type: 'sources', sources: await researchSources(event.data.query, fetch, select) });
  } catch { postMessage({ type: 'error' }); }
};
