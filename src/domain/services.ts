import { budgetBands, careTopics, contacts, coverageGoals, healthExamples, serviceStatusLabels, specialties, timePeriods } from '../data/services.ts';
import { policies } from '../data/demo.ts';
import type { Policy } from '../data/demo.ts';
import { isValidDate } from './ledger.ts';
export type CareCategory='body'|'mind';
export type TimePeriod=typeof timePeriods[number]['id'];
export type PreferredTime={date:string;period:TimePeriod};
export type Contact=typeof contacts[number]['id'];
export type CareDraft={category:CareCategory;specialty:string;topic:string;modality:'online'|'in-person';preferences:PreferredTime[];contact:Contact;coordinationConsent:boolean;demoConsent:boolean};
export type CoverageDraft={goals:string[];budget:string;healthExample:string;policyIds:Policy['id'][];contact:Contact;reviewConsent:boolean;healthConsent:boolean;policyConsent:boolean;demoConsent:boolean};
export type ServiceStatus=keyof typeof serviceStatusLabels;
export type AuditEvent={at:string;actor:'member'|'simulation';label:string};
export type CareProposal={start:string;end:string;feeSatang:number;providerLabel:string};
type BaseRequest={id:string;revision:number;status:ServiceStatus;createdAt:string;updatedAt:string;history:AuditEvent[]};
export type CareRequest=BaseRequest&{kind:'care';care:CareDraft;proposal?:CareProposal};
export type CoverageRequest=BaseRequest&{kind:'coverage';coverage:CoverageDraft};
export type ServiceRequest=CareRequest|CoverageRequest;
export type ServiceData={version:1;requests:ServiceRequest[]};
export const emptyServices=():ServiceData=>({version:1,requests:[]});
export class ServiceError extends Error{}
export const bangkokDate=(now:string)=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));const get=(type:string)=>parts.find(p=>p.type===type)!.value;return `${get('year')}-${get('month')}-${get('day')}`;};
export function addDays(date:string,count:number){return new Date(Date.parse(date+'T00:00:00Z')+count*86400000).toISOString().slice(0,10);}
const contains=(items:readonly {id:string}[],id:unknown)=>typeof id==='string'&&items.some(item=>item.id===id);
const checkConsent=(v:unknown,message:string)=>{if(v!==true)throw new ServiceError(message);};
const validISO=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&Number.isFinite(Date.parse(v));
export function validateCare(d:CareDraft,now:string,checkFuture=true):CareDraft{
  if(!d||!['body','mind'].includes(d.category))throw new ServiceError('เลือกสุขภาพกายหรือสุขภาพใจ');
  if(!specialties.some(s=>s.id===d.specialty&&s.category===d.category))throw new ServiceError('เลือกสาขาให้ตรงกับประเภทการปรึกษา');
  if(!careTopics.some(t=>t.id===d.topic&&t.category===d.category))throw new ServiceError('เลือกหัวข้อให้ตรงกับประเภทการปรึกษา');
  if(!['online','in-person'].includes(d.modality))throw new ServiceError('เลือกรูปแบบการปรึกษา');
  if(!Array.isArray(d.preferences)||d.preferences.length<1||d.preferences.length>2)throw new ServiceError('เลือกช่วงเวลาที่สะดวก 1–2 ช่วง');
  const today=bangkokDate(now);const min=addDays(today,1);const max=addDays(today,90);
  for(const slot of d.preferences){if(!slot||typeof slot.date!=='string'||!isValidDate(slot.date)||!contains(timePeriods,slot.period))throw new ServiceError('วันที่หรือช่วงเวลาไม่ถูกต้อง');if(checkFuture&&(slot.date<min||slot.date>max))throw new ServiceError('เลือกวันที่ตั้งแต่พรุ่งนี้ถึง 90 วันข้างหน้า');}
  if(new Set(d.preferences.map(p=>p.date+'/'+p.period)).size!==d.preferences.length)throw new ServiceError('ช่วงเวลาสำรองต้องต่างจากช่วงแรก');
  if(!contains(contacts,d.contact))throw new ServiceError('เลือกช่องทางติดต่อสาธิต');
  checkConsent(d.coordinationConsent,'ยืนยันให้ใช้ข้อมูลที่เลือกเพื่อประสานนัดสาธิต');checkConsent(d.demoConsent,'ยืนยันว่าใช้ข้อมูลตัวอย่าง ไม่มีการนัดจริง');
  // Whitelist only structured fields; clinical records and free-text health details are not stored.
  return {category:d.category,specialty:d.specialty,topic:d.topic,modality:d.modality,preferences:d.preferences.map(p=>({date:p.date,period:p.period})),contact:d.contact,coordinationConsent:true,demoConsent:true};
}
export function validateCoverage(d:CoverageDraft):CoverageDraft{
  if(!d||!Array.isArray(d.goals)||d.goals.length<1||d.goals.length>3||d.goals.some(g=>!contains(coverageGoals,g))||new Set(d.goals).size!==d.goals.length)throw new ServiceError('เลือกเป้าหมายทบทวน 1–3 เรื่อง');
  if(!contains(budgetBands,d.budget)||!contains(healthExamples,d.healthExample))throw new ServiceError('เลือกงบและข้อมูลตัวอย่างให้ถูกต้อง');
  if(!Array.isArray(d.policyIds)||d.policyIds.length>3||d.policyIds.some(id=>!policies.some(p=>p.id===id))||new Set(d.policyIds).size!==d.policyIds.length)throw new ServiceError('เลือกกรมธรรม์ LIVERA ให้ถูกต้อง');
  if(!contains(contacts,d.contact))throw new ServiceError('เลือกช่องทางติดต่อสาธิต');
  checkConsent(d.reviewConsent,'ยืนยันให้ใช้ข้อมูลเพื่อทบทวนความคุ้มครองครั้งนี้');checkConsent(d.demoConsent,'ยืนยันว่าใช้ข้อมูลตัวอย่าง ไม่ได้สมัครหรือซื้อประกันจริง');
  if(d.healthExample!=='not-shared')checkConsent(d.healthConsent,'ยืนยันการใช้ข้อมูลสุขภาพตัวอย่างสำหรับการทบทวนนี้แยกจากการปรึกษา');
  if(d.policyIds.length)checkConsent(d.policyConsent,'ยืนยันการใช้ชื่อและประเภทของกรมธรรม์ที่เลือก');
  return {goals:[...d.goals].sort(),budget:d.budget,healthExample:d.healthExample,policyIds:[...d.policyIds].sort(),contact:d.contact,reviewConsent:true,healthConsent:d.healthExample!=='not-shared',policyConsent:d.policyIds.length>0,demoConsent:true};
}
export function readServiceData(raw:unknown):ServiceData{
  if(!raw||typeof raw!=='object')throw new ServiceError('ข้อมูลบริการไม่ถูกต้อง');const data=raw as ServiceData;
  if(data.version!==1||!Array.isArray(data.requests))throw new ServiceError('รูปแบบข้อมูลบริการไม่รองรับ');
  if(new Set(data.requests.map(r=>r.id)).size!==data.requests.length)throw new ServiceError('พบรหัสคำขอซ้ำ');
  for(const r of data.requests){
    if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||!Number.isSafeInteger(r.revision)||r.revision<1||!Object.hasOwn(serviceStatusLabels,r.status)||!validISO(r.createdAt)||!validISO(r.updatedAt)||!Array.isArray(r.history)||r.history.length<1||r.history.some(h=>!h||!validISO(h.at)||!['member','simulation'].includes(h.actor)||typeof h.label!=='string'||h.label.length>200))throw new ServiceError('รายละเอียดคำขอไม่ถูกต้อง');
    if(r.kind==='care'){
      validateCare(r.care,r.createdAt,false);if(r.status==='review-ready')throw new ServiceError('สถานะไม่ตรงกับประเภทบริการ');
      if(r.proposal&&(!validISO(r.proposal.start)||!validISO(r.proposal.end)||Date.parse(r.proposal.start)>=Date.parse(r.proposal.end)||!Number.isSafeInteger(r.proposal.feeSatang)||r.proposal.feeSatang<0||typeof r.proposal.providerLabel!=='string'||r.proposal.providerLabel.length>100))throw new ServiceError('ข้อเสนอเวลาสาธิตไม่ถูกต้อง');
      if(['proposed','confirmed','completed'].includes(r.status)&&!r.proposal)throw new ServiceError('ไม่พบเวลาเสนอสำหรับนัดสาธิต');
    }else if(r.kind==='coverage'){validateCoverage(r.coverage);if(['proposed','confirmed'].includes(r.status))throw new ServiceError('สถานะไม่ตรงกับคำขอทบทวน');}
    else throw new ServiceError('ไม่พบประเภทบริการ');
  }return data;
}
export type ServiceAction=
 |{type:'create-care';draft:CareDraft}|{type:'create-coverage';draft:CoverageDraft}
 |{type:'edit-care';id:string;revision:number;draft:CareDraft}|{type:'edit-coverage';id:string;revision:number;draft:CoverageDraft}
 |{type:'cancel'|'advance'|'complete-review';id:string;revision:number}
 |{type:'accept';id:string;revision:number;feeConsent:boolean;demoConsent:boolean};
export function isActiveRequest(r:ServiceRequest){return !['cancelled','completed'].includes(r.status);}
function duplicate(data:ServiceData,candidate:ServiceRequest){
  const active=data.requests.filter(r=>r.id!==candidate.id&&isActiveRequest(r));
  if(candidate.kind==='coverage'&&active.some(r=>r.kind==='coverage'))throw new ServiceError('มีคำขอทบทวนที่ยังไม่จบอยู่แล้ว เปิดรายการเดิมเพื่อแก้ไขหรือยกเลิกก่อน');
  if(candidate.kind==='care'&&active.some(r=>r.kind==='care'&&r.care.specialty===candidate.care.specialty&&r.care.topic===candidate.care.topic&&r.care.modality===candidate.care.modality&&r.care.preferences[0].date===candidate.care.preferences[0].date&&r.care.preferences[0].period===candidate.care.preferences[0].period))throw new ServiceError('มีคำขอสาขาและช่วงเวลานี้อยู่แล้ว ตรวจรายการของฉันก่อน');
}
export function applyServiceAction(current:ServiceData,action:ServiceAction,ctx:{id:string;now:string}={id:crypto.randomUUID(),now:new Date().toISOString()}){
  const data=structuredClone(readServiceData(current));if(!validISO(ctx.now)||!ctx.id||data.requests.some(r=>r.id===ctx.id))throw new ServiceError('รหัสหรือเวลาคำขอไม่ถูกต้อง');let createdId:string|undefined;
  const base=():BaseRequest=>({id:ctx.id,revision:1,status:'recorded',createdAt:ctx.now,updatedAt:ctx.now,history:[{at:ctx.now,actor:'member',label:'สมาชิกบันทึกคำขอด้วยข้อมูลตัวอย่างในเบราว์เซอร์'}]});
  if(action.type==='create-care'||action.type==='create-coverage'){
    const r:ServiceRequest=action.type==='create-care'?{...base(),kind:'care',care:validateCare(action.draft,ctx.now)}:{...base(),kind:'coverage',coverage:validateCoverage(action.draft)};
    duplicate(data,r);data.requests.unshift(r);createdId=r.id;
  }else{
    const r=data.requests.find(r=>r.id===action.id);if(!r)throw new ServiceError('ไม่พบคำขอบริการ');if(r.revision!==action.revision)throw new ServiceError('คำขอเปลี่ยนจากอีกแท็บแล้ว กรุณาปิดหน้าต่างและเปิดรายการใหม่');
    if(!isActiveRequest(r))throw new ServiceError('รายการนี้จบหรือยกเลิกแล้ว');
    let label='';let actor:AuditEvent['actor']='member';
    if(action.type==='cancel'){r.status='cancelled';label='สมาชิกยกเลิกคำขอสาธิต ไม่มีการส่งถึงผู้ให้บริการ';}
    else if(action.type==='edit-care'){
      if(r.kind!=='care')throw new ServiceError('ประเภทคำขอไม่ถูกต้อง');
      r.care=validateCare(action.draft,ctx.now);duplicate(data,r);delete r.proposal;r.status='recorded';label='สมาชิกแก้ช่วงเวลาหรือข้อมูลนัด เริ่มขั้นตอนสาธิตใหม่';
    }else if(action.type==='edit-coverage'){
      if(r.kind!=='coverage'||!['recorded','coordinating'].includes(r.status))throw new ServiceError('แก้ไขได้ก่อนแสดงหัวข้อทบทวนตัวอย่าง');
      r.coverage=validateCoverage(action.draft);duplicate(data,r);r.status='recorded';label='สมาชิกแก้ข้อมูลและยืนยันขอบเขตการทบทวนใหม่';
    }else if(action.type==='advance'){
      actor='simulation';
      if(r.status==='recorded'){r.status='coordinating';label='ระบบจำลองขั้นตอนประสานงาน ยังไม่มีเจ้าหน้าที่รับคำขอจริง';}
      else if(r.status==='coordinating'){
        if(r.kind==='coverage'){r.status='review-ready';label='ระบบสร้างหัวข้อคุยต่อจากตัวเลือก ไม่ใช่ผลพิจารณารับประกัน';}
        else{validateCare(r.care,ctx.now);const pref=r.care.preferences[0];const clock=timePeriods.find(p=>p.id===pref.period)!.sampleTime;const start=new Date(pref.date+'T'+clock+':00+07:00').toISOString();r.proposal={start,end:new Date(Date.parse(start)+30*60000).toISOString(),feeSatang:r.care.category==='body'?90000:120000,providerLabel:'ประเภทผู้ให้บริการตัวอย่าง · ยังไม่มีชื่อบุคลากรจริง'};r.status='proposed';label='ระบบจำลองเวลาและค่าปรึกษาตัวอย่าง ยังไม่มีคู่ค้ายืนยัน';}
      }else if(r.kind==='care'&&r.status==='confirmed'){r.status='completed';label='ระบบจำลองการจบนัด ไม่ได้มีการปรึกษาหรือรักษาจริง';}
      else throw new ServiceError('ไม่มีขั้นตอนจำลองถัดไปในสถานะนี้');
    }else if(action.type==='accept'){
      if(r.kind!=='care'||r.status!=='proposed'||!r.proposal)throw new ServiceError('ยังไม่มีข้อเสนอเวลาสาธิตให้ยืนยัน');checkConsent(action.feeConsent,'ตรวจค่าบริการตัวอย่างและยืนยันก่อนเลือกเวลานี้');checkConsent(action.demoConsent,'ยืนยันว่าเป็นนัดสาธิต ไม่มีการเรียกเก็บเงิน');
      if(Date.parse(r.proposal.start)<=Date.parse(ctx.now))throw new ServiceError('เวลาเสนอผ่านมาแล้ว กรุณาแก้ไขช่วงเวลาที่สะดวก');
      const proposal=r.proposal;
      if(data.requests.some(other=>other.id!==r.id&&other.kind==='care'&&other.status==='confirmed'&&other.proposal&&Date.parse(other.proposal.start)<Date.parse(proposal.end)&&Date.parse(other.proposal.end)>Date.parse(proposal.start)))throw new ServiceError('เวลานี้ซ้อนกับนัดสาธิตที่ยืนยันแล้ว เลือกช่วงเวลาใหม่');
      r.status='confirmed';label='สมาชิกยืนยันเวลาและรับทราบค่าบริการสมมติ ไม่มีการนัดหรือจ่ายเงินจริง';
    }else if(action.type==='complete-review'){
      if(r.kind!=='coverage'||r.status!=='review-ready')throw new ServiceError('ยังไม่มีหัวข้อทบทวนให้อ่าน');r.status='completed';label='สมาชิกทำเครื่องหมายอ่านหัวข้อสาธิตแล้ว ไม่ใช่การสมัครประกัน';
    }
    r.revision++;r.updatedAt=new Date(Math.max(Date.parse(ctx.now),Date.parse(r.updatedAt)+1)).toISOString();r.history.push({at:r.updatedAt,actor,label});
  }
  return {data:readServiceData(data),createdId};
}
export function coverageChecklist(d:CoverageDraft){
  const items:string[]=[];
  if(d.goals.includes('health'))items.push('เตรียมคุยเรื่องขอบเขตสุขภาพที่ต้องการ ความคุ้มครองเดิม วงเงิน และค่าใช้จ่ายที่ต้องรับผิดชอบเอง');
  if(d.goals.includes('retirement'))items.push('เตรียมคุยเรื่องกำหนดชำระเบี้ย เวลาเริ่มรับเงิน ระยะรับเงิน และผลหากหยุดแผนก่อนกำหนด');
  if(d.goals.includes('family'))items.push('เตรียมคุยเรื่องความต้องการของครอบครัว ผู้รับผลประโยชน์ และขอบเขตความคุ้มครองที่อยากทบทวน');
  if(d.healthExample!=='not-shared')items.push('ให้ผู้รับผิดชอบอธิบายกระบวนการพิจารณาข้อมูลสุขภาพ เงื่อนไข ข้อยกเว้น และเอกสารที่ต้องใช้ โดยยังไม่สรุปผลรับประกัน');
  if(d.policyIds.length)items.push('ใช้เฉพาะชื่อและประเภทของแผนที่คุณเลือกเป็นจุดเริ่มต้น ไม่ใช้ประวัติปรึกษาหรือไฟล์ชำระเบี้ย');
  items.push('ขอรายละเอียดเบี้ย เงื่อนไข ระยะรอ และข้อจำกัดของทางเลือกจริงก่อนตัดสินใจ ไม่มีการเสนอขายผลิตภัณฑ์ในต้นแบบนี้');
  return items;
}
