import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, applyServiceAction, bangkokDate, coverageChecklist, emptyServices, readServiceData, validateCare, validateCoverage } from '../src/domain/services.ts';
import type { CareDraft, CoverageDraft, ServiceAction, ServiceData } from '../src/domain/services.ts';
const now='2026-11-11T03:00:00Z';let sequence=0;
const care=():CareDraft=>({category:'body',specialty:'internal',topic:'general',modality:'online',preferences:[{date:'2026-11-18',period:'morning'}],contact:'app',coordinationConsent:true,demoConsent:true});
const coverage=():CoverageDraft=>({goals:['health'],budget:'undecided',healthExample:'not-shared',policyIds:[],contact:'app',reviewConsent:true,healthConsent:false,policyConsent:false,demoConsent:true});
const apply=(data:ServiceData,action:ServiceAction,time=now)=>applyServiceAction(data,action,{id:`service-${++sequence}`,now:time});
function advance(data:ServiceData,id:string){const r=data.requests.find(r=>r.id===id)!;return apply(data,{type:'advance',id,revision:r.revision}).data;}
function proposed(draft=care()){const r=apply(emptyServices(),{type:'create-care',draft});return {data:advance(advance(r.data,r.createdId!),r.createdId!),id:r.createdId!};}
test('Bangkok date and day arithmetic handle midnight and year boundaries',()=>{
  assert.equal(bangkokDate('2026-12-31T18:00:00Z'),'2027-01-01');assert.equal(addDays('2026-12-31',1),'2027-01-01');assert.equal(addDays('2028-02-28',1),'2028-02-29');
});
test('care preference dates must be tomorrow through 90 days, and distinct',()=>{
  const min=addDays('2026-11-11',1),max=addDays('2026-11-11',90);
  for(const date of [min,max])assert.equal(validateCare({...care(),preferences:[{date,period:'morning'}]},now).preferences[0].date,date);
  for(const date of ['2026-11-11','2026-11-10',addDays(max,1),'2026-02-30'])assert.throws(()=>validateCare({...care(),preferences:[{date,period:'morning'}]},now));
  assert.throws(()=>validateCare({...care(),preferences:[...care().preferences,...care().preferences]},now),/สำรองต้องต่าง/);
});
test('specialty and discussion topic must match the selected care category',()=>{
  assert.throws(()=>validateCare({...care(),category:'mind'},now),/สาขา/);
  assert.throws(()=>validateCare({...care(),topic:'balance'},now),/หัวข้อ/);
  assert.equal(validateCare({...care(),category:'mind',specialty:'psychology',topic:'transition'},now).specialty,'psychology');
});
test('care coordination and demo acknowledgements are both required',()=>{
  assert.throws(()=>validateCare({...care(),coordinationConsent:false},now),/ประสานนัด/);assert.throws(()=>validateCare({...care(),demoConsent:false},now),/ข้อมูลตัวอย่าง/);
});
test('coverage requires purpose consent plus separate health and policy consents when chosen',()=>{
  assert.throws(()=>validateCoverage({...coverage(),reviewConsent:false}),/ยืนยัน/);
  assert.throws(()=>validateCoverage({...coverage(),healthExample:'diabetes-example'}),/สุขภาพตัวอย่าง/);
  assert.throws(()=>validateCoverage({...coverage(),policyIds:['health']}),/ชื่อและประเภท/);
  const r=validateCoverage({...coverage(),healthExample:'diabetes-example',healthConsent:true,policyIds:['health'],policyConsent:true});assert.equal(r.healthConsent,true);assert.equal(r.policyConsent,true);
});
test('payloads whitelist structured data and do not retain clinical text or payment files',()=>{
  const c=validateCare({...care(),symptoms:'private',medicalFiles:['private.pdf']} as CareDraft,now);assert.equal(Object.hasOwn(c,'symptoms'),false);assert.equal(Object.hasOwn(c,'medicalFiles'),false);
  const v=validateCoverage({...coverage(),medicalHistory:'private',premiumPaid:500000} as CoverageDraft);assert.equal(Object.hasOwn(v,'medicalHistory'),false);assert.equal(Object.hasOwn(v,'premiumPaid'),false);
  assert.equal(validateCoverage({...coverage(),healthConsent:true,policyConsent:true}).healthConsent,false);
});
test('coverage goals and policy references are bounded and unique',()=>{
  assert.throws(()=>validateCoverage({...coverage(),goals:[]}));assert.throws(()=>validateCoverage({...coverage(),goals:['health','health']}));assert.throws(()=>validateCoverage({...coverage(),policyIds:['unknown'] as never}));assert.throws(()=>validateCoverage({...coverage(),budget:'free-insurance'}));
});
test('creating a request does not mutate the prior data and starts a local audit trail',()=>{
  const s=emptyServices();const r=apply(s,{type:'create-care',draft:care()});assert.equal(s.requests.length,0);assert.equal(r.data.requests[0].status,'recorded');assert.equal(r.data.requests[0].history[0].actor,'member');assert.equal(r.data.requests[0].revision,1);
});
test('active care duplicates are blocked and cancellation preserves history',()=>{
  const r=apply(emptyServices(),{type:'create-care',draft:care()});assert.throws(()=>apply(r.data,{type:'create-care',draft:care()}),/อยู่แล้ว/);
  const d=apply(r.data,{type:'cancel',id:r.createdId!,revision:1}).data;assert.equal(d.requests[0].status,'cancelled');assert.equal(d.requests[0].history.length,2);assert.equal(apply(d,{type:'create-care',draft:care()}).data.requests.length,2);
});
test('one active coverage request is allowed and it never inherits care information',()=>{
  let d=apply(emptyServices(),{type:'create-care',draft:{...care(),category:'mind',specialty:'psychology',topic:'balance'}}).data;d=apply(d,{type:'create-coverage',draft:coverage()}).data;
  const r=d.requests.find(r=>r.kind==='coverage')!;assert.equal(r.kind,'coverage');if(r.kind==='coverage')assert.equal(r.coverage.healthExample,'not-shared');assert.throws(()=>apply(d,{type:'create-coverage',draft:{...coverage(),goals:['family']}}),/ทบทวนที่ยังไม่จบ/);
});
test('sample coordination and proposal are distinct from member acceptance',()=>{
  const r=proposed();const request=r.data.requests[0];assert.equal(request.status,'proposed');assert.equal(request.history.filter(h=>h.actor==='simulation').length,2);
  if(request.kind!=='care')assert.fail();assert.equal(request.proposal?.start,'2026-11-18T03:00:00.000Z');assert.equal(request.proposal?.feeSatang,90000);
  assert.throws(()=>apply(r.data,{type:'advance',id:r.id,revision:request.revision}),/ไม่มีขั้นตอน/);
});
test('accepting a sample appointment requires both fee and demo acknowledgement',()=>{
  const r=proposed();const revision=r.data.requests[0].revision;
  assert.throws(()=>apply(r.data,{type:'accept',id:r.id,revision,feeConsent:false,demoConsent:true}),/ค่าบริการ/);
  assert.throws(()=>apply(r.data,{type:'accept',id:r.id,revision,feeConsent:true,demoConsent:false}),/นัดสาธิต/);
  const d=apply(r.data,{type:'accept',id:r.id,revision,feeConsent:true,demoConsent:true}).data;assert.equal(d.requests[0].status,'confirmed');assert.equal(advance(d,r.id).requests[0].status,'completed');
});
test('expired proposed times cannot be accepted',()=>{
  const r=proposed();assert.throws(()=>apply(r.data,{type:'accept',id:r.id,revision:3,feeConsent:true,demoConsent:true},'2026-11-18T03:00:00Z'),/ผ่านมาแล้ว/);
});
test('a second confirmed sample appointment cannot overlap an existing one',()=>{
  const first=proposed();let d=apply(first.data,{type:'accept',id:first.id,revision:3,feeConsent:true,demoConsent:true}).data;
  const second=apply(d,{type:'create-care',draft:{...care(),specialty:'family'}});d=advance(advance(second.data,second.createdId!),second.createdId!);
  const r=d.requests.find(r=>r.id===second.createdId)!;assert.throws(()=>apply(d,{type:'accept',id:r.id,revision:r.revision,feeConsent:true,demoConsent:true}),/ซ้อน/);
});
test('rescheduling clears the old proposal and requires coordination and acceptance again',()=>{
  const r=proposed();let d=apply(r.data,{type:'accept',id:r.id,revision:3,feeConsent:true,demoConsent:true}).data;
  d=apply(d,{type:'edit-care',id:r.id,revision:4,draft:{...care(),preferences:[{date:'2026-11-20',period:'afternoon'}]}}).data;
  const changed=d.requests[0];assert.equal(changed.status,'recorded');assert.equal(changed.revision,5);assert.equal(changed.kind==='care'&&changed.proposal,undefined);assert.equal(changed.history.length,5);
});
test('stale revisions and terminal state changes are rejected',()=>{
  const r=apply(emptyServices(),{type:'create-care',draft:care()});const d=advance(r.data,r.createdId!);
  assert.throws(()=>apply(d,{type:'cancel',id:r.createdId!,revision:1}),/อีกแท็บ/);
  const cancelled=apply(d,{type:'cancel',id:r.createdId!,revision:2}).data;assert.throws(()=>apply(cancelled,{type:'advance',id:r.createdId!,revision:3}),/จบหรือยกเลิก/);
});
test('coverage produces conversation topics only and can be marked read',()=>{
  const r=apply(emptyServices(),{type:'create-coverage',draft:{...coverage(),healthExample:'diabetes-example',healthConsent:true}});let d=advance(advance(r.data,r.createdId!),r.createdId!);assert.equal(d.requests[0].status,'review-ready');
  const topics=coverageChecklist({...coverage(),healthExample:'diabetes-example',healthConsent:true});assert.ok(topics.some(t=>t.includes('ยังไม่สรุปผลรับประกัน')));assert.ok(!topics.some(t=>t.includes('รับประกันแน่นอน')));
  d=apply(d,{type:'complete-review',id:r.createdId!,revision:3}).data;assert.equal(d.requests[0].status,'completed');assert.equal(apply(d,{type:'create-coverage',draft:coverage()}).data.requests.length,2);
});
test('past stored dates remain readable, while simulating a new proposal requires fresh dates',()=>{
  const r=apply(emptyServices(),{type:'create-care',draft:care()});assert.equal(readServiceData(r.data).requests.length,1);
  const d=advance(r.data,r.createdId!);assert.throws(()=>apply(d,{type:'advance',id:r.createdId!,revision:2},'2026-12-01T03:00:00Z'),/พรุ่งนี้/);
});
test('invalid stored versions, status-kind combinations and missing proposals are rejected',()=>{
  assert.throws(()=>readServiceData({version:9,requests:[]}));const r=apply(emptyServices(),{type:'create-care',draft:care()});r.data.requests[0].status='confirmed';assert.throws(()=>readServiceData(r.data),/ไม่พบเวลา/);
  const v=apply(emptyServices(),{type:'create-coverage',draft:coverage()});v.data.requests[0].status='confirmed';assert.throws(()=>readServiceData(v.data),/สถานะ/);
});
