import test from 'node:test';
import assert from 'node:assert/strict';
import { clubEvents } from '../src/data/club.ts';
import { applyClubAction, createClubSeed, eventAvailability, filterPosts, makeEventCalendar, readClubData } from '../src/domain/community.ts';
import type { ClubAction, ClubData } from '../src/domain/community.ts';
const now='2026-11-11T03:00:00Z';
let sequence=0;
const apply=(data:ClubData,action:ClubAction,time=now)=>applyClubAction(data,action,{id:`test-${++sequence}`,now:time});
const newPost=(data=createClubSeed())=>apply(data,{type:'post',groupId:'planning',title:'เรื่องที่อยากทำหลังเกษียณ',body:'อยากลองวาดสีน้ำและจัดมุมอ่านหนังสือที่บ้านค่ะ',acknowledged:true});
test('club seed is valid and independent of policy and retirement data',()=>{
  const d=createClubSeed();assert.equal(readClubData(d),d);assert.equal(d.posts.length,3);assert.equal(d.bookings.length,0);assert.ok(!('policies' in d)&&!('retirement' in d));
});
test('booking reserves seats once, cancellation releases them and preserves history',()=>{
  const seed=createClubSeed();const e=clubEvents[0];assert.equal(eventAvailability(e,seed,now).remaining,4);
  const r=apply(seed,{type:'book',eventId:e.id,seats:2,acknowledged:true});assert.equal(eventAvailability(e,r.data,now).remaining,2);assert.equal(seed.bookings.length,0);
  assert.throws(()=>apply(r.data,{type:'book',eventId:e.id,seats:1,acknowledged:true}),/ลงทะเบียนกิจกรรมนี้ไว้แล้ว/);
  const cancelled=apply(r.data,{type:'cancel-booking',bookingId:r.createdId!}).data;assert.equal(eventAvailability(e,cancelled,now).remaining,4);assert.equal(cancelled.bookings[0].status,'cancelled');assert.ok(cancelled.bookings[0].cancelledAt);
  const again=apply(cancelled,{type:'book',eventId:e.id,seats:1,acknowledged:true}).data;assert.equal(again.bookings.length,2);
});
test('full events, cutoff boundary and invalid seat counts cannot be booked',()=>{
  const s=createClubSeed();assert.throws(()=>apply(s,{type:'book',eventId:'slow-morning',seats:1,acknowledged:true}),/ที่นั่ง/);
  assert.throws(()=>apply(s,{type:'book',eventId:'garden',seats:1,acknowledged:true},clubEvents[0].close),/พ้นเวลา/);
  for(const seats of [0,3,1.5])assert.throws(()=>apply(s,{type:'book',eventId:'garden',seats,acknowledged:true}));
});
test('creating content and booking require an explicit demo acknowledgement',()=>{
  assert.throws(()=>apply(createClubSeed(),{type:'book',eventId:'garden',seats:1,acknowledged:false}),/ยืนยัน/);
  assert.throws(()=>apply(createClubSeed(),{type:'post',groupId:'planning',title:'หัวข้อตัวอย่าง',body:'เนื้อหาตัวอย่างเพื่อพูดคุยทั่วไป',acknowledged:false}),/ยืนยัน/);
});
test('joining is required to post and comment but leaving preserves existing content',()=>{
  let s=createClubSeed();assert.throws(()=>apply(s,{type:'post',groupId:'hobbies',title:'ชวนคุยงานอดิเรก',body:'มาลองวาดสีน้ำในวันหยุดกันค่ะ',acknowledged:true}),/เข้าร่วมกลุ่ม/);
  s=apply(s,{type:'join',groupId:'hobbies',join:true}).data;
  s=apply(s,{type:'comment',postId:'garden-friends',body:'อยากลองด้วยค่ะ',acknowledged:true}).data;
  s=apply(s,{type:'join',groupId:'hobbies',join:false}).data;assert.equal(s.comments.length,2);
  assert.throws(()=>apply(s,{type:'comment',postId:'garden-friends',body:'อีกความเห็นตัวอย่าง',acknowledged:true}),/เข้าร่วม/);
});
test('post content is trimmed, bounded, kept as literal text, and duplicate-safe',()=>{
  const r=newPost();const p=r.data.posts[0];assert.equal(p.authorId,'demo-member');assert.ok(r.createdId);
  assert.throws(()=>newPost(r.data),/มีข้อความนี้อยู่แล้ว/);
  assert.throws(()=>apply(r.data,{type:'post',groupId:'planning',title:'สั้น',body:'สั้น',acknowledged:true}));
  assert.throws(()=>apply(r.data,{type:'post',groupId:'planning',title:'หัวข้อทดสอบ',body:'x'.repeat(1501),acknowledged:true}));
  const literal=apply(r.data,{type:'post',groupId:'planning',title:'ตรวจข้อความตัวอย่าง',body:'<script>alert("demo")</script>',acknowledged:true}).data.posts[0];assert.equal(literal.body,'<script>alert("demo")</script>');
});
test('members cannot edit or remove seeded authors content',()=>{
  const s=createClubSeed();assert.throws(()=>apply(s,{type:'delete-post',postId:'first-step'}),/เฉพาะเนื้อหา/);
  assert.throws(()=>apply(s,{type:'edit-post',postId:'first-step',title:'แก้หัวข้อตัวอย่าง',body:'เนื้อหาตัวอย่างใหม่ค่ะ',expectedUpdatedAt:s.posts[0].createdAt,acknowledged:true}),/เฉพาะเนื้อหา/);
  assert.throws(()=>apply(s,{type:'delete-comment',commentId:'comment-first'}),/เฉพาะเนื้อหา/);
});
test('stale editing is rejected instead of silently overwriting the latest post',()=>{
  const r=newPost();const action={type:'edit-post' as const,postId:r.createdId!,title:'หัวข้อใหม่หลังแก้ไข',body:'ข้อความแก้ไขสำหรับทดสอบการแก้ข้ามแท็บค่ะ',expectedUpdatedAt:now,acknowledged:true};
  const edited=apply(r.data,action,'2026-11-11T03:01:00Z').data;assert.throws(()=>apply(edited,action),/อีกแท็บ/);assert.equal(Date.parse(edited.posts[0].updatedAt!),Date.parse('2026-11-11T03:01:00Z'));
});
test('removed posts disappear from feeds but can be restored with their comments',()=>{
  const r=newPost();let d=apply(r.data,{type:'comment',postId:r.createdId!,body:'ความคิดเห็นตัวอย่าง',acknowledged:true}).data;
  d=apply(d,{type:'delete-post',postId:r.createdId!}).data;assert.ok(!filterPosts(d).some(p=>p.id===r.createdId));assert.equal(filterPosts(d,{view:'mine'}).length,1);
  assert.throws(()=>apply(d,{type:'comment',postId:r.createdId!,body:'ทดสอบคุยต่อ',acknowledged:true}),/นำออก/);
  d=apply(d,{type:'restore-post',postId:r.createdId!}).data;assert.ok(filterPosts(d).some(p=>p.id===r.createdId));assert.equal(d.comments.filter(c=>c.postId===r.createdId).length,1);
});
test('duplicate comments are blocked and withdrawing preserves a recoverable comment',()=>{
  const r=apply(createClubSeed(),{type:'comment',postId:'first-step',body:' เริ่มจากสิ่งเล็ก ๆ เหมือนกันค่ะ ',acknowledged:true});
  assert.throws(()=>apply(r.data,{type:'comment',postId:'first-step',body:'เริ่มจากสิ่งเล็ก ๆ เหมือนกันค่ะ',acknowledged:true}),/มีความคิดเห็น/);
  let d=apply(r.data,{type:'delete-comment',commentId:r.createdId!}).data;assert.ok(d.comments.find(c=>c.id===r.createdId)?.deletedAt);
  d=apply(d,{type:'restore-comment',commentId:r.createdId!}).data;assert.equal(d.comments.find(c=>c.id===r.createdId)?.deletedAt,undefined);
});
test('likes and bookmarks use desired values and do not double-count repeated actions',()=>{
  let d=createClubSeed();for(let i=0;i<2;i++){d=apply(d,{type:'like',postId:'first-step',value:true}).data;d=apply(d,{type:'save',postId:'first-step',value:true}).data;}
  assert.equal(d.liked.length,1);assert.equal(filterPosts(d,{view:'saved'}).length,1);
  d=apply(d,{type:'save',postId:'first-step',value:false}).data;assert.equal(filterPosts(d,{view:'saved'}).length,0);
});
test('reports remain local records and hiding does not delete a bookmarked post',()=>{
  let d=apply(createClubSeed(),{type:'save',postId:'first-step',value:true}).data;
  d=apply(d,{type:'report',target:'post',targetId:'first-step',reason:'ข้อมูลส่วนตัว',detail:'ข้อความทดสอบ',hide:true}).data;
  assert.equal(d.reports.length,1);assert.equal(filterPosts(d,{view:'saved'}).length,0);assert.equal(filterPosts(d,{view:'hidden'}).length,1);assert.ok(d.saved.includes('first-step'));
  assert.throws(()=>apply(d,{type:'report',target:'post',targetId:'first-step',reason:'ข้อมูลส่วนตัว',detail:'',hide:false}),/ไว้แล้ว/);
  d=apply(d,{type:'hide',postId:'first-step',value:false}).data;assert.equal(filterPosts(d,{view:'saved'}).length,1);
});
test('comment reports can hide their parent post without changing the comment',()=>{
  const r=apply(createClubSeed(),{type:'report',target:'comment',targetId:'comment-first',reason:'ข้อมูลที่อาจทำให้เข้าใจผิด',detail:'',hide:true});assert.ok(r.data.hidden.includes('first-step'));assert.equal(r.data.comments.length,1);
});
test('feed search, group filtering and discussion sort respect visible posts',()=>{
  const d=createClubSeed();assert.equal(filterPosts(d,{query:'สีน้ำ'})[0].id,'garden-friends');assert.equal(filterPosts(d,{group:'living'}).length,1);assert.equal(filterPosts(d,{sort:'discussion'})[0].id,'first-step');assert.equal(filterPosts(d,{query:'ไม่พบข้อความนี้แน่นอน'}).length,0);
});
test('invalid stored shapes are rejected rather than replaced silently',()=>{
  assert.throws(()=>readClubData({version:9}));const d=createClubSeed();d.posts[0].groupId='unknown' as never;assert.throws(()=>readClubData(d));
  const d2=createClubSeed();d2.comments[0].postId='missing';assert.throws(()=>readClubData(d2));
});
test('calendar exports use UTC, stable UID, UTF-8-safe folding and an explicit demo title',()=>{
  const r=apply(createClubSeed(),{type:'book',eventId:'garden',seats:2,acknowledged:true});const b=r.data.bookings[0];const text=makeEventCalendar(clubEvents[0],b,now);
  assert.ok(text.endsWith('\r\n'));assert.ok(text.includes('DTSTART:20261128T030000Z'));assert.ok(text.includes('DTEND:20261128T050000Z'));assert.ok(text.includes(`UID:${b.id}@livera.example`));assert.ok(text.replace(/\r\n /g,'').includes('[สาธิต LIVERA]'));
  for(const line of text.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);
  assert.ok(!text.includes('\ufffd'));assert.throws(()=>makeEventCalendar(clubEvents[0],{...b,status:'cancelled'},now));
});
test('an edit revision advances even when two edits share a millisecond',()=>{
  const r=newPost();const action={type:'edit-post' as const,postId:r.createdId!,title:'หัวข้อที่แก้ในมิลลิวินาทีเดียว',body:'เนื้อหาสาธิตสำหรับทดสอบรุ่นข้อมูลที่เปลี่ยน',expectedUpdatedAt:now,acknowledged:true};
  const d=apply(r.data,action,now).data;assert.notEqual(d.posts[0].updatedAt,now);assert.throws(()=>apply(d,action,now),/อีกแท็บ/);
});
