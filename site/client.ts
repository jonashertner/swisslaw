// Progressive enhancement for swisslaw.io. Pages are complete, readable HTML without this script.
// It adds: instant search (index), answers that filter the guidance, the deadline calculator, copy and print.
import { computeDeadline, DEADLINE_RULES, RuleNotSigned, type Delivery } from '../lib/swisslaw-chat/deadlines';
import { searchSituations } from '../lib/swisslaw-chat/site';
import { redact } from '../lib/swisslaw-chat/redact';
import type { KnowledgeLanguage, Situation } from '../lib/swisslaw-chat/knowledge';

type PageData = { lang: KnowledgeLanguage; channel: 'public' | 'review'; text: Record<string, string>; locale: string;
  search?: { id: string; url: string; due?: string; title: Record<string, string>; summary: Record<string, string>; examples: Record<string, string[]> }[] };
const data: PageData = JSON.parse(document.getElementById('page-data')?.textContent ?? '{}');
const tx = (k: string, v: Record<string, string | number> = {}) => (data.text?.[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => String(v[n] ?? ''));
const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const el = (tag: string, cls?: string, text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

function fmt(iso: string, weekday = true): string {
  const [y, m, d] = iso.split('-').map(Number);
  const opts: Intl.DateTimeFormatOptions = { ...(weekday ? { weekday: 'long' } : {}), day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  let out: string;
  try { out = new Intl.DateTimeFormat(data.locale, opts).format(new Date(Date.UTC(y, m - 1, d))); }
  catch { out = new Intl.DateTimeFormat('de-CH', opts).format(new Date(Date.UTC(y, m - 1, d))); }
  // Keep day, month and year on one line; only the weekday may wrap.
  return out.replace(/\d+\.?(?: [\p{L}’']+)+ \d{4}/u, s => s.replace(/ /g, '\u00a0'));
}
function today(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

// --- index: instant search -----------------------------------------------------
function initSearch() {
  const form = $<HTMLFormElement>('[data-search]'); const input = $<HTMLInputElement>('#q');
  const results = $<HTMLElement>('#results'); const index = $<HTMLElement>('#index');
  if (!form || !input || !results || !index || !data.search) return;
  form.hidden = false;
  const list = $<HTMLUListElement>('.entries', results)!; const none = $<HTMLElement>('.none', results)!;
  const items = data.search.map(s => ({ ...s, examples: { de: [], ...s.examples } })) as unknown as Situation[];
  const byId = new Map(data.search.map(s => [s.id, s]));
  const run = () => {
    const q = input.value.trim();
    const searching = q.length > 1;
    results.hidden = !searching; index.hidden = searching;
    if (!searching) return;
    const hits = searchSituations(q, items, data.lang, 12);
    list.replaceChildren(...hits.map(h => {
      const s = byId.get(h.id)!; const li = el('li'); const a = el('a') as HTMLAnchorElement; a.href = s.url;
      a.append(el('span', 'entry-title', s.title[data.lang] ?? s.title.de));
      if (s.due) a.append(el('span', 'entry-due', s.due));
      li.append(a); return li;
    }));
    none.hidden = hits.length > 0;
  };
  input.addEventListener('input', run);
  for (const chip of $$<HTMLButtonElement>('.chip', form)) chip.addEventListener('click', () => { input.value = chip.dataset.q ?? ''; run(); input.focus(); });
  form.addEventListener('submit', e => { e.preventDefault(); const first = $<HTMLAnchorElement>('a', list); if (first) location.href = first.href; });
  const initial = new URLSearchParams(location.search).get('q'); if (initial) { input.value = initial; run(); }
}

// --- situation: answers, guidance, deadline ------------------------------------
function initSituation() {
  const form = $<HTMLFormElement>('#answers'); if (!form) return;
  form.hidden = false;
  const reset = $<HTMLButtonElement>('button[type=reset]', form)!;
  const factNames = [...new Set($$<HTMLInputElement>('.q:not(.q-deadline) input[type=radio]', form).map(i => i.name))];
  const params = new URLSearchParams(location.search);
  for (const name of factNames) { const v = params.get(name); const r = v && form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${CSS.escape(v)}"]`); if (r) r.checked = true; }

  const facts = () => Object.fromEntries(factNames.map(n => [n, (form.querySelector<HTMLInputElement>(`input[name="${n}"]:checked`)?.value) ?? 'unknown']));
  const applies = (when: string | undefined, f: Record<string, string>) => !when || Object.entries(JSON.parse(when) as Record<string, string[]>).every(([k, vs]) => vs.includes(f[k] ?? 'unknown'));

  const update = () => {
    const f = facts();
    for (const node of $$<HTMLElement>('[data-when]')) node.hidden = !applies(node.dataset.when, f);
    for (const row of $$<HTMLElement>('[data-row]')) row.hidden = !$$<HTMLElement>('[data-when], .para, li', row).some(n => !n.hidden && !n.closest('.due'));
    const answered = Object.values(f).some(v => v !== 'unknown');
    reset.hidden = !answered;
    const q = new URLSearchParams(); for (const [k, v] of Object.entries(f)) if (v !== 'unknown') q.set(k, v);
    history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}`);
    updateDeadline();
  };

  const due = $<HTMLElement>('#due'); const fieldset = $<HTMLFieldSetElement>('[data-deadline]', form);
  const activeRule = (): string | undefined => {
    const block = $$<HTMLElement>('.row-deadline .para[data-rules]').find(b => !b.hidden);
    return block ? (JSON.parse(block.dataset.rules!) as string[]).find(r => DEADLINE_RULES.has(r)) : undefined;
  };
  function updateDeadline() {
    if (!due || !fieldset) return;
    const ruleId = activeRule(); const rule = ruleId ? DEADLINE_RULES.get(ruleId) : undefined;
    due.hidden = !rule; fieldset.hidden = !rule;
    if (!rule) return;
    const get = (n: string) => (form!.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';
    const method = rule.receipt_doctrine === 'event' ? 'event' : ((form!.querySelector<HTMLInputElement>('input[name=method]:checked')?.value) ?? 'personal');
    for (const l of $$<HTMLElement>('[data-for]', fieldset)) l.hidden = (l.dataset.for === 'registered') !== (method === 'registered');
    let delivery: Delivery | null = null;
    if (method === 'event') delivery = get('date') ? { method: 'event', date: get('date') } : null;
    else if (method === 'registered') delivery = get('notice') || get('collected') ? { method: 'registered', ...(get('notice') ? { noticeDate: get('notice') } : {}), ...(get('collected') ? { collectedDate: get('collected') } : {}) } : null;
    else delivery = get('date') ? { method: method as 'personal' | 'ordinary', date: get('date') } : null;
    due.replaceChildren();
    if (!delivery) { due.append(el('p', 'due-prompt', tx('enterDate'))); return; }
    const canton = get('canton');
    let r;
    try { r = computeDeadline(rule.id, delivery, canton || 'ZH', { today: today(), requireSigned: data.channel === 'public' }); }
    catch (e) { due.append(el('p', e instanceof RuleNotSigned ? 'due-note' : 'due-alert', tx(e instanceof RuleNotSigned ? 'calcPending' : 'noDate'))); return; }
    if (!r.bindingDue) { due.append(el('p', 'due-alert', tx('noDate'))); return; }
    due.append(el('p', 'due-label', tx('actUntil')), el('p', 'due-date', fmt(r.bindingDue)));
    if (r.daysLeft !== null && !r.expired) due.append(el('p', 'due-left', r.daysLeft === 0 ? tx('today') : r.daysLeft === 1 ? tx('dayLeft') : tx('daysLeft', { n: r.daysLeft })));
    if (r.expired) due.append(el('p', 'due-alert', tx('expired')));
    if (r.urgent) due.append(el('p', 'due-alert', tx('urgent')));
    for (const l of r.couldBeLater) due.append(el('p', 'due-note', tx('couldBeLater', { date: fmt(l.date, false), reason: tx(`later_${l.code}`) })));
    for (const n of r.notes) if (n !== 'expired') due.append(el('p', 'due-note', tx(`note_${n}`)));
    if (!canton) due.append(el('p', 'due-note', tx('cantonHint')));
    const how = el('details', 'due-how'); how.append(el('summary', undefined, tx('howCalculated')));
    const ol = el('ol'); ol.append(el('li', undefined, tx('calcReceipt', { date: fmt(r.receiptDate!, false) })), el('li', undefined, tx('calcPlus', { n: rule.duration_days })), el('li', undefined, tx('calcEnd', { date: fmt(r.bindingDue, false) })));
    how.append(ol, el('p', undefined, `${tx('basis')}: ${r.legalBasis.join(', ')}`));
    if (r.ruleStatus !== 'signed') how.append(el('p', undefined, tx('calcDraft')));
    how.append(el('p', undefined, tx('calcAdvice')));
    // Chrome paginates a <details> element badly: print a plain copy instead.
    const flat = el('div', 'due-how-print'); flat.append(el('p', 'due-how-title', tx('howCalculated')), ...[...how.children].slice(1).map(n => n.cloneNode(true)));
    due.append(how, flat);
  }

  form.addEventListener('change', update);
  form.addEventListener('input', e => { if ((e.target as HTMLElement).matches('input[type=date], select')) updateDeadline(); });
  form.addEventListener('reset', () => setTimeout(update));
  form.addEventListener('submit', e => e.preventDefault());

  const actions = $<HTMLElement>('[data-actions]');
  if (actions) {
    actions.hidden = false;
    const status = $<HTMLElement>('[data-status]', actions)!;
    $('[data-copy]', actions)?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); status.textContent = tx('copied'); setTimeout(() => (status.textContent = ''), 4000); } catch { /* address bar holds the link */ }
    });
    $('[data-print]', actions)?.addEventListener('click', () => print());
  }
  update();
}

// --- index: submit a question ----------------------------------------------------
function initSubmit() {
  const form = $<HTMLFormElement>('[data-submit]'); if (!form) return;
  const question = form.elements.namedItem('question') as HTMLTextAreaElement;
  const preview = $<HTMLElement>('[data-preview]', form)!; const quote = $<HTMLElement>('blockquote', preview)!;
  const status = $<HTMLElement>('[data-submit-status]', form)!; const button = $<HTMLButtonElement>('button[type=submit]', form)!;
  const show = () => { const r = redact(question.value); preview.hidden = r.replaced === 0; quote.textContent = r.text; };
  question.addEventListener('input', show);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = redact(question.value).text;
    if (text.length < 20) { status.textContent = tx('submitTooShort'); question.focus(); return; }
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? '';
    button.disabled = true; status.textContent = '';
    try {
      const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ lang: data.lang, question: text, canton: get('canton'), email: get('email'), website: get('website'), consent: (form.elements.namedItem('consent') as HTMLInputElement).checked }) });
      if (res.status === 201) { form.reset(); preview.hidden = true; status.textContent = tx('submitThanks'); }
      else status.textContent = tx(res.status === 429 ? 'submitTooMany' : [404, 405, 501].includes(res.status) ? 'submitUnavailable' : 'submitError');
    } catch { status.textContent = tx('submitError'); }
    finally { button.disabled = false; }
  });
}

// --- print: a file name that says what and when, the answers as a summary, the address to reopen them
function initPrint() {
  const title = document.title;
  addEventListener('beforeprint', () => {
    // Browsers name the PDF after the title: drop characters that file systems reject, add the date.
    document.title = `${title.replace(/\s*:\s*/g, ' – ').replace(/[?*"<>|\\/]+/g, '').replace(/\s+/g, ' ').trim()} – ${today()}`;
    const printed = $<HTMLElement>('[data-printed]');
    if (printed?.dataset.printed) printed.textContent = `${printed.dataset.printed.replace('{date}', fmt(today(), false))} ${location.href}`;
    const box = $<HTMLElement>('[data-print-answers]'); const form = $<HTMLFormElement>('#answers');
    if (!box || !form) return;
    const rows: [string, string][] = [];
    for (const fs of $$<HTMLFieldSetElement>('fieldset.q', form)) {
      if (fs.hidden) continue;
      const question = $('legend', fs)?.textContent?.trim() ?? '';
      if (fs.matches('.q-deadline')) {
        const fields = $$<HTMLLabelElement>('label.field', fs).filter(l => !l.hidden && $<HTMLInputElement | HTMLSelectElement>('input, select', l)?.value);
        if (!fields.some(l => $('input[type=date]', l))) continue;
        const method = $('.seg-opt input:checked + span', fs)?.textContent;
        if (method) rows.push([question, method]);
        for (const l of fields) { const c = $<HTMLInputElement | HTMLSelectElement>('input, select', l)!; rows.push([$('span', l)?.textContent ?? '', c.type === 'date' ? fmt(c.value, false) : c.value]); }
      } else {
        const checked = $<HTMLInputElement>('input:checked', fs);
        if (checked && checked.value !== 'unknown') rows.push([question, checked.closest('label')?.textContent?.trim() ?? '']);
      }
    }
    box.replaceChildren();
    if (!rows.length) return;
    const dl = el('dl'); for (const [q, a] of rows) dl.append(el('dt', undefined, q), el('dd', undefined, a));
    box.append(el('h2', 'row-label', $('#in-h')?.textContent ?? ''), dl);
  });
  addEventListener('afterprint', () => { document.title = title; });
}

initSearch();
initSubmit();
initSituation();
initPrint();
