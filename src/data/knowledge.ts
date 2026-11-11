export const checkedOn = '2026-11-11';
export const topics = { retirement: 'เตรียมเกษียณ', money: 'วางแผนเงิน', government: 'ภาครัฐ' } as const;
export type Topic = keyof typeof topics;
export type KnowledgeItem = {
  id: string; kind: 'article' | 'clip'; topic: Topic; title: string; summary: string;
  source: string; sourceTitle: string; sourceUrl: string; publishedOn?: string;
  minutes: number; sections: { title: string; body: string }[];
  action: { label: string; href: string }; duration?: number; media?: string;
};
const retirementSource = { source: 'ธนาคารแห่งประเทศไทย', sourceTitle: 'การวางแผนเกษียณ', sourceUrl: 'https://www.bot.or.th/th/satang-story/money-plan/retirement.html' };
const moneySource = { source: 'ธนาคารแห่งประเทศไทย', sourceTitle: 'การวางแผนการเงิน', sourceUrl: 'https://www.bot.or.th/th/satang-story/money-plan/planning-steps.html' };
export const knowledge: KnowledgeItem[] = [
  { id: 'retirement-map', kind: 'article', topic: 'retirement', title: 'ชีวิตที่อยากมี เริ่มจากแผนที่มองเห็น', summary: 'สำรวจรายจ่าย รายรับ และเวลาของชีวิต ก่อนตั้งเป้าหมายเกษียณ', ...retirementSource, minutes: 2,
    sections: [
      { title: 'เริ่มจากชีวิตประจำวัน', body: 'ลองจดค่าใช้จ่ายที่ยังต้องมีหลังหยุดทำงาน แล้วแยกค่าใช้จ่ายพิเศษ เช่น การดูแลสุขภาพและซ่อมบ้าน เพื่อเห็นภาพเงินที่ต้องเตรียมชัดขึ้น' },
      { title: 'มองรายรับไปพร้อมกัน', body: 'รวบรวมรายรับหลังเกษียณที่คาดว่าจะมี และตรวจเงื่อนไขของแต่ละแหล่งก่อนนำมาใส่แผน ตัวเลขที่ยังไม่ยืนยันควรแยกไว้ต่างหาก' },
      { title: 'เผื่ออนาคตที่เปลี่ยนไป', body: 'เงินเฟ้อและจำนวนปีที่ใช้ชีวิตหลังเกษียณมีผลต่อเงินที่ต้องเตรียม ลองเปลี่ยนสมมติฐานในเครื่องคำนวณ แล้วกลับมาทบทวนเมื่อสถานการณ์เปลี่ยน' },
    ], action: { label: 'ลองคำนวณแผนเกษียณ', href: '#/retirement/calculator' } },
  { id: 'money-routine', kind: 'article', topic: 'money', title: 'เป้าหมายเล็ก ๆ ที่ทำต่อได้ทุกเดือน', summary: 'รู้จุดเริ่มต้น ตั้งยอดและเวลา แล้วทบทวนให้เหมาะกับชีวิต', ...moneySource, minutes: 2,
    sections: [
      { title: 'รู้ว่าเงินไปไหน', body: 'บันทึกรายรับ รายจ่าย สินทรัพย์ และหนี้สิน เพื่อเห็นฐานะการเงินของตัวเองก่อนจัดสรรเงินให้แต่ละเป้าหมาย' },
      { title: 'ระบุยอดและวันที่', body: 'เป้าหมายที่ชัดควรมีจำนวนเงินและกรอบเวลา ลองแบ่งเป้าหมายเป็นช่วงสั้น ๆ ให้สอดคล้องกับรายได้และภาระที่มีอยู่' },
      { title: 'ลงมือแล้วกลับมาดู', body: 'ทำตามแผนและตรวจความคืบหน้าเป็นระยะ หากรายได้หรือรายจ่ายเปลี่ยน ค่อยปรับแผนตามความเป็นจริง ใน LIVERA ยอดกันออมเป็นบันทึกแผน ยังไม่ถือว่าชำระเบี้ยแล้ว' },
    ], action: { label: 'จัดเป้าหมายออมจ่ายเบี้ย', href: '#/retirement/goal' } },
  { id: 'public-retirement-2026', kind: 'article', topic: 'government', title: 'ภาครัฐเตรียมบุคลากรพร้อมเกษียณปี 2569', summary: 'ข่าวกิจกรรมของกรมประชาสัมพันธ์ สะท้อนการเตรียมพร้อมทั้งการเงิน สุขภาพ และความปลอดภัยไซเบอร์', source: 'กรมประชาสัมพันธ์', sourceTitle: 'กิจกรรมเตรียมความพร้อมแก่ข้าราชการเกษียณอายุ ประจำปีงบประมาณ พ.ศ. 2569', sourceUrl: 'https://personal.prd.go.th/th/gallery/article/detail/id/1/iid/3366', publishedOn: '2026-08-14', minutes: 1,
    sections: [
      { title: 'กิจกรรมที่ผ่านมา', body: 'กรมประชาสัมพันธ์รายงานการจัดกิจกรรมเมื่อวันที่ 14 สิงหาคม 2569 สำหรับบุคลากรที่จะเกษียณและผู้สนใจ โดยมีผู้บรรยายด้านไซเบอร์ สุขภาพ และการเงินเข้าร่วม' },
      { title: 'ชวนมองแผนให้ครบด้าน', body: 'มุมมองจาก LIVERA: ลองเตรียมรายการเรื่องที่อยากเรียนรู้ ทั้งการเงิน ชีวิตประจำวัน และความปลอดภัย แล้วเลือกกิจกรรมหรือบทสนทนาที่ช่วยตอบโจทย์ของตัวเอง' },
      { title: 'ก่อนนำข้อมูลไปใช้', body: 'นี่เป็นข่าวกิจกรรมที่ผ่านมา ไม่ใช่ประกาศสิทธิใหม่หรือกิจกรรมที่เปิดรับสมัครใน LIVERA อ่านรายละเอียดจากหน่วยงานต้นทาง และตรวจเงื่อนไขที่เกี่ยวกับตนเองเสมอ' },
    ], action: { label: 'สำรวจกิจกรรม LIVERA Club', href: '#/club/events' } },
  { id: 'clip-retirement', kind: 'clip', topic: 'retirement', title: '3 คำถามก่อนวางแผนเกษียณ', summary: 'รายจ่าย รายรับ และเวลา ลองตอบให้ตัวเองใน 24 วินาที', ...retirementSource, minutes: 1, duration: 24, media: 'retirement-questions',
    sections: [
      { title: '00:00 · อยากใช้ชีวิตแบบไหน', body: 'ลองนึกถึงรายจ่ายต่อเดือน และค่าใช้จ่ายพิเศษหลังเกษียณ' },
      { title: '00:08 · จะมีรายรับจากไหน', body: 'รวบรวมรายรับที่คาดว่าจะมี แล้วตรวจเงื่อนไขก่อนใส่ในแผน' },
      { title: '00:16 · ต้องเตรียมเผื่อแค่ไหน', body: 'ลองเปลี่ยนเงินเฟ้อและจำนวนปีหลังเกษียณ เพื่อเห็นหลายภาพอนาคต' },
    ], action: { label: 'ลองปรับแผนของฉัน', href: '#/retirement/calculator' } },
  { id: 'clip-money', kind: 'clip', topic: 'money', title: 'เป้าหมายที่เริ่มได้วันนี้', summary: 'จากความตั้งใจ สู่ยอดและวันที่ที่ค่อย ๆ ทำตามได้', ...moneySource, minutes: 1, duration: 24, media: 'money-goal',
    sections: [
      { title: '00:00 · รู้จุดเริ่มต้น', body: 'จดรายรับ รายจ่าย และภาระที่มี ก่อนเริ่มตั้งเป้าหมาย' },
      { title: '00:08 · ตั้งยอดพร้อมวัน', body: 'ระบุจำนวนเงินและกำหนดเวลา ให้เหมาะกับกำลังของตัวเอง' },
      { title: '00:16 · กลับมาทบทวน', body: 'ตรวจความคืบหน้า และปรับแผนเมื่อชีวิตเปลี่ยนไป' },
    ], action: { label: 'เริ่ม Goal ออมจ่ายเบี้ย', href: '#/retirement/goal' } },
];
