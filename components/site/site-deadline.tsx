import { computeDeadline, CANTONS, DEADLINE_RULES, RuleNotSigned, type DeadlineResult, type Delivery } from '@/lib/swisslaw-chat/deadlines';
import type { KnowledgeLanguage } from '@/lib/swisslaw-chat/knowledge';
import { FULL_DATE_LOCALE, SITE_TEXT, st, type SiteKey } from '@/lib/swisslaw-chat/site-i18n';
import type { Channel } from '@/lib/swisslaw-chat/site';

export type DeadlineInput = { method: 'personal' | 'registered' | 'ordinary'; date: string; notice: string; collected: string; canton: string };
export const EMPTY_DEADLINE_INPUT: DeadlineInput = { method: 'personal', date: '', notice: '', collected: '', canton: '' };

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDate(iso: string, lang: KnowledgeLanguage, weekday = true): string {
  const [y, m, d] = iso.split('-').map(Number);
  const opts: Intl.DateTimeFormatOptions = { ...(weekday ? { weekday: 'long' } : {}), day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  const date = new Date(Date.UTC(y, m - 1, d));
  try { return new Intl.DateTimeFormat(FULL_DATE_LOCALE[lang], opts).format(date); }
  catch { return new Intl.DateTimeFormat('de-CH', opts).format(date); }
}

export type Computed = { result?: DeadlineResult; pending?: boolean; invalid?: boolean; cantonAssumed?: boolean };
/** Computes the deadline for the first rule. Without a canton, only federal holidays count (the earlier, safe date). */
export function computeFromInput(ruleId: string, input: DeadlineInput, channel: Channel): Computed | null {
  const rule = DEADLINE_RULES.get(ruleId);
  if (!rule) return null;
  let delivery: Delivery;
  if (rule.receipt_doctrine === 'event') { if (!input.date) return null; delivery = { method: 'event', date: input.date }; }
  else if (input.method === 'registered') {
    if (!input.notice && !input.collected) return null;
    delivery = { method: 'registered', ...(input.notice ? { noticeDate: input.notice } : {}), ...(input.collected ? { collectedDate: input.collected } : {}) };
  } else { if (!input.date) return null; delivery = { method: input.method, date: input.date }; }
  try {
    return { result: computeDeadline(rule.id, delivery, input.canton || 'ZH', { today: localToday(), requireSigned: channel === 'public' }), cantonAssumed: !input.canton };
  } catch (error) { return error instanceof RuleNotSigned ? { pending: true } : { invalid: true }; }
}

export function DeadlineFields({ ruleId, value, onChange, lang, idBase }: { ruleId: string; value: DeadlineInput; onChange: (v: DeadlineInput) => void; lang: KnowledgeLanguage; idBase: string }) {
  const rule = DEADLINE_RULES.get(ruleId);
  if (!rule) return null;
  const t = (k: SiteKey) => st(k, lang);
  const set = (patch: Partial<DeadlineInput>) => onChange({ ...value, ...patch });
  const eventKey = `ev_${rule.id}`;
  const isEvent = rule.receipt_doctrine === 'event';
  return (
    <fieldset className="q q-deadline">
      <legend>{isEvent ? (eventKey in SITE_TEXT ? t(eventKey as SiteKey) : t('d_event')) : t('whenReceived')}</legend>
      {!isEvent && (
        <div className="seg" role="radiogroup" aria-label={t('howReceived')}>
          {(['personal', 'registered', 'ordinary'] as const).map(m => (
            <label key={m} className="seg-opt">
              <input type="radio" name={`${idBase}-m`} checked={value.method === m} onChange={() => set({ method: m })} />
              <span>{t(`mm_${m}` as SiteKey)}</span>
            </label>
          ))}
        </div>
      )}
      {isEvent || value.method !== 'registered' ? (
        <label className="field"><span>{isEvent ? t('d_event') : t('dd_received')}</span>
          <input type="date" value={value.date} max="2100-12-31" onChange={e => set({ date: e.target.value })} /></label>
      ) : (
        <>
          <label className="field"><span>{t('dd_notice')}</span>
            <input type="date" value={value.notice} max="2100-12-31" onChange={e => set({ notice: e.target.value })} /></label>
          <label className="field"><span>{t('dd_collected')}</span>
            <input type="date" value={value.collected} min={value.notice || undefined} max="2100-12-31" onChange={e => set({ collected: e.target.value })} /></label>
        </>
      )}
      <label className="field field-inline"><span>{t('cantonOptional')}</span>
        <select value={value.canton} onChange={e => set({ canton: e.target.value })}>
          <option value="">–</option>
          {CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
    </fieldset>
  );
}

export function DeadlineAnswer({ computed, ruleId, lang }: { computed: Computed | null; ruleId: string; lang: KnowledgeLanguage }) {
  const t = (k: SiteKey, v?: Record<string, string | number>) => st(k, lang, v);
  const rule = DEADLINE_RULES.get(ruleId);
  if (!rule) return null;
  if (!computed) return <p className="due-prompt">{t('enterDate')}</p>;
  if (computed.pending) return <p className="due-note">{t('calcPending')}</p>;
  const r = computed.result;
  if (computed.invalid || !r || !r.bindingDue) return <p className="due-alert">{t('noDate')}</p>;
  return (
    <div className="due" aria-live="polite">
      <p className="due-label">{t('actUntil')}</p>
      <p className="due-date">{formatDate(r.bindingDue, lang)}</p>
      {r.daysLeft !== null && !r.expired && (
        <p className="due-left">{r.daysLeft === 0 ? t('today') : r.daysLeft === 1 ? t('dayLeft') : t('daysLeft', { n: r.daysLeft })}</p>
      )}
      {r.expired && <p className="due-alert">{t('expired')}</p>}
      {r.urgent && <p className="due-alert">{t('urgent')}</p>}
      {r.couldBeLater.map(l => (
        <p key={l.date} className="due-note">{t('couldBeLater', { date: formatDate(l.date, lang, false), reason: t(`later_${l.code}` as SiteKey) })}</p>
      ))}
      {r.notes.filter(n => n !== 'expired').map(n => <p key={n} className="due-note">{t(`note_${n}` as SiteKey)}</p>)}
      {computed.cantonAssumed && <p className="due-note">{t('cantonHint')}</p>}
      <details className="due-how">
        <summary>{t('howCalculated')}</summary>
        <ol>
          <li>{t('calcReceipt', { date: formatDate(r.receiptDate!, lang, false) })}</li>
          <li>{t('calcPlus', { n: rule.duration_days })}</li>
          <li>{t('calcEnd', { date: formatDate(r.bindingDue, lang, false) })}</li>
        </ol>
        <p>{t('basis')}: {r.legalBasis.join(', ')}</p>
        {r.ruleStatus !== 'signed' && <p>{t('calcDraft')}</p>}
        <p>{t('calcAdvice')}</p>
      </details>
    </div>
  );
}
