import { useEffect, useId, useMemo, useState } from 'react';
import { applicableBlocks, localText, type KnowledgeLanguage, type Situation, type SituationFacts } from '@/lib/swisslaw-chat/knowledge';
import { BLOCK_ORDER, checkedFacts, situationHash, type Channel } from '@/lib/swisslaw-chat/site';
import { AREA_TEXT, st, type SiteKey } from '@/lib/swisslaw-chat/site-i18n';
import { computeFromInput, DeadlineAnswer, DeadlineFields, EMPTY_DEADLINE_INPUT, formatDate, type DeadlineInput } from './site-deadline';

type LText = Partial<Record<KnowledgeLanguage, string>> & { de: string };
function Txt({ value, lang, as: Tag = 'span', className }: { value: LText; lang: KnowledgeLanguage; as?: 'span' | 'p' | 'h1' | 'legend'; className?: string }) {
  const { text, language } = localText(value, lang);
  return <Tag className={className} lang={language !== lang ? language : undefined}>{text}</Tag>;
}

export default function SituationPage({ situation: s, initialFacts, lang, channel }: { situation: Situation; initialFacts: SituationFacts; lang: KnowledgeLanguage; channel: Channel }) {
  const [facts, setFacts] = useState<SituationFacts>(() => checkedFacts(s, initialFacts));
  const [deadline, setDeadline] = useState<DeadlineInput>(EMPTY_DEADLINE_INPUT);
  const [copied, setCopied] = useState(false);
  const id = useId();
  const t = (k: SiteKey, v?: Record<string, string | number>) => st(k, lang, v);

  // Answers live in the URL fragment only (never sent to a server), so the page can be bookmarked or shared. Dates are not.
  useEffect(() => { history.replaceState(null, '', situationHash(s.id, facts)); }, [s.id, facts]);

  const blocks = applicableBlocks(s, facts);
  const ruleId = blocks.flatMap(b => b.deadline_rules ?? [])[0];
  const computed = useMemo(() => (ruleId ? computeFromInput(ruleId, deadline, channel) : null), [ruleId, deadline, channel]);
  const answered = Object.values(facts).some(v => v && v !== 'unknown');
  const refLabel = (key: string) => { const r = s.sources[key]; return r.type === 'statute' ? r.label : `${r.citation}${r.e ? `, E. ${r.e}` : ''}`; };
  const refs = (keys?: string[]) => keys?.length ? (
    <p className="refs">{keys.map((k, i) => <span key={k}>{i > 0 && ', '}<a href={s.sources[k].url} target="_blank" rel="noreferrer">{refLabel(k)}</a></span>)}</p>
  ) : null;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 4000); } catch { /* the address bar still holds the link */ }
  };

  return (
    <article className="doc">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="#/">{t('overview')}</a><span aria-hidden="true">/</span>
        <a href={`#/bereich/${s.domain}`}>{AREA_TEXT[s.domain]?.[lang] ?? s.domain}</a>
      </nav>
      <header className="doc-head">
        <Txt value={s.title} lang={lang} as="h1" />
        <Txt value={s.summary} lang={lang} as="p" className="doc-lead" />
        {s.status !== 'public' && <p className="doc-meta">{t('draftShort')}</p>}
        {s.status === 'public' && s.review.reviewed_by && s.review.reviewed_at && (
          <p className="doc-meta is-reviewed">{t('reviewedBy', { who: s.review.reviewed_by, date: formatDate(s.review.reviewed_at, lang, false) })}</p>
        )}
        {lang !== 'de' && !s.title[lang] && <p className="doc-meta">{t('untranslated')}</p>}
      </header>

      <div className="doc-grid">
        <aside className="inputs" aria-labelledby={`${id}-in`}>
          <div className="inputs-head">
            <h2 id={`${id}-in`}>{t('yourAnswers')}</h2>
            {answered && <button type="button" className="quiet" onClick={() => setFacts({})}>{t('clearAnswers')}</button>}
          </div>
          <p className="inputs-lead">{t('yourAnswersLead')}</p>
          {ruleId && <DeadlineFields ruleId={ruleId} value={deadline} onChange={setDeadline} lang={lang} idBase={id} />}
          {s.facts.map(f => (
            <fieldset key={f.key} className="q">
              <Txt value={f.question} lang={lang} as="legend" />
              {f.help && <Txt value={f.help} lang={lang} as="p" className="q-help" />}
              {f.options.map(o => (
                <label key={o.value} className="opt">
                  <input type="radio" name={`${id}-${f.key}`} value={o.value} checked={(facts[f.key] ?? 'unknown') === o.value}
                    onChange={() => setFacts(v => ({ ...v, [f.key]: o.value }))} />
                  <Txt value={o.label} lang={lang} />
                </label>
              ))}
            </fieldset>
          ))}
        </aside>

        <div className="answer">
          {BLOCK_ORDER.map(kind => {
            const list = blocks.filter(b => b.kind === kind);
            if (!list.length) return null;
            return (
              <section key={kind} className={`row row-${kind}`} aria-labelledby={`${id}-${kind}`}>
                <h2 id={`${id}-${kind}`} className="row-label">{t(`lbl_${kind}` as SiteKey)}</h2>
                <div className="row-body">
                  {kind === 'deadline' && ruleId && <DeadlineAnswer computed={computed} ruleId={ruleId} lang={lang} />}
                  {kind === 'step' && list.length > 1 ? (
                    <ol className="steps">{list.map(b => <li key={b.id}><Txt value={b.text} lang={lang} as="p" />{refs(b.sources)}</li>)}</ol>
                  ) : list.map(b => <div key={b.id} className="para"><Txt value={b.text} lang={lang} as="p" />{refs(b.sources)}</div>)}
                </div>
              </section>
            );
          })}

          <section className="row row-scope" aria-labelledby={`${id}-scope`}>
            <h2 id={`${id}-scope`} className="row-label">{t('lbl_scope')}</h2>
            <div className="row-body">
              <div className="para"><Txt value={s.scope.covers} lang={lang} as="p" /></div>
              <div className="para muted"><p>{t('excludes')}: {localText(s.scope.excludes, lang).text}</p></div>
            </div>
          </section>

          <section className="row row-sources" aria-labelledby={`${id}-src`}>
            <h2 id={`${id}-src`} className="row-label">{t('lbl_sources')}</h2>
            <div className="row-body">
              <p className="source-list">{Object.keys(s.sources).map((k, i) => <span key={k}>{i > 0 && ', '}<a href={s.sources[k].url} target="_blank" rel="noreferrer">{refLabel(k)}</a></span>)}</p>
              {s.official_links.map(l => <p key={l.url} className="source-link"><a href={l.url} target="_blank" rel="noreferrer"><Txt value={l.label} lang={lang} /></a></p>)}
              <p className="checked">{t('checkedAsOf', { date: formatDate(s.version, lang, false) })}</p>
            </div>
          </section>

          <div className="doc-actions">
            <button type="button" className="quiet" onClick={copyLink}>{t('copyLink')}</button>
            <button type="button" className="quiet" onClick={() => window.print()}>{t('print')}</button>
            <span aria-live="polite">{copied ? t('copied') : ''}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
