import { insurancePlans } from '../data/insuranceCatalog.ts';
import type { InsurancePlan } from '../data/insuranceCatalog.ts';
export type Scenario = { age: number | null; annualBudgetSatang: number | null; sumAssuredSatang: number | null };
export type DiscoveryState = { version: 1; savedIds: string[]; compareIds: string[]; scenario: Scenario };
export type DiscoveryAction = { type: 'save' | 'compare'; id: string; value: boolean } | { type: 'scenario'; scenario: Scenario } | { type: 'clear-compare' };
export const emptyDiscovery = (): DiscoveryState => ({ version: 1, savedIds: [], compareIds: [], scenario: { age: null, annualBudgetSatang: null, sumAssuredSatang: null } });
const validId = (id: unknown): id is string => typeof id === 'string' && insurancePlans.some(p => p.id === id);
export function validateScenario(raw: unknown): Scenario {
  if (!raw || typeof raw !== 'object') throw new Error('ข้อมูลเงื่อนไขไม่ถูกต้อง');
  const s = raw as Scenario;
  if (s.age !== null && (!Number.isInteger(s.age) || s.age < 18 || s.age > 100)) throw new Error('กรอกอายุ 18–100 ปี หรือเว้นว่าง');
  for (const value of [s.annualBudgetSatang, s.sumAssuredSatang]) if (value !== null && (!Number.isSafeInteger(value) || value <= 0 || value > 100000000000)) throw new Error('กรอกจำนวนเงินมากกว่า 0 และไม่เกิน 1,000 ล้านบาท หรือเว้นว่าง');
  return { age: s.age, annualBudgetSatang: s.annualBudgetSatang, sumAssuredSatang: s.sumAssuredSatang };
}
export function readDiscovery(raw: unknown): DiscoveryState {
  if (!raw || typeof raw !== 'object') throw new Error('อ่านข้อมูลค้นหาแผนไม่ได้');
  const r = raw as DiscoveryState;
  for (const list of [r.savedIds, r.compareIds]) if (!Array.isArray(list) || list.length > insurancePlans.length || new Set(list).size !== list.length || list.some(id => !validId(id))) throw new Error('รายการแผนไม่ถูกต้อง');
  if (r.version !== 1 || r.compareIds.length > 3) throw new Error('เปรียบเทียบได้สูงสุด 3 แผน');
  return { version: 1, savedIds: [...r.savedIds], compareIds: [...r.compareIds], scenario: validateScenario(r.scenario) };
}
export function applyDiscovery(current: DiscoveryState, action: DiscoveryAction): DiscoveryState {
  const next = readDiscovery(current);
  if (action.type === 'scenario') next.scenario = validateScenario(action.scenario);
  else if (action.type === 'clear-compare') next.compareIds = [];
  else {
    if (!validId(action.id)) throw new Error('ไม่พบแผนนี้');
    const key = action.type === 'save' ? 'savedIds' : 'compareIds';
    next[key] = action.value ? [...new Set([...next[key], action.id])] : next[key].filter(id => id !== action.id);
  }
  return readDiscovery(next);
}
export type DiscoveryFilters = { query: string; providerId: string; category: string; maxPayYears: number | null; maxCoverYears: number | null };
export const emptyFilters = (): DiscoveryFilters => ({ query: '', providerId: '', category: 'endowment', maxPayYears: null, maxCoverYears: null });
function searchText(value: string) { return value.toLowerCase().replace(/ออมทรัพย์/g, 'สะสมทรัพย์').replace(/เมืองไท(?!ย)/g, 'เมืองไทย').replace(/\s/g, ''); }
export function filterPlans(plans: InsurancePlan[], filters: DiscoveryFilters, scenario: Scenario): InsurancePlan[] {
  const terms = filters.query.trim().split(/\s+/).filter(Boolean).map(searchText);
  return plans.filter(p => {
    const haystack = searchText(`${p.name} ${p.englishName} ${p.providerId === 'mtl' ? 'เมืองไทยประกันชีวิต Muang Thai Life MTL' : 'AIA เอไอเอ'} สะสมทรัพย์ ออมเงิน`);
    if (terms.some(t => !haystack.includes(t)) || filters.providerId && p.providerId !== filters.providerId || filters.category && p.category !== filters.category) return false;
    if (scenario.age !== null && (scenario.age < p.ageMinYears || scenario.age > p.ageMaxYears)) return false;
    if (filters.maxPayYears !== null && p.payYears > filters.maxPayYears) return false;
    const duration = p.cover.kind === 'years' ? p.cover.value : scenario.age === null ? null : p.cover.value - scenario.age;
    if (filters.maxCoverYears !== null && (duration === null || duration > filters.maxCoverYears)) return false;
    // Unknown quotes stay visible as pending; an unknown premium never qualifies as affordable.
    return !(scenario.annualBudgetSatang !== null && p.annualPremiumSatang !== null && p.annualPremiumSatang > scenario.annualBudgetSatang);
  });
}
export function budgetStatus(plan: InsurancePlan, scenario: Scenario) {
  if (plan.annualPremiumSatang === null) return 'pending' as const;
  return scenario.annualBudgetSatang === null ? 'unfiltered' as const : plan.annualPremiumSatang <= scenario.annualBudgetSatang ? 'within' as const : 'over' as const;
}
