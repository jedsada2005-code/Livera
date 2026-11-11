import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { applyJourney, emptyJourney, readJourney, journeyReadiness } from '../src/domain/journey.ts';
import { currentBalanceInput, validateEvidence, validateMoney } from '../src/domain/catalog.ts';
import type { FundingKind, FundingRecord, Evidence } from '../src/domain/catalog.ts';
import { providers, residences, offeringSlots, fundingOptions } from '../src/data/catalog.ts';
const now='2026-11-11T06:00:00Z';
const record=(kind:FundingKind,value:number|null=null):FundingRecord=>({id:`fund-${kind}`,kind,measure:fundingOptions[kind].measure,linkedPolicyId:null,amountSatang:{value,status:value===null?'pending':'member'}});
const apply=(data:ReturnType<typeof emptyJourney>,action:Parameters<typeof applyJourney>[1])=>applyJourney(data,action,now);
test('unknown money is pending/null and differs from an explicitly entered zero',()=>{
  assert.equal(validateMoney({value:null,status:'pending'}).value,null);assert.equal(validateMoney({value:0,status:'member'}).value,0);
  assert.throws(()=>validateMoney({value:0,status:'pending'}));assert.throws(()=>validateMoney({value:null,status:'member'}));
});
test('verified data requires a valid source and check date; source schemes are bounded',()=>{
  assert.throws(()=>validateEvidence({value:'x',status:'verified'}));assert.throws(()=>validateEvidence({value:'x',status:'verified',sourceUrl:'http://example.com',checkedOn:'2026-11-11'}));assert.throws(()=>validateEvidence({value:'x',status:'verified',sourceUrl:'https://example.com',checkedOn:'2026-02-30'}));
  assert.equal(validateEvidence({value:'x',status:'verified',sourceUrl:'https://example.com',checkedOn:'2026-11-11'}).status,'verified');
});
test('money rejects negative, fractional satang, and nonfinite numbers',()=>{for(const value of [-1,.5,NaN,Infinity])assert.throws(()=>validateMoney({value,status:'member'}));});
test('fixture providers are examples, not asserted contracted partners, and product slots contain no invented prices',()=>{
  assert.ok(providers.every(p=>p.relationship==='example'&&p.logo.path===null));
  for(const slot of offeringSlots){assert.equal(slot.name.value,null);assert.equal(slot.annualPremiumSatang.value,null);assert.equal(slot.quoteBasis,null);assert.deepEqual(slot.cashflows,[]);}
  for(const home of residences){validateEvidence(home.description);assert.ok(home.image.sourceUrl);assert.equal(home.image.kind,'photo');assert.ok(existsSync(new URL(`../public/${home.image.path}`,import.meta.url)));assert.equal(home.packages[0].model,'pending');assert.equal(home.packages[0].recurringSatang.value,null);}
});
test('target stores five to twenty years and independent property selection without changing input',()=>{
  const seed=emptyJourney();for(const years of [5,10,20]){const next=apply(seed,{type:'target',residenceId:'jin',years,targetAge:60,occupants:2});assert.equal(next.years,years);assert.equal(next.residenceId,'jin');assert.equal(next.updatedAt,now);}
  assert.equal(seed.residenceId,null);
});
test('invalid horizons, ages, occupancy and property IDs are rejected',()=>{
  const valid={type:'target' as const,residenceId:'aspen',years:10,targetAge:60,occupants:1 as const};
  for(const years of [4,21,5.5,NaN])assert.throws(()=>apply(emptyJourney(),{...valid,years}));
  for(const targetAge of [17,101,60.5,Infinity])assert.throws(()=>apply(emptyJourney(),{...valid,targetAge}));
  assert.throws(()=>apply(emptyJourney(),{...valid,residenceId:'fake'}));assert.throws(()=>readJourney({...emptyJourney(),occupants:3}));
});
test('target and funding actions preserve independent saved selections',()=>{
  let d=apply(emptyJourney(),{type:'interest',providerId:'aia'});d=apply(d,{type:'funding',records:[record('savings',12345)]});d=apply(d,{type:'target',residenceId:'aspen',years:20,targetAge:65,occupants:2});assert.equal(d.funding[0].amountSatang.value,12345);assert.equal(d.interestedInsurer,'aia');
  assert.throws(()=>apply(d,{type:'interest',providerId:'jin'}));
});
test('funding kinds, identifiers and measurement units cannot be duplicated or mixed',()=>{
  assert.throws(()=>apply(emptyJourney(),{type:'funding',records:[record('pvd'),record('pvd')]}));
  assert.throws(()=>apply(emptyJourney(),{type:'funding',records:[{...record('sso'),measure:'current-balance'}]}));
  assert.throws(()=>apply(emptyJourney(),{type:'funding',records:[{...record('tax'),id:'fund-savings'}]}));
});
test('SSO, insurance proceeds and tax savings are never blindly counted as current cash',()=>{
  for(const kind of ['sso','insurance','tax'] as FundingKind[])assert.equal(currentBalanceInput(record(kind,100000)),null);
  assert.equal(currentBalanceInput(record('savings',0)),0);assert.equal(currentBalanceInput(record('pvd',12345)),12345);assert.equal(currentBalanceInput(record('savings')),null);
});
test('insurance needs a future benefit schedule; member records cannot impersonate verified data',()=>{
  assert.throws(()=>apply(emptyJourney(),{type:'funding',records:[record('insurance',50000)]}));
  assert.throws(()=>apply(emptyJourney(),{type:'funding',records:[{...record('savings',100),amountSatang:{value:100,status:'verified',sourceUrl:'https://example.com',checkedOn:'2026-11-11'}}]}));
  assert.throws(()=>apply(emptyJourney(),{type:'funding',records:[{...record('insurance'),linkedPolicyId:'saving'}]}));
});
test('read roundtrip retains member amounts and pending amounts, and removes extra private fields',()=>{
  const input=apply(emptyJourney(),{type:'funding',records:[record('savings',12345),record('insurance'),record('sso',200000),record('tax',500000)]});
  const read=readJourney({...input,medicalNote:'private',funding:input.funding.map(r=>({...r,privateFile:'secret.pdf',amountSatang:{...r.amountSatang,extra:'secret'}}))});assert.deepEqual(read,input);assert.equal(Object.hasOwn(read,'medicalNote'),false);
});
test('invalid stored versions and types fail explicitly instead of being silently reset',()=>{
  for(const raw of [null,{}, {...emptyJourney(),version:2}, {...emptyJourney(),funding:'bad'}, {...emptyJourney(),updatedAt:123}, {...emptyJourney(),funding:[{...record('pvd'),amountSatang:{value:Infinity,status:'member'}}]}])assert.throws(()=>readJourney(raw));
  assert.throws(()=>validateEvidence({value:1,status:'unknown'} as unknown as Evidence<number>));
});
test('readiness describes data preparation, and never treats sample supplier pricing as available',()=>{
  const d=apply(emptyJourney(),{type:'target',residenceId:'jin',years:10,targetAge:60,occupants:1});const states=journeyReadiness(d);assert.equal(states.find(s=>s.label==='ราคาจากผู้ให้บริการ')?.ready,false);assert.equal(states.find(s=>s.label==='ตารางผลประโยชน์ / สูตรรวมเงิน')?.ready,false);
});
