import type { MediaAsset } from '../domain/catalog.ts';
export const housingCheckedOn = '2026-11-11';
export type HousingPlace = {
  id: 'jin' | 'aspen'; name: string; thaiName: string; location: string; region: string;
  tags: ('residence' | 'wellness')[]; summary: string; tenure: string; features: string[];
  sourceUrl: string; gallery: MediaAsset[]; priceStatus: 'pending';
};
const photo = (path: string, sourceUrl: string, alt: string): MediaAsset => ({ path, sourceUrl, alt, kind: 'photo', usage: 'public-reference' });
export const housingPlaces: HousingPlace[] = [
  {
    id: 'jin', name: 'Jin Wellbeing County', thaiName: 'จิณณ์ เวลบีอิ้ง เคาน์ตี้', location: 'รังสิต · ปทุมธานี', region: 'pathum-thani',
    tags: ['residence', 'wellness'], summary: 'ที่อยู่อาศัยแนวคิด Wellness Residences มีพื้นที่ธรรมชาติและบริการสุขภาพในบริเวณโครงการ',
    tenure: 'เว็บไซต์ระบุคอนโดมิเนียมกรรมสิทธิ์แบบ Freehold · รูปแบบและบริการอื่นสอบถามโครงการ',
    features: ['การออกแบบ Universal Design', 'กิจกรรมและพื้นที่สังคมของผู้อยู่อาศัย', 'โรงพยาบาลธนบุรีบูรณาอยู่ในพื้นที่เดียวกัน'],
    sourceUrl: 'https://www.jinwellbeing.com/about/', priceStatus: 'pending',
    gallery: [
      photo('providers/jin-garden.jpg', 'https://www.jinwellbeing.com/wp-content/uploads/2025/09/about-P1_Des-1024x698.jpg', 'ภาพถ่ายอาคาร Jin Wellbeing County และสวนด้านหน้า จากเว็บไซต์โครงการ'),
      photo('providers/jin-wellness.jpg', 'https://www.jinwellbeing.com/wp-content/uploads/2025/09/about-P2_Des-1024x682.jpg', 'ภาพถ่ายสวนและอาคารในพื้นที่ Jin Wellbeing County จากเว็บไซต์โครงการ'),
      photo('providers/jin-lobby.png', 'https://www.jinwellbeing.com/wp-content/uploads/2025/08/%E0%B8%A5%E0%B9%87%E0%B8%AD%E0%B8%9A%E0%B8%9A%E0%B8%B5%E0%B9%89-1.png', 'ภาพถ่ายล็อบบี้ Jin Wellbeing County จากเว็บไซต์โครงการ'),
    ],
  },
  {
    id: 'aspen', name: 'The Aspen Tree', thaiName: 'ดิ แอสเพน ทรี เดอะ ฟอเรสเทียส์', location: 'บางนา · สมุทรปราการ', region: 'samut-prakan',
    tags: ['residence', 'wellness'], summary: 'ที่อยู่อาศัยใน The Forestias เน้นการใช้ชีวิตวัยอิสระ พร้อมพื้นที่กิจกรรมและบริการสุขภาพ',
    tenure: 'เว็บไซต์ระบุทั้ง Freehold สิทธิการเช่าระยะยาว และทางเลือกเช่าระยะสั้น · ต้องยืนยันเงื่อนไขแต่ละแบบ',
    features: ['รูปแบบห้อง Active Living และ Sky Villa', 'Health & Brain Center', 'พื้นที่กิจกรรมและสวนเพื่อการพักผ่อน'],
    sourceUrl: 'https://mqdc.com/th/theaspentree-bangna', priceStatus: 'pending',
    gallery: [photo('providers/aspen-lobby.webp', 'https://corecms.mqdc.com/assets/74baa08f-518a-4646-a533-b05a10fb0e27', 'ภาพถ่ายพื้นที่ต้อนรับภายใน The Aspen Tree จากเว็บไซต์ MQDC')],
  },
];
export const findHousingPlace = (id: string) => housingPlaces.find(p => p.id === id);
export function searchHousing(query: string, type: string, region: string, savedIds?: string[]) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return housingPlaces.filter(p => {
    const aliases = p.id === 'jin' ? 'jinwell jinwel จิณณ์' : 'aspen แอสเพน';
    const text = `${p.name} ${p.thaiName} ${p.location} ${aliases} บ้านพักคนชรา ที่พักผู้สูงอายุ เวลเนส wellness`.toLowerCase();
    return (!savedIds || savedIds.includes(p.id)) && (!region || p.region === region) && (!type || p.tags.includes(type as 'residence' | 'wellness')) && terms.every(t => text.includes(t));
  });
}
