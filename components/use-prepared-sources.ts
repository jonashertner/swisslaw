'use client';
import { useEffect, useRef, useState } from 'react';
import { publicSourceCache, type PublicPacket } from '@/lib/swisslaw-chat/public-source-cache';
import type { PracticalTopic } from '@/lib/swisslaw-chat/practical';

export function usePreparedSources(topic: PracticalTopic) {
  const [packet, setPacket] = useState<PublicPacket | null>(null);
  const [status, setStatus] = useState<'idle'|'reading'|'error'|'ready'>('idle');
  const current = useRef<{ worker: Worker; timer: ReturnType<typeof setTimeout> } | null>(null);
  const revision = useRef(0);
  function stop() { revision.current++; if (current.current) { clearTimeout(current.current.timer); current.current.worker.terminate(); current.current = null; } }
  function reset() { stop(); setPacket(null); setStatus('idle'); }
  useEffect(() => { const leave = () => {reset(); publicSourceCache.clear();}; window.addEventListener('pagehide',leave); return () => {window.removeEventListener('pagehide',leave);stop();}; },[topic]);
  async function load() {
    if (current.current) return;
    stop(); const job = revision.current;
    const cached = publicSourceCache.get(topic);
    if (cached) {setPacket(cached);setStatus('ready');return;}
    setPacket(null); setStatus('reading');
    const fail = () => {if (revision.current !== job) return;stop();setStatus('error');};
    try {
      const worker = new Worker(new URL('../lib/swisslaw-chat/research.worker.ts',import.meta.url),{type:'module'});
      current.current = {worker,timer:setTimeout(fail,75000)};
      worker.onerror = fail;
      worker.onmessage = async event => {
        if (revision.current !== job || current.current?.worker !== worker) return;
        if (event.data.type !== 'sources') {fail();return;}
        try {
          const checked = await publicSourceCache.put(topic,event.data.sources);
          if (revision.current !== job || current.current?.worker !== worker) return;
          stop();setPacket(checked);setStatus('ready');
        } catch {fail();}
      };
      // Fixed public topic ID only. Facts and free text never enter this worker.
      worker.postMessage({practical:topic});
    } catch {fail();}
  }
  return {packet,status,load,reset};
}
