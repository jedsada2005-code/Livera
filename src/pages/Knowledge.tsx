import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Bookmark, Check, ChevronRight, Copy, Play, Search, SlidersHorizontal } from 'lucide-react';
import { MobileDisclosure } from '../components/MobileDisclosure';
import { Badge, DemoNote, Modal } from '../components/ui';
import { checkedOn, knowledge, topics } from '../data/knowledge';
import type { KnowledgeItem, Topic } from '../data/knowledge';
import { filterKnowledge, knowledgeHref, reelForLink, sortKnowledge } from '../domain/knowledge';
import type { KnowledgeFilter, KnowledgeSort } from '../domain/knowledge';
import type { Knowledge } from '../hooks/useKnowledge';
import { useServiceLocation } from '../routing';
import { formatDate } from '../domain/ledger';
import { KnowledgeSource, SaveContent, mediaAsset } from './knowledgeShared';
import { ReelsViewer } from './Reels';

export function KnowledgePage({library,onNotice,largeText}:{largeText:boolean;library:Knowledge;id:string;onNotice:(text:string)=>void}){
  const location=useServiceLocation();
  const section=location.section;
  const item=knowledge.find(k=>k.id===section);
  const isReels=section==='reels'||section==='clips'||item?.kind==='clip';
  const reel=isReels?reelForLink(section,location.id,library.data.lastReelId):undefined;
  const [filter,setFilter]=useState<KnowledgeFilter>({query:'',topic:'all',kind:'article',collection:'all'});
  const [sort,setSort]=useState<KnowledgeSort>('recommended');
  const [limit,setLimit]=useState(3);
  const [readError,setReadError]=useState('');
  const [copyItem,setCopyItem]=useState<KnowledgeItem|null>(null);
  const returnPath=useRef('#/knowledge/news');
  const scrollPosition=useRef(0);
  const previousSection=useRef(section);
  useEffect(()=>{
    if(['home','news','saved'].includes(section)){
      returnPath.current=section==='saved'?'#/knowledge/saved':'#/knowledge/news';
      if(knowledge.some(k=>k.id===previousSection.current)||['reels','clips'].includes(previousSection.current))requestAnimationFrame(()=>window.scrollTo({top:scrollPosition.current}));
      else if(section!==previousSection.current){setFilter(f=>({...f,query:'',topic:'all',kind:section==='saved'?'all':'article',collection:section==='saved'?'saved':'all'}));setLimit(3);}
      else if(section==='saved'&&previousSection.current==='saved')setFilter(f=>({...f,kind:'all',collection:'saved'}));
    }
    setReadError('');previousSection.current=section;
  },[section]);
  const updateFilter=(next:Partial<KnowledgeFilter>)=>{setFilter(f=>({...f,...next}));setLimit(3);};
  const matches=sortKnowledge(filterKnowledge(library.data,filter),library.data,filter.collection==='history'?'recent':sort);
  const disabled=library.loading||library.busy||Boolean(library.error);
  const copy=async(k:KnowledgeItem)=>{
    const url=`${window.location.origin}${window.location.pathname}${knowledgeHref(k)}`;
    try{await navigator.clipboard.writeText(url);onNotice('คัดลอกลิงก์แล้ว เลือกส่งให้คนที่คุณต้องการได้');}catch{setCopyItem(k);}
  };
  const rememberScroll=()=>{scrollPosition.current=window.scrollY;};
  const clips=knowledge.filter(k=>k.kind==='clip');
  return <section className="journal-page">
    <nav className="journal-nav" aria-label="เลือกรูปแบบศูนย์ความรู้"><a href="#/knowledge/news" aria-current={!isReels&&section!=='saved'?'page':undefined}>ข่าวและบทความ</a><a href="#/knowledge/reels" onClick={rememberScroll} aria-current={isReels?'page':undefined}><Play size={15}/>Reels</a><a href="#/knowledge/saved" aria-current={section==='saved'?'page':undefined}><Bookmark size={15}/>คลังของฉัน</a></nav>
    {library.error&&<div className="storage-error" role="alert"><p>{library.error}</p><button className="button button-secondary" onClick={()=>void library.refresh()}>ลองโหลดอีกครั้ง</button><a href="#/account">จัดการคลังความรู้</a></div>}
    {library.loading?<p role="status">กำลังเปิดคลังความรู้…</p>:isReels?<>
      {reel?<ReelsViewer largeText={largeText} key={`${section}/${location.id}`} initial={reel} library={library} onNotice={onNotice} onClose={()=>{window.location.hash=returnPath.current;}}/>:<div className="journal-empty"><h2>ไม่พบคลิปตามลิงก์นี้</h2><a className="button button-primary" href="#/knowledge/reels">เลือกคลิปใหม่</a></div>}
    </>:item?<>
      <a className="text-link back-link" href={returnPath.current}><ArrowLeft size={17}/>กลับหน้าที่เลือกไว้</a>
      <article className="journal-article" key={item.id}><div className="content-meta"><Badge variant="blue">{topics[item.topic]}</Badge><span>อ่าน {item.minutes} นาที</span></div><h2>{item.title}</h2><p className="journal-standfirst">{item.summary}</p><p className="journal-dateline">{item.editorial?'บทความโดย LIVERA':`เรียบเรียงจาก ${item.source}`} · {item.publishedOn?formatDate(item.publishedOn,true):'ต้นทางไม่ระบุวันที่ยืนยันได้'}</p><div className="journal-actions"><SaveContent item={item} library={library} onNotice={onNotice}/><button onClick={()=>void copy(item)}><Copy size={17}/>คัดลอกลิงก์</button></div>
      {item.cover&&<figure className="journal-detail-photo"><img src={`${import.meta.env.BASE_URL}${item.cover.path}`} alt={item.cover.alt}/><figcaption>{item.cover.credit}{item.cover.sourceUrl&&<> · <a href={item.cover.sourceUrl} target="_blank" rel="noopener noreferrer">ต้นทางภาพ</a></>}</figcaption></figure>}
      <div className="content-body">{item.sections.map(s=><section key={s.title}><h3>{s.title}</h3><p>{s.body}</p></section>)}<a className="button button-primary content-action" href={item.action.href}>{item.action.label}<ArrowUpRight size={17}/></a><div className="read-completion"><button className="button button-secondary" disabled={disabled||library.data.activity[item.id]?.read} onClick={async()=>{try{await library.run({type:'read',id:item.id});onNotice('บันทึกว่าอ่านแล้ว');}catch{setReadError('เก็บประวัติอ่านไม่ได้ ลองอีกครั้ง');}}}><Check size={17}/>{library.data.activity[item.id]?.read?'อ่านแล้ว':'ทำเครื่องหมายว่าอ่านแล้ว'}</button>{readError&&<p role="alert">{readError}</p>}</div><KnowledgeSource item={item}/></div></article>
    </>:<>
      {!['home','news','saved'].includes(section)&&<p role="status">ไม่พบเนื้อหาตามลิงก์นี้ เลือกเรื่องใหม่ได้ด้านล่าง</p>}
      <header className="journal-masthead"><div><span className="eyebrow">LIVERA JOURNAL / VOL. 02</span><h2>อ่านวันนี้ เพื่อชีวิต<br/><em>ในแบบที่คุณเลือก</em></h2><p>เรื่องเงิน เรื่องบ้าน และบทต่อไปของชีวิต</p></div><a href="#/knowledge/reels" className="journal-reels-entry" onClick={rememberScroll}><span><Play size={26} fill="currentColor"/></span><strong>พักอ่าน มาดูสั้น ๆ</strong><small>Reels 24 วินาที <ChevronRight size={14}/></small></a></header>
      <div className="journal-layout"><div className="journal-main">
        <div className="journal-tools"><label className="journal-search"><Search size={19}/><span className="visually-hidden">ค้นหาเนื้อหา</span><input type="search" placeholder="ค้นหาเรื่องเงิน บ้าน หรือการเกษียณ" maxLength={120} value={filter.query} onChange={e=>updateFilter({query:e.target.value})}/></label><MobileDisclosure title="ตัวกรองและการเรียง" className="journal-filters" subtitle={filter.topic==='all'?'ทุกหัวข้อ':topics[filter.topic]}><label>หัวข้อ<select value={filter.topic} onChange={e=>updateFilter({topic:e.target.value as Topic|'all'})}><option value="all">ทุกหัวข้อ</option>{Object.entries(topics).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label><label>รูปแบบ<select value={filter.kind} onChange={e=>updateFilter({kind:e.target.value as KnowledgeFilter['kind']})}><option value="all">ทุกแบบ</option><option value="article">ข่าวและบทความ</option><option value="clip">คลิปสั้น</option></select></label><label>เรียงตาม<select value={sort} onChange={e=>{setSort(e.target.value as KnowledgeSort);setLimit(3);}} disabled={filter.collection==='history'}><option value="recommended">ความสนใจของฉัน</option><option value="newest">วันที่เผยแพร่</option><option value="recent">ประวัติล่าสุด</option></select></label><a className="text-link" href="#/account"><SlidersHorizontal size={15}/>เลือกความสนใจ</a></MobileDisclosure></div>
        <div className="journal-collections" role="group" aria-label="เลือกคลังเนื้อหา">{([['all','ทั้งหมด'],['interests','สนใจ'],['saved','เก็บไว้'],['unread','ยังไม่อ่าน'],['continue','ดูต่อ'],['history','ประวัติ']] as const).map(([v,t])=><button key={v} aria-pressed={filter.collection===v} onClick={()=>updateFilter({collection:v,kind:v==='continue'?'clip':v==='history'||v==='saved'?'all':filter.kind})}>{t}</button>)}</div>
        <div className="journal-result"><h3>{filter.collection==='saved'?'เรื่องที่เก็บไว้':filter.collection==='continue'?'กลับมาดูต่อ':filter.collection==='history'?'อ่านและดูที่ผ่านมา':'ฟีดของคุณ'}</h3><span role="status">{matches.length} เรื่อง · แสดง {Math.min(limit,matches.length)}</span></div>
        {matches.slice(0,limit).map((k,index)=>{const activity=library.data.activity[k.id];return <article className="journal-post" key={k.id}><header><span className={`journal-avatar ${k.topic==='government'?'is-public':''}`}>{k.topic==='government'?'รัฐ':'L'}</span><div><strong>{k.editorial?'LIVERA Journal':k.source}</strong><span>{k.publishedOn?`${formatDate(k.publishedOn,true)} · ${k.kind==='clip'?'คลิป LIVERA':k.editorial?'บทความ LIVERA':'ข่าวต้นทาง'}`:'คู่มือความรู้ · ต้นทางไม่ระบุวันที่'}{k.topic==='government'?' · กิจกรรมที่ผ่านมา':''}</span></div><SaveContent item={k} library={library} onNotice={onNotice}/></header>
          <a href={knowledgeHref(k)} onClick={rememberScroll} className={`journal-cover journal-cover-${k.topic}`} aria-label={`${k.kind==='clip'?'ดูคลิป':'อ่าน'} ${k.title}`}>{k.kind==='clip'?<><img src={mediaAsset(`${k.media}.webp`)} alt="" loading="lazy"/><span className="journal-cover-play"><Play size={26} fill="currentColor"/>{k.duration} วินาที</span></>:k.cover?<img src={`${import.meta.env.BASE_URL}${k.cover.path}`} alt={k.cover.alt} loading={index===0?'eager':'lazy'}/>:<><span className="journal-cover-kicker">{k.topic==='government'?'PUBLIC PERSPECTIVE':'PLAN YOUR NEXT CHAPTER'}</span><strong>{k.topic==='money'?<>แผนที่ชัด<br/>เริ่มจากวันนี้</>:k.topic==='government'?<>เตรียมพร้อม<br/>ทุกด้านของชีวิต</>:<>บทต่อไป<br/>คุณเลือกได้</>}</strong><span className="journal-cover-footer">LIVERA / {topics[k.topic]}<ArrowUpRight size={26}/></span></>}</a>
          {k.cover&&<small className="journal-photo-credit">{k.cover.credit}</small>}
          <div className="journal-post-copy"><div className="content-meta"><Badge variant={k.topic==='government'?'red':'blue'}>{topics[k.topic]}</Badge><span>{k.kind==='clip'?`${k.duration} วินาที`: `อ่าน ${k.minutes} นาที`}</span>{(activity?.read||activity?.completed)&&<span className="content-read"><Check size={14}/>{k.kind==='clip'?'ดูจบแล้ว':'อ่านแล้ว'}</span>}</div><h2><a href={knowledgeHref(k)} onClick={rememberScroll}>{k.title}</a></h2><p>{k.summary}</p></div><footer><a href={knowledgeHref(k)} onClick={rememberScroll}>{k.kind==='clip'?'ดูคลิป':'อ่านต่อ'}<ArrowUpRight size={16}/></a><button onClick={()=>void copy(k)}><Copy size={16}/>คัดลอกลิงก์</button></footer>
        </article>;})}
        {!matches.length&&<div className="journal-empty"><Bookmark size={28}/><h3>ยังไม่มีเรื่องในตัวเลือกนี้</h3><p>เปลี่ยนคำค้นหา ตัวกรอง หรือเก็บเรื่องที่สนใจไว้ก่อน</p><button className="button button-secondary" onClick={()=>updateFilter({query:'',topic:'all',kind:'all',collection:'all'})}>สำรวจทั้งหมด</button></div>}
        {matches.length>limit&&<button className="button button-secondary journal-load" onClick={()=>setLimit(n=>n+3)}>ดูเพิ่มอีก {Math.min(3,matches.length-limit)} เรื่อง<ChevronRight size={17}/></button>}
        <DemoNote>คัดสรร {knowledge.filter(k=>k.kind==='article').length} ข่าว/บทความ และ {clips.length} คลิป · ตรวจต้นทาง {formatDate(checkedOn,true)} · คอลเลกชันทดลอง ไม่ใช่ข่าวสดอัตโนมัติ ประวัติเก็บในเบราว์เซอร์นี้</DemoNote>
      </div><aside className="journal-sidebar"><MobileDisclosure title="ดูคลิปและเครื่องมือแนะนำ"><section className="journal-side-card"><span className="eyebrow">A LITTLE WATCH, A BIGGER PICTURE</span><h3>24 วินาที<br/>มองอนาคตให้ชัดขึ้น</h3><div className="journal-mini-reels">{clips.map(k=><a href={knowledgeHref(k)} key={k.id} onClick={rememberScroll}><img src={mediaAsset(`${k.media}.webp`)} alt="" loading="lazy"/><span><Play size={14}/>{k.title}</span></a>)}</div></section><section className="journal-side-links"><h3>อ่านแล้ว ลองวางแผนต่อ</h3><a href="#/retirement/accumulation">รวมเงินปลายทาง<ArrowUpRight size={17}/></a><a href="#/explore">ที่พักและงบ 5–20 ปี<ArrowUpRight size={17}/></a><a href="#/club/events">กิจกรรม Retirement Club<ArrowUpRight size={17}/></a></section></MobileDisclosure></aside></div>
    </>}
    {copyItem&&<Modal title="คัดลอกลิงก์เนื้อหา" onClose={()=>setCopyItem(null)}><p>เลือกข้อความด้านล่างเพื่อคัดลอก</p><input aria-label="ลิงก์เนื้อหา" readOnly value={`${window.location.origin}${window.location.pathname}${knowledgeHref(copyItem)}`} onFocus={e=>e.target.select()}/></Modal>}
  </section>;
}
