// Round 6 contracts. Unknown monetary values stay null and never become zero.
export type DataStatus = 'verified' | 'member' | 'estimate' | 'demo' | 'pending';
export type Evidence<T> = { value:T|null; status:DataStatus; sourceUrl?:string; checkedOn?:string; note?:string };
export type MediaAsset = { path:string|null; kind:'photo'|'render'|'logo'|'placeholder'; sourceUrl:string|null; alt:string; usage:'public-reference'|'partner-supplied'|'pending' };
export type Provider = { id:string; name:string; kind:'insurer'|'residence'; relationship:'example'|'confirmed'; website:string; logo:MediaAsset };
export type BenefitCashflow = { year:number; satang:Evidence<number>; kind:'premium'|'cashback'|'maturity'|'pension'; guaranteed:boolean|null };
export type InsuranceCategory = 'endowment'|'pension'|'health';
export type InsuranceOffering = { id:string; providerId:string; category:InsuranceCategory; name:Evidence<string>; annualPremiumSatang:Evidence<number>; payYears:Evidence<number>; coverYears:Evidence<number>; cashflows:BenefitCashflow[]; quoteBasis:{age:number;sumAssuredSatang:number;frequency:'monthly'|'annual'}|null };
export type Residence = { id:string; providerId:string; name:string; location:string; description:Evidence<string>; image:MediaAsset; services:('residence'|'wellness')[]; packages:ResidencePackage[] };
export type ResidencePackage = { id:string; model:'monthly'|'annual'|'lifetime-lease'|'purchase'|'per-visit'|'pending'; occupants:number|null; upfrontSatang:Evidence<number>; recurringSatang:Evidence<number>; depositSatang:Evidence<number>; escalationPercent:Evidence<number>; included:Evidence<string[]>; excluded:Evidence<string[]>; validUntil:string|null };
export type FundingKind = 'savings'|'insurance'|'pvd'|'sso'|'tax';
export type FundingRecord = { id:string; kind:FundingKind; amountSatang:Evidence<number>; measure:'current-balance'|'monthly-income'|'annual-tax-saving'; linkedPolicyId:string|null };
export type FutureCashflow = { year:number; sourceRecordId:string; direction:'in'|'out'; satang:Evidence<number>; includedInAssetBalance:boolean };
export type ContentEntry = { id:string; format:'news'|'reel'; sourceUrl:string; publishedOn:string|null; checkedOn:string; media:MediaAsset|null; summary:Evidence<string> };
export function validateEvidence<T>(data:Evidence<T>):Evidence<T>{
  if(!data||!['verified','member','estimate','demo','pending'].includes(data.status))throw new Error('สถานะข้อมูลไม่ถูกต้อง');
  if(data.value===undefined)throw new Error('ระบุค่าหรือ null ให้ชัดเจน');
  if(data.status==='pending'&&data.value!==null)throw new Error('ข้อมูลรอยืนยันต้องยังไม่มีค่า');
  if(data.status!=='pending'&&data.value===null)throw new Error('ระบุค่าหรือใช้สถานะรอข้อมูล');
  if(data.status==='verified'&&(!data.sourceUrl||!data.checkedOn))throw new Error('ข้อมูลยืนยันต้องมีแหล่งที่มาและวันที่');
  if(data.checkedOn&&(!/^\d{4}-\d{2}-\d{2}$/.test(data.checkedOn)||!Number.isFinite(Date.parse(data.checkedOn))||new Date(data.checkedOn).toISOString().slice(0,10)!==data.checkedOn))throw new Error('วันที่ตรวจข้อมูลไม่ถูกต้อง');
  if(data.sourceUrl&&new URL(data.sourceUrl).protocol!=='https:')throw new Error('ใช้แหล่งข้อมูล HTTPS');
  return {...data};
}
export function validateMoney(data:Evidence<number>){
  validateEvidence(data);
  if(data.value!==null&&(!Number.isSafeInteger(data.value)||data.value<0))throw new Error('จำนวนเงินต้องเป็นสตางค์ที่ไม่ติดลบ');
  return {...data};
}
export function currentBalanceInput(record:FundingRecord){
  validateMoney(record.amountSatang);
  // Pensions and tax savings are modeled as cashflows, never blindly summed into assets.
  return record.measure==='current-balance'&&(record.kind==='savings'||record.kind==='pvd')?record.amountSatang.value:null;
}
