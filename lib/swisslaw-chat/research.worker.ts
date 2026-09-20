import { researchSources, researchReferences, type Candidate } from './research';
import { checkedResearchJob } from './guide';
let busy = false; let choose: ((ids: string[]) => void) | null = null;
self.onmessage = async event => {
  if (busy) {
    if (choose && event.data && Object.keys(event.data).length === 1 && Array.isArray(event.data.selection)) { const accept = choose; choose = null; accept(event.data.selection); }
    return;
  }
  busy = true;
  try {
    const job = checkedResearchJob(event.data);
    const select = (candidates: Candidate[]) => new Promise<string[]>(resolve => { choose = resolve; postMessage({ type: 'candidates', candidates }); });
    postMessage({ type: 'sources', sources: 'recipe' in job ? await researchReferences(job.recipe, fetch) : await researchSources(job.query, fetch, select) });
  } catch { postMessage({ type: 'error' }); }
};
