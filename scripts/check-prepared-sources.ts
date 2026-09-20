// Read-only maintenance check. A mismatch requires review; never update hashes automatically.
import { PRACTICAL_REFERENCES } from '../lib/swisslaw-chat/practical-manifest';
import { researchPractical } from '../lib/swisslaw-chat/research';
import type { PracticalTopic } from '../lib/swisslaw-chat/practical';
const results = [];
for (const topic of Object.keys(PRACTICAL_REFERENCES) as PracticalTopic[]) {
  const start = performance.now();
  try {const sources=await researchPractical(topic);results.push({topic,status:'matches-reference',provisions:sources.length,ms:Math.round(performance.now()-start)});}
  catch {results.push({topic,status:'review-required',ms:Math.round(performance.now()-start)});}
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),meaning:'Public text matches the pinned reference, not proof of current-law completeness or legal correctness.',results},null,2));
if(results.some(r=>r.status==='review-required'))process.exitCode=1;
