import { useCallback, useEffect, useRef, useState } from 'react';
import { commitAccumulation, loadAccumulation, resetAccumulation } from '../data/accumulationDatabase';
import { emptyAccumulation } from '../domain/accumulation';
import type { AccumulationAction } from '../domain/accumulation';
const channelName='livera-round9-accumulation';
function broadcast(){if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel(channelName);c.postMessage('changed');c.close();}}
export function useAccumulation(){
  const [data,setData]=useState(emptyAccumulation);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const pending=useRef(0);const tail=useRef<Promise<unknown>>(Promise.resolve());
  const refresh=useCallback(async()=>{try{setData(await loadAccumulation());setError('');}catch{setError('อ่านหรือเก็บแผนรวมเงินในเบราว์เซอร์ไม่ได้ ลองโหลดใหม่หรือคืนค่าแผนรวมเงิน');}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();const c=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(channelName):null;if(c)c.onmessage=()=>void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{c?.close();window.removeEventListener('focus',focus);};},[refresh]);
  const perform=(action?:AccumulationAction)=>{
    pending.current++;setBusy(true);
    const work=tail.current.catch(()=>undefined).then(async()=>{try{const result=action?await commitAccumulation(action):await resetAccumulation();setData(result.data);setError('');broadcast();return result.data;}catch(e){if(e instanceof DOMException)setError('บันทึกแผนรวมเงินไม่ได้ กรุณาลองโหลดใหม่หรือตรวจพื้นที่จัดเก็บ');throw e;}finally{pending.current--;setBusy(pending.current>0);}});
    tail.current=work;return work;
  };
  return {data,loading,busy,error,refresh,run:(action:AccumulationAction)=>perform(action),reset:()=>perform()};
}
export type Accumulation=ReturnType<typeof useAccumulation>;
