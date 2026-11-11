export const careCategories=[{id:'body',name:'สุขภาพกาย',description:'เลือกสาขาสำหรับนัดปรึกษาล่วงหน้า'},{id:'mind',name:'สุขภาพใจ',description:'เลือกประเภทผู้เชี่ยวชาญสำหรับพูดคุยส่วนตัว'}] as const;
export const specialties=[
  {id:'internal',category:'body',name:'อายุรกรรม',provider:'แพทย์สาขาอายุรกรรม'},
  {id:'family',category:'body',name:'เวชศาสตร์ครอบครัว',provider:'แพทย์สาขาเวชศาสตร์ครอบครัว'},
  {id:'older-adult',category:'body',name:'ดูแลสุขภาพผู้สูงอายุ',provider:'แพทย์ด้านการดูแลผู้สูงอายุ'},
  {id:'psychiatry',category:'mind',name:'จิตเวชศาสตร์',provider:'จิตแพทย์'},
  {id:'psychology',category:'mind',name:'การปรึกษาทางจิตวิทยา',provider:'นักจิตวิทยา · ผู้เชี่ยวชาญที่ไม่ใช่แพทย์'},
] as const;
export const careTopics=[
  {id:'general',category:'body',name:'เตรียมคำถามสุขภาพทั่วไป'},
  {id:'routine',category:'body',name:'ทบทวนการดูแลตนเองในชีวิตประจำวัน'},
  {id:'visit',category:'body',name:'เตรียมตัวสำหรับการนัดหมาย'},
  {id:'transition',category:'mind',name:'ปรับตัวกับช่วงเปลี่ยนผ่านของชีวิต'},
  {id:'balance',category:'mind',name:'พูดคุยเรื่องสมดุลชีวิตและการพักผ่อน'},
  {id:'relationships',category:'mind',name:'พูดคุยเรื่องความสัมพันธ์และการใช้ชีวิต'},
] as const;
export const timePeriods=[{id:'morning',name:'ช่วงเช้า 09:00–12:00',sampleTime:'10:00'},{id:'afternoon',name:'ช่วงบ่าย 13:00–16:00',sampleTime:'14:00'},{id:'evening',name:'ช่วงเย็น 17:00–19:00',sampleTime:'18:00'}] as const;
export const contacts=[{id:'app',name:'ในแอปสาธิต',sample:'ข้อความในต้นแบบ · ไม่มีแจ้งเตือนจริง'},{id:'phone',name:'โทรศัพท์ตัวอย่าง',sample:'08X-XXX-XXXX · ไม่มีการโทรจริง'},{id:'email',name:'อีเมลตัวอย่าง',sample:'member@example.invalid · ไม่มีการส่งอีเมล'}] as const;
export const coverageGoals=[{id:'health',name:'ทบทวนความคุ้มครองสุขภาพ'},{id:'retirement',name:'ทบทวนรายรับหลังเกษียณ'},{id:'family',name:'ทบทวนความคุ้มครองครอบครัว'}] as const;
export const budgetBands=[{id:'undecided',name:'ยังไม่ระบุงบ'},{id:'under2000',name:'ต่ำกว่า 2,000 บาท/เดือน'},{id:'2000to5000',name:'2,000–5,000 บาท/เดือน'},{id:'over5000',name:'มากกว่า 5,000 บาท/เดือน'}] as const;
export const healthExamples=[{id:'not-shared',name:'ไม่เลือกข้อมูลสุขภาพตัวอย่าง'},{id:'diabetes-example',name:'ตัวอย่าง: มีโรคเบาหวาน'},{id:'chronic-example',name:'ตัวอย่าง: มีโรคประจำตัวอื่น'}] as const;
export const serviceStatusLabels={recorded:'บันทึกคำขอสาธิต',coordinating:'จำลองการประสานงาน',proposed:'มีเวลาและค่าบริการตัวอย่าง',confirmed:'ยืนยันนัดสาธิต','review-ready':'มีหัวข้อทบทวนตัวอย่าง',completed:'จบรายการสาธิต',cancelled:'ยกเลิกคำขอ'} as const;
