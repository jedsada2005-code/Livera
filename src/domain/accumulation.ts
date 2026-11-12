import { readHousingBudget } from './housing.ts';
import type { HousingBudget } from './housing.ts';
import type { JourneyDraft } from './journey.ts';
export const sourceKinds = { savings:'เงินออม / เงินลงทุน', pvd:'กองทุนสำรองเลี้ยงชีพ (PVD)', insurance:'ประกัน', sso:'ประกันสังคม', tax:'ผลประหยัดภาษี' } as const;
export type SourceKind = keyof typeof sourceKinds;
export type Field = { key:string; label:string; unit:'money'|'percent'|'age'; min?:number; max?:number; hint?:string };
export const sourceFields:Record<SourceKind,Field[]> = {
  savings:[{key:'opening',label:'ยอดเงินปัจจุบัน',unit:'money'},{key:'monthly',label:'ออมเพิ่มปลายเดือน',unit:'money',hint:'ยอดเหลือหลังหักเบี้ยที่จ่ายนอกแผน และไม่รวมบัญชีอื่นที่เพิ่มแล้ว'},{key:'return',label:'ผลตอบแทนสุทธิก่อนเกษียณ',unit:'percent',min:-2000,max:2000}],
  pvd:[{key:'employee',label:'ยอดส่วนลูกจ้างปัจจุบัน รวมผลประโยชน์',unit:'money'},{key:'employer',label:'ยอดส่วนนายจ้างปัจจุบัน รวมผลประโยชน์',unit:'money'},{key:'salary',label:'เงินเดือนปัจจุบัน',unit:'money'},{key:'employeeRate',label:'อัตราสะสมของลูกจ้าง',unit:'percent',min:0,max:10000},{key:'employerRate',label:'อัตราสมทบของนายจ้าง',unit:'percent',min:0,max:10000},{key:'salaryGrowth',label:'สมมติเงินเดือนเติบโตต่อปี',unit:'percent',min:-2000,max:2000},{key:'return',label:'ผลตอบแทนสุทธิกองทุนต่อปี',unit:'percent',min:-2000,max:2000},{key:'vested',label:'สิทธิส่วนนายจ้าง ณ เกษียณ',unit:'percent',min:0,max:10000,hint:'ตรวจข้อบังคับกองทุน ไม่ถือว่าได้สิทธิ 100% โดยอัตโนมัติ'},{key:'exitTax',label:'เงินกันไว้สำหรับภาษี/ค่าใช้จ่ายตอนออก',unit:'money',hint:'ระบุเอง ไม่คำนวณสิทธิตามกฎหมาย กรอก 0 เมื่อยืนยันว่าไม่มี'}],
  insurance:[{key:'return',label:'ผลตอบแทนสุทธิของเงินรับที่เก็บต่อก่อนเกษียณ',unit:'percent',min:-2000,max:2000},{key:'surrender',label:'เงินเวนคืนสุทธิที่คาดไว้',unit:'money'}],
  sso:[{key:'monthly',label:'รายรับสุทธิต่อเดือนที่ต้องการจำลอง',unit:'money',hint:'ระบุยอดในปีที่เริ่มใช้รายรับนี้ในแผน ไม่ประเมินสิทธิประกันสังคมให้อัตโนมัติ'},{key:'startAge',label:'อายุเริ่มใช้รายรับนี้ในแผน',unit:'age',min:18,max:109},{key:'endAge',label:'รับจนถึงก่อนครบอายุ',unit:'age',min:19,max:110},{key:'growth',label:'สมมติรายรับปรับต่อปี',unit:'percent',min:0,max:1000}],
  tax:[{key:'annualSaving',label:'ผลประหยัดภาษีที่คาดต่อปี',unit:'money',hint:'ไม่ใช่ยอดค่าลดหย่อน และไม่ใช่เงินคืนภาษีที่ยืนยันแล้ว'},{key:'return',label:'ผลตอบแทนสุทธิของเงินภาษีที่ออมต่อก่อนเกษียณ',unit:'percent',min:-2000,max:2000}],
};
export type PolicyFlow = {id:string;kind:'premium'|'benefit';frequency:'once'|'monthly'|'annual';startMonth:string;endMonth:string|null;amountSatang:number|null};
export type AccumulationSource = {id:string;name:string;kind:SourceKind;origin:'manual'|'round6';referenceOnly:boolean;values:Record<string,number|null>;legacyBalanceSatang:number|null;policyId:string|null;policyMode:'keep'|'surrender';surrenderMonth:string|null;premiumFunding:'external'|'from-plan'|null;receiveInPlan:boolean|null;scheduleComplete:boolean;flows:PolicyFlow[];reinvest:boolean|null;alreadyInSavings:boolean|null};
export type AccumulationGoal = {asOfMonth:string;age:number|null;targetAge:number|null;endAge:number|null;livingSatang:number|null;livingBasis:'today'|'at-target';inflationBps:number|null;postReturnBps:number|null;extraReturnBps:number|null;confirmedNoOverlap:boolean};
export type AccumulationState = {version:1;goal:AccumulationGoal;sources:AccumulationSource[];housingMode:'pending'|'none'|'imported';housingBudget:HousingBudget|null;housingPricing:'as-entered'|'inflate';afterHousingMonthlySatang:number|null;updatedAt:string|null};
export function currentPlanningMonth(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit'}).format(new Date());}
export const emptyAccumulation = (asOfMonth=currentPlanningMonth()):AccumulationState => ({version:1,goal:{asOfMonth,age:null,targetAge:60,endAge:null,livingSatang:null,livingBasis:'today',inflationBps:null,postReturnBps:null,extraReturnBps:null,confirmedNoOverlap:false},sources:[],housingMode:'pending',housingBudget:null,housingPricing:'as-entered',afterHousingMonthlySatang:null,updatedAt:null});
export const emptySource = (kind:SourceKind,id:string):AccumulationSource => ({id,name:sourceKinds[kind],kind,origin:'manual',referenceOnly:false,values:Object.fromEntries(sourceFields[kind].map(f=>[f.key,null])),legacyBalanceSatang:null,policyId:null,policyMode:'keep',surrenderMonth:null,premiumFunding:null,receiveInPlan:null,scheduleComplete:false,flows:[],reinvest:null,alreadyInSavings:null});
export function validMonth(value:unknown):value is string{return typeof value==='string'&&/^(20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value);}
export function monthIndex(value:string){const [year,month]=value.split('-').map(Number);return year*12+month-1;}
export function addMonths(value:string,months:number){const n=monthIndex(value)+months;return `${Math.floor(n/12)}-${String(n%12+1).padStart(2,'0')}`;}
const nullableNumber=(v:unknown,min:number,max:number,label:string)=>{if(v!==null&&(!Number.isSafeInteger(v)||Number(v)<min||Number(v)>max))throw new Error(`ตรวจ ${label}`);return v as number|null;};
const cash=(v:unknown,label:string)=>nullableNumber(v,0,100000000000,label);
const bool=(v:unknown):boolean|null=>{if(v!==true&&v!==false&&v!==null)throw new Error('ตรวจตัวเลือกที่ยังไม่ครบ');return v;};
const idValid=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
export function readGoal(raw:unknown):AccumulationGoal{
  if(!raw||typeof raw!=='object')throw new Error('ข้อมูลเป้าหมายไม่ถูกต้อง');const g=raw as AccumulationGoal;
  if(!validMonth(g.asOfMonth)||Number(g.asOfMonth.slice(0,4))>2099||!['today','at-target'].includes(g.livingBasis)||typeof g.confirmedNoOverlap!=='boolean')throw new Error('ตรวจเดือนตั้งต้นและวิธีนับรายจ่าย');
  const age=nullableNumber(g.age,18,100,'อายุปัจจุบัน 18–100 ปี');const targetAge=nullableNumber(g.targetAge,18,100,'อายุเกษียณ 18–100 ปี');const endAge=nullableNumber(g.endAge,19,110,'อายุปลายแผนไม่เกิน 110 ปี');
  if(age!==null&&targetAge!==null&&targetAge<age||endAge!==null&&targetAge!==null&&endAge<=targetAge)throw new Error('อายุเกษียณต้องไม่น้อยกว่าอายุปัจจุบัน และอายุปลายแผนต้องมากกว่าอายุเกษียณ');
  return {asOfMonth:g.asOfMonth,age,targetAge,endAge,livingSatang:cash(g.livingSatang,'รายจ่ายต่อเดือน'),livingBasis:g.livingBasis,inflationBps:nullableNumber(g.inflationBps,0,1000,'เงินเฟ้อ 0–10%'),postReturnBps:nullableNumber(g.postReturnBps,-2000,2000,'ผลตอบแทนหลังเกษียณ −20–20%'),extraReturnBps:nullableNumber(g.extraReturnBps,-2000,2000,'ผลตอบแทนเงินออมเพิ่ม −20–20%'),confirmedNoOverlap:g.confirmedNoOverlap};
}
export function readSource(raw:unknown):AccumulationSource{
  if(!raw||typeof raw!=='object')throw new Error('แหล่งเงินไม่ถูกต้อง');const s=raw as AccumulationSource;
  if(!idValid(s.id)||!Object.hasOwn(sourceKinds,s.kind)||typeof s.name!=='string'||!s.name.trim()||s.name.length>60||!['manual','round6'].includes(s.origin)||typeof s.referenceOnly!=='boolean'||!s.values||typeof s.values!=='object')throw new Error('ตรวจชื่อและประเภทแหล่งเงิน');
  const values=Object.fromEntries(sourceFields[s.kind].map(f=>[f.key,nullableNumber(s.values[f.key],f.min??0,f.max??100000000000,f.label)]));
  if(!['keep','surrender'].includes(s.policyMode)||s.surrenderMonth!==null&&!validMonth(s.surrenderMonth)||![null,'external','from-plan'].includes(s.premiumFunding)||typeof s.scheduleComplete!=='boolean'||s.policyId!==null&&!['saving','pension','health'].includes(s.policyId)||!Array.isArray(s.flows)||s.flows.length>60)throw new Error('ตรวจข้อมูลกรมธรรม์และตารางรับจ่าย');
  const ids=new Set<string>();const flows=s.flows.map(f=>{if(!f||!idValid(f.id)||ids.has(f.id)||!['premium','benefit'].includes(f.kind)||!['once','monthly','annual'].includes(f.frequency)||!validMonth(f.startMonth)||f.endMonth!==null&&!validMonth(f.endMonth)||f.endMonth!==null&&f.endMonth<f.startMonth)throw new Error('ตรวจเดือนและรายการรับจ่ายประกัน');ids.add(f.id);return {id:f.id,kind:f.kind,frequency:f.frequency,startMonth:f.startMonth,endMonth:f.frequency==='once'?null:f.endMonth,amountSatang:cash(f.amountSatang,'ยอดรับจ่ายประกัน')};});
  if(s.kind==='sso'&&values.startAge!==null&&values.endAge!==null&&values.endAge<=values.startAge)throw new Error('อายุสิ้นสุดรายรับต้องมากกว่าอายุเริ่ม');
  return {id:s.id,name:s.name.trim(),kind:s.kind,origin:s.origin,referenceOnly:s.referenceOnly,values,legacyBalanceSatang:s.kind==='pvd'?cash(s.legacyBalanceSatang,'ยอดรวม PVD เดิม'):null,policyId:s.kind==='insurance'?s.policyId:null,policyMode:s.policyMode,surrenderMonth:s.surrenderMonth,premiumFunding:s.premiumFunding,receiveInPlan:bool(s.receiveInPlan),scheduleComplete:s.scheduleComplete,flows:s.kind==='insurance'?flows:[],reinvest:bool(s.reinvest),alreadyInSavings:bool(s.alreadyInSavings)};
}
export function readAccumulation(raw:unknown):AccumulationState{
  if(!raw||typeof raw!=='object')throw new Error('อ่านแผนรวมเงินไม่ได้');const r=raw as AccumulationState;
  if(r.version!==1||!Array.isArray(r.sources)||r.sources.length>20||!['pending','none','imported'].includes(r.housingMode)||!['as-entered','inflate'].includes(r.housingPricing)||r.updatedAt!==null&&(typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt))))throw new Error('แผนหรือเวอร์ชันไม่ถูกต้อง');
  const sources=r.sources.map(readSource);if(new Set(sources.map(s=>s.id)).size!==sources.length)throw new Error('แหล่งเงินมีรหัสซ้ำ');
  return {version:1,goal:readGoal(r.goal),sources,housingMode:r.housingMode,housingBudget:r.housingBudget===null?null:readHousingBudget(r.housingBudget),housingPricing:r.housingPricing,afterHousingMonthlySatang:cash(r.afterHousingMonthlySatang,'ค่าที่พักหลังหมดช่วงงบ'),updatedAt:r.updatedAt};
}
export type AccumulationAction={type:'goal';goal:AccumulationGoal}|{type:'source';source:AccumulationSource}|{type:'remove-source';id:string}|{type:'housing';budget:HousingBudget|null;mode?:AccumulationState['housingMode'];pricing?:AccumulationState['housingPricing'];afterMonthly?:number|null}|{type:'import-journey';journey:JourneyDraft};
export function applyAccumulation(current:AccumulationState,action:AccumulationAction,now=new Date().toISOString()){
  const next=readAccumulation(current);
  if(action.type==='goal')next.goal=readGoal(action.goal);
  else if(action.type==='source'){const source=readSource(action.source);const i=next.sources.findIndex(s=>s.id===source.id);if(i<0)next.sources.push(source);else next.sources[i]=source;}
  else if(action.type==='remove-source')next.sources=next.sources.filter(s=>s.id!==action.id);
  else if(action.type==='housing'){next.housingBudget=action.budget===null?null:readHousingBudget(action.budget);next.housingMode=action.mode??(action.budget?'imported':'pending');if(action.pricing)next.housingPricing=action.pricing;if(action.afterMonthly!==undefined)next.afterHousingMonthlySatang=action.afterMonthly;}
  else {
    for(const record of action.journey.funding){const id=`legacy-${record.kind}`;if(next.sources.some(s=>s.id===id))continue;const s=emptySource(record.kind,id);s.origin='round6';const v=record.amountSatang.value;if(s.kind==='savings')s.values.opening=v;else if(s.kind==='pvd')s.legacyBalanceSatang=v;else if(s.kind==='sso')s.values.monthly=v;else if(s.kind==='tax')s.values.annualSaving=v;next.sources.push(s);}
    if(!next.housingBudget&&action.journey.housingBudget){next.housingBudget=readHousingBudget(action.journey.housingBudget);next.housingMode='imported';}
  }
  next.updatedAt=now;return readAccumulation(next);
}
export function sourceIssues(s:AccumulationSource,goal:AccumulationGoal):string[]{
  if(s.referenceOnly)return [];
  if(s.kind==='tax'&&s.reinvest===false)return [];
  if(s.kind==='tax'&&s.reinvest===true&&s.alreadyInSavings===true)return [];
  const issues=sourceFields[s.kind].filter(f=>s.values[f.key]===null&&(s.kind!=='insurance'||f.key==='return'&&s.receiveInPlan!==false||f.key==='surrender'&&s.policyMode==='surrender')).map(f=>f.label);
  if(s.kind==='insurance'){if(s.premiumFunding===null)issues.push('วิธีจ่ายเบี้ย');if(s.receiveInPlan===null)issues.push('การนำเงินรับเข้าแผน');if(!s.scheduleComplete)issues.push('ยืนยันตารางรับจ่ายครบ');if(s.policyMode==='surrender'&&!s.surrenderMonth)issues.push('เดือนเวนคืน');if(s.flows.some(f=>f.amountSatang===null||f.frequency!=='once'&&!f.endMonth))issues.push('ยอด/เดือนสิ้นสุดรายการรับจ่าย');}
  if(s.kind==='tax'){if(s.reinvest===null)issues.push('เลือกว่าจะออมผลประหยัดภาษีต่อหรือไม่');if(s.reinvest&&s.alreadyInSavings===null)issues.push('ตรวจว่าเงินภาษีรวมในเงินออมแล้วหรือไม่');}
  if(s.kind==='sso'&&goal.targetAge!==null&&s.values.startAge!==null&&s.values.startAge<goal.targetAge)issues.push('อายุเริ่มใช้รายรับต้องอยู่ตั้งแต่เกษียณในแบบจำลองนี้');
  return issues;
}
