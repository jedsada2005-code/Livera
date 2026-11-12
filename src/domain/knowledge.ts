import { knowledge, topics } from '../data/knowledge.ts';
import type { KnowledgeItem, Topic } from '../data/knowledge.ts';
import type { Payment } from './ledger.ts';
import { policies } from '../data/demo.ts';
export type ReadingState = { read: boolean; position: number; completed: boolean; updatedAt: string };
export type KnowledgeData = { version: 1; saved: string[]; activity: Record<string, ReadingState>; interests: Topic[]; newsInApp: boolean; lastReelId: string|null; player: { muted: boolean; autoPlay: boolean } };
export const emptyKnowledge = (): KnowledgeData => ({ version: 1, saved: [], activity: {}, interests: Object.keys(topics) as Topic[], newsInApp: true, lastReelId: null, player: { muted: true, autoPlay: false } });
const itemFor = (id: string) => { const item=knowledge.find(item=>item.id===id); if(!item)throw new Error('ไม่พบเนื้อหานี้'); return item; };
export type KnowledgeAction = { type: 'save'; id: string; saved: boolean } | { type: 'read'; id: string } | { type: 'progress'; id: string; position: number; completed?: boolean } | { type: 'preferences'; interests: Topic[]; newsInApp: boolean } | { type: 'view'; id: string } | { type: 'player'; muted: boolean; autoPlay: boolean };
export function applyKnowledgeAction(current: KnowledgeData, action: KnowledgeAction, now=new Date().toISOString()): KnowledgeData {
  if(!Number.isFinite(Date.parse(now)))throw new Error('วันเวลาไม่ถูกต้อง');
  const next=structuredClone(current);
  if(action.type==='player'){
    if(typeof action.muted!=='boolean'||typeof action.autoPlay!=='boolean')throw new Error('การตั้งค่าคลิปไม่ถูกต้อง');
    next.player={muted:action.muted,autoPlay:action.autoPlay};return next;
  }
  if(action.type==='preferences'){
    if(!Array.isArray(action.interests)||!action.interests.every(t=>Object.hasOwn(topics,t))||new Set(action.interests).size!==action.interests.length||typeof action.newsInApp!=='boolean')throw new Error('การตั้งค่าไม่ถูกต้อง');
    next.interests=[...action.interests];next.newsInApp=action.newsInApp;return next;
  }
  const item=itemFor(action.id);
  if(action.type==='view'){if(item.kind!=='clip')throw new Error('รายการนี้ไม่ใช่คลิป');next.lastReelId=item.id;return next;}
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
  }
  // Round 5 records remain valid. Only absent new fields receive defaults.
  if(r.lastReelId!==undefined&&r.lastReelId!==null){if(itemFor(r.lastReelId).kind!=='clip')throw new Error('คลิปล่าสุดไม่ถูกต้อง');next.lastReelId=r.lastReelId;}
  if(r.player!==undefined){if(!r.player||typeof r.player.muted!=='boolean'||typeof r.player.autoPlay!=='boolean')throw new Error('การตั้งค่าคลิปไม่ถูกต้อง');next.player={muted:r.player.muted,autoPlay:r.player.autoPlay};}
  return next;
}
export type KnowledgeFilter = { query: string; topic: Topic|'all'; kind: 'all'|'article'|'clip'; collection: 'all'|'saved'|'continue'|'interests'|'unread'|'history' };
export function filterKnowledge(data: KnowledgeData, filter: KnowledgeFilter): KnowledgeItem[]{
  const query=filter.query.trim().toLocaleLowerCase('th');
  return knowledge.filter(item=>(filter.topic==='all'||item.topic===filter.topic)&&(filter.kind==='all'||item.kind===filter.kind)&&(!query||`${item.title} ${item.summary} ${item.source} ${topics[item.topic]} ${item.sections.map(s=>s.body).join(' ')}`.toLocaleLowerCase('th').includes(query))&&(filter.collection==='all'||filter.collection==='saved'&&data.saved.includes(item.id)||filter.collection==='interests'&&data.interests.includes(item.topic)||filter.collection==='continue'&&item.kind==='clip'&&Boolean(data.activity[item.id]?.position)&&!data.activity[item.id]?.completed||filter.collection==='unread'&&!data.activity[item.id]?.read&&!data.activity[item.id]?.completed||filter.collection==='history'&&Boolean(data.activity[item.id]?.read||data.activity[item.id]?.position||data.activity[item.id]?.completed)));
}
export type KnowledgeSort = 'recommended'|'newest'|'recent';
export function sortKnowledge(items: KnowledgeItem[], data: KnowledgeData, sort: KnowledgeSort): KnowledgeItem[]{
  return [...items].sort((a,b)=>{
    if(sort==='recent')return (data.activity[b.id]?.updatedAt??'').localeCompare(data.activity[a.id]?.updatedAt??'');
    if(sort==='recommended'){
      const score=(item:KnowledgeItem)=>Number(data.interests.includes(item.topic))*2+Number(!data.activity[item.id]?.read&&!data.activity[item.id]?.completed);
      const difference=score(b)-score(a);if(difference)return difference;
    }
    // An unknown publication date never becomes "new" merely because it was checked today.
    return (b.publishedOn??'').localeCompare(a.publishedOn??'');
  });
}
export const knowledgeHref=(item:KnowledgeItem)=>item.kind==='clip'?`#/knowledge/reels/${item.id}`:`#/knowledge/${item.id}`;
export function reelForLink(section:string,id:string,lastId:string|null){
  const clips=knowledge.filter(k=>k.kind==='clip');
  const requested=section==='reels'||section==='clips'?id:section;
  return requested?clips.find(k=>k.id===requested):clips.find(k=>k.id===lastId)??clips[0];
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
