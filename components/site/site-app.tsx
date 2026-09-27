'use client';
import { lazy, Suspense, useEffect, useId, useMemo, useState } from 'react';
import '@fontsource-variable/atkinson-hyperlegible-next';
import '@fontsource-variable/source-serif-4';
import './site.css';
import { KNOWLEDGE_LANGUAGES, localText, type KnowledgeLanguage } from '@/lib/swisslaw-chat/knowledge';
import { AREAS, LETTERS, parseRoute, searchSituations, situationHash, type AreaId, type Route } from '@/lib/swisslaw-chat/site';
import { AREA_TEXT, LETTER_TEXT, SITE_TEXT, st, type SiteKey } from '@/lib/swisslaw-chat/site-i18n';
import { byId, CHANNEL, inArea, SITUATIONS } from '@/lib/swisslaw-chat/site-data';
import SituationPage from './site-situation';

const SwisslawChat = lazy(() => import('../swisslaw-chat'));

function initialLanguage(): KnowledgeLanguage {
  try { const saved = localStorage.getItem('swisslaw.lang'); if (saved && (KNOWLEDGE_LANGUAGES as readonly string[]).includes(saved)) return saved as KnowledgeLanguage; } catch { /* storage unavailable */ }
  for (const l of navigator.languages ?? []) { const code = l.slice(0, 2).toLowerCase(); if ((KNOWLEDGE_LANGUAGES as readonly string[]).includes(code)) return code as KnowledgeLanguage; }
  return 'de';
}

export default function SiteApp() {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [lang, setLang] = useState<KnowledgeLanguage>(initialLanguage);
  useEffect(() => {
    const onHash = () => { setRoute(parseRoute(location.hash)); window.scrollTo({ top: 0 }); };
    addEventListener('hashchange', onHash); return () => removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('swisslaw.lang', lang); } catch { /* storage unavailable */ }
  }, [lang]);
  const t = (k: SiteKey, v?: Record<string, string | number>) => st(k, lang, v);
  const titled = route.page === 'situation' ? byId.get(route.id) : undefined;
  useEffect(() => {
    const name = route.page === 'situation' && titled ? localText(titled.title, lang).text
      : route.page === 'area' ? AREA_TEXT[route.area][lang]
      : route.page === 'about' ? st('aboutTitle', lang) : '';
    document.title = name ? `${name} – swisslaw.io` : 'swisslaw.io';
  }, [route, lang, titled]);

  if (route.page === 'ask') {
    return (
      <>
        <div className="site ask-bar"><a href="#/" className="brand" aria-label="swisslaw.io"><span className="dot" aria-hidden="true" /><span>swisslaw<span className="brand-tld">.io</span></span></a><a href="#/">{t('navTopics')}</a></div>
        <Suspense fallback={null}><SwisslawChat /></Suspense>
      </>
    );
  }

  const situation = route.page === 'situation' ? byId.get(route.id) : undefined;
  return (
    <div className="site">
      <a className="skip" href="#main">{t('skip')}</a>
      <header className="bar">
        <a href="#/" className="brand" aria-label="swisslaw.io"><span className="dot" aria-hidden="true" /><span>swisslaw<span className="brand-tld">.io</span></span></a>
        <nav className="bar-nav" aria-label="swisslaw.io">
          <a href="#/frage">{t('navAsk')}</a>
          <a href="#/ueber">{t('navAbout')}</a>
          <label className="lang"><span className="visually-hidden">Sprache · Langue · Lingua · Lingua · Language</span>
            <select value={lang} onChange={e => setLang(e.target.value as KnowledgeLanguage)}>
              {KNOWLEDGE_LANGUAGES.map(l => <option key={l} value={l}>{SITE_TEXT.langName[l]}</option>)}
            </select>
          </label>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {route.page === 'home' && <Home lang={lang} />}
        {route.page === 'area' && <Area area={route.area} lang={lang} />}
        {route.page === 'about' && <About lang={lang} />}
        {route.page === 'situation' && (situation
          ? <SituationPage key={situation.id} situation={situation} initialFacts={route.facts} lang={lang} channel={CHANNEL} />
          : <Home lang={lang} />)}
      </main>
      <footer className="foot">
        <nav className="foot-nav" aria-label="swisslaw.io">
          <a href="#/">{t('home')}</a>
          <a href="#/frage">{t('navAsk')}</a>
          <a href="#/ueber">{t('navAbout')}</a>
        </nav>
        <p>{t('footerNotAdvice')}</p>
        <p>{t('footerOpen')} <a href="https://github.com/jonashertner/swisslaw" target="_blank" rel="noreferrer">GitHub</a> · <a href="https://jonashertner.com" target="_blank" rel="noreferrer">Jonas Hertner</a></p>
      </footer>
    </div>
  );
}

function Home({ lang }: { lang: KnowledgeLanguage }) {
  const [query, setQuery] = useState('');
  const id = useId();
  const t = (k: SiteKey, v?: Record<string, string | number>) => st(k, lang, v);
  const results = useMemo(() => searchSituations(query, SITUATIONS, lang), [query, lang]);
  const letters = LETTERS.filter(l => byId.has(l.situation));
  return (
    <>
      <div className="home-top">
      <section className="hero">
        <h1>{t('homeTitle')}</h1>
        <p className="hero-lead">{t('homeLead')}</p>
        <form className="search" role="search" onSubmit={e => { e.preventDefault(); if (results[0]) location.hash = situationHash(results[0].id); }}>
          <label htmlFor={`${id}-q`}>{t('searchLabel')}</label>
          <input id={`${id}-q`} type="search" value={query} placeholder={t('searchPlaceholder')} autoComplete="off" spellCheck onChange={e => setQuery(e.target.value)} />
        </form>
        {query.trim().length > 1 && (
          <div className="results" aria-live="polite">
            {results.length ? (
              <>
                <h2 className="visually-hidden">{t('searchResults')}</h2>
                <ul>{results.map(s => (
                  <li key={s.id}><a href={situationHash(s.id)}><strong>{localText(s.title, lang).text}</strong><span>{AREA_TEXT[s.domain]?.[lang]}</span></a></li>
                ))}</ul>
              </>
            ) : <p className="results-none">{t('searchNone')} <a href="#/frage">{t('navAsk')}</a></p>}
          </div>
        )}
      </section>

      {letters.length > 0 && (
        <section className="letters" aria-labelledby={`${id}-letters`}>
          <h2 id={`${id}-letters`}>{t('lettersTitle')}</h2>
          <p className="section-lead">{t('lettersLead')}</p>
          <table className="board">
            <thead><tr><th scope="col" className="visually-hidden">{t('lettersTitle')}</th><th scope="col">{t('deadlineColumn')}</th></tr></thead>
            <tbody>
              {letters.map(l => (
                <tr key={l.id}>
                  <th scope="row"><a href={situationHash(l.situation)}>{LETTER_TEXT[l.id].name[lang]}</a></th>
                  <td>{LETTER_TEXT[l.id].deadline[lang]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      </div>

      <section className="areas" aria-labelledby={`${id}-areas`}>
        <h2 id={`${id}-areas`}>{t('areasTitle')}</h2>
        <ul className="area-list">
          {AREAS.map(a => {
            const n = inArea(a).length;
            return (
              <li key={a} className={n ? '' : 'is-empty'}>
                {n ? <a href={`#/bereich/${a}`}><span className="area-name">{AREA_TEXT[a][lang]}</span><span className="area-count">{n === 1 ? t('guideCount') : t('guidesCount', { n })}</span></a>
                  : <span><span className="area-name">{AREA_TEXT[a][lang]}</span><span className="area-count">{t('inPreparation')}</span></span>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="how" aria-labelledby={`${id}-how`}>
        <h2 id={`${id}-how`}>{t('howTitle')}</h2>
        <ul>
          <li>{t('how1')}</li>
          <li>{t('how2')}</li>
          <li>{t('how3')}</li>
        </ul>
      </section>
    </>
  );
}

function Area({ area, lang }: { area: AreaId; lang: KnowledgeLanguage }) {
  const t = (k: SiteKey) => st(k, lang);
  const list = inArea(area);
  return (
    <section className="area-page">
      <nav className="crumbs" aria-label="Breadcrumb"><a href="#/">{t('home')}</a></nav>
      <h1>{AREA_TEXT[area][lang]}</h1>
      {list.length ? (
        <ul className="situation-list">
          {list.map(s => (
            <li key={s.id}>
              <a href={situationHash(s.id)}>
                <strong>{localText(s.title, lang).text}</strong>
                <span>{localText(s.summary, lang).text}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : <p className="section-lead">{t('inPreparation')}</p>}
    </section>
  );
}

function About({ lang }: { lang: KnowledgeLanguage }) {
  const t = (k: SiteKey) => st(k, lang);
  return (
    <section className="about">
      <h1>{t('aboutTitle')}</h1>
      <p>{t('aboutBody')}</p>
      <ul>
        <li>{t('how1')}</li>
        <li>{t('how2')}</li>
        <li>{t('how3')}</li>
      </ul>
      <p className="section-lead">{t('footerOpen')}</p>
    </section>
  );
}
