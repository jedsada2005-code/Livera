import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { insurancePlans, insuranceCompanies, coverLabel } from '../src/data/insuranceCatalog.ts';
import { applyDiscovery, budgetStatus, emptyDiscovery, emptyFilters, filterPlans, readDiscovery, validateScenario } from '../src/domain/discovery.ts';
import { applyJourney, emptyJourney, readJourney } from '../src/domain/journey.ts';

const scenario = emptyDiscovery().scenario;
const filter = (overrides: Partial<ReturnType<typeof emptyFilters>>, context = scenario) => filterPlans(insurancePlans, { ...emptyFilters(), ...overrides }, context);
test('catalog references six identifiable endowment products and keeps every personal premium unknown', () => {
  assert.equal(insurancePlans.length, 6);
  assert.equal(new Set(insurancePlans.map(p => p.id)).size, 6);
  for (const p of insurancePlans) {
    assert.equal(p.category, 'endowment');
    assert.equal(p.annualPremiumSatang, null);
    const host = new URL(p.sourceUrl).hostname;
    assert.ok(['www.aia.co.th', 'www.muangthai.co.th', 'online.muangthai.co.th'].includes(host));
    assert.equal(p.benefits.length, 2);
    assert.ok(insuranceCompanies.some(c => c.id === p.providerId));
  }
});
test('official logos are present as static SVG references', () => {
  for (const c of insuranceCompanies) {
    const path = new URL(`../public/${c.logo}`, import.meta.url);
    assert.ok(existsSync(path));
    const svg = readFileSync(path, 'utf8');
    assert.match(svg, /<svg/);assert.doesNotMatch(svg, /<script|<foreignObject|href=["']https?:/i);
    assert.equal(new URL(c.logoSource).protocol, 'https:');
  }
});
test('Thai savings synonyms, company spelling and case-insensitive compound terms search together', () => {
  assert.equal(filter({ query: 'ออมทรัพย์' }).length, 6);
  assert.equal(filter({ query: 'เมืองไทประกันชีวิต ออมทรัพย์' }).length, 3);
  assert.deepEqual(filter({ query: 'aIa 15/25' }).map(p => p.id), ['aia-15-25']);
  assert.equal(filter({ query: 'ไม่มีรายการนี้' }).length, 0);
});
test('provider and category filters combine; uncollected categories are empty', () => {
  assert.equal(filter({ providerId: 'aia' }).length, 3);
  assert.equal(filter({ providerId: 'mtl', query: 'AIA' }).length, 0);
  for (const category of ['health', 'pension']) assert.deepEqual(filter({ category }), []);
});
test('age filtering includes exact published maximum ages and excludes out-of-range ages', () => {
  const at = (age: number) => filter({}, { ...scenario, age }).map(p => p.id);
  assert.ok(at(50).includes('aia-saving-sure'));
  assert.ok(!at(51).includes('aia-saving-sure'));
  assert.ok(!at(18).includes('mtl-perfect-11-5'));
  assert.ok(at(65).includes('mtl-return-11-1'));
  assert.ok(!at(66).includes('mtl-return-11-1'));
  assert.deepEqual(at(75), ['aia-excellent']);
});
test('to-age coverage is not compared as a fixed 99-year term and needs age to filter duration', () => {
  const p = insurancePlans.find(p => p.id === 'aia-saving-sure')!;
  assert.equal(coverLabel(p), 'ถึงอายุ 99 ปี');
  assert.ok(!filter({ maxCoverYears: 60 }).some(p => p.id === 'aia-saving-sure'));
  assert.ok(filter({ maxCoverYears: 60 }, { ...scenario, age: 40 }).some(p => p.id === 'aia-saving-sure'));
  assert.ok(!filter({ maxCoverYears: 58 }, { ...scenario, age: 40 }).some(p => p.id === 'aia-saving-sure'));
});
test('pay and cover term filters intersect; single-premium is one payment year', () => {
  assert.deepEqual(filter({ maxPayYears: 1, maxCoverYears: 11 }).map(p => p.id), ['mtl-return-11-1']);
  assert.equal(filter({ maxPayYears: 5 }).length, 2);
});
test('a tiny budget keeps unknown quotes pending and never marks them affordable', () => {
  const context = { ...scenario, annualBudgetSatang: 100 };
  const plans = filter({}, context);
  assert.equal(plans.length, 6);
  assert.ok(plans.every(p => budgetStatus(p, context) === 'pending'));
});
test('scenario validates missing vs zero, fractional/invalid ages, unsafe amounts and extra fields', () => {
  assert.deepEqual(validateScenario(scenario), scenario);
  for (const age of [17,101,20.5,NaN,Infinity]) assert.throws(() => validateScenario({ ...scenario, age }));
  for (const annualBudgetSatang of [0,-1,.5,Infinity,NaN,100000000001]) assert.throws(() => validateScenario({ ...scenario,annualBudgetSatang }));
  assert.throws(() => validateScenario({ age: 30 }));
  assert.deepEqual(validateScenario({ ...scenario, age: 40, medicalDetails: 'private' }), { ...scenario,age:40 });
});
test('comparison accepts two or three plans, rejects the fourth atomically, and is idempotent', () => {
  let d = emptyDiscovery();
  for (const p of insurancePlans.slice(0,3)) d = applyDiscovery(d,{ type:'compare', id:p.id,value:true });
  assert.equal(d.compareIds.length,3);
  assert.deepEqual(applyDiscovery(d,{type:'compare',id:d.compareIds[0],value:true}),d);
  assert.throws(() => applyDiscovery(d,{type:'compare',id:insurancePlans[3].id,value:true}), /3/);
  assert.equal(d.compareIds.length,3);
  const removed = applyDiscovery(d,{type:'compare',id:d.compareIds[0],value:false});
  assert.equal(removed.compareIds.length,2);
  assert.equal(applyDiscovery(removed,{type:'compare',id:insurancePlans[3].id,value:true}).compareIds.length,3);
});
test('saving, comparing and editing the shared scenario preserve independent state and do not mutate inputs', () => {
  const seed = emptyDiscovery();
  let d = applyDiscovery(seed,{type:'save',id:'aia-15-25',value:true});
  d = applyDiscovery(d,{type:'compare',id:'mtl-return-11-1',value:true});
  d = applyDiscovery(d,{type:'scenario',scenario:{age:40,annualBudgetSatang:5000000,sumAssuredSatang:10000000}});
  assert.deepEqual(seed,emptyDiscovery());
  assert.deepEqual(d.savedIds,['aia-15-25']);
  assert.deepEqual(d.compareIds,['mtl-return-11-1']);
  const cleared = applyDiscovery(d,{type:'clear-compare'});
  assert.deepEqual(cleared.savedIds,d.savedIds);assert.deepEqual(cleared.scenario,d.scenario);
  assert.deepEqual(readDiscovery(JSON.parse(JSON.stringify(d))),d);
});
test('bad stored discovery records fail explicitly instead of clearing member choices silently', () => {
  for (const raw of [null,{}, { ...emptyDiscovery(),version:2 }, { ...emptyDiscovery(),savedIds:['fake'] }, { ...emptyDiscovery(),compareIds:['aia-15-25','aia-15-25'] }, { ...emptyDiscovery(),compareIds:'bad' }]) assert.throws(() => readDiscovery(raw));
  assert.throws(() => applyDiscovery(emptyDiscovery(),{type:'save',id:'fake',value:true}));
});
test('old Round 6 records migrate additively without losing funding or property targets', () => {
  const old = { ...emptyJourney(),residenceId:'aspen',years:20,interestedInsurer:'aia',funding:[{id:'fund-savings',kind:'savings',measure:'current-balance',linkedPolicyId:null,amountSatang:{value:12345678,status:'member'}}] };
  delete (old as Partial<typeof old>).interestedPlanIds;
  const migrated = readJourney(old);
  assert.deepEqual(migrated.interestedPlanIds,[]);
  assert.equal(migrated.funding[0].amountSatang.value,12345678);
  assert.equal(migrated.residenceId,'aspen');assert.equal(migrated.interestedInsurer,'aia');
});
test('interested products are references, never owned policies or assets, and can be removed idempotently', () => {
  const seed = applyJourney(emptyJourney(),{type:'interest',providerId:'mtl'});
  const d = applyJourney(seed,{type:'plan-interest',planId:'aia-15-25',value:true});
  assert.deepEqual(d.funding,seed.funding);assert.equal(d.interestedInsurer,'mtl');
  assert.deepEqual(d.interestedPlanIds,['aia-15-25']);assert.deepEqual(seed.interestedPlanIds,[]);
  assert.deepEqual(applyJourney(d,{type:'plan-interest',planId:'aia-15-25',value:true}).interestedPlanIds,['aia-15-25']);
  assert.deepEqual(applyJourney(d,{type:'plan-interest',planId:'aia-15-25',value:false}).interestedPlanIds,[]);
  for (const interestedPlanIds of [null,['fake'],['aia-15-25','aia-15-25']]) assert.throws(() => readJourney({...seed,interestedPlanIds}));
  assert.throws(() => applyJourney(seed,{type:'plan-interest',planId:'fake',value:true}));
});
