import { findHousingPlace, housingPlaces } from '../data/housingCatalog.ts';
export const housingModels = { monthly: 'รายเดือน', annual: 'รายปี', purchase: 'ซื้อกรรมสิทธิ์', 'residency-right': 'สิทธิพักอาศัย / เช่าระยะยาว' } as const;
export type HousingModel = keyof typeof housingModels;
export type HousingPlan = {
  version: 1; residenceId: string; basis: 'member-assumption'; model: HousingModel;
  startYear: number; years: number; occupants: 1 | 2;
  upfrontSatang: number | null; recurringSatang: number | null; monthlyCareSatang: number | null;
  monthlyOtherSatang: number | null; depositSatang: number | null; annualIncreaseBps: number | null;
};
export type HousingBudget = { plan: HousingPlan; savedAt: string };
export const emptyHousingPlan = (residenceId: string, startYear = new Date().getFullYear()): HousingPlan => ({ version: 1, residenceId, basis: 'member-assumption', model: 'monthly', startYear, years: 10, occupants: 1, upfrontSatang: null, recurringSatang: null, monthlyCareSatang: null, monthlyOtherSatang: null, depositSatang: null, annualIncreaseBps: null });
const moneyFields = ['upfrontSatang', 'recurringSatang', 'monthlyCareSatang', 'monthlyOtherSatang', 'depositSatang'] as const;
export function readHousingPlan(raw: unknown): HousingPlan {
  if (!raw || typeof raw !== 'object') throw new Error('ข้อมูลงบที่พักไม่ถูกต้อง');
  const p = raw as HousingPlan;
  if (p.version !== 1 || p.basis !== 'member-assumption' || !findHousingPlace(p.residenceId) || !Object.hasOwn(housingModels, p.model)) throw new Error('สถานที่หรือรูปแบบงบไม่ถูกต้อง');
  if (!Number.isInteger(p.startYear) || p.startYear < 2000 || p.startYear > 2200) throw new Error('กรอกปีเริ่มแผน พ.ศ. 2543–2743');
  if (!Number.isInteger(p.years) || p.years < 5 || p.years > 20) throw new Error('เลือกระยะเวลา 5–20 ปี');
  if (![1, 2].includes(p.occupants)) throw new Error('เลือกจำนวนผู้พัก 1 หรือ 2 คน');
  for (const field of moneyFields) if (p[field] !== null && (!Number.isSafeInteger(p[field]) || p[field]! < 0 || p[field]! > 100000000000)) throw new Error('ยอดเงินต้องไม่ติดลบ ไม่เกิน 1,000 ล้านบาท และมีทศนิยมไม่เกิน 2 ตำแหน่ง');
  if (p.annualIncreaseBps !== null && (!Number.isInteger(p.annualIncreaseBps) || p.annualIncreaseBps < 0 || p.annualIncreaseBps > 1000)) throw new Error('กรอกสมมติฐานขึ้นราคา 0–10% ต่อปี');
  return { version: 1, residenceId: p.residenceId, basis: 'member-assumption', model: p.model, startYear: p.startYear, years: p.years, occupants: p.occupants, upfrontSatang: p.upfrontSatang, recurringSatang: p.recurringSatang, monthlyCareSatang: p.monthlyCareSatang, monthlyOtherSatang: p.monthlyOtherSatang, depositSatang: p.depositSatang, annualIncreaseBps: p.annualIncreaseBps };
}
export function readHousingBudget(raw: unknown): HousingBudget {
  if (!raw || typeof raw !== 'object') throw new Error('งบที่บันทึกไม่ถูกต้อง');
  const r = raw as HousingBudget;
  if (typeof r.savedAt !== 'string' || !Number.isFinite(Date.parse(r.savedAt))) throw new Error('วันที่บันทึกงบไม่ถูกต้อง');
  return { plan: readHousingPlan(r.plan), savedAt: r.savedAt };
}
export type HousingYear = { year: number; upfrontSatang: number | null; recurringSatang: number | null; careSatang: number | null; otherSatang: number | null; knownOutlaySatang: number; outlaySatang: number | null };
export function estimateHousing(raw: HousingPlan) {
  const p = readHousingPlan(raw);
  const missing: string[] = [];
  if (p.upfrontSatang === null) missing.push('เงินก้อนแรก');
  if (p.recurringSatang === null) missing.push(p.model === 'annual' ? 'ค่าใช้จ่ายประจำรายปี' : 'ค่าใช้จ่ายประจำรายเดือน');
  if (p.monthlyCareSatang === null) missing.push('ค่าดูแลต่อคน');
  if (p.monthlyOtherSatang === null) missing.push('ค่าใช้จ่ายอื่น');
  if (p.depositSatang === null) missing.push('เงินประกันคืนได้');
  if (p.annualIncreaseBps === null) missing.push('สมมติฐานขึ้นราคา');
  const rows: HousingYear[] = [];
  const coreKnown = (p.model === 'purchase' || p.model === 'residency-right') ? p.upfrontSatang !== null : p.recurringSatang !== null;
  if (coreKnown && p.annualIncreaseBps !== null) {
    const grow = (value: number | null, multiplier: number, index: number) => value === null ? null : Math.round(value * multiplier * (1 + p.annualIncreaseBps! / 10000) ** index);
    for (let i = 0; i < p.years; i++) {
      const upfront = i === 0 ? p.upfrontSatang : 0;
      const recurring = grow(p.recurringSatang, p.model === 'annual' ? 1 : 12, i);
      const care = grow(p.monthlyCareSatang, 12 * p.occupants, i);
      const other = grow(p.monthlyOtherSatang, 12, i);
      const parts = [upfront, recurring, care, other];
      const knownOutlaySatang = parts.reduce<number>((sum, v) => sum + (v === null ? 0 : v), 0);
      if (!Number.isSafeInteger(knownOutlaySatang)) throw new Error('ยอดประมาณการเกินขอบเขตที่คำนวณได้');
      rows.push({ year: p.startYear + i, upfrontSatang: upfront, recurringSatang: recurring, careSatang: care, otherSatang: other, knownOutlaySatang, outlaySatang: parts.some(v => v === null) ? null : knownOutlaySatang });
    }
  }
  const knownOutlaySatang = rows.length ? rows.reduce((sum, r) => sum + r.knownOutlaySatang, 0) : null;
  const outlaySatang = rows.length && rows.every(r => r.outlaySatang !== null) ? knownOutlaySatang : null;
  const cashRequiredSatang = outlaySatang !== null && p.depositSatang !== null ? outlaySatang + p.depositSatang : null;
  if ([knownOutlaySatang, cashRequiredSatang].some(v => v !== null && !Number.isSafeInteger(v))) throw new Error('ยอดประมาณการเกินขอบเขตที่คำนวณได้');
  return { status: !rows.length ? 'pending' as const : missing.length ? 'partial' as const : 'complete' as const, missing, rows, knownOutlaySatang, outlaySatang, cashRequiredSatang, depositSatang: p.depositSatang };
}
export function changeHousingModel(plan: HousingPlan, model: HousingModel): HousingPlan {
  // A monthly value must never silently become an annual amount (or a purchase price).
  return readHousingPlan({ ...plan, model, upfrontSatang: null, recurringSatang: null });
}
export function housingMatchesTarget(budget: HousingBudget, target: { residenceId: string | null; years: number; occupants: number }) {
  return budget.plan.residenceId === target.residenceId && budget.plan.years === target.years && budget.plan.occupants === target.occupants;
}
export type HousingState = { version: 1; savedIds: string[]; budgets: HousingBudget[] };
export const emptyHousing = (): HousingState => ({ version: 1, savedIds: [], budgets: [] });
export type HousingAction = { type: 'bookmark'; id: string; value: boolean } | { type: 'budget'; plan: HousingPlan } | { type: 'remove-budget'; id: string };
export function readHousing(raw: unknown): HousingState {
  if (!raw || typeof raw !== 'object') throw new Error('อ่านข้อมูลที่พักไม่ได้');
  const r = raw as HousingState;
  if (r.version !== 1 || !Array.isArray(r.savedIds) || r.savedIds.length > housingPlaces.length || new Set(r.savedIds).size !== r.savedIds.length || r.savedIds.some(id => typeof id !== 'string' || !findHousingPlace(id)) || !Array.isArray(r.budgets) || r.budgets.length > housingPlaces.length) throw new Error('รายการที่พักที่บันทึกไม่ถูกต้อง');
  const budgets = r.budgets.map(readHousingBudget);
  if (new Set(budgets.map(b => b.plan.residenceId)).size !== budgets.length) throw new Error('งบที่พักซ้ำกัน');
  return { version: 1, savedIds: [...r.savedIds], budgets };
}
export function applyHousing(current: HousingState, action: HousingAction, now = new Date().toISOString()): HousingState {
  const next = readHousing(current);
  if (action.type === 'budget') {
    const budget = readHousingBudget({ plan: action.plan, savedAt: now });
    next.budgets = [...next.budgets.filter(b => b.plan.residenceId !== budget.plan.residenceId), budget];
  } else {
    if (!findHousingPlace(action.id)) throw new Error('ไม่พบสถานที่นี้');
    if (action.type === 'bookmark') next.savedIds = action.value ? [...new Set([...next.savedIds, action.id])] : next.savedIds.filter(id => id !== action.id);
    else next.budgets = next.budgets.filter(b => b.plan.residenceId !== action.id);
  }
  return readHousing(next);
}
