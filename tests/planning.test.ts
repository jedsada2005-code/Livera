import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePremiumGoal, calculateRetirement, defaultRetirement, validateRetirement } from '../src/domain/planning.ts';
const base={...defaultRetirement,age:59,retireAge:60,endAge:62,monthlyExpense:1000,inflation:0,savings:0,monthlySaving:0,beforeReturn:0,afterReturn:0};
const near=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<.005,`${actual} != ${expected}`);
test('zero-rate retirement matches simple spending and monthly savings arithmetic',()=>{
  const r=calculateRetirement({...base,savings:1200,monthlySaving:100});
  near(r.target,24000);near(r.projected,2400);near(r.gap,21600);near(r.requiredMonthly!,1900);near(r.additionalMonthly!,1800);assert.equal(r.duration,2);
});
test('inflation compounds before and during retirement',()=>{
  const r=calculateRetirement({...base,inflation:10});near(r.firstMonthlyExpense,1100);near(r.target,13200+14520);near(r.totalExpense,27720);
});
test('annual start withdrawals discount the second year only',()=>{
  near(calculateRetirement({...base,afterReturn:10}).target,12000+12000/1.1);
});
test('monthly saving uses effective annual return and end-month deposits',()=>{
  const r=calculateRetirement({...base,savings:1000,monthlySaving:100,beforeReturn:12});
  const rate=Math.pow(1.12,1/12)-1;let balance=1000;for(let m=0;m<12;m++)balance=balance*(1+rate)+100;
  near(r.projected,balance);near(r.series[1].balance,balance);
});
test('income starts at age and ends before the stated end age',()=>{
  const r=calculateRetirement({...base,endAge:63,annualIncome:12000,incomeStartAge:61,incomeEndAge:62});near(r.target,24000);assert.deepEqual(r.rows.map(x=>x.income),[0,12000,0]);
});
test('late income cannot retroactively fund an earlier shortfall',()=>{
  near(calculateRetirement({...base,annualIncome:100000,incomeStartAge:61,incomeEndAge:62}).target,12000);
});
test('income surplus early in retirement can fund a later expense',()=>{
  near(calculateRetirement({...base,annualIncome:24000,incomeStartAge:60,incomeEndAge:61}).target,0);
});
test('retiring now reports a capital gap without a monthly savings division',()=>{
  const r=calculateRetirement({...base,age:60,savings:1000});assert.equal(r.requiredMonthly,null);near(r.projected,1000);near(r.gap,23000);assert.equal(r.depletedAge,60);
});
test('funded plan does not prematurely deplete and has no extra monthly need',()=>{
  const r=calculateRetirement({...base,savings:24000});assert.equal(r.depletedAge,null);near(r.coverage,100);near(r.additionalMonthly!,0);near(r.series.at(-1)!.balance,0);
});
test('negative returns remain finite and increase the capital needed',()=>{
  const r=calculateRetirement({...base,beforeReturn:-5,afterReturn:-5,savings:10000});near(r.projected,9500);near(r.target,12000+12000/.95);assert.ok(Number.isFinite(r.requiredMonthly));
});
test('invalid ages, non-finite numbers and income windows are rejected',()=>{
  for(const change of [{retireAge:58},{endAge:60},{age:35.5},{monthlyExpense:NaN},{savings:Infinity},{beforeReturn:-100},{annualIncome:100,incomeEndAge:60,incomeStartAge:60}])assert.throws(()=>validateRetirement({...base,...change}));
});
test('longest allowed horizon remains finite',()=>{
  const r=calculateRetirement({...defaultRetirement,age:18,retireAge:100,endAge:110,inflation:10,beforeReturn:-5,afterReturn:-5,monthlyExpense:1000000});assert.ok(Number.isFinite(r.target)&&Number.isFinite(r.requiredMonthly));
});
test('goal includes today and same-day monthly slots, including February clamping',()=>{
  const r=calculatePremiumGoal(12000000,3000000,'2027-03-30','2027-01-31');assert.deepEqual(r.dates,['2027-01-31','2027-02-28']);assert.equal(r.perSlotSatang,4500000);
  assert.deepEqual(calculatePremiumGoal(100,0,'2027-03-31','2027-01-31').dates,['2027-01-31','2027-02-28','2027-03-31']);
});
test('rounding installments never leaves an unpaid cent at the end',()=>{
  const r=calculatePremiumGoal(100,0,'2027-03-11','2027-01-11');assert.equal(r.perSlotSatang,34);const slots=r.dates.map((_,i)=>Math.max(0,Math.min(r.perSlotSatang,r.missingSatang-i*r.perSlotSatang)));assert.deepEqual(slots,[34,34,32]);
});
test('overdue, due today, fully reserved and surplus goals are explicit',()=>{
  const r=calculatePremiumGoal(10000,1000,'2026-11-10','2026-11-11');assert.equal(r.overdue,true);assert.equal(r.dates.length,0);assert.equal(r.perSlotSatang,9000);
  assert.equal(calculatePremiumGoal(100,0,'2026-11-11','2026-11-11').dates.length,1);
  const full=calculatePremiumGoal(100,150,'2026-11-11','2026-11-11');assert.equal(full.missingSatang,0);assert.equal(full.progress,100);assert.equal(full.surplusSatang,50);
});
test('goal rejects unsafe amounts and impossible dates',()=>{
  assert.throws(()=>calculatePremiumGoal(-1,0,'2026-11-11','2026-11-11'));assert.throws(()=>calculatePremiumGoal(100,1.5,'2026-11-11','2026-11-11'));assert.throws(()=>calculatePremiumGoal(100,0,'2026-02-30','2026-11-11'));
});
