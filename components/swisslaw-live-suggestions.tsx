'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Language } from '@/lib/swisslaw-chat/policy';
import { guideText } from '@/lib/swisslaw-chat/guide-translations';
import { intakeText } from '@/lib/swisslaw-chat/intake-translations';
import { isIntakeTopic, lexicalTopics, meaningfulDraft, stableTopics, TOPIC_LABELS, type IntakeTopic } from '@/lib/swisslaw-chat/intake';
import manifest from '@/lib/swisslaw-chat/intake-model.json';
import './swisslaw-live-suggestions.css';

export type LiveSuggestionsControl = { stop: () => void };
type Props = { draft: string; language: Language; composing: boolean; suspended: boolean; selected: IntakeTopic | null; onSelect: (topic: IntakeTopic) => void };
type Job = { id: number; text: string; language: Language };
type Status = 'idle' | 'loading' | 'preparing' | 'ready' | 'unavailable';
export const INTAKE_DOWNLOAD_MB = Math.ceil([...manifest.artifacts, ...manifest.runtimeArtifacts].reduce((n, a) => n + a.bytes, 0) / 1e6);

const LiveSuggestions = forwardRef<LiveSuggestionsControl, Props>(function LiveSuggestions({ draft, language, composing, suspended, selected, onSelect }, ref) {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [topics, setTopics] = useState<IntakeTopic[]>([]);
  const [dataSaver, setDataSaver] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const worker = useRef<Worker | null>(null); const ready = useRef(false);
  const active = useRef<Job | null>(null); const latest = useRef<Job | null>(null); const revision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef<IntakeTopic[] | null>(null);
  const current = useRef({ draft, language, composing, suspended, enabled });
  current.current = { draft, language, composing, suspended, enabled };
  const tr = (key: string) => intakeText(key, language);
  function show(next: IntakeTopic[]) {
    if (panel.current?.contains(document.activeElement)) { held.current = next; return; }
    setTopics(previous => stableTopics(previous, next));
  }
  function stop() {
    revision.current++; latest.current = null; active.current = null; ready.current = false; held.current = null;
    if (timer.current) clearTimeout(timer.current);
    if (timeout.current) clearTimeout(timeout.current);
    worker.current?.terminate(); worker.current = null;
  }
  useImperativeHandle(ref, () => ({ stop }), []);
  useEffect(() => {
    setDataSaver(Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData));
    const leave = () => { stop(); setTopics([]); setStatus('idle'); };
    window.addEventListener('pagehide', leave);
    return () => { window.removeEventListener('pagehide', leave); stop(); };
  }, []);
  function unavailable() { stop(); setStatus('unavailable'); show(lexicalTopics(current.current.draft)); }
  function dispatch() {
    if (!ready.current || !worker.current || active.current || !latest.current || current.current.composing || current.current.suspended || !current.current.enabled) return;
    const job = latest.current; latest.current = null;
    if (job.text !== current.current.draft.trim() || job.language !== current.current.language) return;
    active.current = job;
    timeout.current = setTimeout(unavailable, 20000);
    worker.current.postMessage({ type: 'classify', id: job.id, text: job.text });
  }
  function start() {
    if (worker.current) return;
    try {
      const instance = new Worker(new URL('../lib/swisslaw-chat/intake.worker.ts', import.meta.url), { type: 'module' });
      worker.current = instance; setStatus('loading'); setProgress(0);
      timeout.current = setTimeout(unavailable, 300000);
      instance.onerror = event => { event.preventDefault(); if (worker.current === instance) unavailable(); };
      instance.onmessage = event => {
        if (worker.current !== instance) return;
        const data = event.data;
        if (data.type === 'progress') { setProgress(Math.max(0, Math.min(100, data.value))); return; }
        if (data.type === 'preparing') { setStatus('preparing'); return; }
        if (data.type === 'unavailable') { unavailable(); return; }
        if (data.type === 'ready') { if (timeout.current) clearTimeout(timeout.current); ready.current = true; setStatus('ready'); if (!latest.current && meaningfulDraft(current.current.draft)) latest.current = { id: revision.current, text: current.current.draft.trim(), language: current.current.language }; dispatch(); return; }
        if (data.type === 'result' && active.current && active.current.id === data.id) {
          if (timeout.current) clearTimeout(timeout.current);
          const job = active.current; active.current = null;
          if (job.id === revision.current && job.text === current.current.draft.trim() && job.language === current.current.language && !current.current.composing && !current.current.suspended && current.current.enabled) {
            const semantic: IntakeTopic[] = Array.isArray(data.topics) ? data.topics.filter(isIntakeTopic).slice(0, 3) : [];
            // Explicit topic words help with fragmentary input; semantic matches
            // add hypotheses. Neither selects a topic or launches a guide.
            show([...new Set([...lexicalTopics(job.text), ...semantic])].slice(0, 3));
          }
          dispatch();
        }
      };
      instance.postMessage({ type: 'load' });
    } catch { unavailable(); }
  }
  useEffect(() => {
    const id = ++revision.current; latest.current = null;
    if (timer.current) clearTimeout(timer.current);
    if (suspended || !enabled) { stop(); setStatus('idle'); setTopics([]); return; }
    if (!meaningfulDraft(draft)) { setTopics([]); held.current = null; return; }
    if (composing) return;
    timer.current = setTimeout(() => {
      if (!ready.current) show(lexicalTopics(draft));
      latest.current = { id, text: draft.trim(), language };
      if (!worker.current && status !== 'unavailable' && (!dataSaver || allowDownload)) start();
      dispatch();
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [draft, language, composing, suspended, enabled, dataSaver, allowDownload]);

  if (suspended) return null;
  const visible = enabled && meaningfulDraft(draft) ? topics : [];
  return <div className="live-intake" ref={panel} data-intake-status={status} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node) && held.current) { const next = held.current; held.current = null; setTopics(previous => stableTopics(previous, next)); } }}>
    <div className="live-intake-heading"><span><svg aria-hidden="true" viewBox="0 0 28 16"><path d="M1 8h7c6 0 6-5 12-5h6M8 8c6 0 6 5 12 5h6"/><circle cx="26" cy="3" r="1"/><circle cx="26" cy="13" r="1"/></svg>{tr('Possible topics')}</span><button type="button" className="live-intake-toggle" onClick={() => setEnabled(value => !value)}>{tr(enabled ? 'Pause suggestions' : 'Enable suggestions')}</button></div>
    {enabled && <>
      <div className="live-intake-options" role="group" aria-label={tr('Possible topics')}>
        {visible.length ? visible.map(topic => <button className="live-intake-chip" type="button" key={topic} aria-pressed={selected === topic} onClick={() => onSelect(topic)}><span>{guideText(TOPIC_LABELS[topic], language)}</span><span aria-hidden="true">{selected === topic ? '✓' : '↗'}</span></button>) : <p className="live-intake-empty">{tr('Optional. Keep writing or choose a topic.')}</p>}
      </div>
      <div className="live-intake-meta">
        <span>{status === 'loading' ? `${tr('Loading the topic model')} · ${progress}%` : status === 'preparing' ? tr('Preparing local suggestions…') : status === 'ready' ? tr('Local topic model') : tr('Simple word matching')}</span>
        <span>{tr('Suggestions stay on this device.')}</span>
      </div>
      {(status === 'loading' || status === 'idle') && <p className="live-intake-download">{tr('First download')} ≈ {INTAKE_DOWNLOAD_MB} MB. {tr('Use Wi-Fi. Model files can be removed below.')}</p>}
      {status === 'loading' && <progress className="live-intake-progress" value={progress} max={100} aria-label={tr('Loading the topic model')} />}
      {status === 'unavailable' && <p className="live-intake-download">{tr('The topic model is unavailable. You can keep writing and submit normally.')} <button type="button" className="live-intake-toggle" onClick={() => { setStatus('idle'); start(); }}>{tr('Try the topic model again')}</button></p>}
      {dataSaver && !allowDownload && status === 'idle' && <p className="live-intake-download">{tr('Data saver is on. Simple suggestions work without a download.')} <button type="button" className="live-intake-toggle" onClick={() => setAllowDownload(true)}>{tr('Download topic model')}</button></p>}
    </>}
  </div>;
});
export default LiveSuggestions;
