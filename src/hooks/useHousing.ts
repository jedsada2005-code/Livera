import { useCallback, useEffect, useRef, useState } from 'react';
import { commitHousing, loadHousing, resetHousing } from '../data/housingDatabase';
import { emptyHousing } from '../domain/housing';
import type { HousingAction } from '../domain/housing';
const channelName='livera-round8-housing';
function broadcast(){if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel(channelName);c.postMessage('changed');c.close();}}
export function useHousing(){
  const [data,setData]=useState(emptyHousing);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const pending=useRef(0);const tail=useRef<Promise<unknown>>(Promise.resolve());
  const refresh=useCallback(async()=>{try{setData(await loadHousing());setError('');}catch{setError('อ่านหรือเก็บข้อมูลที่พักในเบราว์เซอร์ไม่ได้ ลองโหลดใหม่หรือคืนค่าข้อมูลที่พัก');}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();const c=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(channelName):null;if(c)c.onmessage=()=>void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{c?.close();window.removeEventListener('focus',focus);};},[refresh]);
  const perform=(action?:HousingAction)=>{
    pending.current++;setBusy(true);
    const work=tail.current.catch(()=>undefined).then(async()=>{try{const result=action?await commitHousing(action):await resetHousing();setData(result.data);setError('');broadcast();return result.data;}catch(e){if(e instanceof DOMException)setError('บันทึกข้อมูลที่พักไม่ได้ กรุณาลองโหลดใหม่หรือตรวจพื้นที่จัดเก็บ');throw e;}finally{pending.current--;setBusy(pending.current>0);}});
    tail.current=work;return work;
  };
  return {data,loading,busy,error,refresh,run:(action:HousingAction)=>perform(action),reset:()=>perform()};
}
export type Housing=ReturnType<typeof useHousing>;
