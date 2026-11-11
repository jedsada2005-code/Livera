export type ClubEvent = {
  id:string; title:string; subtitle:string; type:'in-person'|'online'; start:string; end:string; close:string;
  location:string; capacity:number; sampleAttendees:number; image:'club'|'residence';
  description:string; agenda:{time:string;title:string}[]; preparation:string;
};
export const clubEvents:ClubEvent[]=[
  {id:'garden',title:'A little pause, a new perspective.',subtitle:'มื้อสายและบทสนทนาเรื่องชีวิตบทใหม่',type:'in-person',
    start:'2026-11-28T10:00:00+07:00',end:'2026-11-28T12:00:00+07:00',close:'2026-11-27T10:00:00+07:00',
    location:'ห้องรับรองและสวน · บ้านพัก LIVERA ตัวอย่าง กรุงเทพฯ',capacity:24,sampleAttendees:20,image:'club',
    description:'ใช้เวลาสบาย ๆ ร่วมโต๊ะมื้อสาย แลกเปลี่ยนภาพชีวิตที่อยากมี และรู้จักเพื่อนสมาชิกทุกช่วงวัย ผ่านบทสนทนาและกิจกรรมเล็ก ๆ ในสวน',
    agenda:[{time:'10:00',title:'ต้อนรับและทำความรู้จัก'},{time:'10:30',title:'มื้อสายและวงสนทนาชีวิตบทใหม่'},{time:'11:15',title:'เดินชมสวนและเขียนการ์ดถึงตัวเอง'},{time:'12:00',title:'จบกิจกรรม'}],
    preparation:'แต่งกายสบาย ๆ เหมาะกับการเดินในสวน สถานที่เป็นตัวอย่าง ไม่มีสิทธิเข้าพักหรือบริการดูแลรวมอยู่'},
  {id:'online',title:'Your future, made clearer.',subtitle:'วงคุยออนไลน์: ชีวิตที่อยากใช้หลังเกษียณ',type:'online',
    start:'2026-12-12T19:00:00+07:00',end:'2026-12-12T20:00:00+07:00',close:'2026-12-11T19:00:00+07:00',
    location:'ห้องออนไลน์สาธิต · ยังไม่มีลิงก์ประชุมจริง',capacity:60,sampleAttendees:28,image:'residence',
    description:'ชวนสำรวจสิ่งที่อยากให้ชีวิตมีมากขึ้นหลังเกษียณ ผ่านคำถามและการแลกเปลี่ยนทั่วไปกับเพื่อนสมาชิก โดยไม่ต้องเปิดเผยข้อมูลการเงินส่วนตัว',
    agenda:[{time:'19:00',title:'เปิดวงและเลือกคำถามชวนคิด'},{time:'19:15',title:'แลกเปลี่ยนประสบการณ์ในกลุ่ม'},{time:'19:45',title:'เลือกหนึ่งสิ่งที่อยากเริ่มทำ'},{time:'20:00',title:'จบกิจกรรม'}],
    preparation:'เตรียมหูฟังและพื้นที่สงบ Prototype มีหน้าทดลองเตรียมตัวเข้าห้อง ไม่มีการเปิดกล้อง ไมโครโฟน หรือประชุมกับบุคคลอื่น'},
  {id:'slow-morning',title:'A slower morning, a brighter day.',subtitle:'เช้าวันใหม่กับศิลปะและเพื่อนในสวน',type:'in-person',
    start:'2027-01-23T10:00:00+07:00',end:'2027-01-23T12:00:00+07:00',close:'2027-01-22T10:00:00+07:00',
    location:'ระเบียงสวน · บ้านพัก LIVERA ตัวอย่าง กรุงเทพฯ',capacity:18,sampleAttendees:18,image:'club',
    description:'ลองวาดสีน้ำและแบ่งปันงานอดิเรกที่ทำให้วันธรรมดามีความหมาย กิจกรรมเดือนมกราคมนี้จัดไว้เป็นตัวอย่างกรณีที่นั่งเต็ม',
    agenda:[{time:'10:00',title:'พบเพื่อนและทำความรู้จักอุปกรณ์'},{time:'10:30',title:'วาดสีน้ำจากสิ่งรอบตัว'},{time:'11:30',title:'เล่าเรื่องผ่านภาพ'},{time:'12:00',title:'จบกิจกรรม'}],
    preparation:'ไม่ต้องมีพื้นฐานศิลปะ อุปกรณ์เป็นส่วนหนึ่งของกิจกรรมตัวอย่าง'},
];
export const communityGroups=[
  {id:'planning',name:'เตรียมเกษียณไปด้วยกัน',tag:'PLAN YOUR CHAPTER',description:'เล่าจุดเริ่มต้น แบ่งปันวิธีจัดระเบียบชีวิตและเป้าหมาย',color:'blue',sampleMembers:128},
  {id:'living',name:'ชีวิตดีในทุกช่วงวัย',tag:'LIVING WELL',description:'กิจวัตร การพักผ่อน และประสบการณ์ใช้ชีวิตอย่างมีความหมาย',color:'red',sampleMembers:96},
  {id:'hobbies',name:'งานอดิเรกและเพื่อนใหม่',tag:'FIND YOUR PEOPLE',description:'หนังสือ ศิลปะ สวน และสิ่งที่อยากเริ่มทำร่วมกัน',color:'sage',sampleMembers:84},
] as const;
export type GroupId=typeof communityGroups[number]['id'];
