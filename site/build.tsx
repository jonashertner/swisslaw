// Static build of swisslaw.io: every page as finished HTML, plus machine-readable files.
//   VITE_CHANNEL=review  drafts included, noindex everywhere (review environment)
//   default (public)     reviewed situations only, indexable
// Output: dist/ (pages, /fonts, /assets, /data, sitemap.xml, robots.txt, llms.txt, _headers, _csp.json)
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build as esbuild } from 'esbuild';
import { localText, SituationSchema, validateSituation, type KnowledgeLanguage, type Situation } from '../lib/swisslaw-chat/knowledge';
import { AREAS, byImportance, LETTERS, sourceLabel, sourceUrl, visibleInChannel, withPublishedLanguages, type AreaId } from '../lib/swisslaw-chat/site';
import { AREA_TEXT, FULL_DATE_LOCALE, LETTER_TEXT, SITE_TEXT, st, type SiteKey } from '../lib/swisslaw-chat/site-i18n';
import { DEADLINE_RULES } from '../lib/swisslaw-chat/deadlines';
import { AboutBody, AreaBody, IndexBody, Layout, LANGS, paths, SituationBody, ThanksBody, TopicsBody, type Ctx } from './templates';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = process.env.SITE_OUT ?? join(ROOT, 'dist');
const ORIGIN = 'https://swisslaw.io';
const REVIEW = process.env.VITE_CHANNEL === 'review';
const CHANNEL = REVIEW ? 'review' : 'public';
const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';

// --- knowledge --------------------------------------------------------------------
const dir = join(ROOT, 'knowledge/situations');
const all: Situation[] = readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => {
  const raw = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const problems = validateSituation(raw);
  if (problems.length) throw new Error(`${f}: ${problems.join('; ')}`);
  return SituationSchema.parse(raw);
});
const situations = all.filter(s => visibleInChannel(s, CHANNEL)).map(s => withPublishedLanguages(s, CHANNEL)).sort(byImportance);
const inArea = (a: AreaId) => situations.filter(s => s.domain === a).sort(byImportance);
const areasWithContent = AREAS.filter(a => inArea(a).length);

// --- assets -----------------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });
const write = (rel: string, body: string | Buffer) => { const p = join(OUT, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, body); };
const hash = (s: string | Buffer) => createHash('sha256').update(s).digest('hex').slice(0, 10);

const css = readFileSync(join(ROOT, 'site/style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s*([{};,])\s*/g, '$1').replace(/:\s+/g, ':');
const cssHash = `sha256-${createHash('sha256').update(css).digest('base64')}`;
mkdirSync(join(OUT, 'fonts'), { recursive: true });
copyFileSync(join(ROOT, 'node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2'), join(OUT, 'fonts/source-serif-4-latin-wght.woff2'));
copyFileSync(join(ROOT, 'node_modules/@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2'), join(OUT, 'fonts/source-sans-3-latin-wght.woff2'));
copyFileSync(join(ROOT, 'node_modules/@fontsource-variable/source-serif-4/LICENSE'), join(OUT, 'fonts/LICENSE-source-serif-4.txt'));
copyFileSync(join(ROOT, 'node_modules/@fontsource-variable/source-sans-3/LICENSE'), join(OUT, 'fonts/LICENSE-source-sans-3.txt'));
copyFileSync(join(ROOT, 'site/favicon.svg'), join(OUT, 'favicon.svg'));

const bundle = await esbuild({ entryPoints: [join(ROOT, 'site/client.ts')], bundle: true, minify: true, format: 'esm', target: 'es2020', write: false, legalComments: 'none', alias: { '@': ROOT } });
const js = bundle.outputFiles[0].contents;
const jsPath = `/assets/site.${hash(Buffer.from(js))}.js`;
write(jsPath, Buffer.from(js));

// --- page shell -------------------------------------------------------------------
const CLIENT_KEYS: SiteKey[] = ['enterDate', 'calcPending', 'noDate', 'actUntil', 'today', 'dayLeft', 'daysLeft', 'expired', 'urgent', 'couldBeLater',
  'later_next_day_receipt', 'later_candidate_holidays', 'later_both', 'cantonHint', 'howCalculated', 'calcReceipt', 'calcPlus', 'calcEnd', 'basis', 'calcDraft', 'calcAdvice', 'copied', 'submitThanks', 'submitError', 'submitUnavailable', 'submitTooShort', 'submitTooMany',
  ...(Object.keys(SITE_TEXT).filter(k => k.startsWith('note_')) as SiteKey[])];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonScript = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
const ROOT_SCRIPT = `try{var s=localStorage.getItem('swisslaw.lang');var l=s||(navigator.language||'de').slice(0,2).toLowerCase();if(['fr','it','rm','en'].indexOf(l)>-1)location.replace('/'+l+'/')}catch(e){}`;
const rootScriptHash = `sha256-${createHash('sha256').update(ROOT_SCRIPT).digest('base64')}`;

type PageSpec = { lang: KnowledgeLanguage; path: string; alt: (l: KnowledgeLanguage) => string; title: string; description: string; body: ReactElement;
  jsonld?: unknown; data?: Record<string, unknown>; script?: boolean; canonical?: string; contentLang?: KnowledgeLanguage; rootScript?: boolean };
const pages: { path: string; alts: Record<string, string> }[] = [];

function page(p: PageSpec): string {
  const ctx: Ctx = { lang: p.lang, review: REVIEW };
  const html = renderToStaticMarkup(<Layout ctx={ctx} alt={p.alt}>{p.body}</Layout>);
  const alts = Object.fromEntries(LANGS.map(l => [l, p.alt(l)]));
  const canonical = p.canonical ?? p.path;
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}">`,
    REVIEW ? '<meta name="robots" content="noindex,nofollow">' : '',
    `<link rel="canonical" href="${ORIGIN}${canonical}">`,
    ...LANGS.map(l => `<link rel="alternate" hreflang="${l === 'rm' ? 'rm' : l}" href="${ORIGIN}${alts[l]}">`),
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${alts.de}">`,
    '<link rel="preload" href="/fonts/source-serif-4-latin-wght.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/fonts/source-sans-3-latin-wght.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<meta name="theme-color" content="#FCFCFA" media="(prefers-color-scheme: light)">',
    '<meta name="theme-color" content="#0F0F10" media="(prefers-color-scheme: dark)">',
    `<meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${ORIGIN}${canonical}"><meta property="og:locale" content="${FULL_DATE_LOCALE[p.lang].replace('-', '_')}">`,
    `<link rel="alternate" type="application/json" href="/data/index.json" title="swisslaw.io open data">`,
    `<style>${css}</style>`,
    p.rootScript ? `<script>${ROOT_SCRIPT}</script>` : '',
    p.jsonld ? `<script type="application/ld+json">${jsonScript(p.jsonld)}</script>` : '',
    p.data ? `<script type="application/json" id="page-data">${jsonScript(p.data)}</script>` : '',
    p.script ? `<script type="module" src="${jsPath}"></script>` : '',
  ].filter(Boolean).join('');
  return `<!doctype html><html lang="${p.lang}" dir="ltr"><head>${head}</head><body class="site">${html}</body></html>`;
}
function emit(p: PageSpec) {
  write(p.path.endsWith('/') ? `${p.path}index.html` : p.path, page(p));
  pages.push({ path: p.path, alts: Object.fromEntries(LANGS.map(l => [l, p.alt(l)])) });
}
// Raw templates: the client fills {n}, {date} and {reason} itself.
const clientText = (lang: KnowledgeLanguage) => Object.fromEntries(CLIENT_KEYS.map(k => [k, SITE_TEXT[k][lang] || SITE_TEXT[k].de]));
const siteLd = { '@type': 'WebSite', name: 'swisslaw.io', url: ORIGIN, description: 'Free guidance on everyday Swiss law, to improve access to justice.', isBasedOn: { '@type': 'Dataset', name: 'OpenCaseLaw', url: 'https://opencaselaw.ch' } };
const publisher = { '@type': 'Organization', name: 'swisslaw.io', url: ORIGIN };
const dueLabel = new Map(LETTERS.map(l => [l.situation, l.id]));

// --- pages --------------------------------------------------------------------------
for (const lang of LANGS) {
  const title = (s: string) => `${s} – swisslaw.io`;
  const indexSpec = (path: string, rootScript = false): PageSpec => ({
    lang, path, alt: l => paths.home(l), canonical: paths.home(lang), rootScript,
    title: `swisslaw.io – ${st('intro', lang).split('.')[0]}`, description: st('intro', lang),
    body: <IndexBody ctx={{ lang, review: REVIEW }} groups={areasWithContent.map(area => ({ area, items: inArea(area) }))} examples={situations.slice(0, 3)} />,
    script: true,
    data: { lang, channel: CHANNEL, locale: FULL_DATE_LOCALE[lang], text: clientText(lang),
      search: situations.map(s => ({ id: s.id, url: paths.situation(lang, s.id), due: dueLabel.get(s.id) ? LETTER_TEXT[dueLabel.get(s.id)!].deadline[lang] : undefined,
        title: { de: s.title.de, ...(s.title[lang] ? { [lang]: s.title[lang] } : {}) }, summary: { de: s.summary.de, ...(s.summary[lang] ? { [lang]: s.summary[lang] } : {}) }, examples: s.examples })) },
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { ...siteLd, inLanguage: lang, potentialAction: { '@type': 'SearchAction', target: `${ORIGIN}${paths.home(lang)}?q={q}`, 'query-input': 'required name=q' } },
      { '@type': 'ItemList', name: st('intro', lang), itemListElement: situations.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${ORIGIN}${paths.situation(lang, s.id)}`, name: localText(s.title, lang).text })) },
    ] },
  });
  emit(indexSpec(paths.home(lang)));
  if (lang === 'de') emit(indexSpec('/', true));

  for (const area of areasWithContent) {
    emit({ lang, path: paths.area(lang, area), alt: l => paths.area(l, area), title: title(AREA_TEXT[area][lang]), description: `${AREA_TEXT[area][lang]}: ${inArea(area).map(s => localText(s.title, lang).text).join(' · ')}`.slice(0, 300),
      body: <AreaBody ctx={{ lang, review: REVIEW }} area={area} items={inArea(area)} />,
      jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: AREA_TEXT[area][lang], url: `${ORIGIN}${paths.area(lang, area)}`, isPartOf: siteLd, inLanguage: lang,
        hasPart: inArea(area).map(s => ({ '@type': 'Article', headline: localText(s.title, lang).text, url: `${ORIGIN}${paths.situation(lang, s.id)}` })) } });
  }

  for (const s of situations) {
    const contentLang = s.title[lang] ? lang : 'de';
    const hasDeadline = s.blocks.some(b => b.deadline_rules?.some(r => DEADLINE_RULES.has(r)));
    const citation = Object.values(s.sources).map(r => r.type === 'statute'
      ? { '@type': 'Legislation', name: sourceLabel(r, lang), legislationIdentifier: `SR ${r.sr} Art. ${r.article}`, url: sourceUrl(r, lang), legislationJurisdiction: 'CH' }
      : { '@type': 'CreativeWork', name: sourceLabel(r, lang), url: r.url });
    emit({ lang, path: paths.situation(lang, s.id), alt: l => paths.situation(l, s.id), contentLang,
      canonical: paths.situation(contentLang, s.id),
      title: title(localText(s.title, lang).text), description: localText(s.summary, lang).text.slice(0, 300),
      body: <SituationBody ctx={{ lang, review: REVIEW }} s={s} />,
      script: true,
      data: { lang, channel: CHANNEL, locale: FULL_DATE_LOCALE[lang], text: hasDeadline ? clientText(lang) : { copied: SITE_TEXT.copied[lang] } },
      jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: localText(s.title, lang).text, description: localText(s.summary, lang).text,
        inLanguage: contentLang, url: `${ORIGIN}${paths.situation(contentLang, s.id)}`, dateModified: s.version, datePublished: s.review.prepared_at,
        isAccessibleForFree: true, license: LICENSE_URL, publisher, isPartOf: siteLd, about: { '@type': 'Thing', name: AREA_TEXT[s.domain]?.[lang] },
        citation, ...(s.status === 'public' && s.review.reviewed_by ? { reviewedBy: { '@type': 'Person', name: s.review.reviewed_by }, lastReviewed: s.review.reviewed_at } : {}),
        mainEntityOfPage: `${ORIGIN}${paths.situation(contentLang, s.id)}`, identifier: s.id,
        encoding: { '@type': 'MediaObject', encodingFormat: 'application/json', contentUrl: `${ORIGIN}/data/situations/${s.id}.json` } } });
  }

  emit({ lang, path: paths.thanks(lang), alt: l => paths.thanks(l), title: title(st('submitThanks', lang)), description: st('submitThanks', lang),
    body: <ThanksBody ctx={{ lang, review: REVIEW }} /> });
  emit({ lang, path: paths.topics(lang), alt: l => paths.topics(l), title: title(st('coverageTitle', lang)), description: st('coverageTitle', lang),
    body: <TopicsBody ctx={{ lang, review: REVIEW }} live={all.filter(s => s.status === 'public').map(s => withPublishedLanguages(s, CHANNEL)).sort(byImportance)} />,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: st('coverageTitle', lang), url: `${ORIGIN}${paths.topics(lang)}`, isPartOf: siteLd, inLanguage: lang } });
  emit({ lang, path: paths.about(lang), alt: l => paths.about(l), title: title(st('aboutTitle', lang)), description: st('aboutBody', lang).slice(0, 300),
    body: <AboutBody ctx={{ lang, review: REVIEW }} />, jsonld: { '@context': 'https://schema.org', '@type': 'AboutPage', name: st('aboutTitle', lang), url: `${ORIGIN}${paths.about(lang)}`, isPartOf: siteLd } });
}
write('404.html', page({ lang: 'de', path: '/404.html', alt: l => paths.home(l), title: 'swisslaw.io', description: st('intro', 'de'),
  body: <section className="about"><h1 className="page-title">Diese Seite gibt es nicht.</h1><p><a href="/de/">Zur Übersicht</a></p></section> }));

// --- machine-readable files ------------------------------------------------------------
const index = situations.map(s => ({ id: s.id, domain: s.domain, status: s.status, version: s.version, title: s.title, summary: s.summary,
  languages: Object.keys(s.title), url: Object.fromEntries(LANGS.map(l => [l, `${ORIGIN}${paths.situation(l, s.id)}`])), data: `${ORIGIN}/data/situations/${s.id}.json` }));
write('data/index.json', JSON.stringify({ name: 'swisslaw.io knowledge base', license: 'CC-BY-4.0', license_url: LICENSE_URL, channel: CHANNEL, generated: new Date().toISOString().slice(0, 10), situations: index }, null, 1));
for (const s of situations) write(`data/situations/${s.id}.json`, JSON.stringify(s, null, 1));
write('data/deadline-rules.json', readFileSync(join(ROOT, 'lib/swisslaw-chat/deadline-rules.json')));
write('data/deadline-holidays.json', readFileSync(join(ROOT, 'lib/swisslaw-chat/deadline-holidays.json')));
write('data/LICENSE.txt', readFileSync(join(ROOT, 'knowledge/LICENSE')));
write('data/index.html', page({ lang: 'de', path: '/data/', alt: () => '/data/', title: 'Offene Daten – swisslaw.io', description: 'Die Wissensbasis von swisslaw.io als offene Daten (CC BY 4.0).',
  body: <section className="about"><h1 className="page-title">Offene Daten</h1>
    <p>Die Wissensbasis von swisslaw.io steht unter CC BY 4.0. Nennen Sie «swisslaw.io», die Situation und ihre Version.</p>
    <p><a href="/data/index.json">index.json</a>: alle Situationen mit Titel, Status, Version und Adressen.</p>
    <p><a href="/data/deadline-rules.json">deadline-rules.json</a> und <a href="/data/deadline-holidays.json">deadline-holidays.json</a>: die Fristregeln mit Rechtsgrundlagen.</p>
    <p>Einzelne Situationen: <code>/data/situations/&lt;id&gt;.json</code>. Format: <a href="https://github.com/jonashertner/swisslaw/tree/main/knowledge">knowledge/README.md</a>.</p></section> }));

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages.filter(p => p.path !== '/').map(p =>
  `<url><loc>${ORIGIN}${p.path}</loc><lastmod>${today}</lastmod>${LANGS.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${p.alts[l]}"/>`).join('')}</url>`).join('\n')}\n</urlset>\n`;
write('sitemap.xml', sitemap);
write('robots.txt', REVIEW ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
write('llms.txt', `# swisslaw.io\n\n> Free guidance on everyday Swiss law for residents, to improve access to justice: what applies, what to do, by when. Powered by OpenCaseLaw (https://opencaselaw.ch), the open collection of Swiss law and case law. German master text; French, Italian, Romansh and English interfaces. Every rule cites official sources (Fedlex, Federal Supreme Court via OpenCaseLaw). Guidance is reviewed by a Swiss lawyer before publication. Content licence: CC BY 4.0.\n\n## Open data\n\n- [Index of all situations](${ORIGIN}/data/index.json): ids, titles, status, versions, URLs\n- [Deadline rules](${ORIGIN}/data/deadline-rules.json): statutory deadlines with legal basis and counting regime\n- Each situation as JSON: ${ORIGIN}/data/situations/<id>.json\n\n## Situations\n\n${situations.map(s => `- [${s.title.de}](${ORIGIN}${paths.situation('de', s.id)}): ${s.summary.de}`).join('\n')}\n\n## Notes for machines\n\n- Cite the situation URL and version. Quote statutes only from the official sources linked in each situation.\n- This is general legal information, not individual advice. Deadlines depend on the facts; see the deadline rules.\n`);

// --- headers ----------------------------------------------------------------------------
const csp = `default-src 'none'; script-src 'self' '${rootScriptHash}'; style-src '${cssHash}'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`;
write('_csp.json', JSON.stringify({ csp }));
write('_headers', [
  '/*', '  Referrer-Policy: no-referrer', '  X-Content-Type-Options: nosniff', '  X-Frame-Options: DENY', '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()', `  Content-Security-Policy: ${csp}`,
  ...(REVIEW ? ['  X-Robots-Tag: noindex, nofollow'] : []),
  '/assets/*', '  Cache-Control: public, max-age=31536000, immutable',
  '/fonts/*', '  Cache-Control: public, max-age=31536000, immutable',
  '/data/*', '  Access-Control-Allow-Origin: *', '',
].join('\n'));

const total = pages.length;
console.log(`swisslaw.io ${CHANNEL}: ${situations.length} situations, ${total} pages, css ${css.length} B, js ${js.length} B`);
