import { clubEvents, communityGroups } from '../data/club.ts';
import type { ClubEvent, GroupId } from '../data/club.ts';
export type Post={id:string;groupId:GroupId;author:string;authorId:string;title:string;body:string;createdAt:string;updatedAt?:string;deletedAt?:string;seedLikes:number;image?:'club'|'residence'};
export type Comment={id:string;postId:string;author:string;authorId:string;body:string;createdAt:string;deletedAt?:string};
export type Booking={id:string;eventId:string;seats:number;status:'active'|'cancelled';createdAt:string;cancelledAt?:string};
export type Report={id:string;target:'post'|'comment';targetId:string;reason:ReportReason;detail:string;createdAt:string};
export const reportReasons=['ข้อมูลส่วนตัว','ชวนซื้อขายหรือโฆษณา','คุกคามหรือไม่เหมาะสม','ข้อมูลที่อาจทำให้เข้าใจผิด','อื่น ๆ'] as const;
export type ReportReason=typeof reportReasons[number];
export type ClubData={version:1;bookings:Booking[];posts:Post[];comments:Comment[];joined:GroupId[];liked:string[];saved:string[];hidden:string[];reports:Report[]};
export const memberId='demo-member';
export function createClubSeed():ClubData{return {version:1,bookings:[],joined:['planning'],liked:[],saved:[],hidden:[],reports:[],posts:[
  {id:'first-step',groupId:'planning',author:'คุณนิด',authorId:'sample-nid',title:'เริ่มเตรียมเกษียณจากเรื่องเล็ก ๆ อะไรกันบ้างคะ',body:'เราเริ่มจากเขียนภาพวันธรรมดาที่อยากมีหลังเกษียณก่อนค่ะ อยากมีเวลาอ่านหนังสือ เดินเล่น และได้เจอเพื่อนบ้าง\n\nทุกคนเริ่มต้นจากอะไรกัน มาแลกเปลี่ยนไอเดียทั่วไปกันนะคะ ไม่ต้องบอกยอดเงินหรือข้อมูลกรมธรรม์ส่วนตัวค่ะ',createdAt:'2026-11-10T03:20:00Z',seedLikes:12},
  {id:'slow-life',groupId:'living',author:'คุณวิทย์',authorId:'sample-wit',title:'พื้นที่เล็ก ๆ ในบ้าน ที่ทำให้เราอยากกลับมาพัก',body:'ช่วงนี้จัดมุมอ่านหนังสือใหม่ให้รับแสงเช้า เปิดหน้าต่างแล้วได้นั่งเงียบ ๆ สักครู่ เป็นกิจวัตรที่ชอบมากครับ\n\nถ้าจัดมุมพักผ่อนได้หนึ่งมุม ทุกคนอยากให้มุมนั้นมีอะไรบ้าง',createdAt:'2026-11-09T08:00:00Z',seedLikes:18,image:'residence'},
  {id:'garden-friends',groupId:'hobbies',author:'คุณอร',authorId:'sample-orn',title:'มีใครอยากลองวาดสีน้ำแบบไม่ต้องเก่งบ้าง',body:'เพิ่งเริ่มวาดใบไม้ในสวนค่ะ สนุกตรงที่ได้สังเกตสีและรูปทรง ไม่ได้ตั้งใจให้สวยเหมือนใคร\n\nมาชวนคุยถึงงานอดิเรกใหม่ ๆ ที่อยากลองกันค่ะ',createdAt:'2026-11-08T04:30:00Z',seedLikes:9,image:'club'},
],comments:[{id:'comment-first',postId:'first-step',author:'คุณวิทย์',authorId:'sample-wit',body:'ผมเริ่มจากจัดเวลาให้ได้ทำสิ่งที่ชอบสัปดาห์ละครั้งครับ ค่อย ๆ เห็นภาพชีวิตที่อยากใช้ชัดขึ้น',createdAt:'2026-11-10T05:15:00Z'}]};}
export class ClubError extends Error{}
export type ClubAction=
 |{type:'book';eventId:string;seats:number;acknowledged:boolean}
 |{type:'cancel-booking';bookingId:string}
 |{type:'join';groupId:GroupId;join:boolean}
 |{type:'post';groupId:GroupId;title:string;body:string;acknowledged:boolean}
 |{type:'edit-post';postId:string;title:string;body:string;expectedUpdatedAt:string;acknowledged:boolean}
 |{type:'delete-post'|'restore-post';postId:string}
 |{type:'comment';postId:string;body:string;acknowledged:boolean}
 |{type:'delete-comment'|'restore-comment';commentId:string}
 |{type:'like'|'save'|'hide';postId:string;value:boolean}
 |{type:'report';target:'post'|'comment';targetId:string;reason:ReportReason;detail:string;hide:boolean};
const groupExists=(id:string)=>communityGroups.some(g=>g.id===id);
const validTime=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function readClubData(raw:unknown):ClubData{
  if(!raw||typeof raw!=='object')throw new ClubError('ข้อมูลคลับไม่ถูกต้อง');
  const d=raw as ClubData;
  const arrays=['bookings','posts','comments','joined','liked','saved','hidden','reports'] as const;
  if(d.version!==1||arrays.some(k=>!Array.isArray(d[k])))throw new ClubError('รูปแบบข้อมูลคลับไม่รองรับ');
  const text=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
  if(d.posts.some(p=>!text(p.id,100)||!groupExists(p.groupId)||!text(p.title,100)||!text(p.body,1500)||!text(p.author,80)||!text(p.authorId,100)||!validTime(p.createdAt)||!Number.isSafeInteger(p.seedLikes)||p.seedLikes<0||(p.image!==undefined&&!['club','residence'].includes(p.image))||(p.updatedAt!==undefined&&!validTime(p.updatedAt))||(p.deletedAt!==undefined&&!validTime(p.deletedAt))))throw new ClubError('ข้อมูลกระทู้ไม่ถูกต้อง');
  const postIds=new Set(d.posts.map(p=>p.id));const commentIds=new Set(d.comments.map(c=>c.id));
  if(postIds.size!==d.posts.length||commentIds.size!==d.comments.length||new Set(d.bookings.map(b=>b.id)).size!==d.bookings.length)throw new ClubError('มีรหัสรายการซ้ำ');
  if(d.comments.some(c=>!text(c.id,100)||!postIds.has(c.postId)||!text(c.body,800)||!text(c.author,80)||!text(c.authorId,100)||!validTime(c.createdAt)||(c.deletedAt!==undefined&&!validTime(c.deletedAt))))throw new ClubError('ข้อมูลความคิดเห็นไม่ถูกต้อง');
  if(d.bookings.some(b=>!text(b.id,100)||!clubEvents.some(e=>e.id===b.eventId)||![1,2].includes(b.seats)||!['active','cancelled'].includes(b.status)||!validTime(b.createdAt)||(b.cancelledAt!==undefined&&!validTime(b.cancelledAt))))throw new ClubError('ข้อมูลลงทะเบียนไม่ถูกต้อง');
  const active=d.bookings.filter(b=>b.status==='active');if(new Set(active.map(b=>b.eventId)).size!==active.length)throw new ClubError('ลงทะเบียนกิจกรรมซ้ำ');
  for(const k of ['liked','saved','hidden'] as const)if(d[k].some(id=>!postIds.has(id))||new Set(d[k]).size!==d[k].length)throw new ClubError('รายการกระทู้ไม่ถูกต้อง');
  if(d.joined.some(g=>!groupExists(g))||new Set(d.joined).size!==d.joined.length)throw new ClubError('ข้อมูลกลุ่มไม่ถูกต้อง');
  if(d.reports.some(r=>!text(r.id,100)||!['post','comment'].includes(r.target)||!(r.target==='post'?postIds:commentIds).has(r.targetId)||!reportReasons.includes(r.reason)||!text(r.detail,300)||!validTime(r.createdAt)))throw new ClubError('ข้อมูลรายงานไม่ถูกต้อง');
  return d;
}
export function eventAvailability(event:ClubEvent,data:ClubData,now=new Date().toISOString()){
  const remaining=Math.max(0,event.capacity-event.sampleAttendees-data.bookings.filter(b=>b.eventId===event.id&&b.status==='active').reduce((sum,b)=>sum+b.seats,0));
  return {remaining,closed:Date.parse(now)>=Date.parse(event.close),ended:Date.parse(now)>=Date.parse(event.end)};
}
const requireText=(value:string,min:number,max:number,label:string)=>{if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw new ClubError(`${label}ต้องมี ${min}–${max} ตัวอักษร`);return value.trim();};
export function applyClubAction(current:ClubData,action:ClubAction,context:{id:string;now:string}={id:crypto.randomUUID(),now:new Date().toISOString()}){
  const d=structuredClone(readClubData(current));const {id,now}=context;
  if(!validTime(now)||!id||d.posts.some(p=>p.id===id)||d.comments.some(c=>c.id===id)||d.bookings.some(b=>b.id===id)||d.reports.some(r=>r.id===id))throw new ClubError('รหัสหรือเวลาของรายการไม่ถูกต้อง');
  const post=(postId:string)=>{const p=d.posts.find(p=>p.id===postId);if(!p)throw new ClubError('ไม่พบกระทู้');return p;};
  const activePost=(postId:string)=>{const p=post(postId);if(p.deletedAt)throw new ClubError('กระทู้นี้ถูกนำออกแล้ว');return p;};
  const acknowledge=(v:boolean)=>{if(!v)throw new ClubError('ยืนยันว่าใช้ข้อมูลตัวอย่างก่อนบันทึก');};
  const joined=(groupId:GroupId)=>{if(!d.joined.includes(groupId))throw new ClubError('เข้าร่วมกลุ่มนี้ก่อนเริ่มบทสนทนา');};
  const own=(authorId:string)=>{if(authorId!==memberId)throw new ClubError('จัดการได้เฉพาะเนื้อหาที่คุณเขียน');};
  let createdId:string|undefined;
  switch(action.type){
    case 'book':{acknowledge(action.acknowledged);const e=clubEvents.find(e=>e.id===action.eventId);if(!e)throw new ClubError('ไม่พบกิจกรรม');if(![1,2].includes(action.seats))throw new ClubError('เลือก 1 หรือ 2 ที่นั่ง');if(d.bookings.some(b=>b.eventId===e.id&&b.status==='active'))throw new ClubError('ลงทะเบียนกิจกรรมนี้ไว้แล้ว');const available=eventAvailability(e,d,now);if(available.closed)throw new ClubError('พ้นเวลาลงทะเบียนของกิจกรรมตัวอย่างแล้ว');if(action.seats>available.remaining)throw new ClubError('จำนวนที่นั่งในตัวอย่างไม่พอสำหรับรายการนี้');d.bookings.push({id,eventId:e.id,seats:action.seats,status:'active',createdAt:now});createdId=id;break;}
    case 'cancel-booking':{const b=d.bookings.find(b=>b.id===action.bookingId);if(!b||b.status!=='active')throw new ClubError('รายการนี้ยกเลิกแล้วหรือไม่พบรายการ');b.status='cancelled';b.cancelledAt=now;break;}
    case 'join':{if(!groupExists(action.groupId))throw new ClubError('ไม่พบกลุ่ม');d.joined=d.joined.filter(g=>g!==action.groupId);if(action.join)d.joined.push(action.groupId);break;}
    case 'post':{acknowledge(action.acknowledged);if(!groupExists(action.groupId))throw new ClubError('เลือกกลุ่มให้ถูกต้อง');joined(action.groupId);const title=requireText(action.title,5,100,'หัวข้อ');const body=requireText(action.body,10,1500,'เนื้อหา');if(d.posts.some(p=>p.authorId===memberId&&!p.deletedAt&&p.groupId===action.groupId&&p.title===title&&p.body===body))throw new ClubError('มีข้อความนี้อยู่แล้ว เปิดกระทู้เดิมเพื่อคุยต่อได้');d.posts.unshift({id,groupId:action.groupId,author:'คุณพีระ',authorId:memberId,title,body,createdAt:now,seedLikes:0});createdId=id;break;}
    case 'edit-post':{acknowledge(action.acknowledged);const p=activePost(action.postId);own(p.authorId);if((p.updatedAt??p.createdAt)!==action.expectedUpdatedAt)throw new ClubError('กระทู้เปลี่ยนจากอีกแท็บแล้ว ปิดหน้าต่างแล้วเปิดแก้ไขใหม่');p.title=requireText(action.title,5,100,'หัวข้อ');p.body=requireText(action.body,10,1500,'เนื้อหา');p.updatedAt=new Date(Math.max(Date.parse(now),Date.parse(p.updatedAt??p.createdAt)+1)).toISOString();break;}
    case 'delete-post':{const p=activePost(action.postId);own(p.authorId);p.deletedAt=now;break;}
    case 'restore-post':{const p=post(action.postId);own(p.authorId);if(!p.deletedAt)throw new ClubError('กระทู้นี้แสดงอยู่แล้ว');delete p.deletedAt;break;}
    case 'comment':{acknowledge(action.acknowledged);const p=activePost(action.postId);joined(p.groupId);const body=requireText(action.body,2,800,'ความคิดเห็น');if(d.comments.some(c=>c.postId===p.id&&c.authorId===memberId&&!c.deletedAt&&c.body===body))throw new ClubError('มีความคิดเห็นนี้อยู่แล้ว');d.comments.push({id,postId:p.id,author:'คุณพีระ',authorId:memberId,body,createdAt:now});createdId=id;break;}
    case 'delete-comment':case 'restore-comment':{const c=d.comments.find(c=>c.id===action.commentId);if(!c)throw new ClubError('ไม่พบความคิดเห็น');own(c.authorId);activePost(c.postId);if(action.type==='delete-comment'){if(c.deletedAt)throw new ClubError('ความคิดเห็นนี้นำออกแล้ว');c.deletedAt=now;}else{if(!c.deletedAt)throw new ClubError('ความคิดเห็นนี้แสดงอยู่แล้ว');delete c.deletedAt;}break;}
    case 'like':case 'save':case 'hide':{activePost(action.postId);const key=action.type==='like'?'liked':action.type==='save'?'saved':'hidden';d[key]=d[key].filter(v=>v!==action.postId);if(action.value)d[key].push(action.postId);break;}
    case 'report':{if(!reportReasons.includes(action.reason))throw new ClubError('เลือกเหตุผลการรายงาน');if(typeof action.detail!=='string'||action.detail.trim().length>300)throw new ClubError('รายละเอียดไม่เกิน 300 ตัวอักษร');let p:Post;if(action.target==='post')p=activePost(action.targetId);else{const c=d.comments.find(c=>c.id===action.targetId&&!c.deletedAt);if(!c)throw new ClubError('ไม่พบความคิดเห็น');p=activePost(c.postId);}if(d.reports.some(r=>r.target===action.target&&r.targetId===action.targetId))throw new ClubError('บันทึกรายงานเนื้อหานี้ไว้แล้ว');d.reports.push({id,target:action.target,targetId:action.targetId,reason:action.reason,detail:action.detail.trim(),createdAt:now});if(action.hide&&!d.hidden.includes(p.id))d.hidden.push(p.id);break;}
  }
  return {data:readClubData(d),createdId};
}
export function filterPosts(data:ClubData,{group='all',query='',view='all',sort='latest'}:{group?:string;query?:string;view?:'all'|'saved'|'mine'|'hidden';sort?:'latest'|'discussion'}={}){
  const term=query.trim().toLocaleLowerCase('th');
  return data.posts.filter(p=>(group==='all'||p.groupId===group)&&(!term||`${p.title} ${p.body} ${p.author}`.toLocaleLowerCase('th').includes(term))&&(view==='hidden'?data.hidden.includes(p.id)&&!p.deletedAt:view==='mine'?p.authorId===memberId:!p.deletedAt&&!data.hidden.includes(p.id))&&(view!=='saved'||data.saved.includes(p.id)))
    .sort((a,b)=>sort==='discussion'?(data.comments.filter(c=>c.postId===b.id&&!c.deletedAt).length-data.comments.filter(c=>c.postId===a.id&&!c.deletedAt).length)||b.createdAt.localeCompare(a.createdAt):b.createdAt.localeCompare(a.createdAt));
}
const calendarText=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const utc=(s:string)=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
export function makeEventCalendar(event:ClubEvent,booking:Booking,now=new Date().toISOString()){
  if(booking.eventId!==event.id||booking.status!=='active')throw new ClubError('ดาวน์โหลดได้เฉพาะรายการลงทะเบียนที่ยังใช้งานอยู่');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LIVERA//Club Demo//TH','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${booking.id.replace(/[^a-zA-Z0-9_-]/g,'')}@livera.example`,`DTSTAMP:${utc(now)}`,`DTSTART:${utc(event.start)}`,`DTEND:${utc(event.end)}`,`SUMMARY:${calendarText('[สาธิต LIVERA] '+event.subtitle)}`,`LOCATION:${calendarText(event.location)}`,`DESCRIPTION:${calendarText('กิจกรรมสมมติ ไม่มีการจองกับผู้จัดจริง จำนวน '+booking.seats+' ที่นั่ง\nเวลาท้องถิ่น Asia/Bangkok หากยกเลิกในแอป ให้แก้ไขหรือลบในปฏิทินของคุณเองด้วย')}`,'STATUS:TENTATIVE','TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR'];
  // RFC 5545 content lines use CRLF and fold at 75 UTF-8 octets, without splitting a character.
  const folded=lines.map(line=>{let parts=[''];let bytes=0;for(const char of line){const size=new TextEncoder().encode(char).length;if(bytes+size>75){parts.push(' ');bytes=1;}parts[parts.length-1]+=char;bytes+=size;}return parts.join('\r\n');});
  return folded.join('\r\n')+'\r\n';
}
