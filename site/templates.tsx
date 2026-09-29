// Static page templates. Rendered to HTML at build time (renderToStaticMarkup); no React runs in the browser.
import type { ReactNode } from 'react';
import { applicableBlocks, localText, type KnowledgeLanguage, type Situation } from '../lib/swisslaw-chat/knowledge';
import { BLOCK_ORDER, byImportance, LETTERS, sourceLabel, sourceUrl, unreviewedTranslation, type AreaId } from '../lib/swisslaw-chat/site';
import { AREA_TEXT, LETTER_TEXT, SITE_TEXT, st, type SiteKey } from '../lib/swisslaw-chat/site-i18n';
import { CANTONS, DEADLINE_RULES } from '../lib/swisslaw-chat/deadlines';
import { LATER, WAVE_1, WAVE_2, WAVE_3, type CoverageGroup } from '../lib/swisslaw-chat/coverage';
import { formatDate } from './format';

export const REPO = 'https://github.com/jonashertner/swisslaw';
export const OCL = 'https://opencaselaw.ch';
export const issueUrl = (template: 'correction' | 'topic', title: string) => `${REPO}/issues/new?template=${template}.md&title=${encodeURIComponent(title)}`;
export const LANGS: readonly KnowledgeLanguage[] = ['de', 'fr', 'it', 'rm', 'en'];
export const LANG_NAMES: Record<KnowledgeLanguage, string> = { de: 'Deutsch', fr: 'Français', it: 'Italiano', rm: 'Rumantsch', en: 'English' };
const LANG_LABEL: Record<KnowledgeLanguage, string> = { de: 'Sprache', fr: 'Langue', it: 'Lingua', rm: 'Lingua', en: 'Language' };
export type Ctx = { lang: KnowledgeLanguage; review: boolean };
export const t = (ctx: Ctx, k: SiteKey, v?: Record<string, string | number>) => st(k, ctx.lang, v);

export const paths = {
  home: (l: KnowledgeLanguage) => `/${l}/`,
  area: (l: KnowledgeLanguage, a: string) => `/${l}/${a}/`,
  situation: (l: KnowledgeLanguage, id: string) => { const [a, ...rest] = id.split('.'); return `/${l}/${a}/${rest.join('.')}/`; },
  about: (l: KnowledgeLanguage) => `/${l}/about/`,
  topics: (l: KnowledgeLanguage) => `/${l}/topics/`,
  thanks: (l: KnowledgeLanguage) => `/${l}/thanks/`,
};
const DEADLINE_LABEL = new Map(LETTERS.map(l => [l.situation, l.id]));

type LText = Partial<Record<KnowledgeLanguage, string>> & { de: string };
function Txt({ value, ctx, as: Tag = 'span', className }: { value: LText; ctx: Ctx; as?: 'span' | 'p' | 'h1' | 'legend'; className?: string }) {
  const { text, language } = localText(value, ctx.lang);
  return <Tag className={className} lang={language !== ctx.lang ? language : undefined}>{text}</Tag>;
}

export function Top({ ctx, alt }: { ctx: Ctx; alt: (l: KnowledgeLanguage) => string }) {
  return (
    <header className="top">
      <a href={paths.home(ctx.lang)} className="mark">swisslaw<span>.io</span></a>
      <nav className="primary" aria-label="swisslaw.io">
        <a href={paths.topics(ctx.lang)}>{t(ctx, 'navTopics')}</a>
        <a href={paths.about(ctx.lang)}>{t(ctx, 'navAbout')}</a>
      </nav>
      <nav className="langs" aria-label={LANG_LABEL[ctx.lang]}>
        <ul>
          {LANGS.map(l => (
            <li key={l}>
              <a href={alt(l)} hrefLang={l} lang={l} aria-current={l === ctx.lang ? 'true' : undefined} title={LANG_NAMES[l]}>{l.toUpperCase()}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function Foot({ ctx }: { ctx: Ctx }) {
  return (
    <footer className="foot">
      <div className="foot-brand">
        <a href={paths.home(ctx.lang)} className="mark">swisslaw<span>.io</span></a>
        <p>{t(ctx, 'mission')} {t(ctx, 'poweredBy')} <a href={OCL}>OpenCaseLaw</a>.</p>
      </div>
      <ul className="foot-links">
        <li><a href={paths.topics(ctx.lang)}>{t(ctx, 'navTopics')}</a></li>
        <li><a href={paths.about(ctx.lang)}>{t(ctx, 'navAbout')}</a></li>
        <li><a href="/data/">{t(ctx, 'openData')}</a></li>
        <li><a href={REPO}>GitHub</a></li>
        <li><a href={`${REPO}/issues/new/choose`}>{t(ctx, 'contribute')}</a></li>
      </ul>
      <div className="foot-fine">
        <p>{t(ctx, 'footerNotAdvice')} {t(ctx, 'footerOpen')}</p>
        <p className="foot-credit">{t(ctx, 'sponsoredBy')} <a href="https://jonashertner.com">jonashertner.com</a></p>
      </div>
    </footer>
  );
}

function Entry({ s, ctx }: { s: Situation; ctx: Ctx }) {
  const letter = DEADLINE_LABEL.get(s.id);
  const title = localText(s.title, ctx.lang);
  return (
    <li>
      <a href={paths.situation(ctx.lang, s.id)}>
        <span className="entry-title" lang={title.language !== ctx.lang ? title.language : undefined}>{title.text}</span>
        {letter && <span className="entry-due">{LETTER_TEXT[letter].deadline[ctx.lang]}</span>}
      </a>
    </li>
  );
}

// Short lay wording from the situation's own examples, used as search suggestions.
function exampleQuery(s: Situation, lang: KnowledgeLanguage): { text: string; lang: KnowledgeLanguage } {
  const list = s.examples[lang]?.length ? s.examples[lang]! : s.examples.de;
  const l = s.examples[lang]?.length ? lang : 'de';
  return { text: list[0], lang: l };
}

export function IndexBody({ ctx, groups, examples }: { ctx: Ctx; groups: { area: AreaId; items: Situation[] }[]; examples: Situation[] }) {
  return (
    <>
      <section className="hero">
        <h1 className="hero-title">{t(ctx, 'intro')}</h1>
        <p className="hero-sub">{t(ctx, 'heroSub')}</p>
        <form className="search" role="search" action={paths.home(ctx.lang)} data-search hidden>
          <label htmlFor="q" className="visually-hidden">{t(ctx, 'searchLabel')}</label>
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <input id="q" name="q" type="search" placeholder={t(ctx, 'searchLabel')} autoComplete="off" spellCheck enterKeyHint="search" />
          </div>
          {examples.length > 0 && (
            <div className="try">
              <span className="try-label">{t(ctx, 'tryExamples')}</span>
              <ul>{examples.map(s => { const q = exampleQuery(s, ctx.lang); return (
                <li key={s.id}><button type="button" className="chip" data-q={q.text} lang={q.lang !== ctx.lang ? q.lang : undefined}>{q.text}</button></li>
              ); })}</ul>
            </div>
          )}
        </form>
      </section>
      <section className="results" id="results" aria-live="polite" hidden>
        <h2 className="section-label">{t(ctx, 'searchResults')}</h2>
        <ul className="entries" /><p className="none" hidden>{t(ctx, 'searchNone')} <a href="#submit">{t(ctx, 'submitTitle')}</a></p>
      </section>
      <div id="index">
        <div className="areas">
          {groups.map(g => (
            <section key={g.area} className="area" aria-labelledby={`g-${g.area}`}>
              <h2 id={`g-${g.area}`} className="area-name"><a href={paths.area(ctx.lang, g.area)}>{AREA_TEXT[g.area][ctx.lang]}</a></h2>
              <ul className="entries">{g.items.map(s => <Entry key={s.id} s={s} ctx={ctx} />)}</ul>
            </section>
          ))}
        </div>
        <p className="index-more"><a href={paths.topics(ctx.lang)}>{t(ctx, 'allTopics')}</a></p>
      </div>
      <SubmitSection ctx={ctx} />
    </>
  );
}

// Live means public. Topic names only, never draft text.
export function TopicsBody({ ctx, live }: { ctx: Ctx; live: Situation[] }) {
  const liveIds = new Set(live.map(s => s.id));
  const drafted = [...WAVE_1, ...WAVE_2, ...WAVE_3];
  const next = drafted.map(g => ({ ...g, topics: g.topics.filter(x => !liveIds.has(x.id!)) })).filter(g => g.topics.length);
  const liveGroups = drafted.map(g => ({ area: g.area, items: live.filter(s => g.topics.some(x => x.id === s.id)) })).filter(g => g.items.length);
  const cards = (groups: readonly CoverageGroup[]) => (
    <div className="topic-grid">
      {groups.map(g => (
        <section key={g.area} className="topic-card">
          <h3>{(g.label ?? AREA_TEXT[g.area])[ctx.lang]}</h3>
          <ul>{g.topics.map(x => <li key={x.id ?? x.title.de}>{x.title[ctx.lang]}</li>)}</ul>
        </section>
      ))}
    </div>
  );
  return (
    <div className="topics">
      <header className="page-head"><h1 className="page-title">{t(ctx, 'coverageTitle')}</h1></header>
      <section className="topics-part" aria-labelledby="t-live">
        <h2 id="t-live" className="section-label">{t(ctx, 'coverageLive')} <span className="count">{live.length}</span></h2>
        {liveGroups.length ? (
          <div className="areas">
            {liveGroups.map(g => (
              <section key={g.area} className="area">
                <h3 className="area-name"><a href={paths.area(ctx.lang, g.area)}>{AREA_TEXT[g.area][ctx.lang]}</a></h3>
                <ul className="entries">{g.items.map(s => <Entry key={s.id} s={s} ctx={ctx} />)}</ul>
              </section>
            ))}
          </div>
        ) : <p className="none">{t(ctx, 'coverageLiveNone')}</p>}
      </section>
      {next.length > 0 && (
        <section className="topics-part" aria-labelledby="t-next">
          <h2 id="t-next" className="section-label">{t(ctx, 'coverageNext')} <span className="count">{next.reduce((n, g) => n + g.topics.length, 0)}</span></h2>
          {cards(next)}
        </section>
      )}
      <section className="topics-part" aria-labelledby="t-later">
        <h2 id="t-later" className="section-label">{t(ctx, 'coveragePlanned')} <span className="count">{LATER.reduce((n, g) => n + g.topics.length, 0)}</span></h2>
        {cards(LATER)}
      </section>
    </div>
  );
}

export function SubmitSection({ ctx }: { ctx: Ctx }) {
  return (
    <section className="submit" id="submit" aria-labelledby="submit-h">
      <h2 id="submit-h" className="submit-title">{t(ctx, 'submitTitle')}</h2>
      <form className="submit-form" method="post" action="/api/questions" data-submit>
        <p className="submit-lead">{t(ctx, 'submitLead')}</p>
        <input type="hidden" name="lang" value={ctx.lang} />
        <label className="field-block"><span>{t(ctx, 'submitQuestion')}</span>
          <textarea name="question" rows={5} minLength={20} maxLength={2000} required />
        </label>
        <div className="submit-preview" data-preview hidden>
          <p>{t(ctx, 'submitPreview')}</p>
          <blockquote />
        </div>
        <div className="submit-row">
          <label className="field-block"><span>{t(ctx, 'submitCanton')}</span>
            <select name="canton" defaultValue=""><option value="">–</option>{CANTONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </label>
          <label className="field-block"><span>{t(ctx, 'submitEmail')}</span><input type="email" name="email" autoComplete="email" maxLength={200} /></label>
        </div>
        <div className="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="opt consent"><input type="checkbox" name="consent" value="yes" required /><span>{t(ctx, 'submitConsent')}</span></label>
        <div className="submit-actions">
          <button type="submit" className="button">{t(ctx, 'submitSend')}</button>
          <p className="submit-status" role="status" data-submit-status />
        </div>
      </form>
    </section>
  );
}

export function ThanksBody({ ctx }: { ctx: Ctx }) {
  return (
    <section className="about">
      <h1 className="page-title">{t(ctx, 'submitThanks')}</h1>
      <p><a href={paths.home(ctx.lang)}>{t(ctx, 'overview')}</a></p>
    </section>
  );
}

export function AreaBody({ ctx, area, items }: { ctx: Ctx; area: AreaId; items: Situation[] }) {
  return (
    <>
      <nav className="crumbs" aria-label={t(ctx, 'overview')}><a href={paths.home(ctx.lang)}>{t(ctx, 'overview')}</a></nav>
      <header className="page-head"><h1 className="page-title">{AREA_TEXT[area][ctx.lang]}</h1></header>
      <ul className="entries entries-page">{[...items].sort(byImportance).map(s => <Entry key={s.id} s={s} ctx={ctx} />)}</ul>
    </>
  );
}

export function AboutBody({ ctx }: { ctx: Ctx }) {
  return (
    <section className="about">
      <h1 className="page-title">{t(ctx, 'aboutTitle')}</h1>
      {(['aboutBody', 'how1', 'how2', 'how3'] as const).map(k => <p key={k}>{t(ctx, k)}</p>)}
      <p>{(SITE_TEXT.aboutSources[ctx.lang] || SITE_TEXT.aboutSources.de).split('{ocl}').flatMap((part, i) => i ? [<a key={i} href={OCL}>OpenCaseLaw</a>, part] : [part])}</p>
    </section>
  );
}

type Provisions = Record<string, { sha256: string; url: string; body: string }>;
type SourceRef = Situation['sources'][string];
// German statute text, checked against the guide's hash. French and Italian readers keep the link to their own official text.
const provisionFor = (r: SourceRef, ctx: Ctx, provisions: Provisions) => {
  if (r.type !== 'statute' || ctx.lang === 'fr' || ctx.lang === 'it') return undefined;
  const p = provisions[`${r.sr}:${r.article}`];
  return p && p.sha256 === r.sha256 ? p : undefined;
};
const popId = (k: string) => `p-${k}`;

// A citation opens the provision's text in place when the text is available; otherwise, and without scripts, it links to the source.
function Refs({ s, keys, ctx, provisions }: { s: Situation; keys?: string[]; ctx: Ctx; provisions: Provisions }) {
  if (!keys?.length) return null;
  return (
    <p className="refs">{keys.map(k => { const r = s.sources[k]; const p = provisionFor(r, ctx, provisions); return (
      <a key={k} className="ref" href={sourceUrl(r, ctx.lang)} data-pop={p ? popId(k) : undefined}>{sourceLabel(r, ctx.lang)}</a>
    ); })}</p>
  );
}

function Provision({ id, r, p, ctx, s }: { id: string; r: SourceRef; p: Provisions[string]; ctx: Ctx; s: Situation }) {
  // The first line is the article's heading when it is short and not a numbered paragraph; the texts are not uniform.
  const lines = p.body.replace(/[ \t]+([.,;:)])/g, '$1').split('\n').filter(Boolean);
  const heading = lines.length > 1 && lines[0].length < 90 && !/^\d+[a-z]*\s/.test(lines[0]) && !/[.:;]$/.test(lines[0]) ? lines[0] : '';
  const body = heading ? lines.slice(1) : lines;
  return (
    <div className="prov" id={popId(id)} popover="auto" role="dialog" aria-labelledby={`${popId(id)}-h`}>
      <div className="prov-head">
        <p className="prov-label" id={`${popId(id)}-h`}>{sourceLabel(r, ctx.lang)}</p>
        <button type="button" className="prov-close" popoverTarget={popId(id)} popoverTargetAction="hide" aria-label={t(ctx, 'close')}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div lang="de">
        {heading && <p className="prov-title">{heading}</p>}
        <div className="prov-text">{body.map((line, i) => { const m = /^(\d+[a-z]*)\s(.*)$/s.exec(line); return <p key={i}>{m ? <><sup>{m[1]}</sup>{m[2]}</> : line}</p>; })}</div>
      </div>
      <p className="prov-foot">
        {ctx.lang !== 'de' && <>{t(ctx, 'germanText')} · </>}
        <a href={p.url}>{t(ctx, 'onFedlex')}</a> · {t(ctx, 'checkedAsOf', { date: formatDate(s.version, ctx.lang, false) })}
      </p>
    </div>
  );
}

const KIND_ICON: Partial<Record<string, ReactNode>> = {
  warning: <path d="M12 4 2.8 19.5h18.4L12 4Zm0 6v4.5m0 2.6v.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  step: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  rule: <path d="M14.5 5.5c-.6-1-1.6-1.5-2.7-1.5-1.7 0-3 1-3 2.5 0 3.5 6.9 2.7 6.9 6.3 0 1.1-.7 2-1.8 2.4M9.5 18.5c.6 1 1.6 1.5 2.7 1.5 1.7 0 3-1 3-2.5 0-3.5-6.9-2.7-6.9-6.3 0-1.1.7-2 1.8-2.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
  cost: <><rect x="2.8" y="6.5" width="18.4" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M6 9.5v5m12-5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
  escalate: <path d="M4.5 18.5v-.8c0-2.6 2.1-4.7 4.7-4.7h1.6c2.6 0 4.7 2.1 4.7 4.7v.8M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5-5.5a3 3 0 0 1 0 5.4m2 3.3c1.5.6 2.5 2 2.5 3.8v.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
  'free-help': <path d="M12 20s-7.5-4.3-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.7-7.5 10-7.5 10Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  scope: <><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 11v5.5m0-8.6v.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  sources: <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v14H6.5A1.5 1.5 0 0 0 5 19.5v-14Zm0 14A1.5 1.5 0 0 0 6.5 21H18v-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
};
const Icon = ({ kind }: { kind: string }) => KIND_ICON[kind] ? <svg className="sec-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">{KIND_ICON[kind]}</svg> : null;

// Statutes grouped by act, decisions last.
function groupSources(s: Situation, ctx: Ctx) {
  const groups = new Map<string, { key: string; r: SourceRef; label: string }[]>();
  for (const [key, r] of Object.entries(s.sources)) {
    const label = sourceLabel(r, ctx.lang);
    const m = r.type === 'statute' ? /^(.+?) · (?:Art|art)\. (.+)$/.exec(label) : null;
    const act = m ? m[1] : t(ctx, 'decisions');
    if (!groups.has(act)) groups.set(act, []);
    groups.get(act)!.push({ key, r, label: m ? `${ctx.lang === 'fr' || ctx.lang === 'it' ? 'art.' : 'Art.'} ${m[2]}` : label });
  }
  const decisions = t(ctx, 'decisions');
  const article = (label: string) => label.replace(/^(Art|art)\. /, '');
  for (const [act, items] of groups) if (act !== decisions) items.sort((a, b) => article(a.label).localeCompare(article(b.label), 'en', { numeric: true }));
  return [...groups.entries()].sort(([a], [b]) => (a === decisions ? 1 : 0) - (b === decisions ? 1 : 0));
}

export function SituationBody({ ctx, s, provisions = {} }: { ctx: Ctx; s: Situation; provisions?: Provisions }) {
  const visible = new Set(applicableBlocks(s, {}).map(b => b.id));
  const deadlineRules = [...new Set(s.blocks.flatMap(b => b.deadline_rules ?? []))].filter(r => DEADLINE_RULES.has(r));
  const hasDeadline = deadlineRules.length > 0;
  const whenAttr = (w?: Record<string, string[]>) => (w ? JSON.stringify(w) : undefined);
  const eventRule = deadlineRules.map(r => DEADLINE_RULES.get(r)!).find(r => r.receipt_doctrine === 'event');
  const eventKey = eventRule ? `ev_${eventRule.id}` : '';
  const deadlineBlocks = s.blocks.filter(b => b.kind === 'deadline');
  const kinds = BLOCK_ORDER.filter(k => k !== 'deadline' && s.blocks.some(b => b.kind === k));
  const kindVisible = (k: string) => s.blocks.some(b => b.kind === k && visible.has(b.id));
  const helpLinks = kinds.includes('free-help') ? s.official_links : [];
  const R = (keys?: string[]) => <Refs s={s} keys={keys} ctx={ctx} provisions={provisions} />;
  const withText = Object.entries(s.sources).flatMap(([k, r]) => { const p = provisionFor(r, ctx, provisions); return p ? [{ k, r, p }] : []; });
  const factCount = s.facts.length;
  return (
    <article className="doc">
      <nav className="crumbs" aria-label={t(ctx, 'overview')}>
        <a href={paths.home(ctx.lang)}>{t(ctx, 'overview')}</a><span aria-hidden="true">/</span>
        <a href={paths.area(ctx.lang, s.domain)}>{AREA_TEXT[s.domain]?.[ctx.lang] ?? s.domain}</a>
      </nav>
      <header className="doc-head">
        <Txt value={s.title} ctx={ctx} as="h1" />
        <Txt value={s.summary} ctx={ctx} as="p" className="doc-lead" />
        {s.status !== 'public' && <p className="doc-meta">{t(ctx, 'draftShort')}</p>}
        {ctx.lang !== 'de' && !s.title[ctx.lang] && <p className="doc-meta">{t(ctx, 'untranslated')}</p>}
        {unreviewedTranslation(s, ctx.lang) && <p className="doc-meta">{t(ctx, 'unreviewedTranslation')}</p>}
      </header>

      <section className="print-answers" data-print-answers aria-hidden="true" />
      {/* The tool: the deadline first, then the questions that shape the rest of the page. */}
      <div className={`doc-top${deadlineBlocks.length ? '' : ' doc-top-single'}`}>
        {deadlineBlocks.length > 0 && (
          <section className="row row-deadline due-card" id="r-deadline" aria-labelledby="h-deadline" hidden={!kindVisible('deadline')} data-row>
            <h2 id="h-deadline" className="card-h">
              <svg className="sec-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="13" r="7.8" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M12 9v4.2l2.6 1.6M9.5 3h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              {t(ctx, 'lbl_deadline')}
            </h2>
            {hasDeadline && (
              <fieldset className="due-inputs" data-deadline>
                <legend>{eventRule ? (eventKey in SITE_TEXT ? t(ctx, eventKey as SiteKey) : t(ctx, 'd_event')) : t(ctx, 'whenReceived')}</legend>
                {!eventRule && (
                  <div className="seg">
                    {(['personal', 'registered', 'ordinary'] as const).map(m => (
                      <label key={m} className="seg-opt"><input type="radio" name="method" value={m} form="answers" defaultChecked={m === 'personal'} /><span>{t(ctx, `mm_${m}` as SiteKey)}</span></label>
                    ))}
                  </div>
                )}
                <div className="due-fields">
                  <label className="field" data-for="single"><span>{eventRule ? t(ctx, 'd_event') : t(ctx, 'dd_received')}</span><input type="date" name="date" form="answers" max="2100-12-31" /></label>
                  <label className="field" data-for="registered" hidden><span>{t(ctx, 'dd_notice')}</span><input type="date" name="notice" form="answers" max="2100-12-31" /></label>
                  <label className="field" data-for="registered" hidden><span>{t(ctx, 'dd_collected')}</span><input type="date" name="collected" form="answers" max="2100-12-31" /></label>
                  <label className="field field-canton"><span>{t(ctx, 'cantonOptional')}</span>
                    <select name="canton" form="answers" defaultValue=""><option value="">–</option>{CANTONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </label>
                </div>
              </fieldset>
            )}
            {hasDeadline && <div className="due" id="due" aria-live="polite" data-rules={JSON.stringify(deadlineRules)} hidden><p className="due-prompt">{t(ctx, 'enterDate')}</p></div>}
            <div className="due-text">
              {deadlineBlocks.map(b => (
                <div key={b.id} className="para" data-when={whenAttr(b.when)} hidden={!visible.has(b.id)} data-rules={b.deadline_rules ? JSON.stringify(b.deadline_rules) : undefined}>
                  <Txt value={b.text} ctx={ctx} as="p" />{R(b.sources)}
                </div>
              ))}
            </div>
          </section>
        )}

        <form className="inputs" id="answers" aria-labelledby="in-h" hidden>
          <div className="inputs-head">
            <h2 id="in-h">{t(ctx, 'yourAnswers')}</h2>
            <p className="inputs-count" data-count data-total={factCount} aria-live="polite">{t(ctx, 'answeredOf', { n: 0, total: factCount })}</p>
          </div>
          <p className="inputs-lead">{t(ctx, 'yourAnswersLead')}</p>
          <div className="qs">
            {s.facts.map(f => (
              <details key={f.key} className="q" data-fact={f.key}>
                <summary>
                  <Txt value={f.question} ctx={ctx} className="q-text" />
                  <span className="q-value" data-value>{localText(f.options.find(o => o.value === 'unknown')?.label ?? f.options[0].label, ctx.lang).text}</span>
                </summary>
                <fieldset>
                  <Txt value={f.question} ctx={ctx} as="legend" className="visually-hidden" />
                  {f.help && <Txt value={f.help} ctx={ctx} as="p" className="q-help" />}
                  {f.options.map(o => (
                    <label key={o.value} className="opt">
                      <input type="radio" name={f.key} value={o.value} defaultChecked={o.value === 'unknown'} />
                      <Txt value={o.label} ctx={ctx} />
                    </label>
                  ))}
                </fieldset>
              </details>
            ))}
          </div>
          <button type="reset" className="quiet" hidden>{t(ctx, 'clearAnswers')}</button>
        </form>
      </div>

      <div className="doc-body">
        <nav className="toc" aria-label={t(ctx, 'tocLabel')}>
          <p className="toc-label" aria-hidden="true">{t(ctx, 'tocLabel')}</p>
          <ul>
            {kinds.map(k => <li key={k} data-toc={k} hidden={!kindVisible(k)}><a href={`#r-${k}`}>{t(ctx, `lbl_${k}` as SiteKey)}</a></li>)}
            <li><a href="#r-scope">{t(ctx, 'lbl_scope')}</a></li>
            <li><a href="#r-sources">{t(ctx, 'lbl_sources')}</a></li>
          </ul>
        </nav>

        <div className="answer">
          {kinds.map(kind => {
            const list = s.blocks.filter(b => b.kind === kind);
            return (
              <section key={kind} className={`row row-${kind}`} id={`r-${kind}`} aria-labelledby={`h-${kind}`} hidden={!kindVisible(kind)} data-row>
                <h2 id={`h-${kind}`} className="row-label"><Icon kind={kind} />{t(ctx, `lbl_${kind}` as SiteKey)}</h2>
                <div className="row-body">
                  {kind === 'step' ? (
                    <ol className="steps">{list.map(b => <li key={b.id} data-when={whenAttr(b.when)} hidden={!visible.has(b.id)}><Txt value={b.text} ctx={ctx} as="p" />{R(b.sources)}</li>)}</ol>
                  ) : list.map(b => (
                    <div key={b.id} className="para" data-when={whenAttr(b.when)} hidden={!visible.has(b.id)}>
                      <Txt value={b.text} ctx={ctx} as="p" />{R(b.sources)}
                    </div>
                  ))}
                  {kind === 'free-help' && helpLinks.length > 0 && (
                    <div className="help-links">
                      <p className="help-links-label">{t(ctx, 'officialPages')}</p>
                      <ul>{helpLinks.map(l => <li key={l.url}><a href={l.url}><Txt value={l.label} ctx={ctx} /><span className="help-host">{new URL(l.url).hostname.replace(/^www\./, '')}</span></a></li>)}</ul>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
          <section className="row row-scope" id="r-scope" aria-labelledby="h-scope">
            <h2 id="h-scope" className="row-label"><Icon kind="scope" />{t(ctx, 'lbl_scope')}</h2>
            <div className="row-body">
              <div className="para"><Txt value={s.scope.covers} ctx={ctx} as="p" /></div>
              <div className="para muted"><p>{t(ctx, 'excludes')}: <Txt value={s.scope.excludes} ctx={ctx} /></p></div>
            </div>
          </section>
          <section className="row row-sources" id="r-sources" aria-labelledby="h-sources">
            <h2 id="h-sources" className="row-label"><Icon kind="sources" />{t(ctx, 'lbl_sources')}</h2>
            <div className="row-body">
              <dl className="source-groups">{groupSources(s, ctx).map(([act, items]) => (
                <div key={act} className="source-group">
                  <dt>{act}</dt>
                  <dd><ul className="source-list">{items.map(({ key, r, label }) => (
                    <li key={key}><a href={sourceUrl(r, ctx.lang)} data-pop={provisionFor(r, ctx, provisions) ? popId(key) : undefined} aria-label={sourceLabel(r, ctx.lang)}>{label}</a></li>
                  ))}</ul></dd>
                </div>
              ))}</dl>
              {s.official_links.length > 0 && !helpLinks.length && <ul className="source-links">{s.official_links.map(l => <li key={l.url}><a href={l.url}><Txt value={l.label} ctx={ctx} /></a></li>)}</ul>}
              <p className="checked">{t(ctx, 'checkedAsOf', { date: formatDate(s.version, ctx.lang, false) })}</p>
            </div>
          </section>
          <div className="doc-actions" data-actions hidden>
            <button type="button" className="quiet" data-copy>{t(ctx, 'copyLink')}</button>
            <button type="button" className="quiet" data-print>{t(ctx, 'print')}</button>
            <span role="status" data-status></span>
          </div>
          <p className="doc-suggest"><a href={issueUrl('correction', `${s.id} (${s.version})`)}>{t(ctx, 'suggestFix')}</a></p>
        </div>
      </div>
      {withText.map(({ k, r, p }) => <Provision key={k} id={k} r={r} p={p} ctx={ctx} s={s} />)}
    </article>
  );
}

export function Layout({ ctx, children, alt }: { ctx: Ctx; children: ReactNode; alt: (l: KnowledgeLanguage) => string }) {
  return (
    <>
      <a className="skip" href="#main">{t(ctx, 'skip')}</a>
      <Top ctx={ctx} alt={alt} />
      <main id="main" tabIndex={-1}>{children}</main>
      <aside className="print-note" aria-hidden="true">
        <p>{t(ctx, 'footerNotAdvice')} {t(ctx, 'footerOpen')}</p>
        <p data-printed={SITE_TEXT.printedFrom[ctx.lang]}>{`https://swisslaw.io${alt(ctx.lang)}`}</p>
      </aside>
      <Foot ctx={ctx} />
    </>
  );
}
