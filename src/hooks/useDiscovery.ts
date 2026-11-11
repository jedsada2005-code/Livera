import { useCallback, useEffect, useRef, useState } from 'react';
import { commitDiscovery, loadDiscovery, resetDiscovery } from '../data/discoveryDatabase';
import { emptyDiscovery } from '../domain/discovery';
import type { DiscoveryAction } from '../domain/discovery';
const channelName='livera-round7-discovery';
function broadcast(){if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel(channelName);c.postMessage('changed');c.close();}}
export function useDiscovery(){
  const [data,setData]=useState(emptyDiscovery);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const pending=useRef(0);const tail=useRef<Promise<unknown>>(Promise.resolve());
  const refresh=useCallback(async()=>{try{setData(await loadDiscovery());setError('');}catch{setError('อ่านหรือเก็บรายการค้นหาแผนในเบราว์เซอร์ไม่ได้ ลองโหลดใหม่หรือคืนค่ารายการค้นหาแผน');}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();const c=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(channelName):null;if(c)c.onmessage=()=>void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{c?.close();window.removeEventListener('focus',focus);};},[refresh]);
  const perform=(action?:DiscoveryAction)=>{
    pending.current++;setBusy(true);
    const work=tail.current.catch(()=>undefined).then(async()=>{try{const result=action?await commitDiscovery(action):await resetDiscovery();setData(result.data);setError('');broadcast();}catch(e){if(e instanceof DOMException)setError('บันทึกรายการค้นหาแผนไม่ได้ กรุณาลองโหลดใหม่หรือตรวจพื้นที่จัดเก็บ');throw e;}finally{pending.current--;setBusy(pending.current>0);}});
    tail.current=work;return work;
  };
  return {data,loading,busy,error,refresh,run:(action:DiscoveryAction)=>perform(action),reset:()=>perform()};
}
export type Discovery=ReturnType<typeof useDiscovery>;
