import test from 'node:test';
import assert from 'node:assert/strict';
import { betreibungsferienContaining, computeDeadline, DEADLINE_RULES, easterSunday, holidays, RuleNotSigned, type Delivery } from '../lib/swisslaw-chat/deadlines';

// Every expected date was computed by hand from the statute text; weekdays are noted
// so a reviewing lawyer can check each case without running code.
const run = (rule: string, d: Delivery, canton = 'ZH', today?: string) => computeDeadline(rule, d, canton, { requireSigned: false, today });
const personal = (date: string): Delivery => ({ method: 'personal', date });
const later = (r: ReturnType<typeof run>) => r.couldBeLater.map(x => x.date);

test('Easter and weekday-rule holidays', () => {
  for (const [y, e] of [[2024, '2024-03-31'], [2025, '2025-04-20'], [2026, '2026-04-05'], [2027, '2027-03-28'], [2038, '2038-04-25']] as const) assert.equal(easterSunday(y), e);
  assert.equal(holidays('GE', 2026, 'candidate').find(h => h.id === 'jeune_genevois')?.date, '2026-09-10');
  assert.equal(holidays('VD', 2026, 'candidate').find(h => h.id === 'lundi_du_jeune')?.date, '2026-09-21');
  assert.deepEqual(holidays('ZH', 2026, 'certain'), [{ id: 'bundesfeiertag', date: '2026-08-01' }]);
});

test('Betreibungsferien windows (SchKG 56)', () => {
  assert.deepEqual(betreibungsferienContaining('2026-12-18'), ['2026-12-18', '2027-01-01']);
  assert.deepEqual(betreibungsferienContaining('2027-01-01'), ['2026-12-18', '2027-01-01']);
  assert.equal(betreibungsferienContaining('2027-01-02'), null);
  assert.deepEqual(betreibungsferienContaining('2026-03-29'), ['2026-03-29', '2026-04-12']);
  assert.deepEqual(betreibungsferienContaining('2026-07-31'), ['2026-07-15', '2026-07-31']);
  assert.equal(betreibungsferienContaining('2026-08-01'), null);
});

test('rules validate; unsigned rules and unknown input are refused', () => {
  assert.ok(DEADLINE_RULES.size >= 7);
  for (const r of DEADLINE_RULES.values()) if (r.status !== 'signed') assert.throws(() => computeDeadline(r.id, r.receipt_doctrine === 'event' ? { method: 'event', date: '2026-10-05' } : personal('2026-10-05'), 'ZH'), RuleNotSigned);
  assert.throws(() => run('stpo_354_einsprache_strafbefehl', personal('2026-10-05'), 'XX'), /UNKNOWN_CANTON/);
  assert.throws(() => run('stpo_354_einsprache_strafbefehl', personal('2026-02-30')), /INVALID_DATE/);
  assert.throws(() => run('or_270_anfechtung_anfangsmietzins', personal('2026-10-01')), /EVENT_REQUIRED/);
});

test('SchKG 74 Rechtsvorschlag', () => {
  assert.equal(run('schkg_74_rechtsvorschlag', personal('2026-10-05')).bindingDue, '2026-10-15'); // Mon + 10 = Thu
  assert.equal(run('schkg_74_rechtsvorschlag', personal('2026-10-07')).bindingDue, '2026-10-19'); // Sat 17 -> Mon 19
  // Thu 10 Dec + 10 = Sun 20 Dec in ferien -> 3rd working day after Fri 1 Jan: Wed 6 Jan
  assert.equal(run('schkg_74_rechtsvorschlag', personal('2026-12-10')).bindingDue, '2027-01-06');
  // Mon 6 Jul + 10 = Thu 16 Jul in ferien -> after Fri 31 Jul (Sat 1 Aug, Sun): Mon 3, Tue 4, Wed 5 Aug
  assert.equal(run('schkg_74_rechtsvorschlag', personal('2026-07-06')).bindingDue, '2026-08-05');
  // Wed 10 Mar 2027 + 10 = Sat 20 Mar -> Mon 22 Mar (ferien 21 Mar–4 Apr) -> Mon 5, Tue 6, Wed 7 Apr
  const easter = run('schkg_74_rechtsvorschlag', personal('2027-03-10'));
  assert.equal(easter.bindingDue, '2027-04-07'); assert.deepEqual(later(easter), []);
  // Tue 12 Dec 2028 + 10 = Fri 22 Dec in ferien -> Tue 2, Wed 3, Thu 4 Jan 2029; Berchtoldstag candidate -> 5 Jan
  const berchtold = run('schkg_74_rechtsvorschlag', personal('2028-12-12'));
  assert.equal(berchtold.bindingDue, '2029-01-04'); assert.deepEqual(later(berchtold), ['2029-01-05']);
  const uncollected = run('schkg_74_rechtsvorschlag', { method: 'registered', noticeDate: '2026-10-05' });
  assert.equal(uncollected.bindingDue, null); assert.ok(uncollected.needsLawyer);
  assert.ok(run('schkg_74_rechtsvorschlag', personal('2026-07-20')).warnings.some(w => w.includes('Betreibungsferien')));
});

test('SchKG 56: service in a closed period takes effect afterwards (BGE 121 III 284 E. 2b)', () => {
  // Mon 20 Jul + 10 = Thu 30 Jul in ferien -> Wed 5 Aug binding. Effect after Fri 31 Jul: Sat 1 Aug holiday, Sun 2 -> Mon 3 Aug + 10 = Thu 13 Aug
  const july = run('schkg_74_rechtsvorschlag', personal('2026-07-20'));
  assert.equal(july.bindingDue, '2026-08-05'); assert.deepEqual(later(july), ['2026-08-13']);
  assert.deepEqual(july.notes, ['served_in_ferien']); assert.ok(!july.needsLawyer);
  assert.equal(july.couldBeLater[0].code, 'closed_time');
  // Mon 21 Dec -> binding Wed 6 Jan. Effect Sat 2 Jan (Saturday is not closed) + 10 = Tue 12 Jan;
  // if Berchtoldstag counts: Mon 4 Jan + 10 = Thu 14 Jan
  const christmas = run('schkg_74_rechtsvorschlag', personal('2026-12-21'));
  assert.deepEqual(christmas.couldBeLater.map(x => [x.date, x.code]), [['2027-01-12', 'closed_time'], ['2027-01-14', 'closed_time_candidate']]);
  // Sun 4 Oct + 10 = Wed 14 Oct; effect Mon 5 Oct -> Thu 15 Oct
  const sunday = run('schkg_74_rechtsvorschlag', personal('2026-10-04'));
  assert.equal(sunday.bindingDue, '2026-10-14'); assert.deepEqual(later(sunday), ['2026-10-15']); assert.deepEqual(sunday.notes, ['served_sunday']);
  // Tue 1 Aug 2028 (federal holiday) + 10 = Fri 11 Aug; effect Wed 2 Aug + 10 = Sat 12 -> Mon 14 Aug
  const holiday = run('schkg_74_rechtsvorschlag', personal('2028-08-01'));
  assert.equal(holiday.bindingDue, '2028-08-11'); assert.deepEqual(later(holiday), ['2028-08-14']); assert.deepEqual(holiday.notes, ['served_holiday']);
  // Saturday service is allowed: no note, no later date
  const saturday = run('schkg_74_rechtsvorschlag', personal('2026-10-03'));
  assert.deepEqual(saturday.notes, []); assert.deepEqual(later(saturday), []);
  // Other rules are not Betreibungshandlungen
  assert.deepEqual(run('stpo_354_einsprache_strafbefehl', personal('2026-10-04')).notes, []);
});

test('StPO 354 Einsprache gegen Strafbefehl', () => {
  // Notice Tue 3 Nov -> deemed served Tue 10 Nov -> Fri 20 Nov
  const fiction = run('stpo_354_einsprache_strafbefehl', { method: 'registered', noticeDate: '2026-11-03' });
  assert.equal(fiction.receiptDate, '2026-11-10'); assert.equal(fiction.bindingDue, '2026-11-20');
  // Collected Thu 5 Nov + 10 = Sun 15 -> Mon 16 Nov
  assert.equal(run('stpo_354_einsprache_strafbefehl', { method: 'registered', noticeDate: '2026-11-03', collectedDate: '2026-11-05' }).bindingDue, '2026-11-16');
  // Late collection does not postpone
  assert.equal(run('stpo_354_einsprache_strafbefehl', { method: 'registered', noticeDate: '2026-11-03', collectedDate: '2026-11-13' }).receiptDate, '2026-11-10');
  assert.equal(run('stpo_354_einsprache_strafbefehl', personal('2026-07-20')).bindingDue, '2026-07-30'); // StPO 89 Abs. 2: no court holidays
  assert.equal(run('stpo_354_einsprache_strafbefehl', personal('2028-07-22')).bindingDue, '2028-08-02'); // Tue 1 Aug 2028 is certain
  // Fri 27 Mar 2026 + 10 = Easter Monday 6 Apr (candidate only) -> binding 6 Apr, could be 7 Apr
  const easterMonday = run('stpo_354_einsprache_strafbefehl', personal('2026-03-27'));
  assert.equal(easterMonday.bindingDue, '2026-04-06'); assert.deepEqual(later(easterMonday), ['2026-04-07']);
});

test('OR 273 / 270b tenancy receipt doctrines', () => {
  // Absolute receipt: notice Mon 5 Oct + 30 = Wed 4 Nov; next-day reading Thu 5 Nov
  const abs = run('or_273_anfechtung_kuendigung', { method: 'registered', noticeDate: '2026-10-05' });
  assert.equal(abs.bindingDue, '2026-11-04'); assert.deepEqual(later(abs), ['2026-11-05']);
  const collectedLate = run('or_273_anfechtung_kuendigung', { method: 'registered', noticeDate: '2026-10-05', collectedDate: '2026-10-12' });
  assert.equal(collectedLate.receiptDate, '2026-10-05'); // 7-day fiction does not apply (BGE 143 III 15)
  assert.equal(run('or_273_anfechtung_kuendigung', personal('2026-07-01')).bindingDue, '2026-07-31'); // no summer standstill
  const unknownNotice = run('or_273_anfechtung_kuendigung', { method: 'registered', collectedDate: '2026-10-12' });
  assert.equal(unknownNotice.receiptDate, '2026-10-05'); assert.ok(unknownNotice.needsLawyer);
  // Relative receipt: uncollected -> Mon 12 Oct + 30 = Wed 11 Nov; collected Wed 7 Oct -> Fri 6 Nov
  assert.equal(run('or_270b_anfechtung_mietzinserhoehung', { method: 'registered', noticeDate: '2026-10-05' }).bindingDue, '2026-11-11');
  assert.equal(run('or_270b_anfechtung_mietzinserhoehung', { method: 'registered', noticeDate: '2026-10-05', collectedDate: '2026-10-07' }).bindingDue, '2026-11-06');
});

test('OR 336b 180 days and urgency', () => {
  assert.equal(run('or_336b_klage_missbraeuchliche_kuendigung', { method: 'event', date: '2026-12-31' }).bindingDue, '2027-06-29');
  const d = personal('2026-10-05'); // due Thu 15 Oct
  assert.ok(run('schkg_74_rechtsvorschlag', d, 'ZH', '2026-10-12').urgent);
  assert.ok(!run('schkg_74_rechtsvorschlag', d, 'ZH', '2026-10-05').urgent);
  const expired = run('schkg_74_rechtsvorschlag', d, 'ZH', '2026-10-16');
  assert.ok(expired.expired && expired.needsLawyer && !expired.urgent);
});

test('safety: binding date is a working day, never before the raw end, never after an alternative', () => {
  const start = Date.UTC(2026, 0, 1);
  for (const rule of DEADLINE_RULES.values()) for (const canton of ['ZH', 'GE', 'TI']) for (let i = 0; i < 730; i++) {
    const iso = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
    const r = run(rule.id, rule.receipt_doctrine === 'event' ? { method: 'event', date: iso } : personal(iso), canton);
    const due = new Date(`${r.bindingDue}T00:00:00Z`);
    assert.ok(due.getUTCDay() !== 0 && due.getUTCDay() !== 6, `${rule.id} ${iso}`);
    assert.notEqual(r.bindingDue!.slice(5), '08-01');
    assert.ok(due.getTime() >= start + (i + rule.duration_days) * 86_400_000);
    assert.ok(r.couldBeLater.every(x => x.date > r.bindingDue!));
  }
});
