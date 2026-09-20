'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp, ArrowUpRight, Copy, LockKeyhole, Plus, RotateCcw, X } from 'lucide-react';
import { LANGUAGES, preferredLanguage, resolveAnswer, contextWithinBounds, safeQuery, type Answer, type Language, type Plan, type Source, type Turn } from '@/lib/swisslaw-chat/policy';
import { errorMessage, safeErrorCode } from '@/lib/swisslaw-chat/diagnostics';
import { MODEL_ID, MODEL_OPTIONS, selectedModel, type ModelId } from '@/lib/swisslaw-chat/model-config';
import { removeModelCache } from '@/lib/swisslaw-chat/model-cache';
import { MCP_ENDPOINT } from '@/lib/swisslaw-chat/mcp';
import { chatText } from '@/lib/swisslaw-chat/translations';
import './swisslaw-chat.css';
import GuidedStart from './swisslaw-guide';
import { guideText } from '@/lib/swisslaw-chat/guide-translations';
import { guideContext, recipeForFacts, REFERENCE_RECIPES, type GuideFacts } from '@/lib/swisslaw-chat/guide';

type Phase = 'idle' | 'loading' | 'thinking' | 'review' | 'searching' | 'answering' | 'cleaning' | 'error';
type Exchange = { role: 'user'; text: string } | { role: 'assistant'; text: string; answer?: Answer; sources?: Source[] };
export default function SwisslawChat() {
  const [language, setLanguage] = useState<Language>('de');
  const [modelId, setModelId] = useState<ModelId>(MODEL_ID);
  const model = selectedModel(modelId);
  const t = (s: string) => chatText(s, language);
  const g = (s: string) => guideText(s, language);
  const [guided, setGuided] = useState(true);
  const [guideEpoch, setGuideEpoch] = useState(0);
  const [guideFacts, setGuideFacts] = useState<GuideFacts | null>(null);
  const [topicContext, setTopicContext] = useState('');
  const guidedRecipe = guideFacts ? recipeForFacts(guideFacts) : null;
  const [draft, setDraft] = useState(''); const [phase, setPhase] = useState<Phase>('idle');
  const [messages, setMessages] = useState<Exchange[]>([]); const [query, setQuery] = useState('');
  const guideVisible = guided && !guideFacts && messages.length === 0 && phase !== 'cleaning';
  const [notice, setNotice] = useState(''); const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState<boolean | null>(null); const [loaded, setLoaded] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [preparationStep, setPreparationStep] = useState<'download' | 'prepare'>('download');
  const [copyStatus, setCopyStatus] = useState(''); const [failureCode, setFailureCode] = useState('');
  const worker = useRef<Worker | null>(null); const searchWorker = useRef<Worker | null>(null);
  const ready = useRef(false); const generation = useRef(0); const sessionEpoch = useRef(0); const context = useRef<Turn[]>([]);
  const asked = useRef(new Map<string, number>());
  const cleaning = useRef(false);
  const pending = useRef<{ resolve: (value: any) => void; reject: (error: Error) => void; id: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const searchPending = useRef<(() => void) | null>(null); const input = useRef<HTMLTextAreaElement>(null);
  const busy = ['loading', 'thinking', 'searching', 'answering', 'cleaning'].includes(phase);
  useEffect(() => {
    setLanguage(preferredLanguage(navigator.languages));
    let alive = true;
    const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<{ features: Set<string>; limits: Record<string, number> } | null> } }).gpu;
    if (!gpu) setSupported(false); else gpu.requestAdapter().then(adapter => { if (alive) setSupported(Boolean(adapter?.features.has('shader-f16') && adapter.limits.maxStorageBufferBindingSize >= 1073741824 && adapter.limits.maxComputeWorkgroupStorageSize >= 32768 && adapter.limits.maxStorageBuffersPerShaderStage >= 10)); }).catch(() => { if (alive) setSupported(false); });
    const leave = () => { stop(); context.current = []; asked.current.clear(); setMessages([]); setDraft(''); setQuery(''); setGuideFacts(null); setGuided(true); setGuideEpoch(n => n + 1); setTopicContext(''); if (!cleaning.current) setPhase('idle'); };
    window.addEventListener('pagehide', leave);
    return () => { alive = false; window.removeEventListener('pagehide', leave); stop(); };
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  function stop() {
    sessionEpoch.current++; generation.current++; worker.current?.terminate(); worker.current = null; searchWorker.current?.terminate(); searchWorker.current = null;
    searchPending.current?.(); searchPending.current = null; ready.current = false; setLoaded(false);
    if (pending.current) { clearTimeout(pending.current.timer); pending.current.reject(new Error('CANCELLED')); pending.current = null; }
  }
  function clear() { if (cleaning.current) return; stop(); context.current = []; asked.current.clear(); setMessages([]); setDraft(''); setQuery(''); setGuideFacts(null); setGuided(true); setGuideEpoch(n => n + 1); setTopicContext(''); setNotice(''); setFailureCode(''); setCopyStatus(''); setProgress(0); setConfirmRemoval(false); setPhase('idle'); input.current?.focus(); }
  async function removeModels() {
    if (cleaning.current) return;
    clear(); cleaning.current = true; const session = sessionEpoch.current; setPhase('cleaning');
    try {
      const removed = await removeModelCache(caches);
      if (session === sessionEpoch.current) setNotice(removed ? 'Saved model files have been removed for this site. You can download them again when needed.' : 'No saved model files were found for this site.');
    } catch {
      if (session === sessionEpoch.current) setNotice('The model files could not all be removed. Try again, or use your browser’s site-data settings.');
    } finally { cleaning.current = false; setPhase('idle'); }
  }
  function cancel() { stop(); setPhase(guidedRecipe ? 'review' : 'idle'); setNotice('Stopped. You can continue or start again.'); }
  function request(type: 'load' | 'plan' | 'select' | 'answer', payload: object = {}) {
    if (!worker.current) throw new Error('NO_WORKER'); const instance = worker.current; const id = ++generation.current;
    return new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => { if (pending.current?.id !== id) return; pending.current = null; instance.terminate(); worker.current = null; ready.current = false; setLoaded(false); reject(new Error('TIMEOUT')); }, type === 'load' ? 600000 : 150000);
      pending.current = { resolve, reject, id, timer }; instance.postMessage({ type, id, ...payload });
    });
  }
  async function prepare() {
    if (cleaning.current) throw new Error('CANCELLED');
    if (ready.current) return;
    worker.current?.terminate();
    setPhase('loading'); setPreparationStep('download'); setProgress(0);
    const instance = new Worker(new URL('../lib/swisslaw-chat/engine.worker.ts', import.meta.url), { type: 'module' }); worker.current = instance;
    instance.onmessage = event => {
      if (worker.current !== instance) return; const data = event.data;
      if (data.type === 'preparation') { setPreparationStep('prepare'); return; }
      if (data.type === 'progress') { setProgress(Math.round(data.progress * 100)); return; }
      const task = pending.current; if (!task || data.id !== task.id) return;
      clearTimeout(task.timer); pending.current = null;
      if (data.type === 'error') task.reject(new Error(safeErrorCode(data.code))); else task.resolve(data.result);
    };
    instance.onerror = event => { event.preventDefault(); if (worker.current !== instance) return; const code = ready.current ? 'MODEL_ERROR' : 'MODEL_STARTUP'; instance.terminate(); worker.current = null; ready.current = false; setLoaded(false); const task = pending.current; if (task) { clearTimeout(task.timer); pending.current = null; task.reject(new Error(code)); } };
    try { await request('load', { modelId }); ready.current = true; setLoaded(true); } catch (error) { instance.terminate(); if (worker.current === instance) { worker.current = null; ready.current = false; setLoaded(false); } throw error; }
  }
  async function plan(turns: Turn[]) {
    await prepare(); setPhase('thinking');
    const result = await request('plan', { turns, language }) as Plan;
    if (result.kind === 'clarify' && (asked.current.get(result.clarification) ?? 0) >= 2) { setPhase('idle'); setNotice('I still cannot work out which issue to research. You can describe it another way, in your own words.'); input.current?.focus(); return; }
    if (result.kind === 'research') {
      try { setQuery(safeQuery(result.query)); } catch { setQuery(''); }
      setPhase('review');
    } else {
      const questions = { none: 'What has happened so far, and what is the main difficulty?', canton: 'Which Swiss canton is this about?', date: 'When did this happen? Approximate dates are enough.', role: 'What is your role in this situation?', goal: 'What outcome are you hoping for?', facts: 'What has happened so far, and what is the main difficulty?' };
      const message = t(result.kind === 'outside' ? 'This tool helps with Swiss legal questions. What legal issue would you like to understand?' : asked.current.has(result.clarification) ? 'Who is involved, what did they do, and what would you like to change? No names are needed.' : questions[result.clarification]);
      if (result.kind === 'clarify') asked.current.set(result.clarification, (asked.current.get(result.clarification) ?? 0) + 1);
      context.current = [...turns, { role: 'assistant', content: message }];
      setMessages(previous => [...previous, { role: 'assistant', text: message }]); setPhase('idle'); input.current?.focus();
    }
  }
  function freeText(label = '') {
    if (cleaning.current) return;
    clear(); setGuided(false); setTopicContext(label);
    requestAnimationFrame(() => input.current?.focus());
  }
  function completeGuide(facts: GuideFacts) {
    if (cleaning.current) return;
    if (!recipeForFacts(facts)) { freeText(guideContext(facts)); return; }
    context.current = [{ role: 'user', content: guideContext(facts) }];
    setGuideFacts(facts); setPhase('review'); setNotice(''); setFailureCode('');
    requestAnimationFrame(() => document.getElementById('guide-review')?.focus({ preventScroll: true }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (cleaning.current || !draft.trim() || busy || supported === false) return;
    const text = draft.trim(); const turns: Turn[] = [...context.current, { role: 'user', content: topicContext ? `Selected topic: ${topicContext}\nMy question: ${text}` : text }];
    if (!contextWithinBounds(turns)) { setNotice('This conversation is full. Start a new question to keep the local context reliable.'); return; }
    setGuideFacts(null); setTopicContext(''); context.current = turns; setMessages(previous => [...previous, { role: 'user', text }]); setDraft(''); setNotice(''); setFailureCode(''); setCopyStatus(''); setQuery('');
    try { await plan(turns); } catch (error) { if ((error as Error).message === 'CANCELLED') return; showModelError(error); }
  }
  function showModelError(error: unknown) { const code = safeErrorCode(error instanceof Error ? error.message : 'MODEL_ERROR'); setFailureCode(code); setPhase('error'); setNotice(errorMessage(code)); }
  async function retry() { if (cleaning.current || busy) return; setNotice(''); setFailureCode(''); if (guidedRecipe) { setPhase('review'); return; } try { await plan(context.current); } catch (error) { if ((error as Error).message !== 'CANCELLED') { showModelError(error); } } }
  async function research(event: FormEvent) {
    event.preventDefault(); if (cleaning.current || busy || supported === false) return; let approved = '';
    const recipe = guidedRecipe;
    try { if (!recipe) approved = safeQuery(query); } catch { setNotice('Use a few legal terms, without names, numbers, links or contact details.'); return; }
    setNotice(''); setFailureCode(''); setPhase('searching'); const session = sessionEpoch.current;
    try {
      await prepare();
      if (session !== sessionEpoch.current) return;
      setPhase('searching');
      const sources = await new Promise<Source[]>((resolve, reject) => {
        const instance = new Worker(new URL('../lib/swisslaw-chat/research.worker.ts', import.meta.url), { type: 'module' }); searchWorker.current = instance;
        let finished = false; let selecting = false; let timer = setTimeout(() => finish(new Error('SEARCH_TIMEOUT')), 60000);
        const finish = (error?: Error, result?: Source[]) => { if (finished) return; finished = true; clearTimeout(timer); instance.terminate(); if (searchWorker.current === instance) { searchWorker.current = null; searchPending.current = null; } if (error) { if (selecting && error.message !== 'CANCELLED') stop(); reject(error); } else resolve(result ?? []); };
        searchPending.current = () => finish(new Error('CANCELLED'));
        instance.onerror = () => finish(new Error('SEARCH_ERROR'));
        instance.onmessage = async event => {
          if (finished || searchWorker.current !== instance) return;
          if (event.data.type === 'candidates') {
            try { selecting = true; clearTimeout(timer); const selected = await request('select', { turns: context.current, language, candidates: event.data.candidates }); selecting = false; if (!finished && searchWorker.current === instance) { timer = setTimeout(() => finish(new Error('SEARCH_TIMEOUT')), 60000); instance.postMessage({ selection: selected.ids }); } }
            catch (error) { selecting = false; finish(error as Error); }
          } else if (event.data.type === 'sources') finish(undefined, event.data.sources);
          else finish(new Error('SEARCH_ERROR'));
        };
        instance.postMessage(recipe ? { recipe } : { query: approved });
      });
      if (session !== sessionEpoch.current) return;
      if (!sources.length) { setPhase('review'); setNotice('I could not find suitable sources. Add a little more about what happened, then try again.'); return; }
      setPhase('answering');
      const result = resolveAnswer(await request('answer', { turns: context.current, language, sources, ...(recipe ? { recipe } : {}) }), sources);
      const resultText = result.status === 'insufficient' ? t('The local model could not give a reliable answer from these sources. You can read the original sources below or add a detail.') : result.answer.text;
      setMessages(previous => [...previous, ...(recipe && guideFacts ? [{ role: 'user' as const, text: [g('I want to leave my job'), g('Private employment law'), g(guideFacts.term === 'indefinite' ? 'No fixed end date' : guideFacts.term === 'fixed' ? 'A fixed end date' : 'I’m not sure'), ...(guideFacts.term === 'indefinite' ? [g(guideFacts.probation === 'yes' ? 'Still in probation' : guideFacts.probation === 'no' ? 'Probation has ended' : 'I’m not sure')] : [])].join(' · ') }] : []), { role: 'assistant', text: resultText, answer: result, sources }]);
      // Keep a short reference to the answer. Sources are always fetched again for a new question.
      context.current = [...context.current, { role: 'assistant', content: resultText.slice(0, 900) }];
      setPhase('idle'); setQuery(''); setGuideFacts(null); setGuided(false); input.current?.focus();
    } catch (error) { if ((error as Error).message === 'CANCELLED') return; const code = safeErrorCode((error as Error).message); setFailureCode(code); setPhase(ready.current ? 'review' : 'error'); setNotice(errorMessage(code)); }
  }
  async function copyResult(message: Extract<Exchange, { role: 'assistant' }>) {
    const a = message.answer; if (!a) return;
    const text = [t('Swisslaw · Research preview'), message.text, ...a.steps.map((s, i) => `${i + 1}. ${s.text}`), a.status === 'answer' ? a.uncertainty : '', t('Sources'), ...(message.sources ?? []).map(s => `${s.id}. ${s.title}\n${s.url}`), t('AI-generated guidance. Check important decisions and deadlines.'), new Date().toISOString().slice(0, 10)].filter(Boolean).join('\n\n');
    try { await navigator.clipboard.writeText(text); setCopyStatus('Copied'); } catch { setCopyStatus('Select the text to copy it.'); }
  }
  const downloadNote = t(modelId === MODEL_ID ? 'First use downloads about 1.1 GB of public model files. Use Wi-Fi. A compatible browser and enough device memory are required.' : 'First use downloads about 2.4 GB of public model files. Use Wi-Fi. The larger model needs more graphics memory and may be slower.');
  const modelChoice = <div className="chat-model-choice"><label htmlFor="local-model">{t('Local model')}</label><select id="local-model" value={modelId} disabled={busy} onChange={event => { if (!cleaning.current) setModelId(selectedModel(event.target.value).id); }}>{MODEL_OPTIONS.map(option => <option key={option.id} value={option.id}>{t(option.label)}</option>)}</select></div>;
  return <div className="sl-chat" lang={language}>
    <a className="chat-skip" href={guideVisible ? '#guide-start' : guideFacts ? '#guide-review' : '#question'}>{t('Go to your question')}</a>
    <header className="chat-header"><a className="chat-brand" href="/" aria-label="Swisslaw"><Plus aria-hidden="true" strokeWidth={1.4} />swisslaw<span>.</span></a><div className="chat-header-right"><select aria-label={t('Language')} value={language} disabled={busy} onChange={e => { setLanguage(e.target.value as Language); setCopyStatus(''); }}>{LANGUAGES.map(l => <option key={l.code} value={l.code} lang={l.code}>{l.label}</option>)}</select>{(messages.length > 0 || guideFacts || !guided) && <button className="chat-clear" onClick={clear} disabled={phase === 'cleaning'} title={t('Start again')}><RotateCcw size={15} aria-hidden="true" /><span>{t('Start again')}</span></button>}</div></header>
    <main className={`chat-main${messages.length ? ' chat-active' : ''}`}>
      {guideVisible ? <GuidedStart key={guideEpoch} language={language} onFreeText={freeText} onComplete={completeGuide} /> : <section className="chat-intro"><p className="chat-eyebrow">{t('SWISS LAW. OPEN TO EVERYONE.')}</p><h1>{guideFacts ? g('A little clearer already.') : t('What would you like to resolve?')}</h1><p>{guideFacts ? g('Your choices') : t('Ask a question about Swiss law. In your own words.')}</p></section>}
      {messages.length > 0 && <section className="chat-conversation" aria-label={t('Your conversation')}>{messages.map((message, index) => <article className={`chat-message chat-${message.role}`} key={index}><p className="chat-speaker">{t(message.role === 'user' ? 'You' : 'Swisslaw')}</p><p className="chat-message-text">{message.text}</p>{message.role === 'assistant' && message.answer && <>
        {message.answer.status === 'answer' && <Evidence sourceId={message.answer.answer.source} quote={message.answer.answer.quote} sources={message.sources ?? []} t={t} />}
        {message.answer.steps.length > 0 && <div className="chat-next"><h2>{t('What you can do next')}</h2><ol>{message.answer.steps.map((step, i) => <li key={i}><p>{step.text}</p><Evidence sourceId={step.source} quote={step.quote} sources={message.sources ?? []} t={t} /></li>)}</ol></div>}
        {message.answer.status === 'answer' && message.answer.uncertainty && <aside className="chat-uncertainty"><h3>{t('What still needs checking')}</h3><p>{message.answer.uncertainty}</p></aside>}
        {message.answer.status === 'insufficient' && <ul className="chat-found-sources">{message.sources?.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={12} aria-hidden="true" /></a></li>)}</ul>}
        <p className="chat-caveat">{t('AI-generated guidance. Check important decisions and deadlines.')}</p>
        <button className="chat-link-button" onClick={() => copyResult(message)}><Copy size={14} aria-hidden="true" />{t('Copy answer with sources')}</button>
      </>}</article>)}</section>}
      {guidedRecipe && guideFacts && <section className="chat-guided-review" id="guide-review" tabIndex={-1}><div className="chat-guide-summary"><span>{g('I want to leave my job')}</span><span>{g('Private employment law')}</span><span>{g(guideFacts.term === 'indefinite' ? 'No fixed end date' : guideFacts.term === 'fixed' ? 'A fixed end date' : 'I’m not sure')}</span>{guideFacts.term === 'indefinite' && <span>{g(guideFacts.probation === 'yes' ? 'Still in probation' : guideFacts.probation === 'no' ? 'Probation has ended' : 'I’m not sure')}</span>}</div><button className="chat-link-button" disabled={busy} onClick={clear}>{g('Change my choices')}</button><form className="chat-search-review" onSubmit={research}><h2>{g('Read the relevant provisions')}</h2><p>{g('These article references will be sent to OpenCaseLaw. They may reveal your legal issue and some of your choices. Your full conversation stays in this tab.')}</p><div className="chat-reference-list">{REFERENCE_RECIPES[guidedRecipe].map(article => <span key={article}>OR · Art. {article} <ArrowUpRight size={13} aria-hidden="true" /></span>)}</div><p className="chat-small">{g('The provisions are in German. The local model explains them in your selected language.')}</p>{!loaded && <>{modelChoice}<p className="chat-download-note">{downloadNote}</p></>}<button className="chat-primary" type="submit" disabled={busy || supported === false}>{busy ? t(phase === 'loading' ? 'Preparing the model on your device…' : 'Working through the sources…') : g('Explain these rules on my device')}<ArrowUpRight size={18} aria-hidden="true" /></button></form><p className="chat-small">{g('This path covers ordinary resignation. For immediate departure, an apprenticeship or another special arrangement, describe your situation instead.')}</p><button className="chat-link-button" disabled={busy} onClick={() => freeText(guideContext(guideFacts))}>{g('Describe my situation instead')}</button></section>}
      {phase === 'review' && !guidedRecipe && <form className="chat-search-review" onSubmit={research}><p className="chat-eyebrow">{t('BEFORE SEARCHING')}</p><h2>{t('Choose what leaves your device.')}</h2><p>{t('These search terms will be sent to OpenCaseLaw. The tool then requests relevant source passages. Your conversation stays on this device.')}</p><label htmlFor="public-query">{t('Public search terms')}</label><input id="public-query" value={query} maxLength={180} onChange={e => setQuery(e.target.value)} autoComplete="off" spellCheck={false} /><p className="chat-small">{t('OpenCaseLaw retains search terms and may process them with an external AI provider. Share only terms you are comfortable disclosing.')}</p><button className="chat-primary" type="submit" disabled={!query.trim()}>{t('Search OpenCaseLaw')}<ArrowUpRight size={18} aria-hidden="true" /></button></form>}
      {!guideVisible && !guideFacts && <form className="chat-composer" onSubmit={submit}>
        <label htmlFor="question" className="chat-field-label">{t(messages.length ? 'Add a detail or ask a follow-up' : 'Your question')}</label>
        <textarea id="question" ref={input} value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} maxLength={1200} rows={messages.length ? 3 : 4} placeholder={t('Tell us what happened and what you would like to know.')} autoComplete="off" spellCheck={false} />
        <div className="chat-composer-bottom"><span>{t('No names or identifying details needed.')}</span><button type="submit" disabled={!draft.trim() || busy || supported === false} aria-label={t(loaded ? 'Continue' : 'Prepare on this device')}><span>{t(loaded ? 'Continue' : 'Start')}</span><ArrowUp size={19} aria-hidden="true" /></button></div>
      </form>}
      {!guideVisible && messages.length === 0 && !guideFacts && <button className="chat-link-button" onClick={clear}>{g('Back to topics')}</button>}
      {!guideVisible && !guideFacts && messages.length === 0 && modelChoice}
      {!guideVisible && !guideFacts && !loaded && !busy && <p className="chat-download-note">{downloadNote}</p>}
      {busy && <div className="chat-status" role="status"><div><span className="chat-dot" aria-hidden="true" />{t(phase === 'cleaning' ? 'Removing saved model files…' : phase === 'loading' ? (preparationStep === 'prepare' ? 'Preparing the model. The download is complete…' : 'Preparing the model on your device…') : phase === 'searching' ? 'Reading public legal sources…' : phase === 'answering' ? 'Working through the sources…' : 'Understanding your question…')}{phase !== 'cleaning' && <button onClick={cancel} aria-label={t('Stop')}><X size={16} /></button>}</div>{phase === 'loading' && preparationStep === 'download' && <><progress value={progress} max={100} aria-label={t('Model download')} /><span className="chat-small">{progress}%</span></>}</div>}
      {!guideVisible && supported === false && <div className="chat-notice" role="status"><h2>{t('This browser cannot run the local model.')}</h2><p>{t('Try a recent browser on a device with WebGPU support. No question is sent to a cloud model as a fallback.')}</p><a href="https://opencaselaw.ch/" target="_blank" rel="noreferrer">{t('Explore OpenCaseLaw directly')}<ArrowUpRight size={14} aria-hidden="true" /></a></div>}
      {notice && <p className="chat-notice" role="status" data-status-reason={failureCode || undefined}>{t(notice)}{failureCode && <><br />{t('Your question has not been sent to a cloud model.')}<small className="chat-error-code">{t('Technical code')}: {failureCode}</small></>}{phase === 'error' && <button className="chat-link-button" onClick={retry}>{t('Try again')}</button>}</p>}
      {copyStatus && <p className="chat-small" role="status">{t(copyStatus)}</p>}
      <div className="chat-assurances"><span><LockKeyhole size={14} aria-hidden="true" />{t('Thinking stays on your device')}</span><span>{t('Free. No account.')}</span></div>
      <p className="chat-privacy-summary">{g('Your conversation stays in this tab. You approve search terms or public article references before they are sent to OpenCaseLaw.')}</p>
      <section className="chat-about">
        <details><summary>{t('How it works')}<Plus size={15} aria-hidden="true" /></summary><p>{g('Choose a topic or describe your situation. Guided choices work instantly on your device. You approve any public-source request before it is sent.')}</p><p>{g('The guided choices use local rules. No AI, account or download is needed until you ask for an explanation.')}</p><p>{t('You review the search terms before anything is sent to OpenCaseLaw. Answers link to the source passages they use.')}</p></details>
        <details className="chat-technology"><summary>{t('Model, sources and open code')}<Plus size={15} aria-hidden="true" /></summary><p><strong>{model.id}</strong><br />{t('The model runs in this browser through WebLLM 0.2.85 and WebGPU. It uses 4-bit weights. There is no cloud-model fallback.')}</p><p>{t('Choose the model before starting. Start again to change it.')}</p><p>{t('A larger model is not a guarantee of better legal advice. Both options are experimental.')}</p><p>{t('Model files come from Hugging Face; the WebAssembly runtime comes from MLC on GitHub. Both revisions are pinned in the source code.')}</p><a href={model.repository.replace('/resolve/', '/tree/')} target="_blank" rel="noreferrer">{t('Model details')}<ArrowUpRight size={13} aria-hidden="true" /></a><p>{t('Your browser connects directly to OpenCaseLaw over HTTPS using MCP (JSON-RPC, protocol 2025-03-26). There is no Swisslaw search proxy or API key.')}</p><p><code>{MCP_ENDPOINT}</code></p><p>{t('Only the search terms you approve and public source identifiers are sent. The available tools search legislation and decisions, then retrieve selected articles and judgment passages.')}</p><p><code>search_laws · search_decisions · get_law · get_erwaegung</code></p><p>{t('Open source · MIT licence')}</p><a href="https://github.com/jonashertner/swisslaw" target="_blank" rel="noreferrer">{t('Read the source code')}<ArrowUpRight size={13} aria-hidden="true" /></a></details>
        <details><summary>{t('What leaves my device?')}<Plus size={15} aria-hidden="true" /></summary><p>{t('Opening this site and downloading a model uses the internet. The site host and download providers receive ordinary connection details, including your IP address. OpenCaseLaw receives the search terms you approve and connection details. Your conversation is not sent to a cloud AI.')}</p><p>{t('Your conversation is kept in page memory, not saved as a history. Start again or close this tab to clear it. Downloaded model files may remain in browser storage. Use the removal control here, or clear this site’s data in your browser. Local processing reduces data exposure, but cannot guarantee absolute security on a shared or compromised device.')}</p><p>{t('OpenCaseLaw retains search terms and may process them with an external AI provider. Share only terms you are comfortable disclosing.')}</p><a href="https://opencaselaw.ch/datenschutz/" target="_blank" rel="noreferrer">{t('OpenCaseLaw privacy information')}<ArrowUpRight size={13} aria-hidden="true" /></a></details>
        <details><summary>{t('Data on this device')}<Plus size={15} aria-hidden="true" /></summary><p>{t('Start again clears this conversation. Downloaded model files stay in this browser so they can be reused.')}</p><button className="chat-link-button" onClick={clear} disabled={phase === 'cleaning'}>{t('Clear this conversation')}</button><button className="chat-link-button" disabled={phase === 'cleaning'} onClick={() => setConfirmRemoval(true)}>{t('Remove cached models from this browser')}</button>{confirmRemoval && <div className="chat-remove-confirm"><p>{t('This ends the conversation and removes Swisslaw’s saved model files for this site. Other browser data and copied answers are not removed.')}</p><div><button className="chat-link-button" onClick={removeModels}>{t('Remove model files')}</button><button className="chat-link-button" onClick={() => setConfirmRemoval(false)}>{t('Keep them')}</button></div></div>}</details>
        <details><summary>{t('What this preview can and cannot do')}<Plus size={15} aria-hidden="true" /></summary><p>{t('You can ask about any Swiss-law topic. This is an experimental tool, not a lawyer. Source links and exact quotations do not guarantee that an interpretation is correct or complete.')}</p><p>{t('Do not rely on this tool to calculate a deadline or handle an emergency. If the sources are insufficient, the tool should say so.')}</p><p>{t('The interface supports German, French, Italian, Romansh and English. Legal translations and the model’s language ability, especially Romansh, still need independent review.')}</p></details>
      </section>
      <footer className="chat-footer"><span>{t('Swisslaw · Research preview')}</span><a href="https://jonashertner.com" target="_blank" rel="noreferrer">Jonas Hertner <ArrowUpRight size={12} aria-hidden="true" /></a></footer>
    </main>
  </div>;
}
function Evidence({ sourceId, quote, sources, t }: { sourceId: string; quote: string; sources: Source[]; t: (value: string) => string }) {
  const source = sources.find(s => s.id === sourceId); if (!source) return null;
  return <details className="chat-evidence"><summary>{t('Source')} · {source.title}<ArrowUpRight size={12} aria-hidden="true" /></summary><blockquote>{quote}</blockquote><a href={source.url} target="_blank" rel="noreferrer">{t('Read the original')}<ArrowUpRight size={12} aria-hidden="true" /></a><span>{source.jurisdiction} · {source.date}</span></details>;
}
