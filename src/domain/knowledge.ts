import { knowledge, topics } from '../data/knowledge.ts';
import type { KnowledgeItem, Topic } from '../data/knowledge.ts';
import type { Payment } from './ledger.ts';
import { policies } from '../data/demo.ts';
export type ReadingState = { read: boolean; position: number; completed: boolean; updatedAt: string };
export type KnowledgeData = { version: 1; saved: string[]; activity: Record<string, ReadingState>; interests: Topic[]; newsInApp: boolean };
export const emptyKnowledge = (): KnowledgeData => ({ version: 1, saved: [], activity: {}, interests: ['retirement','money','government'], newsInApp: true });
const itemFor = (id: string) => { const item=knowledge.find(item=>item.id===id); if(!item)throw new Error('ไม่พบเนื้อหานี้'); return item; };
export type KnowledgeAction = { type: 'save'; id: string; saved: boolean } | { type: 'read'; id: string } | { type: 'progress'; id: string; position: number; completed?: boolean } | { type: 'preferences'; interests: Topic[]; newsInApp: boolean };
export function applyKnowledgeAction(current: KnowledgeData, action: KnowledgeAction, now=new Date().toISOString()): KnowledgeData {
  if(!Number.isFinite(Date.parse(now)))throw new Error('วันเวลาไม่ถูกต้อง');
  const next=structuredClone(current);
  if(action.type==='preferences'){
    if(!Array.isArray(action.interests)||!action.interests.every(t=>Object.hasOwn(topics,t))||new Set(action.interests).size!==action.interests.length||typeof action.newsInApp!=='boolean')throw new Error('การตั้งค่าไม่ถูกต้อง');
    next.interests=[...action.interests];next.newsInApp=action.newsInApp;return next;
  }
  const item=itemFor(action.id);
  if(action.type==='save'){ if(typeof action.saved!=='boolean')throw new Error('การตั้งค่าไม่ถูกต้อง');next.saved=next.saved.filter(id=>id!==action.id);if(action.saved)next.saved.push(action.id);return next; }
  const old=next.activity[action.id]??{read:false,position:0,completed:false,updatedAt:now};
  if(action.type==='read'){if(item.kind!=='article')throw new Error('รายการนี้เป็นคลิป');next.activity[action.id]={...old,read:true,updatedAt:now};}
  else {
    if(item.kind!=='clip'||!Number.isFinite(action.position)||action.position<0||action.position>item.duration!+.5||action.completed!==undefined&&typeof action.completed!=='boolean')throw new Error('ตำแหน่งคลิปไม่ถูกต้อง');
    next.activity[action.id]={read:false,position:Math.min(item.duration!,action.position),completed:old.completed||action.completed===true,updatedAt:now};
  }return next;
}
export function readKnowledgeData(raw: unknown): KnowledgeData {
  if(!raw||typeof raw!=='object')throw new Error('ข้อมูลคลังความรู้เสียหาย');
  const r=raw as KnowledgeData;
  if(r.version!==1||!Array.isArray(r.saved)||!Array.isArray(r.interests)||!r.activity||typeof r.activity!=='object'||Array.isArray(r.activity)||typeof r.newsInApp!=='boolean')throw new Error('ข้อมูลคลังความรู้เสียหาย');
  if(r.saved.some(id=>!knowledge.some(item=>item.id===id))||new Set(r.saved).size!==r.saved.length)throw new Error('ข้อมูลที่เก็บไว้ไม่ถูกต้อง');
  const next=applyKnowledgeAction(emptyKnowledge(),{type:'preferences',interests:r.interests,newsInApp:r.newsInApp}); next.saved=[...r.saved];
  for(const [id,a] of Object.entries(r.activity)){
    const item=itemFor(id);
    if(!a||typeof a.read!=='boolean'||typeof a.completed!=='boolean'||!Number.isFinite(a.position)||a.position<0||a.position>(item.duration??0)||!Number.isFinite(Date.parse(a.updatedAt))||(item.kind==='article'&&(a.completed||a.position!==0))||(item.kind==='clip'&&a.read))throw new Error('ประวัติการอ่านไม่ถูกต้อง');
    next.activity[id]={read:a.read,position:a.position,completed:a.completed,updatedAt:a.updatedAt};
  }return next;
}
export type KnowledgeFilter = { query: string; topic: Topic|'all'; kind: 'all'|'article'|'clip'; collection: 'all'|'saved'|'continue'|'interests' };
export function filterKnowledge(data: KnowledgeData, filter: KnowledgeFilter): KnowledgeItem[]{
  const query=filter.query.trim().toLocaleLowerCase('th');
  return knowledge.filter(item=>(filter.topic==='all'||item.topic===filter.topic)&&(filter.kind==='all'||item.kind===filter.kind)&&(!query||`${item.title} ${item.summary} ${item.source} ${topics[item.topic]}`.toLocaleLowerCase('th').includes(query))&&(filter.collection==='all'||filter.collection==='saved'&&data.saved.includes(item.id)||filter.collection==='interests'&&data.interests.includes(item.topic)||filter.collection==='continue'&&item.kind==='clip'&&Boolean(data.activity[item.id]?.position)&&!data.activity[item.id]?.completed));
}
export function annualPremiums(entries: Payment[], year: number){
  if(!Number.isInteger(year)||year<1900||year>3000)throw new Error('ปีไม่ถูกต้อง');
  return policies.map(policy=>{
    const rows=entries.filter(e=>e.policyId===policy.id&&e.status!=='voided'&&e.paidDate.startsWith(`${year}-`));
    return { name:policy.name,count:rows.length,satang:rows.reduce((sum,e)=>sum+e.satang,0),pending:rows.filter(e=>e.status==='pending').length };
  });
}
export function premiumSummaryCSV(entries: Payment[], year: number){
  const rows=annualPremiums(entries,year);
  return '\uFEFF'+[['LIVERA DEMO - สรุปที่ผู้ใช้บันทึก ไม่ใช่หนังสือรับรองภาษี'],['ปี พ.ศ.',String(year+543)],['กรมธรรม์','จำนวนรายการ','ยอดที่บันทึก (บาท)','รายการรอตรวจ'],...rows.map(r=>[r.name,String(r.count),(r.satang/100).toFixed(2),String(r.pending)]),['ยอดนี้ยังไม่ยืนยันการชำระหรือสิทธิลดหย่อนจากบริษัทประกัน']].map(row=>row.map(cell=>`"${cell.replaceAll('"','""')}"`).join(',')).join('\r\n');
}
