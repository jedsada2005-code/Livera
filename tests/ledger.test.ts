import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, createSeed, dueDate, isValidDate, makePayment, outstanding, parseSatang, summarize, validateDraft, voidPayment } from '../src/domain/ledger.ts';
import { policies } from '../src/data/demo.ts';
import type { PaymentDraft } from '../src/domain/ledger.ts';

const saving = policies[0];
const draft = (overrides: Partial<PaymentDraft> = {}): PaymentDraft => ({ policyId: 'saving', period: 18, paidDate: '2026-11-11', satang: 1000000, reference: '', note: '', ...overrides });

test('opening ledger reconciles across all policies and dates', () => {
  const seed = createSeed();
  assert.equal(seed.length, 21);
  const summary = summarize(seed);
  assert.equal(summary.reduce((sum, policy) => sum + policy.paid, 0), 324000);
  assert.equal(summary.reduce((sum, policy) => sum + (policy.remaining ?? 0), 0), 2100000);
  assert.equal(summary[0].paidPeriods, 18);
  assert.equal(summary[0].progress, 10);
  assert.equal(summary[0].nextDueISO, '2026-11-30');
  assert.equal(summary[1].nextDueISO, '2027-01-15');
});
test('partial payments change money immediately but count a period only when complete', () => {
  const entries = createSeed();
  entries.push(makePayment(draft({ satang: 300000, reference: 'FIRST' }), entries));
  let summary = summarize(entries)[0];
  assert.equal(summary.paid, 183000); assert.equal(summary.paidPeriods, 18);
  assert.equal(summary.nextDueISO, '2026-11-30');
  assert.equal(outstanding(entries, saving, 18), 700000);
  entries.push(makePayment(draft({ satang: 700000, reference: 'SECOND' }), entries));
  summary = summarize(entries)[0];
  assert.equal(summary.paid, 190000); assert.equal(summary.paidPeriods, 19);
  assert.equal(summary.remaining, 1610000); assert.equal(summary.nextDueISO, '2026-12-30');
});
test('exact duplicate partial payments are rejected, separate references are allowed', () => {
  const entries = createSeed(); const input = draft({ satang: 250000, reference: 'A' });
  entries.push(makePayment(input, entries));
  assert.throws(() => validateDraft(input, entries), /พบรายการยอดและวันที่นี้แล้ว/);
  assert.doesNotThrow(() => validateDraft({ ...input, reference: 'B' }, entries));
});
test('paid periods and excess amounts cannot be recorded again', () => {
  assert.throws(() => validateDraft(draft({ period: 17 }), createSeed()), /มีบันทึกครบแล้ว/);
  assert.throws(() => validateDraft(draft({ satang: 1000001 }), createSeed()), /เกินยอด/);
  assert.throws(() => validateDraft(draft({ period: 180 }), createSeed()), /ไม่อยู่ในตาราง/);
});
test('voiding keeps an audit trail and restores money and due period', () => {
  const seed = createSeed(); const payment = makePayment(draft(), seed);
  const before = summarize([...seed, payment])[0]; assert.equal(before.paidPeriods, 19);
  const cancelled = voidPayment(payment, 'บันทึกจำนวนเงินผิด');
  assert.equal(cancelled.id, payment.id); assert.equal(cancelled.status, 'voided');
  assert.equal(cancelled.voidReason, 'บันทึกจำนวนเงินผิด'); assert.ok(cancelled.voidedAt);
  const after = summarize([...seed, cancelled])[0];
  assert.equal(after.paid, 180000); assert.equal(after.remaining, 1620000);
  assert.equal(after.nextDueISO, '2026-11-30');
  assert.throws(() => voidPayment(cancelled, 'ยกเลิกอีกครั้ง'), /ถูกยกเลิกแล้ว/);
});
test('opening records are protected, and void reasons must be meaningful', () => {
  assert.throws(() => voidPayment(createSeed()[0], 'แก้รายการ'), /ตั้งต้น/);
  assert.throws(() => voidPayment(makePayment(draft(), createSeed()), 'x'), /3–160/);
});
test('attachments change status to pending, never insurer-confirmed', () => {
  const entry = makePayment(draft(), createSeed(), { id: 'attachment-1', name: 'sample.png', type: 'image/png', size: 100 });
  assert.equal(entry.status, 'pending'); assert.equal(summarize([...createSeed(), entry])[0].pending, 1);
  assert.equal(summarize([...createSeed(), entry])[0].reviewed, 0);
  assert.equal(makePayment(draft(), createSeed()).status, 'recorded');
});
test('invalid dates, future payment dates, and nonpositive amounts are rejected', () => {
  assert.equal(isValidDate('2026-02-30'), false);
  assert.throws(() => validateDraft(draft({ paidDate: '2026-02-30' }), createSeed(), '2026-11-11'), /วันที่/);
  assert.throws(() => validateDraft(draft({ paidDate: '2026-11-12' }), createSeed(), '2026-11-11'), /วันที่/);
  assert.throws(() => validateDraft(draft({ satang: 0 }), createSeed()), /มากกว่า 0/);
  assert.throws(() => validateDraft(draft({ satang: 1.2 }), createSeed()), /ทศนิยม/);
});
test('money is represented in whole satang, including decimal input', () => {
  assert.equal(parseSatang('0.10')! + parseSatang('0.20')!, 30);
  assert.equal(parseSatang('1,234.56'), 123456);
  for (const value of ['1e4', '-100', 'Infinity', '100.123', 'abc', '']) assert.equal(parseSatang(value), null);
});
test('monthly schedule preserves its anchor day across February', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-01-31', 2), '2026-03-31');
  assert.equal(dueDate(saving, 21), '2027-02-28');
  assert.equal(dueDate(saving, 22), '2027-03-30');
});
test('health renewal does not manufacture an indefinite remaining balance or future premium', () => {
  const entries = createSeed();
  assert.equal(summarize(entries)[2].remaining, null);
  entries.push(makePayment(draft({ policyId: 'health', period: 1, satang: 2400000 }), entries));
  const health = summarize(entries)[2];
  assert.equal(health.remaining, null); assert.equal(health.nextPeriod, null);
  assert.match(health.nextDue, /รอยืนยัน/);
  assert.throws(() => validateDraft(draft({ policyId: 'health', period: 2, satang: 2400000 }), entries), /ยังไม่มีอัตรา/);
});
test('completed fixed plans have no next due period and zero remaining', () => {
  const entries = createSeed();
  for (let period = 18; period < 180; period++) entries.push(makePayment(draft({ period, reference: `PERIOD-${period}` }), entries));
  const summary = summarize(entries)[0];
  assert.equal(summary.paidPeriods, 180); assert.equal(summary.remaining, 0);
  assert.equal(summary.nextPeriod, null); assert.equal(summary.progress, 100);
});
