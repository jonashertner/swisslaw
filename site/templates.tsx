// Static page templates. Rendered to HTML at build time (renderToStaticMarkup); no React runs in the browser.
import type { ReactNode } from 'react';
import { applicableBlocks, localText, type KnowledgeLanguage, type Situation } from '../lib/swisslaw-chat/knowledge';
import { BLOCK_ORDER, byImportance, LETTERS, type AreaId } from '../lib/swisslaw-chat/site';
import { AREA_TEXT, LETTER_TEXT, SITE_TEXT, st, type SiteKey } from '../lib/swisslaw-chat/site-i18n';
import { CANTONS, DEADLINE_RULES } from '../lib/swisslaw-chat/deadlines';
import { formatDate } from './format';

export const REPO = 'https://github.com/jonashertner/swisslaw';
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
      <a href={paths.home(ctx.lang)} className="mark">swisslaw.io</a>
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
      <nav aria-label="swisslaw.io">
        <a href={paths.home(ctx.lang)}>{t(ctx, 'overview')}</a>
        <a href={paths.about(ctx.lang)}>{t(ctx, 'navAbout')}</a>
        <a href="/data/">{t(ctx, 'openData')}</a>
        <a href={REPO}>GitHub</a>
      </nav>
      <p>{t(ctx, 'footerNotAdvice')} {t(ctx, 'footerOpen')}</p>
      <p><a href={`${REPO}/issues/new/choose`}>{t(ctx, 'contribute')}</a></p>
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

export function IndexBody({ ctx, groups, preparing }: { ctx: Ctx; groups: { area: AreaId; items: Situation[] }[]; preparing: AreaId[] }) {
  return (
    <>
      <section className="lead-in">
        <h1 className="intro">{t(ctx, 'intro')}</h1>
        <form className="search" role="search" action={paths.home(ctx.lang)} data-search hidden>
          <label htmlFor="q" className="visually-hidden">{t(ctx, 'searchLabel')}</label>
          <input id="q" name="q" type="search" placeholder={t(ctx, 'searchLabel')} autoComplete="off" spellCheck />
        </form>
      </section>
      <section className="group" id="results" aria-live="polite" hidden>
        <h2 className="group-name">{t(ctx, 'searchResults')}</h2>
        <div className="group-body"><ul className="entries" /><p className="none" hidden>{t(ctx, 'searchNone')} <a href={issueUrl('topic', '')}>{t(ctx, 'suggestTopic')}</a></p></div>
      </section>
      <div id="index">
        {groups.map(g => (
          <section key={g.area} className="group" aria-labelledby={`g-${g.area}`}>
            <h2 id={`g-${g.area}`} className="group-name"><a href={paths.area(ctx.lang, g.area)}>{AREA_TEXT[g.area][ctx.lang]}</a></h2>
            <ul className="entries">{g.items.map(s => <Entry key={s.id} s={s} ctx={ctx} />)}</ul>
          </section>
        ))}
        {preparing.length > 0 && <p className="preparing">{t(ctx, 'preparing', { x: preparing.map(a => AREA_TEXT[a][ctx.lang]).join(', ') })}</p>}
      </div>
    </>
  );
}

export function AreaBody({ ctx, area, items }: { ctx: Ctx; area: AreaId; items: Situation[] }) {
  return (
    <>
      <nav className="crumbs" aria-label={t(ctx, 'overview')}><a href={paths.home(ctx.lang)}>{t(ctx, 'overview')}</a></nav>
      <section className="lead-in lead-in-area"><h1>{AREA_TEXT[area][ctx.lang]}</h1></section>
      <section className="group" aria-labelledby="area-list">
        <h2 id="area-list" className="group-name visually-hidden">{AREA_TEXT[area][ctx.lang]}</h2>
        <ul className="entries">{[...items].sort(byImportance).map(s => <Entry key={s.id} s={s} ctx={ctx} />)}</ul>
      </section>
    </>
  );
}

export function AboutBody({ ctx }: { ctx: Ctx }) {
  return (
    <section className="about">
      <h1>{t(ctx, 'aboutTitle')}</h1>
      {(['aboutBody', 'how1', 'how2', 'how3'] as const).map(k => <p key={k}>{t(ctx, k)}</p>)}
    </section>
  );
}

function Refs({ s, keys }: { s: Situation; keys?: string[] }) {
  if (!keys?.length) return null;
  return <p className="refs">{keys.map((k, i) => { const r = s.sources[k]; return <span key={k}>{i > 0 && ', '}<a href={r.url}>{r.type === 'statute' ? r.label : `${r.citation}${r.e ? `, E. ${r.e}` : ''}`}</a></span>; })}</p>;
}

export function SituationBody({ ctx, s }: { ctx: Ctx; s: Situation }) {
  const visible = new Set(applicableBlocks(s, {}).map(b => b.id));
  const deadlineRules = [...new Set(s.blocks.flatMap(b => b.deadline_rules ?? []))].filter(r => DEADLINE_RULES.has(r));
  const hasDeadline = deadlineRules.length > 0;
  const whenAttr = (w?: Record<string, string[]>) => (w ? JSON.stringify(w) : undefined);
  const eventRule = deadlineRules.map(r => DEADLINE_RULES.get(r)!).find(r => r.receipt_doctrine === 'event');
  const eventKey = eventRule ? `ev_${eventRule.id}` : '';
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
        {s.status === 'public' && s.review.reviewed_by && s.review.reviewed_at && (
          <p className="doc-meta">{t(ctx, 'reviewedBy', { who: s.review.reviewed_by, date: formatDate(s.review.reviewed_at, ctx.lang, false) })}</p>
        )}
        {ctx.lang !== 'de' && !s.title[ctx.lang] && <p className="doc-meta">{t(ctx, 'untranslated')}</p>}
      </header>

      <div className="doc-grid">
        <form className="inputs" id="answers" aria-labelledby="in-h" hidden>
          <div className="inputs-head">
            <h2 id="in-h">{t(ctx, 'yourAnswers')}</h2>
            <button type="reset" className="quiet" hidden>{t(ctx, 'clearAnswers')}</button>
          </div>
          <p className="inputs-lead">{t(ctx, 'yourAnswersLead')}</p>
          {hasDeadline && (
            <fieldset className="q q-deadline" data-deadline>
              <legend>{eventRule ? (eventKey in SITE_TEXT ? t(ctx, eventKey as SiteKey) : t(ctx, 'd_event')) : t(ctx, 'whenReceived')}</legend>
              {!eventRule && (
                <div className="seg">
                  {(['personal', 'registered', 'ordinary'] as const).map(m => (
                    <label key={m} className="seg-opt"><input type="radio" name="method" value={m} defaultChecked={m === 'personal'} /><span>{t(ctx, `mm_${m}` as SiteKey)}</span></label>
                  ))}
                </div>
              )}
              <label className="field" data-for="single"><span>{eventRule ? t(ctx, 'd_event') : t(ctx, 'dd_received')}</span><input type="date" name="date" max="2100-12-31" /></label>
              <label className="field" data-for="registered" hidden><span>{t(ctx, 'dd_notice')}</span><input type="date" name="notice" max="2100-12-31" /></label>
              <label className="field" data-for="registered" hidden><span>{t(ctx, 'dd_collected')}</span><input type="date" name="collected" max="2100-12-31" /></label>
              <label className="field field-inline"><span>{t(ctx, 'cantonOptional')}</span>
                <select name="canton" defaultValue=""><option value="">–</option>{CANTONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </label>
            </fieldset>
          )}
          {s.facts.map(f => (
            <fieldset key={f.key} className="q">
              <Txt value={f.question} ctx={ctx} as="legend" />
              {f.help && <Txt value={f.help} ctx={ctx} as="p" className="q-help" />}
              {f.options.map(o => (
                <label key={o.value} className="opt">
                  <input type="radio" name={f.key} value={o.value} defaultChecked={o.value === 'unknown'} />
                  <Txt value={o.label} ctx={ctx} />
                </label>
              ))}
            </fieldset>
          ))}
        </form>

        <div className="answer">
          {BLOCK_ORDER.map(kind => {
            const list = s.blocks.filter(b => b.kind === kind);
            if (!list.length) return null;
            const anyVisible = list.some(b => visible.has(b.id));
            const ordered = kind === 'step';
            return (
              <section key={kind} className={`row row-${kind}`} aria-labelledby={`r-${kind}`} hidden={!anyVisible} data-row>
                <h2 id={`r-${kind}`} className="row-label">{t(ctx, `lbl_${kind}` as SiteKey)}</h2>
                <div className="row-body">
                  {kind === 'deadline' && hasDeadline && (
                    <div className="due" id="due" aria-live="polite" data-rules={JSON.stringify(deadlineRules)} hidden><p className="due-prompt">{t(ctx, 'enterDate')}</p></div>
                  )}
                  {ordered ? (
                    <ol className="steps">{list.map(b => <li key={b.id} data-when={whenAttr(b.when)} hidden={!visible.has(b.id)}><Txt value={b.text} ctx={ctx} as="p" /><Refs s={s} keys={b.sources} /></li>)}</ol>
                  ) : list.map(b => (
                    <div key={b.id} className="para" data-when={whenAttr(b.when)} hidden={!visible.has(b.id)} data-rules={b.deadline_rules ? JSON.stringify(b.deadline_rules) : undefined}>
                      <Txt value={b.text} ctx={ctx} as="p" /><Refs s={s} keys={b.sources} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          <section className="row row-scope" aria-labelledby="r-scope">
            <h2 id="r-scope" className="row-label">{t(ctx, 'lbl_scope')}</h2>
            <div className="row-body">
              <div className="para"><Txt value={s.scope.covers} ctx={ctx} as="p" /></div>
              <div className="para muted"><p>{t(ctx, 'excludes')}: <Txt value={s.scope.excludes} ctx={ctx} /></p></div>
            </div>
          </section>
          <section className="row row-sources" aria-labelledby="r-src">
            <h2 id="r-src" className="row-label">{t(ctx, 'lbl_sources')}</h2>
            <div className="row-body">
              <ul className="source-list">{Object.entries(s.sources).map(([k, r]) => (
                <li key={k}><a href={r.url}>{r.type === 'statute' ? r.label : `${r.citation}${r.e ? `, E. ${r.e}` : ''}`}</a></li>
              ))}</ul>
              {s.official_links.length > 0 && <ul className="source-links">{s.official_links.map(l => <li key={l.url}><a href={l.url}><Txt value={l.label} ctx={ctx} /></a></li>)}</ul>}
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
    </article>
  );
}

export function Layout({ ctx, children, alt }: { ctx: Ctx; children: ReactNode; alt: (l: KnowledgeLanguage) => string }) {
  return (
    <>
      <a className="skip" href="#main">{t(ctx, 'skip')}</a>
      <Top ctx={ctx} alt={alt} />
      <main id="main" tabIndex={-1}>{children}</main>
      <Foot ctx={ctx} />
    </>
  );
}
