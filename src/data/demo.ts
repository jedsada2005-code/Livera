export type Route = 'overview' | 'policies' | 'retirement' | 'club' | 'services';

export const member = {
  name: 'เมย์', fullName: 'เมธาวี ใจดี', initials: 'ม',
  membership: 'LIVERA Member', referenceDate: '10 พฤศจิกายน 2569',
};

export const policies = [
  { id: 'saving', name: 'แผนสะสมทรัพย์', english: 'Future Together', type: 'สะสมทรัพย์',
    number: 'DEMO •••• 0148', paid: 180000, remaining: 1620000,
    paidPeriods: 18, totalPeriods: 180, premium: 10000, frequency: 'เดือน',
    nextDue: '30 พ.ย. 2569', premiumEnd: '30 เม.ย. 2583', maturity: '30 เม.ย. 2593',
    note: 'ผลประโยชน์และเงื่อนไขเป็นข้อมูลสมมติสำหรับออกแบบ',
    description: 'ค่อย ๆ เตรียมเงินก้อน เพื่ออนาคตในแบบที่คุณเลือก',
    icon: 'saving', color: 'blue',
  },
  { id: 'pension', name: 'แผนบำนาญ', english: 'My Next Chapter', type: 'บำนาญ',
    number: 'DEMO •••• 0276', paid: 120000, remaining: 480000,
    paidPeriods: 2, totalPeriods: 10, premium: 60000, frequency: 'ปี',
    nextDue: '15 ม.ค. 2570', premiumEnd: 'ตามตารางตัวอย่าง', maturity: 'เริ่มรับตามสัญญาเมื่ออายุ 60 ปี',
    note: 'ตัวอย่างบำนาญ 120,000 บาทต่อปี เริ่มเมื่ออายุ 60 ปี',
    description: 'วางรายรับในวันข้างหน้า ให้ชีวิตเกษียณมีจังหวะที่มั่นใจ',
    icon: 'pension', color: 'red',
  },
  { id: 'health', name: 'แผนสุขภาพ', english: 'Live Well', type: 'สุขภาพ',
    number: 'DEMO •••• 0351', paid: 24000, remaining: null,
    paidPeriods: 1, totalPeriods: null, premium: 24000, frequency: 'ปี',
    nextDue: '1 มี.ค. 2570', premiumEnd: 'ทบทวนตามเงื่อนไขรายปี', maturity: 'ไม่มีเงินครบกำหนดในตัวอย่างนี้',
    note: 'เบี้ยในอนาคตขึ้นกับการต่ออายุและเงื่อนไข ไม่รวมในยอดคงเหลือ',
    description: 'ดูแลความอุ่นใจระหว่างทาง พร้อมทบทวนให้เหมาะกับชีวิต',
    icon: 'health', color: 'sage',
  },
] as const;

export type Policy = typeof policies[number];
export const totals = {
  paid: policies.reduce((sum, policy) => sum + policy.paid, 0),
  remaining: policies.reduce((sum, policy) => sum + (policy.remaining ?? 0), 0),
};

export const events = [
  { id: 'garden', type: 'in-person', tag: 'พบกันจริง', title: 'A little pause, a new perspective.',
    subtitle: 'มื้อสายและบทสนทนาเรื่องชีวิตบทใหม่', date: '28 พ.ย. 2569', time: '10:00–12:00 น.',
    location: 'สถานที่ตัวอย่าง · กรุงเทพฯ', month: 'NOV', day: '28',
    description: 'ใช้เวลาร่วมกันในบรรยากาศสบาย ๆ แลกเปลี่ยนสิ่งที่อยากทำหลังเกษียณ และทำความรู้จักเพื่อนสมาชิก',
  },
  { id: 'online', type: 'online', tag: 'ออนไลน์', title: 'Your future, made clearer.',
    subtitle: 'ทำความเข้าใจเงินเกษียณไปด้วยกัน', date: '12 ธ.ค. 2569', time: '19:00–20:00 น.',
    location: 'กิจกรรมออนไลน์ตัวอย่าง', month: 'DEC', day: '12',
    description: 'หัวข้อความรู้สำหรับสมาชิกที่เริ่มวางแผน พร้อมช่วงแลกเปลี่ยนคำถามทั่วไปเกี่ยวกับการเตรียมตัว',
  },
] as const;

export const routeLabels: Record<Route, { title: string; english: string }> = {
  overview: { title: 'ภาพรวม', english: 'MY OVERVIEW' },
  policies: { title: 'กรมธรรม์ของฉัน', english: 'MY POLICIES' },
  retirement: { title: 'แผนเกษียณ', english: 'MY NEXT CHAPTER' },
  club: { title: 'LIVERA Club', english: 'BELONG & CONNECT' },
  services: { title: 'บริการสำหรับคุณ', english: 'HERE FOR YOU' },
};
