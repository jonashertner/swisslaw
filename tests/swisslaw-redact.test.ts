import test from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../lib/swisslaw-chat/redact';

test('removes identifiers, keeps the legal substance', () => {
  const r = redact('Frau Anna Muster (anna@example.ch, 079 123 45 67) wohnt an der Bahnhofstrasse 12. AHV 756.1234.5678.97, IBAN CH93 0076 2011 6238 5295 7. Kündigung am 5. Oktober für Ende Januar, Miete CHF 1850, Kanton ZH, Auto ZH 123456, Betreibung Nr. 20261234.');
  for (const leak of ['Anna', 'Muster', 'anna@example.ch', '079 123', 'Bahnhofstrasse 12', '756.1234', 'CH93', '123456', '20261234']) assert.ok(!r.text.includes(leak), leak);
  for (const keep of ['5. Oktober', 'Ende Januar', 'CHF 1850', 'Kanton ZH']) assert.ok(r.text.includes(keep), keep);
  assert.ok(r.replaced >= 8);
});

test('leaves ordinary questions untouched', () => {
  const q = 'Mein Vermieter hat mir gekündigt, weil er die Wohnung selbst braucht. Kann ich mehr Zeit verlangen?';
  assert.deepEqual(redact(q), { text: q, replaced: 0 });
  assert.equal(redact('Art. 273 OR und BGE 143 III 15').replaced, 0);
});
