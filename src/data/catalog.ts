import type { Evidence, Provider, Residence, InsuranceOffering, FundingKind } from '../domain/catalog.ts';
export const catalogCheckedOn='2026-11-11';
export const pending=<T>():Evidence<T>=>({value:null,status:'pending'});
const emptyLogo={path:null,kind:'placeholder' as const,sourceUrl:null,alt:'พื้นที่โลโก้ทางการ รอไฟล์จากคู่ค้า',usage:'pending' as const};
export const providers:Provider[]=[
  {id:'aia',name:'AIA',kind:'insurer',relationship:'example',website:'https://www.aia.co.th/th/our-products/save-invest/savings',logo:emptyLogo},
  {id:'mtl',name:'เมืองไทยประกันชีวิต',kind:'insurer',relationship:'example',website:'https://www.muangthai.co.th/th/life-insurance',logo:emptyLogo},
  {id:'jin',name:'Jin Wellbeing County',kind:'residence',relationship:'example',website:'https://www.jinwellbeing.com/',logo:emptyLogo},
  {id:'aspen',name:'The Aspen Tree',kind:'residence',relationship:'example',website:'https://mqdc.com/th/theaspentree-bangna',logo:emptyLogo},
];
export const insuranceCategories={endowment:'สะสมทรัพย์',pension:'บำนาญ',health:'สุขภาพ'} as const;
// Template slots, not invented commercial products associated with real insurers.
export const offeringSlots:InsuranceOffering[]=providers.filter(p=>p.kind==='insurer').map(p=>({id:`${p.id}-endowment-slot`,providerId:p.id,category:'endowment',name:pending<string>(),annualPremiumSatang:pending<number>(),payYears:pending<number>(),coverYears:pending<number>(),cashflows:[],quoteBasis:null}));
const pendingPackage={id:'package-pending',model:'pending' as const,occupants:null,upfrontSatang:pending<number>(),recurringSatang:pending<number>(),depositSatang:pending<number>(),escalationPercent:pending<number>(),included:pending<string[]>(),excluded:pending<string[]>(),validUntil:null};
export const residences:Residence[]=[
  {id:'jin',providerId:'jin',name:'Jin Wellbeing County',location:'รังสิต · ปทุมธานี',description:{value:'โครงการที่อยู่อาศัยแนวคิด Wellness Residences',status:'verified',sourceUrl:'https://www.jinwellbeing.com/',checkedOn:catalogCheckedOn},image:{path:'providers/jin-lobby.png',kind:'photo',sourceUrl:'https://www.jinwellbeing.com/',alt:'ล็อบบี้ของโครงการ Jin Wellbeing County จากเว็บไซต์โครงการ',usage:'public-reference'},services:['residence','wellness'],packages:[{...pendingPackage,id:'jin-package-pending'}]},
  {id:'aspen',providerId:'aspen',name:'The Aspen Tree',location:'บางนา · สมุทรปราการ',description:{value:'โครงการที่พักอาศัยใน The Forestias พร้อมแนวคิดการดูแลตามช่วงวัย',status:'verified',sourceUrl:'https://mqdc.com/th/theaspentree-bangna',checkedOn:catalogCheckedOn},image:{path:'providers/aspen-residence.webp',kind:'photo',sourceUrl:'https://mqdc.com/th/theaspentree-bangna',alt:'อาคารที่พัก The Aspen Tree จากเว็บไซต์ MQDC',usage:'public-reference'},services:['residence','wellness'],packages:[{...pendingPackage,id:'aspen-package-pending'}]},
];
export const fundingOptions:Record<FundingKind,{name:string;hint:string;measure:'current-balance'|'monthly-income'|'annual-tax-saving'}>={
  savings:{name:'เงินออม / เงินลงทุน',hint:'ยอดปัจจุบันที่จะใช้เป็นจุดเริ่มต้นของแผน',measure:'current-balance'},
  insurance:{name:'ประกันสะสมทรัพย์ / บำนาญ',hint:'ใช้ตารางรับเงินและเบี้ย ไม่ใช้เบี้ยสะสมแทนเงินที่จะได้รับ',measure:'current-balance'},
  pvd:{name:'กองทุนสำรองเลี้ยงชีพ (PVD)',hint:'ยอดปัจจุบัน ส่วนลูกจ้าง/นายจ้างและเงื่อนไขสิทธิจะใช้เมื่อมีข้อมูลครบ',measure:'current-balance'},
  sso:{name:'ประกันสังคม',hint:'ระบุรายรับรายเดือนที่ต้องการจำลอง ยังไม่ประเมินสิทธิตามกฎหมาย',measure:'monthly-income'},
  tax:{name:'ผลประหยัดภาษี',hint:'ระบุผลประหยัดภาษีต่อปีที่คุณประเมิน ไม่ใช่ยอดค่าลดหย่อน',measure:'annual-tax-saving'},
};
