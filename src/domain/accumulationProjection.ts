import { addMonths, monthIndex, readAccumulation, sourceIssues } from './accumulation.ts';
import type { AccumulationSource, AccumulationState, PolicyFlow } from './accumulation.ts';
import { estimateHousing } from './housing.ts';
export const accumulationModelVersion='livera-cashflow-1';
const safe=(n:number)=>{if(!Number.isFinite(n)||Math.abs(n)>8000000000000000)throw new Error('ประมาณการเกินขอบเขตจำนวนเงิน ลองลดระยะเวลาหรือสมมติฐานผลตอบแทน');return Math.round(n);};
const monthlyRate=(bps:number)=>(1+bps/10000)**(1/12)-1;
export function savingsFuture(opening:number,contribution:number,annualBps:number,months:number){let balance=opening;const r=monthlyRate(annualBps);for(let i=0;i<months;i++)balance=safe(balance+safe(balance*r)+contribution);return balance;}
export function additionalSaving(gap:number,annualBps:number,months:number){
  if(gap<=0)return 0;if(months===0)return null;
  const rate=monthlyRate(annualBps);
  const reaches=(payment:number)=>{let balance=0;for(let i=0;i<months;i++){const next=balance+safe(balance*rate)+payment;if(next>=gap)return true;balance=safe(next);}return false;};
  let low=0,high=gap;while(low<high){const mid=Math.floor((low+high)/2);if(reaches(mid))high=mid;else low=mid+1;}return low;
}
export function flowOccurs(f:PolicyFlow,month:string){if(month<f.startMonth||f.frequency==='once'&&month!==f.startMonth||f.frequency!=='once'&&(!f.endMonth||month>f.endMonth))return false;return f.frequency!=='annual'||(monthIndex(month)-monthIndex(f.startMonth))%12===0;}
function policyCash(s:AccumulationSource,month:string){let incoming=0,premium=0,external=0,outside=0;
  if(s.policyMode==='surrender'&&s.surrenderMonth&&month>=s.surrenderMonth){if(month===s.surrenderMonth){if(s.receiveInPlan)incoming=s.values.surrender!;else outside=s.values.surrender!;}return {incoming,premium,external,outside};}
  for(const f of s.flows){if(!flowOccurs(f,month))continue;const v=f.amountSatang!;if(f.kind==='premium'){if(s.premiumFunding==='from-plan')premium=safe(premium+v);else external=safe(external+v);}else if(s.receiveInPlan)incoming=safe(incoming+v);else outside=safe(outside+v);}
  return {incoming,premium,external,outside};
}
type RetirementFlow={month:string;immediate:number;expense:number;income:number;housing:number;living:number;premium:number};
export type RetirementYear={year:number;month:string;age:number;openingSatang:number;incomeSatang:number;housingSatang:number;livingSatang:number;premiumSatang:number;returnSatang:number;closingSatang:number};
function retirementRun(initial:number,flows:RetirementFlow[],r:number,targetAge:number,collect=false){let balance=initial;let firstShortfall:string|null=null;const years:RetirementYear[]=[];let row:RetirementYear|undefined;let remaining=flows.reduce((sum,f)=>safe(sum+f.immediate+f.expense),0);
  for(let i=0;i<flows.length;i++){if(!collect&&r>=0&&balance>=remaining)return {balance,firstShortfall,years};const f=flows[i];remaining=safe(remaining-f.immediate-f.expense);if(collect&&i%12===0){row={year:Number(f.month.slice(0,4)),month:f.month,age:targetAge+Math.floor(i/12),openingSatang:balance,incomeSatang:0,housingSatang:0,livingSatang:0,premiumSatang:0,returnSatang:0,closingSatang:balance};years.push(row);}balance=safe(balance-f.immediate);if(balance<0&&!firstShortfall)firstShortfall=f.month;const growth=balance>0?safe(balance*r):0;balance=safe(balance+growth+f.income-f.expense);if(balance<0&&!firstShortfall)firstShortfall=f.month;if(row){row.incomeSatang=safe(row.incomeSatang+f.income);row.housingSatang=safe(row.housingSatang+f.housing);row.livingSatang=safe(row.livingSatang+f.living);row.premiumSatang=safe(row.premiumSatang+f.premium);row.returnSatang=safe(row.returnSatang+growth);row.closingSatang=balance;}}
  return {balance,firstShortfall,years};
}
export function requiredCapital(flows:RetirementFlow[],annualBps:number){const r=monthlyRate(annualBps);if(!retirementRun(0,flows,r,0).firstShortfall)return 0;let high=Math.max(1,flows.reduce((sum,f)=>safe(sum+f.expense+f.immediate),0));while(retirementRun(high,flows,r,0).firstShortfall)high=safe(high*2);let low=0;while(low<high){const mid=Math.floor((low+high)/2);if(retirementRun(mid,flows,r,0).firstShortfall)low=mid+1;else high=mid;}return low;}
export type SourceTrace={id:string;name:string;kind:string;status:'included'|'pending'|'excluded';reason:string;atTargetSatang:number|null;withdrawnSatang:number};
function requiredGoal(state:AccumulationState){const g=state.goal;return [[g.age,'อายุปัจจุบัน'],[g.targetAge,'อายุเกษียณ'],[g.endAge,'อายุปลายแผน'],[g.livingSatang,'รายจ่ายต่อเดือน'],[g.inflationBps,'สมมติเงินเฟ้อ'],[g.postReturnBps,'ผลตอบแทนหลังเกษียณ'],[g.extraReturnBps,'ผลตอบแทนเงินออมเพิ่ม']].filter(([v])=>v===null).map(([,label])=>String(label));}
export function projectAccumulation(raw:AccumulationState){
  const state=readAccumulation(raw),g=state.goal;const issues=requiredGoal(state);const notes:string[]=[];
  if(!g.confirmedNoOverlap)issues.push('ยืนยันตรวจบัญชีและรายรับที่นับซ้ำ');
  if(!state.sources.some(s=>!s.referenceOnly))issues.push('เพิ่มแหล่งเงินอย่างน้อยหนึ่งรายการ ระบุ 0 ได้เมื่อไม่มีเงิน');
  const seenPolicies=new Set<string>();const traces:SourceTrace[]=state.sources.map(s=>{const duplicate=!!s.policyId&&!s.referenceOnly&&seenPolicies.has(s.policyId);if(s.policyId&&!s.referenceOnly)seenPolicies.add(s.policyId);const missing=sourceIssues(s,g);if(duplicate)missing.push('กรมธรรม์เดียวกันถูกเพิ่มในแหล่งเงินอื่นแล้ว');const excluded=s.referenceOnly||s.kind==='tax'&&(s.reinvest===false||s.alreadyInSavings===true);if(!excluded&&missing.length)issues.push(`${s.name}: ${missing.join(' · ')}`);return {id:s.id,name:s.name,kind:s.kind,status:excluded?'excluded':missing.length?'pending':'included',reason:excluded?s.referenceOnly?'เก็บอ้างอิง / ไม่นับซ้ำ':s.reinvest===false?'ไม่ได้เลือกนำผลประหยัดภาษีมาออมต่อ':'รวมไว้ในเงินออมอื่นแล้ว':missing.length?missing.join(' · '):'ข้อมูลที่ระบุครบตามแบบจำลอง',atTargetSatang:excluded?0:null,withdrawnSatang:0};});
  for(const s of state.sources){const t=traces.find(t=>t.id===s.id)!;if(t.status!=='included')continue;if(s.kind==='sso')t.reason='รายรับหลังเกษียณตามเดือน ไม่นับเป็นเงินก้อนวันแรก';else if(s.kind==='pvd')t.reason=`สิทธินายจ้างที่ระบุ ${s.values.vested!/100}% หลังกันภาษี รับตอนเกษียณ`;else if(s.kind==='tax')t.reason='ออมผลประหยัดภาษีปีละครั้งก่อนเกษียณ';else if(s.kind==='insurance')t.reason=s.policyMode==='surrender'?'เวนคืนตามเดือนที่ระบุ ไม่นับผลตามสัญญาหลังเวนคืนซ้ำ':s.receiveInPlan===false?'ไม่นับเงินรับ ใช้เฉพาะเบี้ยที่เลือกหักจากแผน':'รับตามงวด ไม่ใช้เบี้ยสะสมแทนเงินครบสัญญา';else t.reason='ออมปลายเดือนและคิดผลตอบแทนสุทธิที่ระบุ';}
  const empty={modelVersion:accumulationModelVersion,status:'pending' as 'pending'|'partial'|'complete',issues,notes,traces,targetMonth:null as string|null,knownAssetsSatang:null as number|null,requiredCapitalSatang:null as number|null,gapSatang:null as number|null,additionalMonthlySatang:null as number|null,firstYearIncomeSatang:null as number|null,firstShortfall:null as string|null,preShortfall:null as string|null,endBalanceSatang:null as number|null,years:[] as RetirementYear[],preYears:[] as {month:string;balanceSatang:number}[],externalPremiumSatang:0};
  if(requiredGoal(state).length)return empty;
  const age=g.age!,target=g.targetAge!,end=g.endAge!,months=(target-age)*12,postMonths=(end-target)*12,targetMonth=addMonths(g.asOfMonth,months+1);
  const included=state.sources.filter(s=>traces.find(t=>t.id===s.id)?.status==='included');
  const accounts=included.filter(s=>['savings','insurance','tax'].includes(s.kind)).map(s=>({source:s,balance:s.kind==='savings'?s.values.opening!:0,rate:monthlyRate(s.kind==='insurance'&&s.receiveInPlan===false?0:s.values.return!)}));
  const pvds=included.filter(s=>s.kind==='pvd').map(s=>({source:s,employee:s.values.employee!,employer:s.values.employer!,rate:monthlyRate(s.values.return!)}));
  let debt=0,preShortfall:string|null=null,externalPremiumSatang=0;
  const draw=(amount:number)=>{let remain=amount;for(const a of accounts){const take=Math.min(a.balance,remain);a.balance-=take;remain-=take;const trace=traces.find(t=>t.id===a.source.id)!;trace.withdrawnSatang=safe(trace.withdrawnSatang+take);if(remain===0)break;}return remain;};
  const preYears:{month:string;balanceSatang:number}[]=[];
  for(let m=1;m<=months;m++){const month=addMonths(g.asOfMonth,m);let premiums=0;
    for(const a of accounts){const s=a.source;a.balance=safe(a.balance+safe(a.balance*a.rate));if(s.kind==='savings')a.balance=safe(a.balance+s.values.monthly!);else if(s.kind==='tax'&&m%12===0)a.balance=safe(a.balance+s.values.annualSaving!);else if(s.kind==='insurance'){const cash=policyCash(s,month);a.balance=safe(a.balance+cash.incoming);premiums=safe(premiums+cash.premium);externalPremiumSatang=safe(externalPremiumSatang+cash.external);}}
    for(const a of pvds){const v=a.source.values,salary=v.salary!*(1+v.salaryGrowth!/10000)**Math.floor((m-1)/12);a.employee=safe(a.employee+safe(a.employee*a.rate)+safe(salary*v.employeeRate!/10000));a.employer=safe(a.employer+safe(a.employer*a.rate)+safe(salary*v.employerRate!/10000));}
    debt=safe(debt+premiums);if(debt)debt=draw(debt);if(debt>0&&!preShortfall)preShortfall=month;
    if(m%12===0||m===months)preYears.push({month,balanceSatang:safe(accounts.reduce((sum,a)=>sum+a.balance,0)-debt+pvds.reduce((sum,a)=>sum+a.employee+a.employer*a.source.values.vested!/10000-a.source.values.exitTax!,0))});
  }
  let assets=safe(accounts.reduce((sum,a)=>sum+a.balance,0)-debt);
  for(const a of accounts)traces.find(t=>t.id===a.source.id)!.atTargetSatang=a.balance;
  for(const a of pvds){const net=safe(a.employee+safe(a.employer*a.source.values.vested!/10000)-a.source.values.exitTax!);assets=safe(assets+net);if(net<0)notes.push(`${a.source.name}: เงินกันภาษี/ค่าใช้จ่ายสูงกว่ายอดตามสิทธิ ส่วนเกินถูกหักจากเงินรวม`);traces.find(t=>t.id===a.source.id)!.atTargetSatang=net;}
  for(const s of included.filter(s=>s.kind==='sso'))traces.find(t=>t.id===s.id)!.atTargetSatang=0;
  if(debt){notes.push(`เงินจ่ายก่อนเกษียณที่ยังไม่มีแหล่งรองรับ ${debt/100} บาท ถูกหักจากเงินสุทธิวันเกษียณแล้ว`);traces.push({id:'model:shortfall',name:'ภาระก่อนเกษียณที่ยังขาด',kind:'adjustment',status:'included',reason:'ยอดที่ยังไม่มีเงินรองรับ หักจากเงินสุทธิ ณ เกษียณแล้ว ไม่ได้สมมติดอกเบี้ยกู้',atTargetSatang:-debt,withdrawnSatang:0});}
  if(accounts.some(a=>a.source.kind==='insurance'&&a.source.premiumFunding==='from-plan'))notes.push('เบี้ยที่จ่ายจากแผนหักจากบัญชีสภาพคล่องตามลำดับที่เพิ่ม ไม่ถอน PVD ก่อนเกษียณ');
  const housing=Array(postMonths).fill(0) as number[],immediate=Array(postMonths).fill(0) as number[];
  if(state.housingMode==='pending')issues.push('เลือกรวมงบที่พัก หรือยืนยันว่ารายจ่ายต่อเดือนรวมที่พักแล้ว');
  if(state.housingMode==='imported'){
    if(!state.housingBudget)issues.push('ยังไม่มีสำเนางบที่พัก');else{
      const p=state.housingBudget.plan,r=estimateHousing(p),startYear=Number(targetMonth.slice(0,4)),shift=startYear-p.startYear;
      if(r.status!=='complete')issues.push(`งบที่พักยังขาด: ${r.missing.join(' · ')}`);
      if(state.housingPricing==='as-entered'&&shift!==0)issues.push(`ปีเริ่มงบที่พัก ${p.startYear+543} ไม่ตรงปีเริ่มเกษียณ ${startYear+543}`);
      if(state.housingPricing==='inflate'&&shift<0)issues.push('ปีราคาที่พักอยู่หลังวันเกษียณ กรุณาแก้งบต้นทางก่อน');
      const canAlign=shift===0||state.housingPricing==='inflate'&&shift>=0;
      if(canAlign&&r.rows.length){const factor=state.housingPricing==='inflate'?(1+p.annualIncreaseBps!/10000)**shift:1,oneoffFactor=state.housingPricing==='inflate'?(1+g.inflationBps!/10000)**shift:1;
        if(shift>0&&state.housingPricing==='inflate')notes.push(`เลื่อนราคาที่พักจากปี ${p.startYear+543} ไปปี ${startYear+543}: ยอดประจำใช้อัตราขึ้นราคาของงบ เงินก้อน/เงินประกันใช้เงินเฟ้อของแผน`);
        immediate[0]=safe(safe((p.upfrontSatang??0)*oneoffFactor)+safe((p.depositSatang??0)*oneoffFactor));
        for(let y=0;y<Math.min(r.rows.length,end-target);y++){const row=r.rows[y];for(const [value,annual] of [[row.recurringSatang,p.model==='annual'],[row.careSatang,false],[row.otherSatang,false]] as const){if(value===null)continue;const yearly=safe(value*factor);for(let j=0;j<12;j++){const cost=annual?(j===0?yearly:0):Math.floor(yearly/12)+(j<yearly%12?1:0);housing[y*12+j]=safe(housing[y*12+j]+cost);}}}
      }
      if(postMonths>p.years*12){if(state.afterHousingMonthlySatang===null)issues.push('ค่าที่พักหลังหมดช่วงงบ 5–20 ปี');else for(let m=p.years*12;m<postMonths;m++)housing[m]=safe(state.afterHousingMonthlySatang*(1+g.inflationBps!/10000)**Math.floor((m-p.years*12)/12));}
      if(p.years>end-target)notes.push('คำนวณค่าที่พักเฉพาะช่วงที่อยู่ภายในอายุปลายแผน');
    }
  }
  const flows:RetirementFlow[]=[];
  for(let m=0;m<postMonths;m++){const month=addMonths(targetMonth,m),retireAge=target+Math.floor(m/12);let income=0,premium=0;
    for(const s of included){if(s.kind==='sso'&&retireAge>=s.values.startAge!&&retireAge<s.values.endAge!)income=safe(income+s.values.monthly!*(1+s.values.growth!/10000)**(retireAge-s.values.startAge!));if(s.kind==='insurance'){const cash=policyCash(s,month);income=safe(income+cash.incoming);premium=safe(premium+cash.premium);externalPremiumSatang=safe(externalPremiumSatang+cash.external);}}
    const living=safe(g.livingSatang!*(1+g.inflationBps!/10000)**(Math.floor(m/12)+(g.livingBasis==='today'?target-age:0)));
    flows.push({month,immediate:immediate[m],income,expense:safe(living+housing[m]+premium),housing:safe(housing[m]+immediate[m]),living,premium});
  }
  const simulation=retirementRun(assets,flows,monthlyRate(g.postReturnBps!),target,true);
  const complete=issues.length===0;const capital=complete?requiredCapital(flows,g.postReturnBps!):null;const gap=capital===null?null:Math.max(0,safe(capital-assets));
  if(externalPremiumSatang)notes.push('มีเบี้ยที่เลือกจ่ายนอกแผน ไม่หักจากบัญชีเหล่านี้ ยอดออมต่อเดือนต้องเป็นยอดสุทธิหลังกันเบี้ยแล้ว');
  return {...empty,status:complete?'complete' as const:'partial' as const,targetMonth,knownAssetsSatang:assets,requiredCapitalSatang:capital,gapSatang:gap,additionalMonthlySatang:gap===null?null:additionalSaving(gap,g.extraReturnBps!,months),firstYearIncomeSatang:flows.slice(0,12).reduce((sum,f)=>safe(sum+f.income),0),firstShortfall:complete?simulation.firstShortfall:null,preShortfall,endBalanceSatang:complete?simulation.balance:null,years:simulation.years,preYears,externalPremiumSatang};
}
