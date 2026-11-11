import { useCallback, useEffect, useRef, useState } from 'react';
import { commitJourney, loadJourney, resetJourney } from '../data/journeyDatabase';
import { emptyJourney } from '../domain/journey';
import type { JourneyAction } from '../domain/journey';
const channelName='livera-round6-journey';
function broadcast(){if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel(channelName);c.postMessage('changed');c.close();}}
export function useJourney(){
  const [data,setData]=useState(emptyJourney);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const pending=useRef(0);const tail=useRef<Promise<unknown>>(Promise.resolve());
  const refresh=useCallback(async()=>{try{setData(await loadJourney());setError('');}catch{setError('อ่านหรือเก็บเส้นทางวางแผนในเบราว์เซอร์ไม่ได้ ลองโหลดใหม่หรือคืนค่าเส้นทางวางแผน');}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();const c=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(channelName):null;if(c)c.onmessage=()=>void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{c?.close();window.removeEventListener('focus',focus);};},[refresh]);
  const perform=(action?:JourneyAction)=>{
    pending.current++;setBusy(true);
    const work=tail.current.catch(()=>undefined).then(async()=>{try{const result=action?await commitJourney(action):await resetJourney();setData(result.data);setError('');broadcast();}catch(e){if(e instanceof DOMException)setError('บันทึกเส้นทางวางแผนไม่ได้ กรุณาลองโหลดใหม่หรือตรวจพื้นที่จัดเก็บ');throw e;}finally{pending.current--;setBusy(pending.current>0);}});
    tail.current=work;return work;
  };
  return {data,loading,busy,error,refresh,run:(action:JourneyAction)=>perform(action),reset:()=>perform()};
}
export type Journey=ReturnType<typeof useJourney>;
