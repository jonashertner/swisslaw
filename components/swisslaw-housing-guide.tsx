'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Copy, Plus } from 'lucide-react';
import { EMPTY_HOUSING_FACTS, HOUSING_TITLES, housingGuide, housingQuestions, type HousingFacts, type HousingTopic } from '@/lib/swisslaw-chat/housing';
import { PRACTICAL_REFERENCES } from '@/lib/swisslaw-chat/practical-manifest';
import { housingText } from '@/lib/swisslaw-chat/housing-translations';
import type { Language } from '@/lib/swisslaw-chat/policy';
import type { GuideParagraph } from '@/lib/swisslaw-chat/practical-content';
import { usePreparedSources } from './use-prepared-sources';
import './swisslaw-practical-guide.css';
import './swisslaw-housing-guide.css';

export default function HousingGuide({topic,language,onDismiss}:{topic:HousingTopic;language:Language;onDismiss:()=>void}) {
  const [facts,setFacts] = useState<HousingFacts>({...EMPTY_HOUSING_FACTS});
  const [step,setStep] = useState(0);
  const [copied,setCopied] = useState(false);
  const sources = usePreparedSources(topic);
  const heading = useRef<HTMLHeadingElement>(null);
  const h = (key:string) => housingText(key,language);
  const questions = housingQuestions(topic); const question = questions[step];
  const guide = housingGuide(topic,facts);
  const answer = sources.status === 'ready' && sources.packet !== null;
  useEffect(()=>{heading.current?.focus({preventScroll:true});},[step,answer]);
  useEffect(()=>{setCopied(false);},[language]);
  function change(index:number) {sources.reset();setCopied(false);setStep(index);}
  function choose(value:string) {sources.reset();setCopied(false);setFacts(f=>({...f,[question.key]:value}));setStep(step+1);if(step+1===questions.length)void sources.load();}
  function paragraph(item:GuideParagraph,index:number) {
    return <div key={index}><p>{h(item.text)}</p>{item.refs && <div className="sp-citations">{item.refs.map(id=>{const source=sources.packet?.sources.find(s=>s.id===id);return source?<a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={12} aria-hidden="true"/></a>:null;})}</div>}</div>;
  }
  const checkedAt = sources.packet ? new Date(sources.packet.checkedAt).toISOString().slice(0,10) : '';
  async function copy() {
    const text=[h(HOUSING_TITLES[topic]),h('Prepared guidance'),...questions.map(q=>`${h(q.title)}: ${h(q.options.find(([value])=>value===facts[q.key])![1])}`),h(guide.intro),...guide.steps.map((s,i)=>`${i+1}. ${h(s.text)}`),h(guide.check),...guide.rules.map(s=>h(s.text)),...(sources.packet?.sources??[]).map(s=>`${s.title}\n${s.url}`),`${h('These provisions were checked against this guide’s reference text on')} ${checkedAt}`,h('A matching text is not a guarantee that every applicable rule has been covered. Translations need independent review.')].join('\n\n');
    try {await navigator.clipboard.writeText(text);setCopied(true);}catch {setCopied(false);}
  }
  return <section className="sp-guide sh-guide" id="practical-guide" aria-busy={sources.status==='reading'}>
    <div className="sh-topline"><span>{h(HOUSING_TITLES[topic])}</span><span>{h('Prepared guidance')}</span></div>
    {!answer && <div className="sh-progress" role="progressbar" aria-label={h('Question')} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={step}><span style={{width:`${step/questions.length*100}%`}}/></div>}
    {!answer && <p className="sh-local">{h('No account. No model download. Your choices stay in this tab.')}</p>}
    {(topic==='rent-increase'||topic==='tenancy-end'&&(facts.exit==='received'||facts.exit==='unknown')) && !answer && <aside className="sh-timing">{h('A notice can carry a short deadline. Keep the letter and its envelope. If timing is uncertain, contact the tenancy authority promptly.')}</aside>}
    {question && !answer ? <div className="sh-scene" key={step}>
      <p className="chat-eyebrow">{h('Question')} {step+1} {h('of')} {questions.length}</p>
      <h1 tabIndex={-1} ref={heading}>{h(question.title)}</h1>
      {question.help && <p className="sp-help">{h(question.help)}</p>}
      <div className="sg-options">{question.options.map(([value,label])=><button className="sg-option" type="button" key={value} onClick={()=>choose(value)}><span>{h(label)}</span><ArrowUpRight size={18} aria-hidden="true"/></button>)}</div>
    </div> : <>
      <header className="sp-heading"><p className="chat-eyebrow">{h(answer?'Your next steps':'A few facts. A useful next step.')}</p><h1 tabIndex={-1} ref={heading}>{h(HOUSING_TITLES[topic])}</h1></header>
      <div className="sh-facts" aria-label={h('Your choices')}>{questions.map((q,i)=><button type="button" key={q.key} onClick={()=>change(i)} disabled={sources.status==='reading'}><span>{h(q.options.find(([value])=>value===facts[q.key])![1])}</span><span className="sh-change">{h('Change')}</span></button>)}</div>
      {answer ? <div className="sp-answer">
        <p className="sp-lead">{h(guide.intro)}</p><ol className="sp-steps">{guide.steps.map((s,i)=><li key={i}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{paragraph(s,i)}</li>)}</ol>
        <aside className="sp-check"><h2>{h('What still needs checking')}</h2><p>{h(guide.check)}</p></aside>
        {guide.rules.length>0 && <details className="sp-rules"><summary>{h('The rules behind this guide')}<Plus size={16} aria-hidden="true"/></summary>{guide.rules.map(paragraph)}</details>}
        <details className="sp-rules"><summary>{h('Read the complete provisions')}<Plus size={16} aria-hidden="true"/></summary>{sources.packet!.sources.map(s=><div key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={13}/></a><blockquote lang="de">{s.text}</blockquote></div>)}</details>
        <p className="chat-small sh-source-date">{h('These provisions were checked against this guide’s reference text on')} {checkedAt}. {h('A matching text is not a guarantee that every applicable rule has been covered. Translations need independent review.')}</p>
        <button type="button" className="chat-primary" onClick={copy}>{copied?<Check size={17}/>:<Copy size={17}/>} {h(copied?'Copied':'Copy my steps and sources')}</button>
      </div> : <div className="sp-approval">
        <p>{h('Only these public article references go to OpenCaseLaw. They can reveal the topic. Your question and choices stay in this tab.')}</p>
        <div className="chat-reference-list">{PRACTICAL_REFERENCES[topic].map(ref=><a key={ref.url} href={ref.url} target="_blank" rel="noreferrer">{ref.label}</a>)}</div>
        <button type="button" className="chat-primary" disabled={sources.status==='reading'} onClick={()=>void sources.load()}>{h(sources.status==='reading'?'Checking the public provisions…':sources.status==='error'?'Try again':'Check sources and show my steps')}<ArrowUpRight size={18}/></button>
        {sources.status==='reading' && <div className="sp-reading" role="status"><span className="sp-reading-line" aria-hidden="true"/>{h('Checking the public provisions…')}<button type="button" onClick={sources.reset}>{h('Stop')}</button></div>}
        {sources.status==='error' && <p className="chat-notice" role="status">{h('The sources could not be checked. Read the official provisions or contact the tenancy authority; do not wait here if a deadline may be running.')}</p>}
      </div>}
    </>}
    <div className="sp-actions">
      {step>0 && !answer && <button type="button" className="chat-link-button" onClick={()=>change(step-1)}><ArrowLeft size={14}/> {h('Back')}</button>}
      <a href={guide.official} target="_blank" rel="noreferrer">{h('Official tenancy information')}<ArrowUpRight size={14}/></a>
      <button type="button" className="chat-link-button" onClick={()=>{sources.reset();onDismiss();}}>{h('Describe something else')}</button>
    </div>
  </section>;
}
