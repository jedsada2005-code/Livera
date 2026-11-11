import { residences, fundingOptions, providers } from '../data/catalog.ts';
import { validateMoney } from './catalog.ts';
import type { FundingRecord, FundingKind } from './catalog.ts';
export type JourneyDraft={version:1;residenceId:string|null;years:number;targetAge:number;occupants:1|2;funding:FundingRecord[];interestedInsurer:string|null;updatedAt:string|null};
export const emptyJourney=():JourneyDraft=>({version:1,residenceId:null,years:10,targetAge:60,occupants:1,funding:[],interestedInsurer:null,updatedAt:null});
export type JourneyAction={type:'target';residenceId:string|null;years:number;targetAge:number;occupants:1|2}|{type:'funding';records:FundingRecord[]}|{type:'interest';providerId:string};
export function readJourney(raw:unknown):JourneyDraft{
  if(!raw||typeof raw!=='object')throw new Error('ข้อมูลเส้นทางไม่ถูกต้อง');const r=raw as JourneyDraft;
  if(r.version!==1||r.residenceId!==null&&!residences.some(h=>h.id===r.residenceId)||!Number.isInteger(r.years)||r.years<5||r.years>20||!Number.isInteger(r.targetAge)||r.targetAge<18||r.targetAge>100||![1,2].includes(r.occupants)||!Array.isArray(r.funding)||r.funding.length>5||r.interestedInsurer!==null&&!providers.some(p=>p.id===r.interestedInsurer&&p.kind==='insurer')||r.updatedAt!==null&&(typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt))))throw new Error('ข้อมูลเส้นทางหรือเวอร์ชันไม่ถูกต้อง');
  const kinds=new Set<FundingKind>();const ids=new Set<string>();
  const funding=r.funding.map(record=>{
    if(!record||!Object.hasOwn(fundingOptions,record.kind)||kinds.has(record.kind)||typeof record.id!=='string'||record.id!==`fund-${record.kind}`||ids.has(record.id)||record.measure!==fundingOptions[record.kind].measure||record.linkedPolicyId!==null)throw new Error('รายการแหล่งเงินซ้ำหรือไม่ถูกต้อง');
    validateMoney(record.amountSatang);if(!['member','pending'].includes(record.amountSatang.status)||record.amountSatang.value!==null&&record.amountSatang.value>100000000000)throw new Error('ยอดที่ระบุไม่ถูกต้อง');
    // Future policy values require the benefit schedule, so Round 6 does not collect them as current assets.
    if(record.kind==='insurance'&&record.amountSatang.value!==null)throw new Error('ประกันต้องรอตารางผลประโยชน์');
    kinds.add(record.kind);ids.add(record.id);return {id:record.id,kind:record.kind,measure:record.measure,linkedPolicyId:null,amountSatang:{value:record.amountSatang.value,status:record.amountSatang.status}} as FundingRecord;
  });
  return {version:1,residenceId:r.residenceId,years:r.years,targetAge:r.targetAge,occupants:r.occupants,funding,interestedInsurer:r.interestedInsurer,updatedAt:r.updatedAt};
}
export function applyJourney(current:JourneyDraft,action:JourneyAction,now=new Date().toISOString()){
  const next=structuredClone(current);
  if(action.type==='target'){if(!Number.isInteger(action.years)||action.years<5||action.years>20)throw new Error('กรอกระยะเวลาตั้งแต่ 5 ถึง 20 ปี');if(!Number.isInteger(action.targetAge)||action.targetAge<18||action.targetAge>100)throw new Error('กรอกอายุเป้าหมายตั้งแต่ 18 ถึง 100 ปี');next.residenceId=action.residenceId;next.years=action.years;next.targetAge=action.targetAge;next.occupants=action.occupants;}
  else if(action.type==='funding')next.funding=structuredClone(action.records);
  else next.interestedInsurer=action.providerId;
  next.updatedAt=now;return readJourney(next);
}
export function journeyReadiness(d:JourneyDraft){return [{label:'เป้าหมายที่พัก',ready:d.residenceId!==null},{label:'ช่วงเวลาที่วางแผน',ready:true},{label:'เลือกแหล่งเงิน',ready:d.funding.length>0},{label:'ราคาจากผู้ให้บริการ',ready:false},{label:'ตารางผลประโยชน์ / สูตรรวมเงิน',ready:false}];}
