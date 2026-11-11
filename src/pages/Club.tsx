import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Info, MessageCircle, RotateCcw, ShieldCheck, Ticket } from 'lucide-react';
import { DemoNote, Modal } from '../components/ui';
import { PhotoHero } from '../components/PhotoHero';
import { clubEvents } from '../data/club';
import { reportReasons } from '../domain/community';
import type { ReportReason } from '../domain/community';
import type { Club } from '../hooks/useClub';
import { useClubLocation } from '../routing';
import { EventDetails, EventsList, MyClub, BookingForm } from './ClubEvents';
import { CommunityFeed, PostDetails, PostEditor } from './Community';
export type ClubDialog={kind:'book'|'room';id:string}|{kind:'cancel';id:string}|{kind:'compose';id?:string}|{kind:'report';id:string;target:'post'|'comment'}|{kind:'guidelines'|'reset'};
export type ClubViewProps={club:Club;open:(dialog:ClubDialog)=>void;act:(action:Parameters<Club['run']>[0],message:string)=>Promise<boolean>};
const errorText=(e:unknown)=>e instanceof Error?e.message:'ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง';
export function ClubPage({club,onNotice}:{club:Club;onNotice:(message:string)=>void}){
  const location=useClubLocation();
  const [dialog,setDialog]=useState<ClubDialog|null>(null);const [error,setError]=useState('');
  const heading=useRef<HTMLHeadingElement>(null);const alert=useRef<HTMLDivElement>(null);
  useEffect(()=>{setError('');setDialog(null);heading.current?.focus();},[location.section,location.id]);
  useEffect(()=>{if(error)alert.current?.focus();},[error]);
  const act:ClubViewProps['act']=async(action,message)=>{setError('');try{await club.run(action);onNotice(message);return true;}catch(e){setError(errorText(e));return false;}};
  const props:ClubViewProps={club,open:setDialog,act};
  const section=location.section==='post'?'community':location.section;
  const event=clubEvents.find(e=>e.id===location.id);
  const title=dialog?.kind==='book'?'ลงทะเบียนกิจกรรมสาธิต':dialog?.kind==='cancel'?'ยกเลิกการลงทะเบียน':dialog?.kind==='compose'?(dialog.id?'แก้ไขกระทู้ของฉัน':'เริ่มบทสนทนาใหม่'):dialog?.kind==='report'?'รายงานเนื้อหาสาธิต':dialog?.kind==='room'?'เตรียมตัวเข้ากิจกรรมออนไลน์':dialog?.kind==='reset'?'คืนค่าข้อมูลคลับสาธิต':'ข้อตกลงของพื้นที่ร่วมกัน';
  return <div className="club-round3">
    {location.section==='events'&&!location.id&&<PhotoHero club/>}
    {location.section==='community'&&<section className="club-short-hero"><div><span className="eyebrow">A PLACE TO BELONG</span><h2>เรื่องราวเล็ก ๆ<br/>ที่ทำให้รู้สึกเป็นส่วนหนึ่ง</h2><p>ความสนใจเดียวกัน เป็นจุดเริ่มต้นของบทสนทนา</p></div><img src={`${import.meta.env.BASE_URL}images/retirement-club.webp`} alt="ภาพประกอบสมมติของสมาชิกทำกิจกรรมในสวน"/><span>ภาพจำลอง AI</span></section>}
    <nav className="club-section-nav" aria-label="เมนูคลับ"><a href="#/club/events" className={section==='events'?'selected':''} aria-current={section==='events'?'page':undefined}><CalendarDays size={19}/>กิจกรรมคลับ</a><a href="#/club/community" className={section==='community'?'selected':''} aria-current={section==='community'?'page':undefined}><MessageCircle size={19}/>Community</a><a href="#/club/mine" className={section==='mine'?'selected':''} aria-current={section==='mine'?'page':undefined}><Ticket size={19}/>รายการของฉัน{club.data.bookings.some(b=>b.status==='active')&&<span className="club-count">{club.data.bookings.filter(b=>b.status==='active').length}</span>}</a></nav>
    <h2 ref={heading} tabIndex={-1} className="visually-hidden">{section==='events'?'กิจกรรม Retirement Luxury Club':section==='community'?'Community สำหรับลูกค้า LIVERA':'รายการคลับของฉัน'}</h2>
    <div className="club-demo-strip"><ShieldCheck size={18}/><span>พื้นที่ลูกค้า LIVERA ทุกวัย <strong>· กำลังทดลองด้วยข้อมูลสมมติในเบราว์เซอร์นี้</strong></span><button className="text-link" onClick={()=>setDialog({kind:'guidelines'})}>ข้อตกลงชุมชน</button></div>
    {club.error&&<div className="storage-error" role="alert"><p>{club.error}</p><button className="button button-secondary" onClick={()=>void club.refresh()}>ลองโหลดอีกครั้ง</button></div>}
    {error&&<div className="club-action-error" role="alert" tabIndex={-1} ref={alert}><Info size={18}/><span>{error}</span><button className="text-link" onClick={()=>setError('')}>ปิดข้อความ</button></div>}
    {location.section==='events'?(location.id?(event?<EventDetails event={event} {...props}/>:<NotFound/>):<EventsList {...props}/>):location.section==='community'?<CommunityFeed {...props}/>:location.section==='post'?<PostDetails id={location.id} {...props}/>:location.section==='mine'?<MyClub {...props}/>:<NotFound/>}
    <div className="club-data-footer"><p>รายการลงทะเบียน กระทู้ และรายงานสาธิตเก็บเฉพาะเบราว์เซอร์นี้ ไม่ซิงก์กับสมาชิกหรือผู้จัด</p><button className="text-link" onClick={()=>setDialog({kind:'reset'})}><RotateCcw size={15}/>คืนค่าข้อมูลคลับ</button></div>
    {dialog&&<Modal title={title} eyebrow="LIVERA CLUB · DEMO" canClose={!club.busy} onClose={()=>setDialog(null)}>
      {dialog.kind==='book'&&<BookingForm key={dialog.id} id={dialog.id} club={club} onNotice={onNotice} onClose={()=>setDialog(null)}/>}
      {dialog.kind==='cancel'&&<CancelBooking id={dialog.id} club={club} onDone={()=>{setDialog(null);onNotice('ยกเลิกรายการสาธิตแล้ว');}}/>}
      {dialog.kind==='compose'&&<PostEditor key={dialog.id??'new'} id={dialog.id} club={club} onDone={id=>{setDialog(null);onNotice('บันทึกกระทู้ในเบราว์เซอร์นี้แล้ว');window.location.hash=`/club/post/${id}`;}}/>}
      {dialog.kind==='report'&&<ReportForm key={`${dialog.target}/${dialog.id}`} target={dialog.target} id={dialog.id} club={club} onDone={()=>{setDialog(null);onNotice('บันทึกรายงานสาธิตแล้ว ยังไม่ได้ส่งผู้ดูแล');}}/>}
      {dialog.kind==='room'&&<><div className="club-modal-symbol"><CalendarDays size={30}/></div><h3>{clubEvents.find(e=>e.id===dialog.id)?.subtitle}</h3><p className="feature-body">คุณลงทะเบียนในต้นแบบไว้แล้ว กิจกรรมออนไลน์ตัวอย่างยังไม่มีห้องประชุมจริง หน้านี้ไม่เปิดกล้องหรือไมโครโฟน</p><ul className="club-checklist"><li>เตรียมอุปกรณ์และหูฟัง</li><li>เลือกมุมสงบที่สะดวกเข้าร่วม</li><li>เก็บคำถามทั่วไปไว้พูดคุย โดยไม่เปิดเผยเอกสารส่วนตัว</li></ul><button className="button button-primary" onClick={()=>setDialog(null)}>เข้าใจแล้ว<Check size={17}/></button></>}
      {dialog.kind==='guidelines'&&<div className="club-guidelines"><span className="club-modal-symbol"><ShieldCheck size={30}/></span><h3>คุยกันด้วยความเคารพ และเก็บเรื่องส่วนตัวไว้กับตัว</h3><ol><li>ใช้ข้อความตัวอย่าง พูดคุยและแลกเปลี่ยนประสบการณ์ทั่วไป</li><li>ไม่ลงเลขกรมธรรม์ หลักฐานชำระเงิน เบอร์โทร หรือข้อมูลสุขภาพที่ระบุตัวบุคคล</li><li>ไม่โฆษณาหรือชักชวนซื้อขายผลิตภัณฑ์ผ่านกระทู้</li><li>แยกประสบการณ์ส่วนบุคคลจากคำแนะนำของผู้เชี่ยวชาญ การนัดปรึกษาจะอยู่ในบริการส่วนตัว</li><li>รายงานเนื้อหาหรือซ่อนกระทู้ได้ ใน Prototype รายงานอยู่ในเครื่องและยังไม่มีผู้ดูแลจริงรับเรื่อง</li></ol><DemoNote>กระทู้ ความคิดเห็น และตัวเลขสมาชิกตั้งต้นเป็นเรื่องสมมติ ข้อมูลกรมธรรม์และแผนเงินไม่ถูกดึงมาโพสต์อัตโนมัติ</DemoNote></div>}
      {dialog.kind==='reset'&&<ResetClub club={club} onDone={()=>{setDialog(null);onNotice('คืนค่าข้อมูลคลับสาธิตแล้ว');window.location.hash='/club/events';}}/>}
    </Modal>}
  </div>;
}
export function NotFound(){return <section className="panel club-empty"><Info size={30}/><h3>ไม่พบรายการนี้ในเบราว์เซอร์</h3><p>กระทู้ที่สร้างใหม่อาจอยู่เฉพาะเบราว์เซอร์ที่ใช้สร้าง</p><a className="button button-secondary" href="#/club/events"><ArrowLeft size={16}/>กลับไปคลับ</a></section>;}
function CancelBooking({id,club,onDone}:{id:string;club:Club;onDone:()=>void}){
  const [error,setError]=useState('');const b=club.data.bookings.find(b=>b.id===id);const e=clubEvents.find(e=>e.id===b?.eventId);
  return <><p className="feature-body">ยกเลิกรายการสาธิต “{e?.subtitle}” {b?.seats} ที่นั่ง ประวัติจะยังอยู่ในรายการของฉัน</p><p className="club-warning">หากเคยเพิ่มไฟล์กิจกรรมลงปฏิทิน ต้องลบหรือแก้ไขในปฏิทินนั้นด้วย การยกเลิกในแอปไม่แก้ปฏิทินภายนอกให้</p>{error&&<p className="form-error" role="alert">{error}</p>}<div className="flow-actions"><button className="button button-danger" disabled={club.busy} onClick={async()=>{try{await club.run({type:'cancel-booking',bookingId:id});onDone();}catch(e){setError(errorText(e));}}}>ยืนยันยกเลิกการลงทะเบียน</button></div></>;
}
function ResetClub({club,onDone}:{club:Club;onDone:()=>void}){
  const [error,setError]=useState('');return <><p className="feature-body">ล้างรายการลงทะเบียน กระทู้และความคิดเห็นที่เพิ่ม การถูกใจ โพสต์ที่บันทึก/ซ่อน กลุ่ม และรายงานสาธิต แล้วกลับเป็นข้อมูลคลับตั้งต้น ประวัติเบี้ยและแผนเกษียณยังอยู่</p>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-danger" disabled={club.busy} onClick={async()=>{try{await club.reset();onDone();}catch(e){setError(errorText(e));}}}><RotateCcw size={17}/>ยืนยันคืนค่าข้อมูลคลับ</button></>;
}
function ReportForm({target,id,club,onDone}:{target:'post'|'comment';id:string;club:Club;onDone:()=>void}){
  const [reason,setReason]=useState('');const [detail,setDetail]=useState('');const [hide,setHide]=useState(true);const [error,setError]=useState('');
  return <form className="club-form" noValidate onSubmit={async event=>{event.preventDefault();if(!reason){setError('เลือกเหตุผลก่อนบันทึกรายงาน');return;}try{await club.run({type:'report',target,targetId:id,reason:reason as ReportReason,detail,hide});onDone();}catch(e){setError(errorText(e));}}}><p className="club-warning">รายงานนี้เก็บในเบราว์เซอร์เพื่อทดลองขั้นตอน ยังไม่มีการส่งไปถึงผู้ดูแล</p><label>เหตุผล<select value={reason} onChange={e=>setReason(e.target.value)}><option value="">เลือกเหตุผล</option>{reportReasons.map(reason=><option key={reason}>{reason}</option>)}</select></label><label>รายละเอียดเพิ่มเติม (ไม่บังคับ)<textarea rows={3} maxLength={300} value={detail} onChange={e=>setDetail(e.target.value)}/><small>ไม่ใส่ข้อมูลส่วนบุคคล · {detail.length}/300 ตัวอักษร</small></label><label className="club-checkbox"><input type="checkbox" checked={hide} onChange={e=>setHide(e.target.checked)}/><span>ซ่อนกระทู้นี้จากฟีดของฉันด้วย</span></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={club.busy}>บันทึกรายงานสาธิต<ArrowRight size={17}/></button></form>;
}
