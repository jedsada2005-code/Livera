import { policies as definitions } from '../data/demo.ts';
import type { Policy } from '../data/demo.ts';

export type PaymentStatus = 'recorded' | 'pending' | 'reviewed' | 'voided';
export type Attachment = { id: string; name: string; type: string; size: number };
export type Payment = {
  id: string; policyId: Policy['id']; period: number; dueDate: string; paidDate: string;
  satang: number; reference: string; note: string; status: PaymentStatus;
  source: 'seed' | 'member'; createdAt: string; attachment?: Attachment;
  voidReason?: string; voidedAt?: string;
};
export type PaymentDraft = {
  policyId: Policy['id']; period: number; paidDate: string; satang: number;
  reference: string; note: string;
};
export type PolicySummary = Omit<Policy, 'paid' | 'remaining' | 'paidPeriods' | 'nextDue'> & {
  paid: number; remaining: number | null; paidPeriods: number;
  nextDue: string; nextDueISO: string | null; nextPeriod: number | null;
  pending: number; reviewed: number; progress: number;
};
export const statusLabels: Record<PaymentStatus, string> = {
  recorded: 'ผู้ใช้บันทึก', pending: 'รอตรวจหลักฐาน', reviewed: 'LIVERA ตรวจเอกสารแล้ว', voided: 'ยกเลิกรายการ',
};
const starts: Record<Policy['id'], string> = { saving: '2025-05-30', pension: '2025-01-15', health: '2026-03-01' };

export function todayISO() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function formatDate(iso: string, long = false) {
  return new Intl.DateTimeFormat('th-TH', { timeZone: 'UTC', day: 'numeric', month: long ? 'long' : 'short', year: 'numeric' }).format(new Date(`${iso}T00:00:00Z`));
}
export function isValidDate(iso: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) && new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso;
}
export function addMonths(iso: string, months: number) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}
type SchedulePolicy = Pick<Policy, 'id' | 'premium' | 'frequency' | 'totalPeriods'>;
export function dueDate(policy: SchedulePolicy, period: number) {
  return addMonths(starts[policy.id], period * (policy.frequency === 'เดือน' ? 1 : 12));
}
export function parseSatang(value: string) {
  const normalized = value.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, decimal = ''] = normalized.split('.');
  const satang = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return Number.isSafeInteger(satang) ? satang : null;
}
export function createSeed(): Payment[] {
  return definitions.flatMap(policy => Array.from({ length: policy.paidPeriods }, (_, period) => ({
    id: `seed-${policy.id}-${period}`, policyId: policy.id, period,
    dueDate: dueDate(policy, period), paidDate: dueDate(policy, period), satang: policy.premium * 100,
    reference: '', note: 'รายการตั้งต้นสำหรับสาธิต ไม่ใช่ข้อมูลยืนยันจากบริษัทประกัน',
    status: 'recorded' as const, source: 'seed' as const, createdAt: `${dueDate(policy, period)}T06:00:00.000Z`,
  })));
}
export function paidForPeriod(entries: Payment[], policyId: string, period: number) {
  return entries.filter(entry => entry.policyId === policyId && entry.period === period && entry.status !== 'voided').reduce((sum, entry) => sum + entry.satang, 0);
}
export function outstanding(entries: Payment[], policy: SchedulePolicy, period: number) {
  return Math.max(0, policy.premium * 100 - paidForPeriod(entries, policy.id, period));
}
export function summarize(entries: Payment[]): PolicySummary[] {
  return definitions.map(policy => {
    const active = entries.filter(entry => entry.policyId === policy.id && entry.status !== 'voided');
    const sum = active.reduce((total, entry) => total + entry.satang, 0);
    const periodCount = policy.totalPeriods ?? policy.paidPeriods + 1;
    let paidPeriods = 0;
    let nextPeriod: number | null = null;
    for (let period = 0; period < periodCount; period++) {
      if (outstanding(entries, policy, period) === 0) paidPeriods++;
      else if (nextPeriod === null) nextPeriod = period;
    }
    const nextDueISO = nextPeriod === null ? null : dueDate(policy, nextPeriod);
    return { ...policy, paid: sum / 100,
      remaining: policy.totalPeriods === null ? null : Math.max(0, policy.premium * 100 * policy.totalPeriods - sum) / 100,
      paidPeriods, nextPeriod, nextDueISO, nextDue: nextDueISO ? formatDate(nextDueISO) : policy.totalPeriods === null ? 'รอยืนยันเบี้ยต่ออายุรอบใหม่' : 'บันทึกครบตามแผนแล้ว',
      pending: active.filter(entry => entry.status === 'pending').length,
      reviewed: active.filter(entry => entry.status === 'reviewed').reduce((total, entry) => total + entry.satang, 0) / 100,
      progress: policy.totalPeriods ? Math.min(100, sum / (policy.premium * 100 * policy.totalPeriods) * 100) : 0,
    };
  });
}
export class PaymentError extends Error {
  field: string;
  constructor(message: string, field = 'form') { super(message); this.name = 'PaymentError'; this.field = field; }
}
export function validateDraft(draft: PaymentDraft, entries: Payment[], asOf = todayISO()) {
  const policy = definitions.find(item => item.id === draft.policyId);
  if (!policy) throw new PaymentError('ไม่พบกรมธรรม์ที่เลือก', 'policyId');
  if (!Number.isInteger(draft.period) || draft.period < 0 || (policy.totalPeriods !== null && draft.period >= policy.totalPeriods)) throw new PaymentError('งวดที่เลือกไม่อยู่ในตารางกรมธรรม์', 'period');
  // Health premiums are only specified through the next sample renewal, not indefinitely.
  if (policy.totalPeriods === null && draft.period > policy.paidPeriods) throw new PaymentError('ยังไม่มีอัตราเบี้ยตัวอย่างสำหรับปีที่เลือก', 'period');
  if (!isValidDate(draft.paidDate) || draft.paidDate > asOf) throw new PaymentError('เลือกวันที่ชำระจริงไม่เกินวันนี้', 'paidDate');
  if (!Number.isSafeInteger(draft.satang) || draft.satang <= 0) throw new PaymentError('กรอกจำนวนเงินมากกว่า 0 และทศนิยมไม่เกิน 2 ตำแหน่ง', 'satang');
  const remaining = outstanding(entries, policy, draft.period);
  if (remaining === 0) throw new PaymentError('งวดนี้มีบันทึกครบแล้ว กรุณาตรวจประวัติหรือเลือกงวดอื่น', 'period');
  if (draft.satang > remaining) throw new PaymentError(`จำนวนเงินเกินยอดที่ยังไม่ได้บันทึกของงวดนี้ (${new Intl.NumberFormat('th-TH').format(remaining / 100)} บาท)`, 'satang');
  if (draft.reference.trim().length > 60 || draft.note.trim().length > 250) throw new PaymentError('เลขอ้างอิงหรือหมายเหตุยาวเกินกำหนด');
  const duplicate = entries.some(entry => entry.status !== 'voided' && entry.policyId === draft.policyId && entry.period === draft.period && entry.satang === draft.satang && entry.paidDate === draft.paidDate && (!draft.reference.trim() || entry.reference === draft.reference.trim()));
  if (duplicate) throw new PaymentError('พบรายการยอดและวันที่นี้แล้ว ตรวจประวัติก่อน หรือระบุเลขอ้างอิงที่แตกต่างกันหากเป็นคนละรายการ', 'reference');
}

export function makePayment(draft: PaymentDraft, entries: Payment[], attachment?: Attachment): Payment {
  validateDraft(draft, entries);
  const policy = definitions.find(item => item.id === draft.policyId)!;
  return { ...draft, reference: draft.reference.trim(), note: draft.note.trim(), id: crypto.randomUUID(),
    dueDate: dueDate(policy, draft.period), status: attachment ? 'pending' : 'recorded',
    source: 'member', createdAt: new Date().toISOString(), attachment,
  };
}
export function voidPayment(entry: Payment, reason: string): Payment {
  if (entry.source !== 'member') throw new PaymentError('รายการตั้งต้นเก็บไว้สำหรับอ้างอิงในโหมดสาธิต');
  if (entry.status === 'voided') throw new PaymentError('รายการนี้ถูกยกเลิกแล้ว');
  if (reason.trim().length < 3 || reason.trim().length > 160) throw new PaymentError('ระบุเหตุผลการยกเลิก 3–160 ตัวอักษร');
  return { ...entry, status: 'voided', voidReason: reason.trim(), voidedAt: new Date().toISOString() };
}
