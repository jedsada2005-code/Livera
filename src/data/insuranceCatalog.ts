// Public product references, not quotes or confirmation of a LIVERA distribution agreement.
export const insuranceCheckedOn = '2026-11-11';
export const insuranceCompanies = [
  { id: 'aia', name: 'AIA', fullName: 'เอไอเอ', logo: 'providers/aia.svg', logoSource: 'https://www.aia.co.th/etc.clientlibs/aia-wise/clientlibs/clientlib-site/resources/images/icons/aia-logo-red.svg' },
  { id: 'mtl', name: 'เมืองไทยประกันชีวิต', fullName: 'Muang Thai Life', logo: 'providers/mtl.svg', logoSource: 'https://www.muangthai.co.th/assets/cd748ac7-e5fd-4dcd-9f62-a6d071c69f30/MTLLogo.svg' },
] as const;
export type InsurancePlan = {
  id: string; providerId: 'aia' | 'mtl'; category: 'endowment'; name: string; englishName: string;
  payYears: number; cover: { kind: 'years' | 'to-age'; value: number };
  ageMinYears: number; ageMaxYears: number; ageLabel: string;
  annualPremiumSatang: null; highlight: string;
  benefits: { when: string; description: string }[];
  conditions: string[]; sourceUrl: string; brochureUrl?: string;
};
const aia = 'https://www.aia.co.th/th/our-products/save-invest/';
const mtl = 'https://online.muangthai.co.th/th/detail/';
export const insurancePlans: InsurancePlan[] = [
  {
    id: 'aia-15-25', providerId: 'aia', category: 'endowment', name: 'AIA สะสมทรัพย์ 15/25', englishName: 'AIA Endowment 15/25 (Non Par)',
    payYears: 15, cover: { kind: 'years', value: 25 }, ageMinYears: 0, ageMaxYears: 70, ageLabel: '15 วัน–70 ปี', annualPremiumSatang: null,
    highlight: 'จ่ายเบี้ย 15 ปี วางแผนเงินก้อนในปีที่ 25',
    benefits: [
      { when: 'สิ้นปีกรมธรรม์ที่ 2–24', description: 'เงินคืนปีละ 1% ของทุนประกันเริ่มต้น' },
      { when: 'ครบสัญญาปีที่ 25', description: 'จ่ายจำนวนที่มากที่สุดระหว่าง 121% ของทุนประกัน มูลค่าเวนคืน หรือเบี้ยหลักสะสมหักเงินคืนที่จ่ายแล้ว' },
    ],
    conditions: ['แบบไม่มีเงินปันผล · ทุนประกันขั้นต่ำ 100,000 บาท ไม่ใช่ค่าเบี้ย', 'เบี้ยจริงและการรับประกันต้องประเมินเป็นรายบุคคล'],
    sourceUrl: `${aia}aia-15pay25-non-par`,
    brochureUrl: 'https://www.aia.co.th/content/dam/th-wise/images/th/our-products/si_114_aia-endowment-15-pay-25-non-par/AIA%20Endowment%2015%2025%20Non%20Par_Brochure.pdf',
  },
  {
    id: 'mtl-perfect-11-5', providerId: 'mtl', category: 'endowment', name: 'เมืองไทย เพอร์เฟคเซฟวิ่ง 11/5', englishName: 'Perfect Saving 11/5',
    payYears: 5, cover: { kind: 'years', value: 11 }, ageMinYears: 20, ageMaxYears: 65, ageLabel: '20–65 ปี', annualPremiumSatang: null,
    highlight: 'จ่ายเบี้ย 5 ปี มีเงินคืนทุก 2 ปีกรมธรรม์',
    benefits: [
      { when: 'สิ้นปีกรมธรรม์ที่ 2, 4, 6, 8, 10', description: 'เงินคืนครั้งละ 1.5% ของทุนประกันเริ่มต้น' },
      { when: 'ครบสัญญาปีที่ 11', description: 'จ่ายจำนวนที่มากกว่าระหว่าง 520% ของทุนประกันเริ่มต้น หรือ 101% ของเบี้ยที่ชำระทั้งหมด' },
    ],
    conditions: ['ชำระเบี้ยรายปี · ซื้อสัญญาเพิ่มเติมไม่ได้', 'ช่องทางออนไลน์ระบุผู้มีสัญชาติไทย · อายุคิดตามวิธีของบริษัท'],
    sourceUrl: `${mtl}perfect-saving-11-5`,
  },
  {
    id: 'aia-excellent', providerId: 'aia', category: 'endowment', name: 'AIA Excellent', englishName: 'AIA Excellent (Non Par)',
    payYears: 20, cover: { kind: 'years', value: 20 }, ageMinYears: 0, ageMaxYears: 75, ageLabel: '15 วัน–75 ปี', annualPremiumSatang: null,
    highlight: 'รับเงินคืนทุก 4 ปีกรมธรรม์ก่อนครบสัญญา',
    benefits: [
      { when: 'สิ้นปีกรมธรรม์ที่ 4, 8, 12, 16', description: 'เงินคืนครั้งละ 10% ของทุนประกัน' },
      { when: 'ครบสัญญาปีที่ 20', description: 'จ่ายจำนวนที่มากที่สุดระหว่าง 300% ของทุนประกัน มูลค่าเวนคืน หรือเบี้ยหลักสะสมหักเงินคืนที่จ่ายแล้ว' },
    ],
    conditions: ['แบบไม่มีเงินปันผล · ทุนประกันขั้นต่ำ 100,000 บาท ไม่ใช่ค่าเบี้ย', 'การลดทุนประกันมีผลต่อฐานเบี้ยและเงินคืนตามเงื่อนไขกรมธรรม์'],
    sourceUrl: `${aia}aia-excellent`,
  },
  {
    id: 'mtl-return-11-1', providerId: 'mtl', category: 'endowment', name: 'เมืองไทย คืนคุ้ม 11/1', englishName: 'Muang Thai Easy Plan 11/1',
    payYears: 1, cover: { kind: 'years', value: 11 }, ageMinYears: 20, ageMaxYears: 65, ageLabel: '20–65 ปี', annualPremiumSatang: null,
    highlight: 'จ่ายเบี้ยครั้งเดียว วางแผนต่อเนื่อง 11 ปี',
    benefits: [
      { when: 'สิ้นปีกรมธรรม์ที่ 2, 4, 6, 8, 10', description: 'เงินคืนครั้งละ 2% ของทุนประกันเริ่มต้น' },
      { when: 'ครบสัญญาปีที่ 11', description: 'รับ 102% ของทุนประกันเริ่มต้น' },
    ],
    conditions: ['ชื่อแบบประกัน: เมืองไทย อีซี่ แพลน 11/1 · ซื้อสัญญาเพิ่มเติมไม่ได้', 'ช่องทางออนไลน์ระบุผู้มีสัญชาติไทย · อายุคิดตามวิธีของบริษัท'],
    sourceUrl: `${mtl}return-saving`,
  },
  {
    id: 'mtl-super-25-16', providerId: 'mtl', category: 'endowment', name: 'เมืองไทย ซุปเปอร์ เซฟเวอร์ 25/16', englishName: 'Super Saver 25/16',
    payYears: 16, cover: { kind: 'years', value: 25 }, ageMinYears: 0, ageMaxYears: 65, ageLabel: '30 วัน–65 ปี', annualPremiumSatang: null,
    highlight: 'จ่ายเบี้ย 16 ปี มีเงินคืนทุกปีกรมธรรม์',
    benefits: [
      { when: 'สิ้นปีกรมธรรม์ที่ 1–10 / 11–20 / 21–24', description: 'เงินคืนปีละ 1% / 1.5% / 2% ของทุนประกันเริ่มต้น ตามลำดับ' },
      { when: 'ครบสัญญาปีที่ 25', description: 'รับ 150% ของทุนประกันเริ่มต้น' },
    ],
    conditions: ['สามารถซื้อสัญญาเพิ่มเติมได้ตามเกณฑ์บริษัท', 'ตัวอย่างเบี้ยในโบรชัวร์เป็นคนละกรณีกับคุณ ต้องขอใบเสนอราคาใหม่'],
    sourceUrl: 'https://www.muangthai.co.th/th/savings-insurance/super-saver-25-16',
    brochureUrl: 'https://www.muangthai.co.th/filestorage/brochures/MTL-Muangthai-Super-Saver-25-16.pdf',
  },
  {
    id: 'aia-saving-sure', providerId: 'aia', category: 'endowment', name: 'AIA Saving Sure', englishName: 'AIA Saving Sure (Non Par)',
    payYears: 10, cover: { kind: 'to-age', value: 99 }, ageMinYears: 0, ageMaxYears: 50, ageLabel: '15 วัน–50 ปี', annualPremiumSatang: null,
    highlight: 'จ่ายเบี้ย 10 ปี มีเงินคืนช่วงอายุ 60–98 ปี',
    benefits: [
      { when: 'สิ้นปีกรมธรรม์หลังอายุครบ 60–98 ปี', description: 'เงินคืน 12–26% ของทุนประกันตามช่วงอายุ ดูตารางฉบับเต็มจากบริษัท' },
      { when: 'ครบสัญญาที่อายุ 99 ปี', description: 'รับ 100% ของทุนประกัน ตามข้อกำหนดและหักหนี้สินกรมธรรม์ถ้ามี' },
    ],
    conditions: ['แบบสะสมทรัพย์ไม่มีเงินปันผล ไม่จัดเป็นประกันบำนาญในแคตตาล็อกนี้', 'คุ้มครองถึงอายุ 99 ปี ไม่ใช่ระยะคุ้มครอง 99 ปี'],
    sourceUrl: `${aia}aia-saving-sure-non-par`,
  },
];
export const findInsurancePlan = (id: string) => insurancePlans.find(p => p.id === id);
export const coverLabel = (p: InsurancePlan) => p.cover.kind === 'to-age' ? `ถึงอายุ ${p.cover.value} ปี` : `${p.cover.value} ปี`;
