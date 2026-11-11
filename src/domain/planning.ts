import { addMonths, isValidDate } from './ledger.ts';

export type RetirementInput = {
  age: number; retireAge: number; endAge: number; monthlyExpense: number;
  inflation: number; savings: number; monthlySaving: number; beforeReturn: number; afterReturn: number;
  annualIncome: number; incomeStartAge: number; incomeEndAge: number;
};
export const defaultRetirement: RetirementInput = {
  age: 35, retireAge: 60, endAge: 85, monthlyExpense: 30000, inflation: 3,
  savings: 500000, monthlySaving: 10000, beforeReturn: 3, afterReturn: 2,
  annualIncome: 0, incomeStartAge: 60, incomeEndAge: 85,
};
export const fieldLabels: Record<keyof RetirementInput, string> = {
  age: 'อายุปัจจุบัน', retireAge: 'อายุเกษียณ', endAge: 'วางแผนใช้เงินถึงอายุ',
  monthlyExpense: 'รายจ่ายหลังเกษียณในค่าเงินวันนี้', inflation: 'เงินเฟ้อ', savings: 'เงินออมเพื่อเกษียณที่มีวันนี้',
  monthlySaving: 'เงินออมเพิ่มต่อเดือน', beforeReturn: 'ผลตอบแทนก่อนเกษียณ', afterReturn: 'ผลตอบแทนหลังเกษียณ',
  annualIncome: 'รายรับหลังเกษียณต่อปี', incomeStartAge: 'เริ่มรับเมื่ออายุ', incomeEndAge: 'รับถึงก่อนอายุ',
};
export class PlanningError extends Error {
  field: keyof RetirementInput;
  constructor(field: keyof RetirementInput, message: string) { super(message); this.field = field; }
}
export function validateRetirement(input: RetirementInput) {
  const limits: Record<keyof RetirementInput, [number, number]> = {
    age:[18,90], retireAge:[18,100], endAge:[19,110], monthlyExpense:[1,1000000], inflation:[0,10],
    savings:[0,1000000000], monthlySaving:[0,1000000], beforeReturn:[-5,15], afterReturn:[-5,15],
    annualIncome:[0,12000000], incomeStartAge:[18,110], incomeEndAge:[19,110],
  };
  for (const key of Object.keys(limits) as (keyof RetirementInput)[]) {
    const value = input[key]; const [min,max] = limits[key];
    if (!Number.isFinite(value) || value < min || value > max) throw new PlanningError(key, `${fieldLabels[key]}ต้องอยู่ระหว่าง ${min.toLocaleString('th-TH')}–${max.toLocaleString('th-TH')}`);
    if (key.toLowerCase().includes('age') && !Number.isInteger(value)) throw new PlanningError(key, 'กรอกอายุเป็นจำนวนเต็ม');
  }
  if (input.retireAge < input.age) throw new PlanningError('retireAge', 'อายุเกษียณต้องไม่น้อยกว่าอายุปัจจุบัน');
  if (input.endAge <= input.retireAge) throw new PlanningError('endAge', 'อายุปลายแผนต้องมากกว่าอายุเกษียณ');
  if (input.annualIncome > 0 && input.incomeEndAge <= input.incomeStartAge) throw new PlanningError('incomeEndAge', 'อายุสิ้นสุดรายรับต้องมากกว่าอายุเริ่มรับ');
}
export type ProjectionYear = { age: number; expense: number; income: number; balance: number };
export function calculateRetirement(input: RetirementInput) {
  validateRetirement(input);
  const years = input.retireAge - input.age;
  const duration = input.endAge - input.retireAge;
  const growth = Math.pow(1 + input.beforeReturn / 100, years);
  const monthlyRate = Math.pow(1 + input.beforeReturn / 100, 1/12) - 1;
  const months = years * 12;
  const savingFactor = monthlyRate === 0 ? months : Math.expm1(months * Math.log1p(monthlyRate)) / monthlyRate;
  const firstMonthlyExpense = input.monthlyExpense * Math.pow(1 + input.inflation / 100, years);
  const rows = Array.from({length:duration}, (_,year) => {
    const age = input.retireAge + year;
    return { age, expense: firstMonthlyExpense * 12 * Math.pow(1 + input.inflation / 100, year),
      income: age >= input.incomeStartAge && age < input.incomeEndAge ? input.annualIncome : 0 };
  });
  // Withdraw each year's net spending at its start. The maximum discounted cumulative
  // demand also prevents a later income surplus from funding an earlier shortfall.
  let discounted = 0; let target = 0;
  for (let i = 0; i < rows.length; i++) {
    discounted += (rows[i].expense - rows[i].income) / Math.pow(1 + input.afterReturn / 100, i);
    target = Math.max(target, discounted);
  }
  const projected = input.savings * growth + input.monthlySaving * savingFactor;
  const gap = Math.max(0, target - projected);
  const requiredMonthly = months > 0 ? Math.max(0, target - input.savings * growth) / savingFactor : null;
  const series: ProjectionYear[] = [{age:input.age,expense:0,income:0,balance:input.savings}];
  for (let y = 1; y <= years; y++) {
    const m = y * 12;
    const factor = monthlyRate === 0 ? m : Math.expm1(m * Math.log1p(monthlyRate)) / monthlyRate;
    series.push({age:input.age+y,expense:0,income:0,balance:input.savings*Math.pow(1+input.beforeReturn/100,y)+input.monthlySaving*factor});
  }
  let balance = projected; let depletedAge: number | null = null;
  for (const row of rows) {
    const available = balance - (row.expense - row.income);
    if (available < -0.01 && depletedAge === null) depletedAge = row.age;
    balance = Math.max(0, available) * (1 + input.afterReturn / 100);
    series.push({...row,age:row.age+1,balance});
  }
  return { years, duration, firstMonthlyExpense, target, projected, gap, requiredMonthly,
    additionalMonthly: requiredMonthly === null ? null : Math.max(0, requiredMonthly-input.monthlySaving),
    coverage:target === 0 ? 100 : Math.min(100, projected/target*100), series, rows, depletedAge,
    totalExpense: rows.reduce((sum,row)=>sum+row.expense,0) };
}
export type RetirementResult = ReturnType<typeof calculateRetirement>;

export function calculatePremiumGoal(targetSatang: number, reservedSatang: number, due: string, today: string) {
  if (![targetSatang,reservedSatang].every(v=>Number.isSafeInteger(v)&&v>=0) || reservedSatang>10000000000) throw new Error('จำนวนเงิน Goal ไม่ถูกต้อง');
  if (!isValidDate(due)||!isValidDate(today)) throw new Error('วันที่ Goal ไม่ถูกต้อง');
  const dates: string[] = [];
  for (let n=0; n<1200; n++) { const date=addMonths(today,n); if(date>due)break; dates.push(date); }
  const missingSatang = Math.max(0,targetSatang-reservedSatang);
  const perSlotSatang = dates.length ? Math.ceil(missingSatang/dates.length) : missingSatang;
  return {missingSatang, perSlotSatang, dates, overdue: due<today,
    progress:targetSatang===0?100:Math.min(100,reservedSatang/targetSatang*100), surplusSatang:Math.max(0,reservedSatang-targetSatang)};
}
