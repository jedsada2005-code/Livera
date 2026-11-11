import { useCallback, useEffect, useRef, useState } from 'react';
import { commitClub, loadClub, resetClub } from '../data/clubDatabase';
import { createClubSeed } from '../domain/community';
import type { ClubAction } from '../domain/community';
const channelName='livera-round3-club';
const broadcast=()=>{if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel(channelName);c.postMessage('changed');c.close();}};
export function useClub(){
  const [data,setData]=useState(createClubSeed);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
  const refresh=useCallback(async()=>{try{setData(await loadClub());setError('');}catch{setError('อ่านหรือเก็บข้อมูลคลับไม่ได้ ขณะนี้แสดงข้อมูลสาธิต กรุณาลองโหลดใหม่ หรือคืนค่าข้อมูลคลับ');}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();const c=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(channelName):null;if(c)c.onmessage=()=>void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{c?.close();window.removeEventListener('focus',focus);};},[refresh]);
  const perform=async(action?:ClubAction)=>{
    if(lock.current)throw new Error('กำลังบันทึกรายการ กรุณารอสักครู่');
    lock.current=true;setBusy(true);
    try{const result=action?await commitClub(action):await resetClub();setData(result.data);setError('');if(!action){try{Object.keys(sessionStorage).filter(key=>key.startsWith('livera:round3:draft:')).forEach(key=>sessionStorage.removeItem(key));}catch{/* Optional drafts. */}}broadcast();return result.createdId;}
    catch(e){if(e instanceof DOMException)setError('บันทึกข้อมูลคลับไม่ได้ กรุณาตรวจพื้นที่จัดเก็บแล้วลองอีกครั้ง');throw e;}
    finally{lock.current=false;setBusy(false);}
  };
  return {data,loading,busy,error,refresh,run:(action:ClubAction)=>perform(action),reset:()=>perform()};
}
export type Club=ReturnType<typeof useClub>;
