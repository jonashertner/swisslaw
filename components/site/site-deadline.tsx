import { useId, useMemo, useState } from 'react';
import { CANTONS, computeDeadline, DEADLINE_RULES, RuleNotSigned, type Delivery, type DeliveryMethod } from '@/lib/swisslaw-chat/deadlines';
import type { KnowledgeLanguage } from '@/lib/swisslaw-chat/knowledge';
import { FULL_DATE_LOCALE, SITE_TEXT, st, type SiteKey } from '@/lib/swisslaw-chat/site-i18n';
import type { Channel } from '@/lib/swisslaw-chat/site';

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDate(iso: string, lang: KnowledgeLanguage, weekday = true): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const opts: Intl.DateTimeFormatOptions = { ...(weekday ? { weekday: 'long' } : {}), day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  try { return new Intl.DateTimeFormat(FULL_DATE_LOCALE[lang], opts).format(date); }
  catch { return new Intl.DateTimeFormat('de-CH', opts).format(date); }
}

type Method = 'personal' | 'notice' | 'collected' | 'ordinary';
export default function DeadlineCalculator({ ruleIds, lang, channel }: { ruleIds: string[]; lang: KnowledgeLanguage; channel: Channel }) {
  const rule = DEADLINE_RULES.get(ruleIds[0]);
  const id = useId();
  const isEvent = rule?.receipt_doctrine === 'event';
  const [method, setMethod] = useState<Method>('personal');
  const [date, setDate] = useState('');
  const [collected, setCollected] = useState('');
  const [canton, setCanton] = useState('');
  const t = (k: SiteKey, v?: Record<string, string | number>) => st(k, lang, v);

  const result = useMemo(() => {
    if (!rule || !date || !canton) return null;
    let delivery: Delivery;
    if (isEvent) delivery = { method: 'event', date };
    else if (method === 'notice') delivery = { method: 'registered', noticeDate: date, ...(collected ? { collectedDate: collected } : {}) };
    else if (method === 'collected') delivery = { method: 'registered', collectedDate: date };
    else delivery = { method: method as DeliveryMethod, date };
    try { return { ok: computeDeadline(rule.id, delivery, canton, { today: localToday(), requireSigned: channel === 'public' }) }; }
    catch (error) { return { error: error instanceof RuleNotSigned ? 'pending' as const : 'invalid' as const }; }
  }, [rule, date, collected, canton, method, isEvent, channel]);

  if (!rule) return null;
  const eventKey = `ev_${rule.id}`;
  const dateLabel = isEvent ? (eventKey in SITE_TEXT ? t(eventKey as SiteKey) : t('d_event')) : t(`d_${method}` as SiteKey);
  const r = result && 'ok' in result ? result.ok : null;

  return (
    <section className="dl" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="dl-title"><span className="dot" aria-hidden="true" />{t('calcTitle')}</h2>
      {!isEvent && (
        <fieldset className="dl-methods">
          <legend>{t('calcHow')}</legend>
          {(['personal', 'notice', 'collected', 'ordinary'] as const).map(m => (
            <label key={m} className="choice">
              <input type="radio" name={`${id}-m`} value={m} checked={method === m} onChange={() => { setMethod(m); setCollected(''); }} />
              <span>{t(`m_${m}` as SiteKey)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="dl-fields">
        <label className="field"><span>{dateLabel}</span><input type="date" value={date} max="2100-12-31" onChange={e => setDate(e.target.value)} /></label>
        {!isEvent && method === 'notice' && (
          <label className="field"><span>{t('d_collected')}</span><input type="date" value={collected} min={date || undefined} onChange={e => setCollected(e.target.value)} /></label>
        )}
        <label className="field"><span>{t('canton')}</span>
          <select value={canton} onChange={e => setCanton(e.target.value)}>
            <option value="">–</option>
            {CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="dl-result" aria-live="polite">
        {result && 'error' in result && <p className="dl-note">{result.error === 'pending' ? t('calcPending') : t('noDate')}</p>}
        {r && !r.bindingDue && <p className="dl-alert">{t('noDate')}</p>}
        {r?.bindingDue && (
          <>
            <p className="dl-actby">{t('actBy')}</p>
            <p className="dl-date">{formatDate(r.bindingDue, lang)}</p>
            {r.daysLeft !== null && !r.expired && (
              <p className={`dl-left${r.urgent ? ' is-urgent' : ''}`}>{r.daysLeft === 0 ? t('today') : r.daysLeft === 1 ? t('dayLeft') : t('daysLeft', { n: r.daysLeft })}</p>
            )}
            {r.expired && <p className="dl-alert">{t('expired')}</p>}
            {r.urgent && <p className="dl-alert">{t('urgent')}</p>}
            {r.couldBeLater.map(l => (
              <p key={l.date} className="dl-note">{t('couldBeLater', { date: formatDate(l.date, lang, false) })} ({t(`later_${l.code}` as SiteKey)})</p>
            ))}
            {r.notes.filter(n => n !== 'expired').map(n => <p key={n} className="dl-note">{t(`note_${n}` as SiteKey)}</p>)}
            <details className="dl-how">
              <summary>{t('howCalculated')}</summary>
              <ol>
                <li>{t('calcReceipt', { date: formatDate(r.receiptDate!, lang, false) })}</li>
                <li>{t('calcPlus', { n: rule.duration_days })}</li>
                <li>{t('calcEnd', { date: formatDate(r.bindingDue, lang, false) })}</li>
              </ol>
              <p>{t('basis')}: {r.legalBasis.join(', ')}</p>
            </details>
            {r.ruleStatus !== 'signed' && <p className="dl-draft">{t('calcDraft')}</p>}
            <p className="dl-fine">{t('calcAdvice')}</p>
          </>
        )}
      </div>
    </section>
  );
}
