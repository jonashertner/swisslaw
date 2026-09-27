'use client';
import { useEffect, useId, useMemo, useState } from 'react';
import '@fontsource-variable/source-serif-4/opsz.css';
import '@fontsource-variable/source-sans-3';
import './site.css';
import { KNOWLEDGE_LANGUAGES, localText, type KnowledgeLanguage, type Situation } from '@/lib/swisslaw-chat/knowledge';
import { AREAS, LETTERS, parseRoute, searchSituations, situationHash, type AreaId, type Route } from '@/lib/swisslaw-chat/site';
import { AREA_TEXT, LETTER_TEXT, st, type SiteKey } from '@/lib/swisslaw-chat/site-i18n';
import { byId, CHANNEL, inArea, SITUATIONS } from '@/lib/swisslaw-chat/site-data';
import SituationPage from './site-situation';

const DEADLINE_BY_SITUATION = new Map(LETTERS.map(l => [l.situation, l.id]));

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
  const situation = route.page === 'situation' ? byId.get(route.id) : undefined;
  useEffect(() => {
    const name = situation ? localText(situation.title, lang).text
      : route.page === 'area' ? AREA_TEXT[route.area][lang]
      : route.page === 'about' ? st('aboutTitle', lang) : '';
    document.title = name ? `${name} – swisslaw.io` : 'swisslaw.io';
  }, [route, lang, situation]);

  const top = (
    <header className="top">
      <a href="#/" className="mark">swisslaw.io</a>
      <nav className="langs" aria-label="Sprache / Langue / Lingua / Lingua / Language">
        {KNOWLEDGE_LANGUAGES.map(l => (
          <button key={l} type="button" lang={l} aria-pressed={l === lang} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
        ))}
      </nav>
    </header>
  );

  return (
    <div className="site">
      <a className="skip" href="#main">{t('skip')}</a>
      {top}
      <main id="main" tabIndex={-1}>
        {(route.page === 'home' || route.page === 'ask') && <Index lang={lang} />}
        {route.page === 'area' && <Index lang={lang} only={route.area} />}
        {route.page === 'about' && <About lang={lang} />}
        {route.page === 'situation' && (situation
          ? <SituationPage key={situation.id} situation={situation} initialFacts={route.facts} lang={lang} channel={CHANNEL} />
          : <Index lang={lang} />)}
      </main>
      <footer className="foot">
        <nav aria-label="swisslaw.io">
          <a href="#/">{t('overview')}</a>
          <a href="#/ueber">{t('navAbout')}</a>
        </nav>
        <p>{t('footerNotAdvice')} {t('footerOpen')}</p>
      </footer>
    </div>
  );
}

function Entry({ s, lang }: { s: Situation; lang: KnowledgeLanguage }) {
  const letter = DEADLINE_BY_SITUATION.get(s.id);
  return (
    <li>
      <a href={situationHash(s.id)}>
        <span className="entry-title">{localText(s.title, lang).text}</span>
        {letter && <span className="entry-due">{LETTER_TEXT[letter].deadline[lang]}</span>}
      </a>
    </li>
  );
}

function Index({ lang, only }: { lang: KnowledgeLanguage; only?: AreaId }) {
  const [query, setQuery] = useState('');
  const id = useId();
  const t = (k: SiteKey, v?: Record<string, string | number>) => st(k, lang, v);
  const results = useMemo(() => searchSituations(query, SITUATIONS, lang, 12), [query, lang]);
  const searching = query.trim().length > 1;
  const areas = (only ? [only] : AREAS).filter(a => inArea(a).length);
  const preparing = only ? [] : AREAS.filter(a => !inArea(a).length);
  return (
    <>
      <section className="lead-in">
        {only ? <h1>{AREA_TEXT[only][lang]}</h1> : <h1 className="intro">{t('intro')}</h1>}
        {!only && (
          <form className="search" role="search" onSubmit={e => { e.preventDefault(); if (results[0]) location.hash = situationHash(results[0].id); }}>
            <label htmlFor={`${id}-q`} className="visually-hidden">{t('searchLabel')}</label>
            <input id={`${id}-q`} type="search" value={query} placeholder={t('searchLabel')} autoComplete="off" spellCheck onChange={e => setQuery(e.target.value)} />
          </form>
        )}
      </section>

      {searching ? (
        <section className="group" aria-live="polite">
          <h2 className="group-name">{t('searchResults')}</h2>
          {results.length ? <ul className="entries">{results.map(s => <Entry key={s.id} s={s} lang={lang} />)}</ul>
            : <p className="none">{t('searchNone')}</p>}
        </section>
      ) : (
        <>
          {areas.map(a => (
            <section key={a} className="group" aria-labelledby={`${id}-${a}`}>
              <h2 id={`${id}-${a}`} className="group-name">{only ? <a href="#/">{t('overview')}</a> : <a href={`#/bereich/${a}`}>{AREA_TEXT[a][lang]}</a>}</h2>
              <ul className="entries">{inArea(a).map(s => <Entry key={s.id} s={s} lang={lang} />)}</ul>
            </section>
          ))}
          {preparing.length > 0 && <p className="preparing">{t('preparing', { x: preparing.map(a => AREA_TEXT[a][lang]).join(', ') })}</p>}
        </>
      )}
    </>
  );
}

function About({ lang }: { lang: KnowledgeLanguage }) {
  const t = (k: SiteKey) => st(k, lang);
  return (
    <section className="about">
      <h1>{t('aboutTitle')}</h1>
      <p>{t('aboutBody')}</p>
      <p>{t('how1')}</p>
      <p>{t('how2')}</p>
      <p>{t('how3')}</p>
    </section>
  );
}
