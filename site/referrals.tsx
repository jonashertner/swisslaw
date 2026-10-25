// All directory content is rendered at build time. Browser filtering needs no catalog download.
import type { KnowledgeLanguage } from '../lib/swisslaw-chat/knowledge';
import { CANTONS, CANTON_NAMES, REFERRALS, REFERRAL_TOPICS, isReviewDue, referralPath, type Referral, type ReferralTopic } from '../lib/swisslaw-chat/referrals';
import { rt, REFERRAL_TOPIC_TEXT, type ReferralKey } from '../lib/swisslaw-chat/referrals-i18n';

function Arrow() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function Plus() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>; }
export function ReferralLink({lang,topic='general'}:{lang:KnowledgeLanguage;topic?:ReferralTopic}) {
  return <a className="referral-cta" href={referralPath(lang,topic)}><span><strong>{rt('nav',lang)}</strong><span>{rt('homeLead',lang)}</span></span><Arrow/></a>;
}
function Card({r,lang}:{r:Referral;lang:KnowledgeLanguage}) {
  const t = (key:ReferralKey)=>rt(key,lang);
  const copy=r.copy[lang];
  const costs={free:'freeBadge',conditional:'conditionalBadge',paid:'paidBadge',unknown:'unknownBadge'} as const;
  const date=new Intl.DateTimeFormat({de:'de-CH',fr:'fr-CH',it:'it-CH',rm:'rm-CH',en:'en-GB'}[lang],{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${r.verifiedAt}T12:00:00Z`)).replace(/ /g,'\u00a0');
  return <li className="referral-card" data-referral data-id={r.id} data-reviewed={r.verifiedAt} data-name={r.name} data-topics={r.topics.join(' ')} data-cantons={r.cantons.join(' ')} data-kind={r.kind} data-cost={r.cost} data-free-initial={String(r.freeInitial)} data-specific={String(r.specificAudience)}>
    <div className="referral-meta"><span>{t(r.kind)}</span><span>{r.cantons.includes('CH')?t('nationwide'):r.cantons.join(' · ')}</span></div>
    <h3><a href={r.url} target="_blank" rel="noreferrer">{r.name}<Arrow/></a></h3>
    <p className="referral-description">{copy.description}</p>
    <p className="referral-access"><strong>{t('access')}: </strong>{copy.access}</p>
    <p className="referral-cost"><span className={`referral-badge ${r.cost==='free'?'is-free':''}`}>{t(costs[r.cost])}</span>{copy.costNote}</p>
    {copy.privacyNote&&<p className="referral-access">{copy.privacyNote}{r.privacyUrl&&<> <a href={r.privacyUrl} target="_blank" rel="noreferrer">{t('privacy')}</a></>}</p>}
    <div className="referral-card-bottom"><a className="referral-visit" href={r.url} target="_blank" rel="noreferrer">{t(r.kind==='directory'?'visitDirectory':'visit')}<Arrow/></a>
      <details className="referral-source"><summary>{t('source')}</summary><p>{t('checked')} <time dateTime={r.verifiedAt}>{date}</time>.</p><p data-referral-stale hidden={!isReviewDue(r.verifiedAt)}>{t('due')}</p><a href={r.sourceUrl} target="_blank" rel="noreferrer">{new URL(r.sourceUrl).hostname}<Arrow/></a></details>
    </div>
  </li>;
}
export function ReferralsBody({lang}:{lang:KnowledgeLanguage}) {
  const t=(key:ReferralKey)=>rt(key,lang);
  const sorted=[...REFERRALS].sort((a,b)=>a.name.localeCompare(b.name,'de'));
  const cards=(items:Referral[])=>items.map(r=><Card key={r.id} r={r} lang={lang}/>);
  return <div className="referrals" data-referrals data-count-one={t('resultOne')} data-count-many={t('resultCount')}>
    <nav className="crumbs" aria-label={t('back')}><a href={`/${lang}/`}>{t('back')}</a></nav>
    <header className="referral-head"><p className="referral-eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1><p className="referral-lead">{t('lead')}</p></header>
    <div className="referral-layout">
      <aside className="referral-sidebar">
        <form className="referral-filters" data-referral-filters hidden>
          <label htmlFor="referral-topic">{t('topic')}</label>
          <select id="referral-topic" name="topic">{REFERRAL_TOPICS.map(v=><option key={v} value={v}>{REFERRAL_TOPIC_TEXT[v][lang]}</option>)}</select>
          <label htmlFor="referral-canton">{t('canton')}</label>
          <select id="referral-canton" name="canton"><option value="">{t('allCantons')}</option>{CANTONS.map(c=><option key={c} value={c}>{CANTON_NAMES[c]}</option>)}</select>
          <label className="referral-check"><input type="checkbox" name="freeOnly" aria-describedby="referral-cost-help"/><span>{t('free')}</span></label>
          <p id="referral-cost-help" className="referral-fine">{t('freeHelp')}</p>
          <button className="referral-text-button" type="button" data-referral-reset>{t('reset')}</button>
          <p className="referral-private">{t('local')}</p>
        </form>
        <details className="referral-urgent" data-referral-urgent><summary>{t('urgent')}<Plus/></summary><p>{t('urgentText')}</p><p>{t('emergency')}</p><div className="referral-numbers"><a href="tel:117">117</a><a href="tel:144">144</a></div><p>{t('victim')}</p><a href="tel:142">142<Arrow/></a><a className="referral-fine" href="https://www.opferhilfe-schweiz.ch/de/wo-finde-ich-hilfe/" target="_blank" rel="noreferrer">{t('source')}<Arrow/></a></details>
      </aside>
      <div className="referral-results">
        <div className="referral-result-heading"><h2>{t('results')}</h2><p role="status" aria-live="polite" aria-atomic="true" data-referral-count hidden/></div>
        <div className="referral-empty" data-referral-empty hidden><p>{t('empty')}</p><button className="referral-text-button" type="button" data-referral-general>{t('general')}</button><button className="referral-text-button" type="button" data-referral-paid hidden>{t('includePaid')}</button></div>
        <section data-referral-group="direct"><ul className="referral-list" data-referral-list="direct">{cards(sorted.filter(r=>r.kind!=='directory'&&r.kind!=='ai'&&!r.specificAudience))}</ul><button className="referral-more" type="button" data-referral-more hidden>{t('more')}<span data-referral-remaining/><Plus/></button></section>
        <section className="referral-networks" data-referral-group="networks"><h2>{t('networks')}</h2><p className="referral-fine">{t('networksLead')}</p><ul className="referral-list" data-referral-list="networks">{cards(sorted.filter(r=>r.kind==='directory'&&!r.specificAudience))}</ul></section>
        <details className="referral-fallback" data-referral-group="specific" open><summary><span>{t('specific')} <span data-referral-group-count/></span><Plus/></summary><p className="referral-fine">{t('specificLead')}</p><ul className="referral-list" data-referral-list="specific">{cards(sorted.filter(r=>r.specificAudience&&r.kind!=='ai'))}</ul></details>
        <details className="referral-fallback" data-referral-group="fallback" hidden><summary><span>{t('generalFallback')} <span data-referral-group-count/></span><Plus/></summary><p className="referral-fine">{t('generalFallbackLead')}</p><ul className="referral-list" data-referral-list="fallback"/><button className="referral-text-button" type="button" data-referral-general>{t('general')}<Arrow/></button></details>
        <section className="referral-networks" data-referral-group="ai"><h2>{t('aiHeading')}</h2><p className="referral-fine">{t('aiLead')}</p><ul className="referral-list" data-referral-list="ai">{cards(sorted.filter(r=>r.kind==='ai'))}</ul></section>
        <p className="referral-language">{t('language')}</p>
      </div>
    </div>
    <section className="referral-preparation"><h2>{t('prepare')}</h2><ol>{(['prepare1','prepare2','prepare3'] as const).map((key,i)=><li key={key}><span aria-hidden="true">0{i+1}</span><p>{t(key)}</p></li>)}</ol></section>
    <details className="referral-method"><summary>{t('criteria')}<Plus/></summary><p>{t('criteriaText')}</p><p>{t('limits')}</p><p>{t('external')}</p><a href="https://github.com/jonashertner/swisslaw/issues/new?title=Beratungsstellen%3A%20Erg%C3%A4nzung%20oder%20Korrektur" target="_blank" rel="noreferrer">{t('correct')}<Arrow/></a><p className="referral-fine">{t('noPrivate')}</p></details>
  </div>;
}
