'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { guideText, type Language } from '@/lib/swisslaw-chat/guide-translations';
import { practicalText } from '@/lib/swisslaw-chat/practical-translations';
import type { PracticalTopic } from '@/lib/swisslaw-chat/practical';
import type { GuideFacts } from '@/lib/swisslaw-chat/guide';
import './swisslaw-guide.css';

export type GuidedFacts = GuideFacts;

export type GuidedStartProps = {
  language: Language;
  onFreeText: (contextLabel?: string) => void;
  onComplete: (facts: GuidedFacts) => void;
  onPractical: (topic: PracticalTopic) => void;
  /** Optional host translation; unchanged keys fall back to this module. */
  t?: (key: string) => string;
};

type Stage = 'topics' | 'work' | 'family' | 'regime' | 'term' | 'probation';
const STAGES: Stage[] = ['topics', 'work', 'regime', 'term', 'probation'];
const TOPICS = ['Work', 'Home', 'Family', 'Money', 'Purchases', 'Something else'] as const;
const REGIME_LABELS = { private: 'Private employment law', public: 'Public employment law', unknown: 'I’m not sure' } as const;
const TERM_LABELS = { indefinite: 'No fixed end date', fixed: 'A fixed end date', unknown: 'I’m not sure' } as const;

function Arrow({ back = false }: { back?: boolean }) {
  return <svg className="sg-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={back ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'} /></svg>;
}

function Branches({ active, settled }: { active: number; settled: boolean }) {
  return <svg className={`sg-branches${settled ? ' sg-branches-settled' : ''}`} viewBox="0 0 280 104" fill="none" aria-hidden="true">
    <circle className="sg-origin-ring" cx="14" cy="52" r="10" />
    {[8, 25.6, 43.2, 60.8, 78.4, 96].map((y, i) => {
      const end = settled ? 52 : y;
      const selected = active === i || settled && i === 0;
      return <g key={i} className={`sg-branch${selected ? ' sg-branch-active' : ''}`} style={{ '--branch-order': i } as import('react').CSSProperties}>
        <path d={`M14 52H66C132 52 142 ${end} 204 ${end}H266`} pathLength="1" />
        <circle cx="266" cy={end} r={selected ? 3.5 : 2} />
      </g>;
    })}
    <circle className="sg-origin" cx="14" cy="52" r="3" />
  </svg>;
}

function Progress({ stage, label }: { stage: Stage; label: string }) {
  const index = STAGES.indexOf(stage);
  return <div className="sg-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={4} aria-valuenow={index}>
    <svg viewBox="0 0 200 16" fill="none" aria-hidden="true">
      <path className="sg-progress-track" d="M8 8H192" />
      <path className="sg-progress-done" d="M8 8H192" pathLength="4" strokeDasharray="4" strokeDashoffset={4 - index} />
      {[8, 54, 100, 146, 192].map((x, i) => <circle key={x} cx={x} cy="8" r={i === index ? 4 : 2.5} className={i <= index ? 'sg-node sg-node-done' : 'sg-node'} />)}
    </svg>
  </div>;
}

export default function GuidedStart({ language, onFreeText, onComplete, onPractical, t: hostText }: GuidedStartProps) {
  const [activeBranch, setActiveBranch] = useState(-1);
  const [stage, setStage] = useState<Stage>('topics');
  const [facts, setFacts] = useState<Partial<GuidedFacts>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
  const completed = useRef(false);
  const helpId = useId();
  const tr = (key: string) => { const supplied = hostText?.(key); return supplied && supplied !== key ? supplied : practicalText(guideText(key, language), language); };
  const position = STAGES.indexOf(stage);

  useEffect(() => {
    if (navigated.current) heading.current?.focus();
  }, [stage]);

  function move(next: Stage) { navigated.current = true; completed.current = false; setStage(next); }
  function backTo(next: Stage) {
    // Preserve the answer at the reopened question, clear every later answer.
    setFacts(previous => next === 'topics' || next === 'work' ? {}
      : next === 'regime' ? (previous.regime ? { regime: previous.regime } : {})
      : next === 'term' ? { ...(previous.regime ? { regime: previous.regime } : {}), ...(previous.term ? { term: previous.term } : {}) }
      : previous);
    move(next);
  }
  function freeText(label?: string) { onFreeText(label); }
  function chooseRegime(regime: GuidedFacts['regime']) {
    setFacts({ regime });
    if (regime !== 'private') {
      freeText(`${tr('Work')} · ${tr('I want to leave my job')} · ${tr('Employment rules')}: ${tr(REGIME_LABELS[regime])}`);
      return;
    }
    move('term');
  }
  function chooseTerm(term: GuidedFacts['term']) {
    if (facts.regime !== 'private') { backTo('regime'); return; }
    if (term !== 'indefinite') {
      if (completed.current) return;
      const confirmed: GuideFacts = { regime: 'private', term, probation: 'unknown' };
      setFacts(confirmed); completed.current = true; onComplete(confirmed);
      return;
    }
    setFacts({ regime: 'private', term }); move('probation');
  }
  function finish(probation: GuidedFacts['probation']) {
    if (completed.current) return;
    if (facts.regime !== 'private') { backTo('regime'); return; }
    if (!facts.term) { backTo('term'); return; }
    const confirmed = { regime: facts.regime, term: facts.term, probation };
    setFacts(confirmed); completed.current = true; onComplete(confirmed);
  }

  const title = stage === 'topics' ? 'What would you like to understand?'
    : stage === 'work' || stage === 'family' ? 'What would you like help with?'
    : stage === 'regime' ? 'Which rules apply to your employment?'
    : stage === 'term' ? 'Does your contract have a fixed end date?'
    : 'Are you still in a probation period?';
  const help = stage === 'topics' ? 'Start with a topic, or describe your question in your own words.'
    : stage === 'work' || stage === 'family' ? 'We can start with a few facts. You can always describe your situation instead.'
    : stage === 'regime' ? 'Check your contract or appointment documents. A public employer can also use a private-law contract.'
    : stage === 'term' ? 'You do not need to enter the date.'
    : 'Choose what your contract says. If you are unsure, that is useful to know too.';

  function option(key: string, onClick: () => void, detail?: string, selected = false) {
    return <button key={key} className={`sg-option${selected ? ' sg-selected' : ''}`} type="button" onClick={onClick} aria-pressed={selected}>
      <span className="sg-option-copy"><span>{tr(key)}</span>{detail && <small>{tr(detail)}</small>}</span>
      {selected ? <svg className="sg-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg> : <Arrow />}
    </button>;
  }

  return <section id="guide-start" className={`swisslaw-guide sg-stage-${stage}`} lang={language} aria-label={tr('Guided start')}>
    <div className="sg-toolbar">
      {stage === 'topics' ? <span className="sg-kicker">{tr('Swiss law')}</span> : <button type="button" className="sg-back" onClick={() => backTo(stage === 'family' ? 'topics' : STAGES[position - 1])}><Arrow back /><span>{tr('Back')}</span></button>}
      <div className="sg-path-view"><Branches active={activeBranch} settled={stage !== 'topics'} /><div className={stage === 'topics' ? 'sg-progress-hidden' : 'sg-progress-visible'}><Progress stage={stage === 'family' ? 'work' : stage} label={tr('Your progress')} /></div></div>
    </div>

    {position > 1 && <nav className="sg-trail" aria-label={tr('Your choices')}>
      <button type="button" onClick={() => backTo('topics')}>{tr('Work')}</button><span aria-hidden="true">/</span>
      <button type="button" onClick={() => backTo('work')}>{tr('Leaving my job')}</button>
      {position > 2 && facts.regime && <><span aria-hidden="true">/</span><button type="button" onClick={() => backTo('regime')}>{tr(REGIME_LABELS[facts.regime])}</button></>}
      {position > 3 && facts.term && <><span aria-hidden="true">/</span><button type="button" onClick={() => backTo('term')}>{tr(TERM_LABELS[facts.term])}</button></>}
    </nav>}

    <div className="sg-scene" key={stage}>
      <header className="sg-question-heading">
        <h1 ref={heading} tabIndex={-1}>{tr(title)}</h1>
        <p id={helpId}>{tr(help)}</p>
      </header>

      {stage === 'topics' ? <div className="sg-topic-grid" aria-describedby={helpId}>
        {TOPICS.map((topic, i) => <button type="button" className="sg-topic" key={topic} onPointerEnter={() => setActiveBranch(i)} onPointerLeave={() => setActiveBranch(-1)} onFocus={() => setActiveBranch(i)} onBlur={() => setActiveBranch(-1)} onClick={() => topic === 'Work' ? move('work') : topic === 'Family' ? move('family') : freeText(tr(topic))}>
          <span className="sg-topic-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><span className="sg-topic-label">{tr(topic)}</span><Arrow />
        </button>)}
      </div> : <div className="sg-options" aria-describedby={helpId}>
        {stage === 'work' && <>
          {option('I want to leave my job', () => { setFacts({}); move('regime'); })}
          {option('I have been dismissed', () => freeText(`${tr('Work')} · ${tr('I have been dismissed')}`))}
          {option('Extra working hours', () => onPractical('overtime'))}
          {option('Pay or another work issue', () => freeText(`${tr('Work')} · ${tr('Pay or working hours')}`))}
          {option('Something else about work', () => freeText(tr('Work')))}
        </>}
        {stage === 'family' && <>{option('Getting married', () => onPractical('marriage'))}{option('Another family question', () => freeText(tr('Family')))}</>}
        {stage === 'regime' && <>
          {option('Private employment law', () => chooseRegime('private'), 'The Code of Obligations (OR/CO).', facts.regime === 'private')}
          {option('Public employment law', () => chooseRegime('public'), 'For example, federal or cantonal personnel law.', facts.regime === 'public')}
          {option('I’m not sure', () => chooseRegime('unknown'), undefined, facts.regime === 'unknown')}
        </>}
        {stage === 'term' && <>
          {option('No fixed end date', () => chooseTerm('indefinite'), undefined, facts.term === 'indefinite')}
          {option('A fixed end date', () => chooseTerm('fixed'), undefined, facts.term === 'fixed')}
          {option('I’m not sure', () => chooseTerm('unknown'), undefined, facts.term === 'unknown')}
        </>}
        {stage === 'probation' && <>
          {option('Still in probation', () => finish('yes'), undefined, facts.probation === 'yes')}
          {option('Probation has ended', () => finish('no'), undefined, facts.probation === 'no')}
          {option('I’m not sure', () => finish('unknown'), undefined, facts.probation === 'unknown')}
        </>}
      </div>}

      <div className="sg-free-text">
        <button type="button" onClick={() => freeText(stage === 'topics' ? undefined : stage === 'family' ? tr('Family') : position > 1 ? `${tr('Work')} · ${tr('Leaving my job')}` : tr('Work'))}>
          <span>{tr(stage === 'topics' ? 'Write in your own words' : 'Describe your situation instead')}</span><Arrow />
        </button>
        {stage === 'regime' && <p>{tr('This path covers ordinary resignation. For immediate departure, an apprenticeship or another special arrangement, describe your situation instead.')}</p>}
      </div>
    </div>
  </section>;
}
