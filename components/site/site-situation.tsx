import { useEffect, useId, useState } from 'react';
import { applicableBlocks, localText, type KnowledgeLanguage, type Situation, type SituationFacts } from '@/lib/swisslaw-chat/knowledge';
import { BLOCK_ORDER, checkedFacts, situationHash, type Channel } from '@/lib/swisslaw-chat/site';
import { AREA_TEXT, st, type SiteKey } from '@/lib/swisslaw-chat/site-i18n';
import DeadlineCalculator, { formatDate } from './site-deadline';

type LText = Partial<Record<KnowledgeLanguage, string>> & { de: string };

function Txt({ value, lang, as: Tag = 'span', className }: { value: LText; lang: KnowledgeLanguage; as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'legend' | 'li'; className?: string }) {
  const { text, language } = localText(value, lang);
  return <Tag className={className} lang={language !== lang ? language : undefined}>{text}</Tag>;
}

export default function SituationPage({ situation: s, initialFacts, lang, channel }: { situation: Situation; initialFacts: SituationFacts; lang: KnowledgeLanguage; channel: Channel }) {
  const [facts, setFacts] = useState<SituationFacts>(() => checkedFacts(s, initialFacts));
  const [copied, setCopied] = useState(false);
  const id = useId();
  const t = (k: SiteKey, v?: Record<string, string | number>) => st(k, lang, v);

  // Keep answers in the URL fragment only (never sent to a server), so a person can bookmark or share them.
  useEffect(() => { history.replaceState(null, '', situationHash(s.id, facts)); }, [s.id, facts]);
  useEffect(() => { setFacts(checkedFacts(s, initialFacts)); }, [s.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  const blocks = applicableBlocks(s, facts);
  const deadlineRules = [...new Set(blocks.flatMap(b => b.deadline_rules ?? []))];
  const untranslated = lang !== 'de' && !s.title[lang];
  const citedSources = Object.entries(s.sources);
  const setFact = (key: string, value: string) => setFacts(f => ({ ...f, [key]: value }));
  const answered = Object.values(facts).some(v => v && v !== 'unknown');

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 4000); } catch { /* clipboard unavailable: the address bar still holds the link */ }
  };

  return (
    <article className="sit">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="#/">{t('home')}</a><span aria-hidden="true">/</span>
        <a href={`#/bereich/${s.domain}`}>{AREA_TEXT[s.domain]?.[lang] ?? s.domain}</a>
      </nav>
      <header className="sit-head">
        <Txt value={s.title} lang={lang} as="h1" className="sit-title" />
        <Txt value={s.summary} lang={lang} as="p" className="sit-lead" />
        {s.status !== 'public' && <p className="review-banner" role="note">{t('draftBanner')}</p>}
        {s.status === 'public' && s.review.reviewed_by && s.review.reviewed_at && (
          <p className="reviewed">{t('reviewedBy', { who: s.review.reviewed_by, date: formatDate(s.review.reviewed_at, lang, false) })}</p>
        )}
        {untranslated && <p className="fallback-note">{t('untranslated')}</p>}
      </header>

      <div className="sit-grid">
        {deadlineRules.length > 0 && (
          <aside className="sit-aside">
            <DeadlineCalculator key={deadlineRules.join()} ruleIds={deadlineRules} lang={lang} channel={channel} />
          </aside>
        )}

        <div className="sit-main">
          {s.facts.length > 0 && (
            <section className="facts" aria-labelledby={`${id}-facts`}>
              <div className="facts-head">
                <h2 id={`${id}-facts`}>{t('yourSituation')}</h2>
                {answered && <button type="button" className="text-button" onClick={() => setFacts({})}>{t('clearAnswers')}</button>}
              </div>
              <p className="facts-lead">{t('yourSituationLead')}</p>
              {s.facts.map(f => (
                <fieldset key={f.key} className="fact">
                  <Txt value={f.question} lang={lang} as="legend" />
                  {f.help && <Txt value={f.help} lang={lang} as="p" className="fact-help" />}
                  <div className="fact-options">
                    {f.options.map(o => (
                      <label key={o.value} className="choice">
                        <input type="radio" name={`${id}-${f.key}`} value={o.value}
                          checked={(facts[f.key] ?? 'unknown') === o.value} onChange={() => setFact(f.key, o.value)} />
                        <Txt value={o.label} lang={lang} />
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </section>
          )}

          <div className="guidance">
            {BLOCK_ORDER.map(kind => {
              const list = blocks.filter(b => b.kind === kind);
              if (!list.length) return null;
              const Items = kind === 'step' && list.length > 1 ? 'ol' : 'ul';
              return (
                <section key={kind} className={`g g-${kind}`} aria-labelledby={`${id}-${kind}`}>
                  <h2 id={`${id}-${kind}`}>{t(`sec_${kind}` as SiteKey)}</h2>
                  <Items className="g-list">
                    {list.map(b => (
                      <li key={b.id}>
                        <Txt value={b.text} lang={lang} as="p" />
                        {b.sources && b.sources.length > 0 && (
                          <p className="g-refs">{b.sources.map((src, i) => {
                            const ref = s.sources[src];
                            const label = ref.type === 'statute' ? ref.label : `${ref.citation}${ref.e ? `, E. ${ref.e}` : ''}`;
                            return <span key={src}>{i > 0 && ', '}<a href={ref.url} target="_blank" rel="noreferrer">{label}</a></span>;
                          })}</p>
                        )}
                      </li>
                    ))}
                  </Items>
                </section>
              );
            })}
          </div>

          <details className="scope">
            <summary>{t('covers')}</summary>
            <Txt value={s.scope.covers} lang={lang} as="p" />
            <h3>{t('excludes')}</h3>
            <Txt value={s.scope.excludes} lang={lang} as="p" />
          </details>

          <section className="sources" aria-labelledby={`${id}-src`}>
            <h2 id={`${id}-src`}>{t('sources')}</h2>
            <p className="sources-lead">{t('sourcesLead', { date: formatDate(s.version, lang, false) })}</p>
            <ul>
              {citedSources.map(([key, ref]) => (
                <li key={key}>
                  <a href={ref.url} target="_blank" rel="noreferrer">
                    {ref.type === 'statute' ? ref.label : `${ref.citation}${ref.e ? `, E. ${ref.e}` : ''}`}
                  </a>
                </li>
              ))}
            </ul>
            {s.official_links.length > 0 && (
              <>
                <h3>{t('officialInfo')}</h3>
                <ul>{s.official_links.map(l => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer"><Txt value={l.label} lang={lang} /></a></li>)}</ul>
              </>
            )}
          </section>

          <div className="sit-actions">
            <button type="button" className="text-button" onClick={copyLink}>{t('copyLink')}</button>
            <button type="button" className="text-button" onClick={() => window.print()}>{t('print')}</button>
            <p className="sit-actions-status" aria-live="polite">{copied ? t('copied') : ''}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
