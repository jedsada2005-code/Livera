import { Bookmark, ExternalLink } from 'lucide-react';
import { MobileDisclosure } from '../components/MobileDisclosure';
import { checkedOn } from '../data/knowledge';
import type { KnowledgeItem } from '../data/knowledge';
import type { Knowledge } from '../hooks/useKnowledge';
import { formatDate } from '../domain/ledger';
export const mediaAsset=(file:string)=>`${import.meta.env.BASE_URL}media/${file}`;
export const clipClock=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
export function SaveContent({item,library,onNotice}:{item:KnowledgeItem;library:Knowledge;onNotice:(text:string)=>void}){
  const saved=library.data.saved.includes(item.id);
  return <button className={`content-save ${saved?'is-saved':''}`} disabled={library.loading||library.busy||Boolean(library.error)} aria-label={`${saved?'เลิกเก็บ':'เก็บ'} ${item.title}`} aria-pressed={saved} onClick={async()=>{try{await library.run({type:'save',id:item.id,saved:!saved});onNotice(saved?'นำออกจากรายการที่เก็บแล้ว':'เก็บในคลังของฉันแล้ว');}catch(e){onNotice(e instanceof Error?e.message:'บันทึกไม่ได้');}}}><Bookmark size={18} fill={saved?'currentColor':'none'}/><span>{saved?'เก็บแล้ว':item.kind==='clip'?'เก็บไว้ดู':'เก็บไว้อ่าน'}</span></button>;
}
export function KnowledgeSource({item}:{item:KnowledgeItem}){
  return <MobileDisclosure title="แหล่งอ้างอิงและวันที่"><aside className="content-source"><span className="eyebrow">SOURCE & CONTEXT</span><h3>{item.editorial?'เรียบเรียงโดย LIVERA':'อ่านจากแหล่งข้อมูลโดยตรง'}</h3><p>{item.editorial?'แนวทางใช้เครื่องมือและเช็กลิสต์ของ LIVERA':`สรุปจาก ${item.source}`} · {item.sourceTitle}</p><p>{item.publishedOn?`${item.editorial?'เผยแพร่บทความ LIVERA':'เผยแพร่ต้นทาง'} ${formatDate(item.publishedOn,true)}`:'ไม่พบวันที่เผยแพร่ที่ยืนยันได้บนหน้าต้นทาง'}<br/>ตรวจแหล่งข้อมูล {formatDate(checkedOn,true)}</p><a className="text-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">เปิด {item.source}<ExternalLink size={16}/><span className="visually-hidden">(เปิดแท็บใหม่)</span></a>{item.cover?.sourceUrl&&<p><a href={item.cover.sourceUrl} target="_blank" rel="noopener noreferrer">{item.cover.credit} · ต้นทางภาพ</a></p>}<small>เนื้อหาคัดสรร ไม่ใช่ฟีดข่าวอัตโนมัติหรือคำแนะนำเฉพาะบุคคล {item.kind==='clip'&&(item.hasAudio?'คลิปผลิตโดย LIVERA · เสียงสังเคราะห์ภาษาไทย':'คลิปข้อความโดย LIVERA · ไม่มีเสียง')}</small></aside></MobileDisclosure>;
}
