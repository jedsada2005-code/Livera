import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, ArrowUpRight, Captions, Info, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { Modal } from '../components/ui';
import { knowledge, topics } from '../data/knowledge';
import type { KnowledgeItem } from '../data/knowledge';
import type { Knowledge } from '../hooks/useKnowledge';
import { knowledgeHref } from '../domain/knowledge';
import { clipClock, KnowledgeSource, mediaAsset, SaveContent } from './knowledgeShared';
const clips=knowledge.filter(k=>k.kind==='clip');

function ReelPlayer({item,library,muted,autoPlay,videoRef,onPlaying,onFeedback}:{item:KnowledgeItem;library:Knowledge;muted:boolean;autoPlay:boolean;videoRef:(video:HTMLVideoElement|null)=>void;onPlaying:(playing:boolean)=>void;onFeedback:(text:string)=>void}){
  const ref=useRef<HTMLVideoElement>(null);
  const initial=useRef(library.data.activity[item.id]);
  const started=useRef(false);const last=useRef(initial.current?.position??0);
  const [failure,setFailure]=useState('');
  const persist=useRef((position:number,completed=false)=>{void library.run({type:'progress',id:item.id,position:Math.min(item.duration!,Math.max(0,position)),completed}).catch(()=>onFeedback('เก็บตำแหน่งไม่ได้ ลองหยุดแล้วเล่นอีกครั้ง'));});
  persist.current=(position,completed=false)=>{void library.run({type:'progress',id:item.id,position:Math.min(item.duration!,Math.max(0,position)),completed}).catch(()=>onFeedback('เก็บตำแหน่งไม่ได้ ลองหยุดแล้วเล่นอีกครั้ง'));};
  useEffect(()=>{
    const video=ref.current;videoRef(video);
    const hide=()=>{if(document.hidden)video?.pause();};
    document.addEventListener('visibilitychange',hide);
    return()=>{document.removeEventListener('visibilitychange',hide);if(video){video.pause();if(started.current)persist.current(video.currentTime,video.ended);}videoRef(null);};
    // Each mounted player represents exactly one clip. Persist uses the latest library callback.
  },[]);
  return <div className="reel-video-frame"><video ref={ref} controls playsInline preload="metadata" muted={muted||!item.hasAudio} poster={mediaAsset(`${item.media}.webp`)} aria-label={item.title}
    onLoadedMetadata={event=>{const v=event.currentTarget;const old=initial.current;if(old&&!old.completed&&old.position>0)v.currentTime=Math.min(old.position,item.duration!-.5);if(autoPlay&&!document.hidden)void v.play().catch(()=>onFeedback('แตะปุ่มเล่นเพื่อเริ่มคลิป'));}}
    onPlay={()=>{started.current=true;onPlaying(true);setFailure('');}}
    onPause={e=>{onPlaying(false);if(started.current)persist.current(e.currentTarget.currentTime,e.currentTarget.ended);}}
    onTimeUpdate={e=>{const v=e.currentTarget;if(started.current&&!v.seeking&&Math.abs(v.currentTime-last.current)>=5){last.current=v.currentTime;persist.current(v.currentTime);}}}
    onSeeked={e=>{if(started.current)persist.current(e.currentTarget.currentTime);}}
    onEnded={e=>{onPlaying(false);persist.current(e.currentTarget.currentTime,true);onFeedback('ดูจบแล้ว เลื่อนขึ้นเพื่อเลือกเรื่องถัดไป');}}
    onError={()=>setFailure('เล่นคลิปไม่ได้ อ่านสคริปต์หรือเปิดไฟล์วิดีโอได้ในรายละเอียด')}>
    <source src={mediaAsset(`${item.media}.mp4`)} type="video/mp4"/><track kind="captions" src={mediaAsset(`${item.media}.vtt`)} srcLang="th" label="ภาษาไทย" default/>
    เบราว์เซอร์นี้ไม่รองรับวิดีโอ อ่านสคริปต์ได้ในรายละเอียด
  </video>{failure&&<p role="alert" className="reel-play-error">{failure}</p>}</div>;
}

export function ReelsViewer({initial,library,onNotice,onClose,largeText}:{largeText:boolean;initial:KnowledgeItem;library:Knowledge;onNotice:(text:string)=>void;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);const scroller=useRef<HTMLDivElement>(null);const player=useRef<HTMLVideoElement|null>(null);
  const [active,setActive]=useState(initial.id);const activeRef=useRef(active);
  const [muted,setMuted]=useState(library.data.player.muted);const [autoPlay,setAutoPlay]=useState(library.data.player.autoPlay);
  const [playing,setPlaying]=useState(false);const [info,setInfo]=useState(false);const [feedback,setFeedback]=useState('');const [captions,setCaptions]=useState(true);
  const item=clips.find(k=>k.id===active)!;const index=clips.indexOf(item);
  const announce=(text:string)=>{setFeedback(text);onNotice(text);};
  useLayoutEffect(()=>{
    const d=dialog.current;const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;const overflow=document.body.style.overflow;
    d?.showModal();document.body.style.overflow='hidden';
    const root=scroller.current;if(root)root.scrollTop=clips.indexOf(initial)*root.clientHeight;
    return()=>{player.current?.pause();d?.close();document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  useEffect(()=>{
    const root=scroller.current;if(!root)return;
    const observer=new IntersectionObserver(entries=>{const visible=entries.find(e=>e.isIntersecting&&e.intersectionRatio>=.65);if(visible){const id=(visible.target as HTMLElement).dataset.reelId;if(id&&id!==activeRef.current){player.current?.pause();activeRef.current=id;setActive(id);setPlaying(false);setFeedback('');setCaptions(true);}}},{root,threshold:[.65]});
    root.querySelectorAll('[data-reel-id]').forEach(el=>observer.observe(el));
    const resize=new ResizeObserver(()=>{root.scrollTop=Math.max(0,clips.findIndex(k=>k.id===activeRef.current))*root.clientHeight;});resize.observe(root);
    return()=>{observer.disconnect();resize.disconnect();};
  },[]);
  useEffect(()=>{
    const current=clips.find(k=>k.id===active)!;
    window.history.replaceState(window.history.state,'',knowledgeHref(current));
    void library.run({type:'view',id:active}).catch(()=>setFeedback('เก็บคลิปล่าสุดไม่ได้'));
  },[active]);
  const move=(next:number)=>{const root=scroller.current;if(!root||next<0||next>=clips.length)return;player.current?.pause();root.scrollTo({top:next*root.clientHeight,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
  const openInfo=()=>{player.current?.pause();setInfo(true);};
  const settings=(m:boolean,a:boolean)=>{setMuted(m);setAutoPlay(a);void library.run({type:'player',muted:m,autoPlay:a}).catch(()=>setFeedback('เก็บการตั้งค่าไม่ได้ การตั้งค่านี้ใช้ได้เฉพาะตอนนี้'));};
  const transcript=<><p>{item.summary}</p><p className="reel-format">{topics[item.topic]} · 24 วินาที · {item.hasAudio?'เสียงสังเคราะห์ภาษาไทย':'คลิปข้อความ ไม่มีเสียง'}</p>{item.sections.map(s=><section key={s.title}><h3>{s.title}</h3><p>{s.body}</p></section>)}<a href={item.action.href} className="button button-primary" onClick={()=>player.current?.pause()}>{item.action.label}<ArrowUpRight size={17}/></a><KnowledgeSource item={item}/><a className="text-link" href={mediaAsset(`${item.media}.mp4`)} target="_blank" rel="noopener noreferrer">เปิดไฟล์วิดีโอ<ArrowUpRight size={15}/></a></>;
  const controls=<footer className="reel-footer"><div className="reel-topic">{topics[item.topic]} · {library.data.activity[item.id]?.completed?'ดูจบแล้ว':library.data.activity[item.id]?.position?`ดูถึง ${clipClock(library.data.activity[item.id].position)}`:'24 วินาที'}{!item.hasAudio&&' · ไม่มีเสียง'}</div><h2>{item.title}</h2><div className="reel-controls"><button aria-label={playing?'หยุดคลิปชั่วคราว':'เล่นคลิป'} onClick={()=>{const v=player.current;if(!v)return;if(v.paused){if(v.ended)v.currentTime=0;void v.play().catch(()=>setFeedback('เล่นคลิปไม่ได้ ลองเปิดรายละเอียด'));}else v.pause();}}>{playing?<Pause size={20}/>:<Play size={20}/>}</button><button aria-label={muted?'เปิดเสียง':'ปิดเสียง'} disabled={!item.hasAudio} aria-pressed={!muted&&Boolean(item.hasAudio)} onClick={()=>settings(!muted,autoPlay)}>{muted||!item.hasAudio?<VolumeX size={20}/>:<Volume2 size={20}/>}</button><button aria-label="คำบรรยายภาษาไทย" aria-pressed={captions} onClick={()=>{const v=player.current;if(v)for(const track of Array.from(v.textTracks))track.mode=captions?'hidden':'showing';setCaptions(c=>!c);}}><Captions size={20}/></button><SaveContent item={item} library={library} onNotice={announce}/><button aria-label="รายละเอียดและสคริปต์คลิป" onClick={openInfo}><Info size={21}/></button></div></footer>;
  return createPortal(<><dialog ref={dialog} className={`reels-dialog ${largeText?'reels-large':''}`} aria-labelledby="reels-title" onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{
    if(info||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLVideoElement)return;
    if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();move(index+1);}if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();move(index-1);}
  }}><header className="reels-header"><div><strong id="reels-title">LIVERA <span>Reels</span></strong><small>เลื่อนขึ้น / ลงเพื่อเปลี่ยนคลิป · {index+1} / {clips.length}</small></div><button className="reel-icon" aria-label="ปิด Reels" onClick={onClose}><X size={24}/></button></header>
    <div className="reels-stage"><div className="reels-phone"><div ref={scroller} className="reel-scroll" aria-label="คลิปแนวตั้ง เลื่อนขึ้นลง" tabIndex={0}>{clips.map(k=><article key={k.id} data-reel-id={k.id} className="reel-slide" aria-label={k.title} inert={k.id!==active}>
      {k.id===active?<><ReelPlayer key={k.id} item={k} library={library} muted={muted} autoPlay={autoPlay} videoRef={v=>{player.current=v;}} onPlaying={setPlaying} onFeedback={announce}/></>:<div className="reel-inactive"><img src={mediaAsset(`${k.media}.webp`)} alt="" loading="lazy"/><span>{k.title}</span></div>}
    </article>)}</div>{controls}<div className="reel-bottom"><button aria-label="คลิปก่อนหน้า" disabled={index===0} onClick={()=>move(index-1)}><ArrowUp size={17}/></button><label><input type="checkbox" checked={autoPlay} onChange={e=>settings(muted,e.target.checked)}/>เล่นเมื่อเปลี่ยนคลิป</label><button aria-label="คลิปถัดไป" disabled={index===clips.length-1} onClick={()=>move(index+1)}><ArrowDown size={17}/></button></div><p className="reel-feedback" role="status">{feedback||'ตำแหน่งดูต่อบันทึกเฉพาะเบราว์เซอร์นี้'}</p></div>
      <aside className="reels-desktop-info"><span className="eyebrow">A MOMENT FOR YOUR FUTURE</span><h2>{item.title}</h2><div className="reel-transcript">{transcript}</div><nav className="reels-picker" aria-label="เลือกคลิป">{clips.map((k,i)=><button key={k.id} aria-current={k.id===active?'true':undefined} onClick={()=>move(i)}><span>0{i+1}</span>{k.title}</button>)}</nav></aside>
    </div>
  </dialog>{info&&<Modal title={item.title} onClose={()=>setInfo(false)}><div className={`reel-info-modal ${largeText?'reels-large':''}`}>{transcript}</div></Modal>}</>,document.body);
}
