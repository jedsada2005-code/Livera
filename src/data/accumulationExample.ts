import { addMonths, emptyAccumulation, emptySource } from '../domain/accumulation.ts';
// Fictional, read-only walkthrough. Never written into the member's plan.
export function accumulationExample(){
  const p=emptyAccumulation();p.goal={...p.goal,age:40,targetAge:60,endAge:85,livingSatang:3000000,livingBasis:'today',inflationBps:200,postReturnBps:300,extraReturnBps:300,confirmedNoOverlap:true};p.housingMode='none';
  const savings=emptySource('savings','demo-savings');savings.name='ตัวอย่าง · เงินออม';savings.values={opening:30000000,monthly:500000,return:300};
  const fund=emptySource('pvd','demo-pvd');fund.name='ตัวอย่าง · PVD';fund.values={employee:20000000,employer:20000000,salary:5000000,employeeRate:500,employerRate:500,salaryGrowth:200,return:300,vested:10000,exitTax:0};
  const insurance=emptySource('insurance','demo-insurance');insurance.name='ตัวอย่าง · ประกันสมมติ';insurance.values={return:0,surrender:null};insurance.premiumFunding='external';insurance.receiveInPlan=true;insurance.scheduleComplete=true;insurance.flows=[{id:'demo-premium',kind:'premium',frequency:'annual',startMonth:addMonths(p.goal.asOfMonth,1),endMonth:addMonths(p.goal.asOfMonth,120),amountSatang:1200000},{id:'demo-maturity',kind:'benefit',frequency:'once',startMonth:addMonths(p.goal.asOfMonth,240),endMonth:null,amountSatang:40000000}];
  const pension=emptySource('sso','demo-sso');pension.name='ตัวอย่าง · รายรับประกันสังคม';pension.values={monthly:400000,startAge:60,endAge:85,growth:0};
  const tax=emptySource('tax','demo-tax');tax.name='ตัวอย่าง · ผลประหยัดภาษี';tax.values={annualSaving:600000,return:300};tax.reinvest=true;tax.alreadyInSavings=false;
  p.sources=[savings,fund,insurance,pension,tax];return p;
}
