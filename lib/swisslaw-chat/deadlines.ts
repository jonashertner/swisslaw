// Deterministic Swiss deadline (Frist) engine. No model inference.
//
// The binding date is the EARLIEST date a deadline can end on, given what is known.
// Every uncertainty (receipt doctrine, unverified cantonal holidays) resolves towards
// the earlier date and is reported with the later date it could otherwise be. A person
// who acts by the binding date is never late because of this computation.
// Rules: deadline-rules.json; holidays: deadline-holidays.json. Dates are ISO 'YYYY-MM-DD'.
import rulesFile from './deadline-rules.json';
import holidaysFile from './deadline-holidays.json';

export type IsoDate = string;
export type DeliveryMethod = 'personal' | 'registered' | 'ordinary' | 'event';
export type Delivery = { method: DeliveryMethod; date?: IsoDate; noticeDate?: IsoDate; collectedDate?: IsoDate };
type Doctrine = 'procedural_fiction' | 'relative_receipt' | 'absolute_receipt' | 'personal_service' | 'event';
type LegalBasis = { law: string; sr?: string; article: string; paragraph?: string; source_url: string };
export type DeadlineRule = {
  id: string; title_de: string; domain: string; duration_days: number; receipt_doctrine: Doctrine;
  standstill: 'none'; schkg_63_extension: boolean; calendar: string; legal_basis: LegalBasis[];
  case_law?: string[]; how_to_meet: string; status: 'draft' | 'signed'; signed_by: string | null; signed_at: string | null;
};
export type DeadlineResult = {
  ruleId: string; ruleStatus: string; bindingDue: IsoDate | null; receiptDate: IsoDate | null;
  couldBeLater: { date: IsoDate; reason: string; code: LaterCode }[]; assumptions: string[]; warnings: string[]; trace: string[];
  /** Stable codes for every assumption and warning, for translated interfaces. */
  notes: NoteCode[];
  legalBasis: string[]; needsLawyer: boolean; daysLeft: number | null; urgent: boolean; expired: boolean;
};
export type NoteCode = 'absolute_receipt' | 'zb_collected' | 'zb_no_service' | 'ordinary_service_doubt' | 'notice_unknown_estimate' | 'fiction_assumed' | 'relative_deemed' | 'notice_unknown_collected' | 'served_in_ferien' | 'served_sunday' | 'served_holiday' | 'expired';
export type LaterCode = 'next_day_receipt' | 'candidate_holidays' | 'both' | 'closed_time' | 'closed_time_candidate';
export class RuleNotSigned extends Error {}

const DOCTRINES = new Set(['procedural_fiction', 'relative_receipt', 'absolute_receipt', 'personal_service', 'event']);
export const URGENT_DAYS = 5;
const FICTION_DAYS = 7; // ZPO 138 Abs. 3 lit. a, StPO 85 Abs. 4 lit. a; holding period for relative receipt

// --- dates as UTC day numbers --------------------------------------------------
const DAY = 86_400_000;
function toDay(iso: IsoDate): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`INVALID_DATE ${iso}`);
  const d = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  if (new Date(d).toISOString().slice(0, 10) !== iso) throw new Error(`INVALID_DATE ${iso}`);
  return d / DAY;
}
const toIso = (day: number): IsoDate => new Date(day * DAY).toISOString().slice(0, 10);
const ymd = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / DAY;
const yearOf = (day: number) => new Date(day * DAY).getUTCFullYear();
const isWeekend = (day: number) => { const w = new Date(day * DAY).getUTCDay(); return w === 0 || w === 6; };
const isSunday = (day: number) => new Date(day * DAY).getUTCDay() === 0;

export function easterSunday(year: number): IsoDate {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return toIso(ymd(year, Math.floor(n / 31), (n % 31) + 1));
}

// --- holidays --------------------------------------------------------------
type HolidayEntry = { id: string; fixed?: string; easter_offset?: number; weekday_rule?: string };
type HolidayData = {
  federal: HolidayEntry[]; common_candidates: HolidayEntry[]; catholic_candidates: HolidayEntry[];
  catholic_cantons: string[]; canton_specific_candidates: Record<string, HolidayEntry[]>;
  canton_certain: Record<string, HolidayEntry[]>; cantons: string[];
};
const HOLIDAYS = holidaysFile as unknown as HolidayData;
export const CANTONS: readonly string[] = HOLIDAYS.cantons;

function nthSundayOfSeptember(year: number, n: number): number {
  const first = ymd(year, 9, 1); const w = new Date(first * DAY).getUTCDay();
  return first + ((7 - w) % 7) + 7 * (n - 1);
}
function resolveHoliday(e: HolidayEntry, year: number): number {
  if (e.fixed) { const [m, d] = e.fixed.split('-').map(Number); return ymd(year, m, d); }
  if (e.easter_offset !== undefined) return toDay(easterSunday(year)) + e.easter_offset;
  if (e.weekday_rule === 'thursday_after_first_sunday_of_september') return nthSundayOfSeptember(year, 1) + 4;
  if (e.weekday_rule === 'monday_after_third_sunday_of_september') return nthSundayOfSeptember(year, 3) + 1;
  if (e.weekday_rule === 'first_thursday_of_april') { const f = ymd(year, 4, 1); return f + ((4 - new Date(f * DAY).getUTCDay() + 7) % 7); }
  throw new Error(`INVALID_HOLIDAY ${e.id}`);
}
export function checkedCanton(canton: string): string {
  const c = canton.toUpperCase();
  if (!CANTONS.includes(c)) throw new Error(`UNKNOWN_CANTON ${canton}`);
  return c;
}
function certainEntries(canton: string): HolidayEntry[] { return [...HOLIDAYS.federal, ...(HOLIDAYS.canton_certain?.[canton] ?? [])]; }
function candidateEntries(canton: string): HolidayEntry[] {
  const certain = new Set(certainEntries(canton).map(e => e.id));
  return [...HOLIDAYS.common_candidates, ...(HOLIDAYS.catholic_cantons.includes(canton) ? HOLIDAYS.catholic_candidates : []), ...(HOLIDAYS.canton_specific_candidates?.[canton] ?? [])]
    .filter(e => !certain.has(e.id));
}
export function holidays(canton: string, year: number, certainty: 'certain' | 'candidate'): { id: string; date: IsoDate }[] {
  const c = checkedCanton(canton);
  return (certainty === 'certain' ? certainEntries(c) : candidateEntries(c)).map(e => ({ id: e.id, date: toIso(resolveHoliday(e, year)) }));
}
function holidaySet(canton: string, years: number[], includeCandidates: boolean): Set<number> {
  const out = new Set<number>();
  for (const y of years) {
    for (const h of certainEntries(canton)) out.add(resolveHoliday(h, y));
    if (includeCandidates) for (const h of candidateEntries(canton)) out.add(resolveHoliday(h, y));
  }
  return out;
}

// SchKG 56 Abs. 1 Ziff. 2: seven days before and after Easter and Christmas, and 15 to 31 July.
export function betreibungsferienContaining(iso: IsoDate): [IsoDate, IsoDate] | null {
  const day = toDay(iso); const w = ferienContaining(day);
  return w ? [toIso(w[0]), toIso(w[1])] : null;
}
function ferienContaining(day: number): [number, number] | null {
  const y = yearOf(day); const e = toDay(easterSunday(y));
  const windows: [number, number][] = [[ymd(y - 1, 12, 18), ymd(y, 1, 1)], [e - 7, e + 7], [ymd(y, 7, 15), ymd(y, 7, 31)], [ymd(y, 12, 18), ymd(y + 1, 1, 1)]];
  return windows.find(([s, t]) => s <= day && day <= t) ?? null;
}

// --- rules -----------------------------------------------------------------
export function validateRule(r: DeadlineRule): void {
  const required = ['id', 'title_de', 'duration_days', 'receipt_doctrine', 'standstill', 'schkg_63_extension', 'calendar', 'legal_basis', 'status'] as const;
  for (const k of required) if (r[k] === undefined) throw new Error(`INVALID_RULE ${r.id}: missing ${k}`);
  if (!DOCTRINES.has(r.receipt_doctrine)) throw new Error(`INVALID_RULE ${r.id}: receipt_doctrine`);
  if (r.standstill !== 'none') throw new Error(`INVALID_RULE ${r.id}: standstill ${r.standstill} not implemented`);
  if (!Number.isInteger(r.duration_days) || r.duration_days <= 0) throw new Error(`INVALID_RULE ${r.id}: duration_days`);
  for (const lb of r.legal_basis) if (!lb.law || !lb.article || !lb.source_url) throw new Error(`INVALID_RULE ${r.id}: legal_basis`);
  if (r.status === 'signed' && !(r.signed_by && r.signed_at)) throw new Error(`INVALID_RULE ${r.id}: signed without signer`);
}
export const DEADLINE_RULES: ReadonlyMap<string, DeadlineRule> = (() => {
  const m = new Map<string, DeadlineRule>();
  for (const r of (rulesFile as unknown as { rules: DeadlineRule[] }).rules) {
    validateRule(r);
    if (m.has(r.id)) throw new Error(`INVALID_RULE duplicate ${r.id}`);
    m.set(r.id, r);
  }
  return m;
})();
const cite = (lb: LegalBasis) => `Art. ${lb.article}${lb.paragraph ? ` Abs. ${lb.paragraph}` : ''} ${lb.law}`;

// --- receipt ---------------------------------------------------------------
// Candidate receipt days, earliest first. The first is binding; later ones feed couldBeLater.
type Receipt = [day: number, why: string, code?: LaterCode];
function receipts(rule: DeadlineRule, d: Delivery, res: DeadlineResult): Receipt[] {
  const doctrine = rule.receipt_doctrine;
  if (doctrine === 'event') {
    if (d.method !== 'event' || !d.date) throw new Error(`EVENT_REQUIRED ${rule.id}`);
    return [[toDay(d.date), 'event']];
  }
  if (d.method === 'personal') {
    if (!d.date) throw new Error('DATE_REQUIRED');
    return [[toDay(d.date), 'handed over in person']];
  }
  if (doctrine === 'personal_service') {
    if (d.method === 'registered' && d.collectedDate) {
      res.warnings.push('Zahlungsbefehl by post: the deadline runs from the day it was collected.'); res.notes.push('zb_collected');
      return [[toDay(d.collectedDate), 'collected at the post office']];
    }
    res.needsLawyer = true;
    res.warnings.push('Zahlungsbefehl not handed over or collected: no safe start date. Lawyer must assess service before any date is given.'); res.notes.push('zb_no_service');
    return [];
  }
  if (d.method === 'ordinary') {
    if (!d.date) throw new Error('DATE_REQUIRED');
    if (doctrine === 'procedural_fiction') {
      res.warnings.push('Decision received by ordinary mail: proper service is in doubt; lawyer to check.'); res.notes.push('ordinary_service_doubt');
      res.needsLawyer = true;
    }
    return [[toDay(d.date), 'in the letterbox (ordinary mail)']];
  }
  if (d.method !== 'registered') throw new Error(`UNSUPPORTED_DELIVERY ${d.method}`);
  const notice = d.noticeDate ? toDay(d.noticeDate) : null;
  const collected = d.collectedDate ? toDay(d.collectedDate) : null;
  if (doctrine === 'absolute_receipt') {
    if (notice !== null) {
      res.assumptions.push('Receipt = day the pickup notice was left (absolute receipt theory, BGE 143 III 15 E. 4.1). The 7-day collection period does not extend this deadline.'); res.notes.push('absolute_receipt');
      return [[notice, 'pickup notice day'], [notice + 1, 'if same-day collection could not be expected']];
    }
    if (collected !== null) {
      res.needsLawyer = true;
      res.warnings.push('Pickup-notice date unknown. The deadline ran from the notice, not from collection; estimated as up to 7 days before collection. Ask for the notice date.'); res.notes.push('notice_unknown_estimate');
      return [[collected - FICTION_DAYS, 'estimated notice day (unknown)']];
    }
    throw new Error('NOTICE_OR_COLLECTION_REQUIRED');
  }
  if (notice !== null) {
    const deemed = notice + FICTION_DAYS;
    if (collected !== null && collected < deemed) return [[collected, 'collected at the post office']];
    res.assumptions.push(doctrine === 'procedural_fiction'
      ? 'Uncollected registered mail deemed served on the 7th day after the failed delivery attempt (only if service had to be expected).'
      : 'Notice deemed received on the last (7th) day of the holding period.');
    res.notes.push(doctrine === 'procedural_fiction' ? 'fiction_assumed' : 'relative_deemed');
    return [[deemed, '7th day after the pickup notice']];
  }
  if (collected !== null) {
    res.warnings.push('Pickup-notice date unknown: if collection was more than 7 days after the notice, the deadline started earlier. Ask for the notice date.'); res.notes.push('notice_unknown_collected');
    res.needsLawyer = true;
    return [[collected, 'collected (notice date unknown)']];
  }
  throw new Error('NOTICE_OR_COLLECTION_REQUIRED');
}

// --- counting --------------------------------------------------------------
const isOff = (day: number, hol: Set<number>) => isWeekend(day) || hol.has(day);
function rollForward(day: number, hol: Set<number>): number { while (isOff(day, hol)) day += 1; return day; }
function schkg63(end: number, rawEnd: number, hol: Set<number>, trace: string[]): number {
  const w = ferienContaining(rawEnd) ?? ferienContaining(end);
  if (!w) return end;
  let day = w[1], counted = 0;
  while (counted < 3) { day += 1; if (!isOff(day, hol)) counted += 1; }
  trace.push(`end falls in Betreibungsferien ${toIso(w[0])}–${toIso(w[1])}: extended to the 3rd working day after them (SchKG 63) = ${toIso(day)}`);
  return day;
}
// SchKG 56 Abs. 1: a Betreibungshandlung on a Sunday, a public holiday or in the Betreibungsferien
// is not void; it takes effect on the first day after that closed period (BGE 121 III 284 E. 2b).
// Saturdays are not closed.
const isClosed = (day: number, hol: Set<number>) => isSunday(day) || hol.has(day) || ferienContaining(day) !== null;
function firstOpenDay(day: number, hol: Set<number>): number { do day += 1; while (isClosed(day, hol)); return day; }
function endDay(rule: DeadlineRule, receipt: number, hol: Set<number>, trace: string[]): number {
  const rawEnd = receipt + rule.duration_days;
  trace.push(`receipt ${toIso(receipt)} + ${rule.duration_days} days = ${toIso(rawEnd)} (counting starts the next day)`);
  let end = rollForward(rawEnd, hol);
  if (end !== rawEnd) trace.push(`${toIso(rawEnd)} is a Saturday, Sunday or holiday: moves to ${toIso(end)}`);
  if (rule.schkg_63_extension) end = schkg63(end, rawEnd, hol, trace);
  return end;
}

// --- public API ------------------------------------------------------------
export function computeDeadline(ruleId: string, delivery: Delivery, canton: string,
  options: { today?: IsoDate; requireSigned?: boolean } = {}): DeadlineResult {
  const rule = DEADLINE_RULES.get(ruleId);
  if (!rule) throw new Error(`UNKNOWN_RULE ${ruleId}`);
  if ((options.requireSigned ?? true) && rule.status !== 'signed') throw new RuleNotSigned(`rule ${ruleId} is ${rule.status}; a lawyer must sign it off`);
  const c = checkedCanton(canton);
  const res: DeadlineResult = {
    ruleId, ruleStatus: rule.status, bindingDue: null, receiptDate: null, couldBeLater: [],
    assumptions: [`Holidays of canton ${c}: ${rule.calendar}.`], warnings: [], trace: [],
    legalBasis: rule.legal_basis.map(cite), needsLawyer: false, daysLeft: null, urgent: false, expired: false, notes: [],
  };
  const rs = receipts(rule, delivery, res);
  if (!rs.length) return res;
  const receipt = rs[0][0];
  res.receiptDate = toIso(receipt);
  const years = [yearOf(receipt), yearOf(receipt) + 1];
  const certain = holidaySet(c, years, false);
  const broad = holidaySet(c, years, true);
  if (rule.schkg_63_extension && isClosed(receipt, broad)) {
    // The binding date still runs from the day of service: some decisions treat such service as
    // merely open to complaint rather than deferred. The deferred start is reported as the later date.
    const [note, what]: [NoteCode, string] = ferienContaining(receipt) ? ['served_in_ferien', 'during Betreibungsferien']
      : isSunday(receipt) ? ['served_sunday', 'on a Sunday'] : ['served_holiday', 'on a public holiday'];
    res.notes.push(note);
    res.warnings.push(`Served ${what} (SchKG 56 Abs. 1): service takes effect only on the first day after (BGE 121 III 284 E. 2b); the binding date still counts from the day of service.`);
    for (const hol of [certain, broad]) {
      if (!isClosed(receipt, hol)) continue;
      const open = firstOpenDay(receipt, hol);
      if (!rs.some(([day]) => day === open)) rs.push([open, `service takes effect on ${toIso(open)}, the first day after the closed period`, hol === certain ? 'closed_time' : 'closed_time_candidate']);
    }
  }
  const binding = endDay(rule, receipt, certain, res.trace);
  res.bindingDue = toIso(binding);
  const later = new Map<number, { reason: string; code: LaterCode }>();
  for (const [r, why, code] of rs) {
    for (const [hol, label] of [[certain, null], [broad, "if the canton's candidate holidays apply"]] as const) {
      const end = endDay(rule, r, hol, []);
      const nextDay = r !== receipt;
      if (end > binding && !later.has(end)) later.set(end, {
        reason: [nextDay ? why : null, label].filter(Boolean).join('; '),
        code: code === 'closed_time' && label ? 'closed_time_candidate' : code ?? (nextDay && label ? 'both' : nextDay ? 'next_day_receipt' : 'candidate_holidays'),
      });
    }
  }
  res.couldBeLater = [...later].sort((a, b) => a[0] - b[0]).map(([day, v]) => ({ date: toIso(day), ...v }));
  if (options.today) {
    res.daysLeft = binding - toDay(options.today);
    res.expired = res.daysLeft < 0;
    res.urgent = !res.expired && res.daysLeft < URGENT_DAYS;
    if (res.expired) { res.needsLawyer = true; res.warnings.push('Deadline has passed on the binding date: lawyer to check restoration or whether a later date applies.'); res.notes.push('expired'); }
  }
  return res;
}
