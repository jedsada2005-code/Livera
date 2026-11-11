import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { housingPlaces, searchHousing } from '../src/data/housingCatalog.ts';
import { emptyHousingPlan, estimateHousing, readHousingPlan, readHousingBudget, changeHousingModel, emptyHousing, readHousing, applyHousing, housingMatchesTarget } from '../src/domain/housing.ts';
import { emptyJourney, readJourney, applyJourney } from '../src/domain/journey.ts';
const now='2026-11-11T15:00:00.000Z';
const plan=()=>({...emptyHousingPlan('jin',2030),years:10,occupants:2 as const,upfrontSatang:5000000,recurringSatang:1000000,monthlyCareSatang:150000,monthlyOtherSatang:200000,depositSatang:2000000,annualIncreaseBps:0});
test('two named project entries have official photo sources and no invented package prices',()=>{
  assert.equal(housingPlaces.length,2);
  for(const p of housingPlaces){assert.equal(p.priceStatus,'pending');assert.equal(new URL(p.sourceUrl).protocol,'https:');for(const image of p.gallery){assert.equal(image.kind,'photo');assert.equal(image.usage,'public-reference');assert.ok(image.sourceUrl);assert.ok(existsSync(new URL(`../public/${image.path}`,import.meta.url)));}}
  assert.equal(housingPlaces.find(p=>p.id==='aspen')!.gallery[0].path,'providers/aspen-lobby.webp');
  assert.ok(!housingPlaces.some(p=>p.gallery.some(i=>i.path==='providers/aspen-residence.webp')));
});
test('search accepts provider aliases, Thai locations, combined words and compatible saved/type/region filters',()=>{
  assert.deepEqual(searchHousing('jinwel','','').map(p=>p.id),['jin']);
  assert.deepEqual(searchHousing('ASPEN บางนา','wellness','samut-prakan').map(p=>p.id),['aspen']);
  assert.equal(searchHousing('รังสิต','residence','samut-prakan').length,0);
  assert.deepEqual(searchHousing('บ้านพักคนชรา','','',['jin']).map(p=>p.id),['jin']);
  assert.equal(searchHousing('','','',[]).length,0);
});
test('zero escalation monthly model matches a hand-calculated ten-year household budget',()=>{
  const result=estimateHousing(plan());
  // 50,000 upfront + (10,000 housing + 1,500 care × 2 + 2,000 other) × 12 × 10.
  assert.equal(result.outlaySatang,185000000);
  assert.equal(result.cashRequiredSatang,187000000);
  assert.equal(result.depositSatang,2000000);
  assert.equal(result.status,'complete');
  assert.equal(result.rows.length,10);assert.equal(result.rows[0].year,2030);assert.equal(result.rows.at(-1)!.year,2039);
});
test('annual and monthly prices with equivalent annual amounts have equal projected outlays',()=>{
  const monthly=plan();
  const annual={...monthly,model:'annual' as const,recurringSatang:12000000};
  for(const annualIncreaseBps of [0,250,1000])assert.equal(estimateHousing({...monthly,annualIncreaseBps}).outlaySatang,estimateHousing({...annual,annualIncreaseBps}).outlaySatang);
});
test('purchase and residency-right models pay upfront once and do not assume any resale or refund proceeds',()=>{
  for(const model of ['purchase','residency-right'] as const){const p={...plan(),model,occupants:1 as const,upfrontSatang:300000000,recurringSatang:500000,monthlyCareSatang:0,monthlyOtherSatang:0};const r=estimateHousing(p);assert.equal(r.outlaySatang,360000000);assert.equal(r.rows[0].upfrontSatang,300000000);assert.ok(r.rows.slice(1).every(row=>row.upfrontSatang===0));assert.equal(r.cashRequiredSatang,362000000);}
});
test('growth starts in year two; each annual component rounds to satang and deposits do not grow',()=>{
  const p={...plan(),recurringSatang:1000001,annualIncreaseBps:250};
  const r=estimateHousing(p);
  assert.equal(r.rows[0].recurringSatang,12000012);
  assert.equal(r.rows[1].recurringSatang,Math.round(12000012*1.025));
  assert.equal(r.rows[2].careSatang,Math.round(150000*24*1.025**2));
  const independentlySummed=Array.from({length:10},(_,i)=>Math.round(12000012*1.025**i)+Math.round(3600000*1.025**i)+Math.round(2400000*1.025**i)).reduce((a,b)=>a+b,5000000);
  assert.equal(r.outlaySatang,independentlySummed);assert.equal(r.cashRequiredSatang,r.outlaySatang!+2000000);
});
test('only per-person care scales with occupancy; room price, other costs, upfront and deposit do not double',()=>{
  const one=estimateHousing({...plan(),occupants:1});const two=estimateHousing(plan());
  assert.equal(two.outlaySatang!-one.outlaySatang!,150000*12*10);
  for(const field of ['recurringSatang','otherSatang','upfrontSatang'] as const)assert.equal(one.rows[0][field],two.rows[0][field]);
  assert.equal(one.depositSatang,two.depositSatang);
});
test('unknown fees produce partial subtotals, not falsely complete zero-cost budgets',()=>{
  const p={...plan(),monthlyCareSatang:null};const r=estimateHousing(p);
  assert.equal(r.status,'partial');assert.equal(r.outlaySatang,null);assert.equal(r.cashRequiredSatang,null);assert.equal(r.rows[0].careSatang,null);assert.equal(r.knownOutlaySatang,149000000);
  const zero=estimateHousing({...p,monthlyCareSatang:0});assert.equal(zero.status,'complete');assert.equal(zero.outlaySatang,149000000);
});
test('an unknown deposit keeps full cash required pending even when all spending components are specified',()=>{
  const r=estimateHousing({...plan(),depositSatang:null});assert.equal(r.outlaySatang,185000000);assert.equal(r.cashRequiredSatang,null);assert.equal(r.status,'partial');assert.ok(r.missing.includes('เงินประกันคืนได้'));
});
test('missing base price or escalation keeps a result pending instead of silently guessing',()=>{
  for(const p of [{...plan(),recurringSatang:null},{...plan(),annualIncreaseBps:null},{...plan(),model:'purchase' as const,upfrontSatang:null}]){const r=estimateHousing(p);assert.equal(r.status,'pending');assert.equal(r.knownOutlaySatang,null);assert.deepEqual(r.rows,[]);}
});
test('5–20-year scenarios use the same first-year assumptions and grow monotonically without a zero-rate division',()=>{
  let previous=0;
  for(const years of [5,10,15,20]){const r=estimateHousing({...plan(),years});assert.equal(r.outlaySatang,5000000+18000000*years);assert.ok(r.outlaySatang!>previous);previous=r.outlaySatang!;}
  for(const years of [4,21,5.5,NaN])assert.throws(()=>estimateHousing({...plan(),years}));
});
test('invalid monetary, rate, age-independent occupancy and version fields fail explicitly',()=>{
  for(const recurringSatang of [-1,.5,NaN,Infinity,100000000001,undefined])assert.throws(()=>readHousingPlan({...plan(),recurringSatang}));
  for(const annualIncreaseBps of [-1,1001,2.5,NaN,undefined])assert.throws(()=>readHousingPlan({...plan(),annualIncreaseBps}));
  for(const raw of [null,{}, {...plan(),version:2},{...plan(),basis:'verified'},{...plan(),residenceId:'unknown'},{...plan(),model:'per-visit'},{...plan(),occupants:3},{...plan(),startYear:2543},{...plan(),startYear:'2030'}])assert.throws(()=>readHousingPlan(raw));
});
test('maximum supported amounts and growth over twenty years remain safe integer satang',()=>{
  const r=estimateHousing({...plan(),years:20,annualIncreaseBps:1000,upfrontSatang:100000000000,recurringSatang:100000000000,monthlyCareSatang:100000000000,monthlyOtherSatang:100000000000,depositSatang:100000000000});assert.ok(Number.isSafeInteger(r.cashRequiredSatang));assert.ok(r.rows.every(row=>Number.isSafeInteger(row.outlaySatang)));
});
test('changing the payment model requires new prices and preserves fields whose units are unchanged',()=>{
  const seed=plan();const p=changeHousingModel(seed,'annual');assert.equal(p.upfrontSatang,null);assert.equal(p.recurringSatang,null);assert.equal(p.monthlyCareSatang,seed.monthlyCareSatang);assert.equal(p.depositSatang,seed.depositSatang);assert.equal(seed.model,'monthly');
});
test('stored plan and budget readers whitelist fields, reject invalid dates and roundtrip integer satang',()=>{
  const raw={plan:{...plan(),medicalHistory:'private'},savedAt:now,personalDocument:'private'};const b=readHousingBudget(raw);assert.deepEqual(b,{plan:plan(),savedAt:now});assert.deepEqual(readHousingBudget(JSON.parse(JSON.stringify(b))),b);assert.throws(()=>readHousingBudget({...raw,savedAt:0}));assert.throws(()=>readHousingBudget({...raw,savedAt:'bad-date'}));
});
test('bookmarks are idempotent and separate from the latest budget per place',()=>{
  const seed=emptyHousing();let s=applyHousing(seed,{type:'bookmark',id:'jin',value:true},now);s=applyHousing(s,{type:'bookmark',id:'jin',value:true},now);s=applyHousing(s,{type:'budget',plan:plan()},now);s=applyHousing(s,{type:'budget',plan:{...plan(),years:20}},now);s=applyHousing(s,{type:'budget',plan:{...plan(),residenceId:'aspen'}},now);
  assert.deepEqual(seed,emptyHousing());assert.deepEqual(s.savedIds,['jin']);assert.equal(s.budgets.length,2);assert.equal(s.budgets.find(b=>b.plan.residenceId==='jin')!.plan.years,20);assert.deepEqual(readHousing(JSON.parse(JSON.stringify(s))),s);
  const removed=applyHousing(s,{type:'remove-budget',id:'jin'},now);assert.deepEqual(removed.savedIds,['jin']);assert.equal(removed.budgets[0].plan.residenceId,'aspen');
});
test('invalid saved IDs, duplicate budgets and unsupported versions are not silently reset',()=>{
  const b={plan:plan(),savedAt:now};for(const raw of [null,{}, {...emptyHousing(),version:2},{...emptyHousing(),savedIds:['fake']},{...emptyHousing(),savedIds:['jin','jin']},{...emptyHousing(),budgets:[b,b]}])assert.throws(()=>readHousing(raw));assert.throws(()=>applyHousing(emptyHousing(),{type:'bookmark',id:'fake',value:true}));
});
test('Round 6 and Round 7 drafts without a housing budget migrate without losing existing selections',()=>{
  const old={...emptyJourney(),residenceId:'aspen',interestedInsurer:'aia',interestedPlanIds:['aia-15-25']};delete (old as Partial<typeof old>).housingBudget;const d=readJourney(old);assert.equal(d.housingBudget,null);assert.equal(d.residenceId,'aspen');assert.deepEqual(d.interestedPlanIds,['aia-15-25']);
});
test('importing a budget sets only its target fields and preserves funding, age and insurance references',()=>{
  const seed=readJourney({...emptyJourney(),targetAge:65,interestedPlanIds:['aia-excellent'],funding:[{id:'fund-savings',kind:'savings',measure:'current-balance',linkedPolicyId:null,amountSatang:{value:987654321,status:'member'}}]});
  const budget={plan:plan(),savedAt:now};const d=applyJourney(seed,{type:'housing-budget',budget},now);assert.equal(d.residenceId,'jin');assert.equal(d.years,10);assert.equal(d.occupants,2);assert.equal(d.targetAge,65);assert.deepEqual(d.funding,seed.funding);assert.deepEqual(d.interestedPlanIds,seed.interestedPlanIds);assert.equal(seed.housingBudget,null);
  const cleared=applyJourney(d,{type:'housing-budget',budget:null},now);assert.equal(cleared.housingBudget,null);assert.equal(cleared.residenceId,'jin');assert.deepEqual(cleared.funding,seed.funding);
});
test('changing a target exposes a stale budget without discarding the saved assumptions',()=>{
  const d=applyJourney(emptyJourney(),{type:'housing-budget',budget:{plan:plan(),savedAt:now}},now);assert.ok(housingMatchesTarget(d.housingBudget!,d));const changed=applyJourney(d,{type:'target',residenceId:'aspen',years:20,targetAge:70,occupants:1},now);assert.equal(housingMatchesTarget(changed.housingBudget!,changed),false);assert.deepEqual(changed.housingBudget,d.housingBudget);
});
