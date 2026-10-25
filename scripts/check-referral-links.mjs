// Manual public-link health check. Does not edit or recertify records or contact providers.
import { readFile } from 'node:fs/promises';
const rows=JSON.parse(await readFile(new URL('../lib/swisslaw-chat/referrals-data.json',import.meta.url),'utf8'));
const urls=[...new Set(rows.flatMap(r=>[r.url,r.sourceUrl]))];
const report=[]; let cursor=0;
await Promise.all(Array.from({length:3},async()=>{
  while(cursor<urls.length){
    const url=urls[cursor++];
    try{
      const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'Swisslaw-directory-link-check/1.0'}});
      await response.body?.cancel();
      report.push({url,status:response.status,finalUrl:response.url,ok:response.ok,ids:rows.filter(r=>r.url===url||r.sourceUrl===url).map(r=>r.id)});
    }catch{report.push({url,ok:false,status:null,ids:rows.filter(r=>r.url===url||r.sourceUrl===url).map(r=>r.id)});}
  }
}));
console.log(JSON.stringify({checkedAt:new Date().toISOString(),note:'HTTP reachability only; does not verify content, cost, capacity or quality.',results:report.sort((a,b)=>a.url.localeCompare(b.url))},null,2));
if(report.some(r=>!r.ok)) process.exitCode=1;
