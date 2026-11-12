import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, applyAccumulation, emptyAccumulation, emptySource, readAccumulation, readGoal, readSource, sourceIssues } from '../src/domain/accumulation.ts';
import { additionalSaving, flowOccurs, projectAccumulation, savingsFuture } from '../src/domain/accumulationProjection.ts';
import { emptyHousingPlan } from '../src/domain/housing.ts';
import { emptyJourney } from '../src/domain/journey.ts';
const now='2030-01-31T00:00:00Z';
const saving=(id='cash',opening=0,monthly=0,rate=0)=>({...emptySource('savings',id),values:{opening,monthly,return:rate}});
function plan(){const p=emptyAccumulation('2030-01');p.goal={...p.goal,age:40,targetAge:41,endAge:42,livingSatang:100000,inflationBps:0,postReturnBps:0,extraReturnBps:0,confirmedNoOverlap:true};p.housingMode='none';p.sources=[saving()];return p;}
const insurance=()=>({...emptySource('insurance','policy'),values:{return:0,surrender:null},premiumFunding:'external' as const,receiveInPlan:true,scheduleComplete:true});
const pension=(start=41,end=42,monthly=100000)=>({...emptySource('sso','sso'),values:{monthly,startAge:start,endAge:end,growth:0}});
const housing=(startYear=2031)=>({plan:{...emptyHousingPlan('jin',startYear),years:5,upfrontSatang:0,recurringSatang:100000,monthlyCareSatang:0,monthlyOtherSatang:0,depositSatang:1000000,annualIncreaseBps:0},savedAt:now});
test('zero-rate monthly projection matches hand calculation without dividing by zero',()=>{
  const p=plan();p.sources=[saving('cash',10000000,100000)];const r=projectAccumulation(p);assert.equal(r.status,'complete');assert.equal(r.knownAssetsSatang,11200000);assert.equal(r.requiredCapitalSatang,1200000);assert.equal(r.gapSatang,0);assert.equal(r.endBalanceSatang,10000000);assert.equal(r.targetMonth,'2031-02');
});
test('income received after retirement is not multiplied into opening assets',()=>{
  const p=plan();p.sources.push(pension());const r=projectAccumulation(p);assert.equal(r.knownAssetsSatang,0);assert.equal(r.requiredCapitalSatang,0);assert.equal(r.firstYearIncomeSatang,1200000);assert.equal(r.endBalanceSatang,0);
});
test('deferred pension requires a cash bridge and contributes zero in the first year',()=>{
  const p=plan();p.goal.endAge=43;p.sources.push(pension(42,43));const r=projectAccumulation(p);assert.equal(r.requiredCapitalSatang,1200000);assert.equal(r.firstYearIncomeSatang,0);assert.equal(r.gapSatang,1200000);assert.equal(r.additionalMonthlySatang,100000);
});
test('future value uses annual effective rates converted to monthly and month-end contributions',()=>{
  assert.ok(Math.abs(savingsFuture(1000000,0,1200,12)-1120000)<=12);
  const rate=1.12**(1/12)-1;let balance=1000000;for(let m=0;m<12;m++)balance+=Math.round(balance*rate)+10000;
  assert.equal(savingsFuture(1000000,10000,1200,12),balance);
});
test('additional saving is the smallest integer-satang monthly amount meeting the target, including negative returns',()=>{
  for(const rate of [-2000,0,150,2000]){const x=additionalSaving(1234567,rate,24)!;assert.ok(savingsFuture(0,x,rate,24)>=1234567);assert.ok(savingsFuture(0,x-1,rate,24)<1234567);}
  assert.equal(additionalSaving(100,0,0),null);assert.equal(additionalSaving(0,0,0),0);
});
test('the minimum capital amount survives every payment month, not merely the final balance',()=>{
  const p=plan();p.goal.livingSatang=100000;p.housingMode='imported';p.housingBudget=housing();p.sources=[saving('cash',500000),pension(41,42,300000)];const r=projectAccumulation(p);assert.equal(r.requiredCapitalSatang,1000000);assert.equal(r.gapSatang,500000);assert.equal(r.firstShortfall,'2031-02');assert.ok(r.endBalanceSatang!>0);
});
test('negative retirement balances do not receive fictional investment gains or loan interest',()=>{
  const p=plan();p.goal.postReturnBps=1000;const r=projectAccumulation(p);assert.equal(r.endBalanceSatang,-1200000);assert.equal(r.years[0].returnSatang,0);
});
test('current-price living expenses inflate before retirement; target-year prices do not inflate twice',()=>{
  const p=plan();p.goal.inflationBps=1000;const today=projectAccumulation(p);p.goal.livingBasis='at-target';const target=projectAccumulation(p);assert.equal(today.requiredCapitalSatang,1320000);assert.equal(target.requiredCapitalSatang,1200000);
});
test('missing fields keep full requirements and gaps pending instead of advertising an optimistic zero',()=>{
  const p=plan();p.sources.push(emptySource('pvd','unknown'));const r=projectAccumulation(p);assert.equal(r.status,'partial');assert.equal(r.knownAssetsSatang,0);assert.equal(r.requiredCapitalSatang,null);assert.equal(r.gapSatang,null);assert.equal(r.endBalanceSatang,null);assert.equal(r.traces[1].status,'pending');
});
test('missing goal assumptions and an unconfirmed overlap check surface explicitly',()=>{
  const p=plan();p.goal.inflationBps=null;assert.equal(projectAccumulation(p).knownAssetsSatang,null);p.goal.inflationBps=0;p.goal.confirmedNoOverlap=false;assert.equal(projectAccumulation(p).gapSatang,null);p.sources=[];assert.ok(projectAccumulation(p).issues.some(s=>s.includes('อย่างน้อย')));
});
test('reference-only entries can remain incomplete and never double count money',()=>{
  const p=plan();p.sources=[saving('cash',1000000),{...saving('reference',1000000),referenceOnly:true}];const r=projectAccumulation(p);assert.equal(r.status,'complete');assert.equal(r.knownAssetsSatang,1000000);assert.equal(r.traces[1].status,'excluded');
});
test('PVD respects employee/employer balances, contributions, salary growth, vesting and exit provision',()=>{
  const p=plan();p.goal.targetAge=42;p.goal.endAge=43;const s=emptySource('pvd','fund');s.values={employee:0,employer:0,salary:5000000,employeeRate:1000,employerRate:500,salaryGrowth:1000,return:0,vested:5000,exitTax:100000};p.sources=[s];const r=projectAccumulation(p);assert.equal(r.knownAssetsSatang,15650000);assert.equal(r.traces[0].atTargetSatang,15650000);
});
test('PVD is not used to pay premiums before its retirement release',()=>{
  const p=plan();const fund=emptySource('pvd','fund');fund.values={employee:500000,employer:500000,salary:0,employeeRate:0,employerRate:0,salaryGrowth:0,return:0,vested:5000,exitTax:50000};const s=insurance();s.premiumFunding='from-plan';s.flows=[{id:'pay',kind:'premium',frequency:'once',startMonth:'2030-02',endMonth:null,amountSatang:100000}];p.sources=[fund,s];const r=projectAccumulation(p);assert.equal(r.knownAssetsSatang,600000);assert.equal(r.preShortfall,'2030-02');assert.equal(r.traces[0].withdrawnSatang,0);
});
test('premiums from the plan reduce actual liquid balances so spent money no longer compounds',()=>{
  const p=plan();p.sources=[saving('cash',100000,0,1200)];const s=insurance();s.premiumFunding='from-plan';s.flows=[{id:'pay',kind:'premium',frequency:'once',startMonth:'2030-02',endMonth:null,amountSatang:100000}];p.sources.push(s);let cash=100000;const rMonth=1.12**(1/12)-1;for(let i=0;i<12;i++){cash+=Math.round(cash*rMonth);if(i===0)cash-=100000;}const r=projectAccumulation(p);assert.equal(r.knownAssetsSatang,cash);assert.equal(r.traces[0].withdrawnSatang,100000);
});
test('externally funded premiums are traced but are not deducted twice from net monthly savings',()=>{
  const p=plan();const s=insurance();s.flows=[{id:'pay',kind:'premium',frequency:'once',startMonth:'2030-02',endMonth:null,amountSatang:100000}];p.sources=[saving('cash',500000),s];const r=projectAccumulation(p);assert.equal(r.knownAssetsSatang,500000);assert.equal(r.externalPremiumSatang,100000);assert.ok(r.notes.some(n=>n.includes('นอกแผน')));
});
test('surrender replaces both premiums and survival benefits in and after its month',()=>{
  const p=plan(),s=insurance();s.policyMode='surrender';s.surrenderMonth='2030-06';s.values.surrender=500000;s.premiumFunding='from-plan';s.flows=[{id:'pay',kind:'premium',frequency:'once',startMonth:'2030-05',endMonth:null,amountSatang:100000},{id:'benefit',kind:'benefit',frequency:'monthly',startMonth:'2030-06',endMonth:'2031-12',amountSatang:1000000}];p.sources=[saving(),s];const r=projectAccumulation(p);assert.equal(r.knownAssetsSatang,400000);assert.equal(r.firstYearIncomeSatang,0);
});
test('benefits outside the plan are excluded while chosen premium expenses still apply',()=>{
  const p=plan(),s=insurance();s.receiveInPlan=false;s.values.return=null;s.premiumFunding='from-plan';s.flows=[{id:'benefit',kind:'benefit',frequency:'once',startMonth:'2030-03',endMonth:null,amountSatang:1000000},{id:'pay',kind:'premium',frequency:'once',startMonth:'2030-02',endMonth:null,amountSatang:100000}];p.sources=[saving('cash',500000),s];assert.equal(projectAccumulation(p).knownAssetsSatang,400000);
});
test('one linked demo policy cannot be included twice',()=>{
  const p=plan(),a=insurance(),b={...insurance(),id:'second'};a.policyId='saving';b.policyId='saving';p.sources=[saving(),a,b];const r=projectAccumulation(p);assert.equal(r.status,'partial');assert.equal(r.traces[2].status,'pending');
});
test('dated schedules respect inclusive endpoints and annual frequency across year boundaries',()=>{
  const f={id:'annual',kind:'benefit' as const,frequency:'annual' as const,startMonth:'2030-12',endMonth:'2032-12',amountSatang:1};assert.ok(flowOccurs(f,'2030-12'));assert.equal(flowOccurs(f,'2031-01'),false);assert.ok(flowOccurs(f,'2032-12'));assert.equal(flowOccurs(f,'2033-12'),false);assert.equal(addMonths('2030-12',2),'2031-02');
});
test('past policy cashflows are not received again after the starting month',()=>{
  const p=plan(),s=insurance();s.flows=[{id:'old',kind:'benefit',frequency:'once',startMonth:'2030-01',endMonth:null,amountSatang:999999}];p.sources.push(s);assert.equal(projectAccumulation(p).knownAssetsSatang,0);
});
test('tax saving is only invested at year-end when explicitly selected and not already included elsewhere',()=>{
  const p=plan(),tax=emptySource('tax','tax');tax.values={annualSaving:120000,return:1000};tax.reinvest=true;tax.alreadyInSavings=false;p.sources.push(tax);assert.equal(projectAccumulation(p).knownAssetsSatang,120000);tax.alreadyInSavings=true;assert.equal(projectAccumulation(p).knownAssetsSatang,0);tax.alreadyInSavings=null;tax.reinvest=false;assert.equal(projectAccumulation(p).knownAssetsSatang,0);tax.reinvest=null;assert.equal(projectAccumulation(p).gapSatang,null);
});
test('SSO is a manual income scenario with required timing, not a legal entitlement formula',()=>{
  const p=plan();const s=pension(40,42);assert.ok(sourceIssues(s,p.goal).length);p.sources.push(s);assert.equal(projectAccumulation(p).gapSatang,null);s.values.startAge=41;assert.equal(projectAccumulation(p).requiredCapitalSatang,0);
});
test('housing deposit is reserved once at the start, separate from monthly outlays and later receipts',()=>{
  const p=plan();p.goal.livingSatang=0;p.housingMode='imported';p.housingBudget=housing();const r=projectAccumulation(p);assert.equal(r.requiredCapitalSatang,2200000);assert.equal(r.years[0].housingSatang,2200000);
});
test('a housing-year mismatch blocks the final gap until the member chooses an explicit pricing treatment',()=>{
  const p=plan();p.goal.livingSatang=0;p.housingMode='imported';p.housingBudget=housing(2029);assert.equal(projectAccumulation(p).gapSatang,null);p.housingPricing='inflate';p.goal.inflationBps=500;p.housingBudget.plan.annualIncreaseBps=1000;p.housingBudget.plan.upfrontSatang=1000000;p.housingBudget.plan.depositSatang=100000;const r=projectAccumulation(p);assert.equal(r.requiredCapitalSatang,2664750);assert.equal(p.housingBudget.plan.startYear,2029);
});
test('a future quoted year is never silently discounted backwards',()=>{
  const p=plan();p.housingMode='imported';p.housingBudget=housing(2040);p.housingPricing='inflate';assert.equal(projectAccumulation(p).gapSatang,null);
});
test('living beyond the housing budget requires a separate later accommodation assumption',()=>{
  const p=plan();p.goal.livingSatang=0;p.goal.endAge=47;p.housingMode='imported';p.housingBudget=housing();assert.equal(projectAccumulation(p).gapSatang,null);p.afterHousingMonthlySatang=200000;assert.equal(projectAccumulation(p).requiredCapitalSatang,9400000);
});
test('annual housing payments need at least as much starting capital as equivalent monthly payments with positive returns',()=>{
  const p=plan();p.goal.livingSatang=0;p.goal.postReturnBps=1000;p.housingMode='imported';p.housingBudget=housing();const monthly=projectAccumulation(p).requiredCapitalSatang!;p.housingBudget.plan.model='annual';p.housingBudget.plan.recurringSatang=1200000;assert.ok(projectAccumulation(p).requiredCapitalSatang!>monthly);
});
test('an already-retired member has no accumulation period and needs a lump sum when a gap remains',()=>{
  const p=plan();p.goal.age=41;const r=projectAccumulation(p);assert.deepEqual(r.preYears,[]);assert.equal(r.additionalMonthlySatang,null);assert.equal(r.requiredCapitalSatang,1200000);
});
test('invalid money, rates, months, names, ages and schemas fail at persistence boundaries',()=>{
  const p=plan();for(const v of [-1,.5,Infinity,NaN,undefined])assert.throws(()=>readSource({...saving(),values:{...saving().values,opening:v}}));for(const returnRate of [-2001,2001])assert.throws(()=>readSource({...saving(),values:{...saving().values,return:returnRate}}));for(const g of [{...p.goal,age:42},{...p.goal,endAge:41},{...p.goal,asOfMonth:'2030-13'},{...p.goal,confirmedNoOverlap:null}])assert.throws(()=>readGoal(g));assert.throws(()=>readAccumulation({...p,sources:[saving(),saving()]}));assert.throws(()=>readAccumulation({...p,version:2}));
});
test('canonical readers strip extra private fields and roundtrip all typed source kinds',()=>{
  const p=plan();p.sources.push(emptySource('pvd','pvd'),emptySource('sso','sso'),emptySource('tax','tax'),emptySource('insurance','insurance'));const r=readAccumulation({...p,secret:'private',sources:p.sources.map(s=>({...s,privateFile:'private.pdf',values:{...s.values,secret:123}}))});assert.deepEqual(r,p);assert.deepEqual(readAccumulation(JSON.parse(JSON.stringify(r))),r);
});
test('importing starter data is idempotent, preserves edited fields and does not guess the PVD split',()=>{
  const j=emptyJourney();j.funding=[{id:'fund-savings',kind:'savings',measure:'current-balance',linkedPolicyId:null,amountSatang:{value:1234500,status:'member'}},{id:'fund-pvd',kind:'pvd',measure:'current-balance',linkedPolicyId:null,amountSatang:{value:600000,status:'member'}}];let p=applyAccumulation(plan(),{type:'import-journey',journey:j},now);assert.equal(p.sources.find(s=>s.id==='legacy-savings')!.values.opening,1234500);const fund=p.sources.find(s=>s.id==='legacy-pvd')!;assert.equal(fund.legacyBalanceSatang,600000);assert.equal(fund.values.employee,null);p=applyAccumulation(p,{type:'source',source:{...p.sources.find(s=>s.id==='legacy-savings')!,values:{opening:900000,monthly:1,return:0}}},now);p=applyAccumulation(p,{type:'import-journey',journey:j},now);assert.equal(p.sources.filter(s=>s.id==='legacy-savings').length,1);assert.equal(p.sources.find(s=>s.id==='legacy-savings')!.values.opening,900000);assert.equal(j.funding[0].amountSatang.value,1234500);
});
test('housing and source actions change only their own fields and never mutate the initial state',()=>{
  const seed=plan();const next=applyAccumulation(seed,{type:'housing',budget:housing()},now);assert.equal(seed.housingBudget,null);assert.equal(next.goal.age,40);assert.deepEqual(next.sources,seed.sources);const removed=applyAccumulation(next,{type:'remove-source',id:'cash'},now);assert.ok(removed.housingBudget);assert.equal(removed.sources.length,0);
});

test('long accumulation with strong returns solves the needed contribution without overflowing its binary-search bound',()=>{const gap=100000000000;const x=additionalSaving(gap,2000,960)!;assert.ok(savingsFuture(0,x,2000,960)>=gap);assert.ok(savingsFuture(0,x-1,2000,960)<gap);});

test('the fictional walkthrough contains five complete source kinds and cannot change a member plan',async()=>{const {accumulationExample}=await import('../src/data/accumulationExample.ts');const p=accumulationExample();assert.equal(new Set(p.sources.map(s=>s.kind)).size,5);assert.equal(projectAccumulation(p).status,'complete');const other=accumulationExample();p.sources[0].values.opening=0;assert.notEqual(other.sources[0].values.opening,0);});
test('CSV includes model assumptions, schedule provenance and safe text cells, and refuses partial summaries',async()=>{const {buildAccumulationCsv}=await import('../src/domain/accumulationCsv.ts');const p=plan();p.sources[0].name='=SUM(1,2)';const csv=buildAccumulationCsv(p,projectAccumulation(p));assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'=SUM(1,2)"));assert.ok(csv.includes('รายละเอียดสมมติฐานรายแหล่ง'));assert.ok(buildAccumulationCsv(p,projectAccumulation(p),true).includes('ตัวอย่างสมมติ ไม่ใช่ข้อมูลผู้ใช้'));p.goal.age=null;assert.throws(()=>buildAccumulationCsv(p,projectAccumulation(p)));});

test('annual cashflow rows reconcile exactly including upfront/deposit and monthly returns',()=>{const p=plan();p.goal.endAge=47;p.goal.postReturnBps=300;p.goal.inflationBps=200;p.sources=[saving('cash',9000000,50000,300),pension(41,47,50000)];p.housingMode='imported';p.housingBudget=housing();p.afterHousingMonthlySatang=50000;const r=projectAccumulation(p);assert.equal(r.status,'complete');for(const y of r.years)assert.equal(y.closingSatang,y.openingSatang+y.returnSatang+y.incomeSatang-y.housingSatang-y.livingSatang-y.premiumSatang);});
test('incomplete recurring schedules and unconfirmed schedule completeness cannot produce a complete capital gap',()=>{const p=plan(),s=insurance();s.scheduleComplete=false;p.sources.push(s);assert.equal(projectAccumulation(p).gapSatang,null);s.scheduleComplete=true;s.flows=[{id:'x',kind:'benefit',frequency:'monthly',startMonth:'2031-02',endMonth:null,amountSatang:100000}];assert.equal(projectAccumulation(p).gapSatang,null);});
test('source count is bounded and schedule dates can extend into the next century',()=>{const p=plan();p.sources=Array.from({length:21},(_,i)=>saving('cash-'+i));assert.throws(()=>readAccumulation(p));const s=insurance();s.flows=[{id:'future',kind:'benefit',frequency:'once',startMonth:'2101-02',endMonth:null,amountSatang:100}];assert.equal(readSource(s).flows[0].startMonth,'2101-02');});

test('source traces reconcile to known target wealth including an explicit uncovered-liquidity adjustment',()=>{const p=plan(),s=insurance();s.premiumFunding='from-plan';s.flows=[{id:'x',kind:'premium',frequency:'once',startMonth:'2030-02',endMonth:null,amountSatang:12345}];p.sources.push(s);const r=projectAccumulation(p);assert.equal(r.traces.filter(t=>t.status==='included').reduce((sum,t)=>sum+(t.atTargetSatang??0),0),r.knownAssetsSatang);assert.equal(r.traces.find(t=>t.id==='model:shortfall')!.atTargetSatang,-12345);});
