import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
const query='(max-width: 760px)';
const subscribe=(changed:()=>void)=>{const media=window.matchMedia(query);media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed);};
const snapshot=()=>window.matchMedia(query).matches;
export function useMobile(){return useSyncExternalStore(subscribe,snapshot,()=>false);}
// Keep children mounted when collapsed, so drafts and selections survive screen changes.
export function MobileDisclosure({title,subtitle,children,defaultOpen=false,forceOpen=false,className=''}:{title:string;subtitle?:string;children:ReactNode;defaultOpen?:boolean;forceOpen?:boolean;className?:string}){
  const mobile=useMobile();const [open,setOpen]=useState(defaultOpen);const id=useId();const expanded=!mobile||open||forceOpen;
  useEffect(()=>{if(forceOpen)setOpen(true);},[forceOpen]);
  return <div className={`mobile-disclosure ${className}`}><button type="button" className="mobile-disclosure-toggle" aria-expanded={expanded} aria-controls={id} onClick={()=>setOpen(!open)}><span><strong>{title}</strong>{subtitle&&<small>{subtitle}</small>}</span><ChevronDown size={18} className={expanded?'expanded':''}/></button><div id={id} className="mobile-disclosure-content" hidden={!expanded}>{children}</div></div>;
}
