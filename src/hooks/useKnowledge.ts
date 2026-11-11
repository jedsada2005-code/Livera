import { useCallback, useEffect, useRef, useState } from 'react';
import { commitKnowledge, loadKnowledge, resetKnowledge } from '../data/knowledgeDatabase';
import { emptyKnowledge } from '../domain/knowledge';
import type { KnowledgeAction } from '../domain/knowledge';
const channelName='livera-round5-knowledge';
function broadcast(){if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel(channelName);c.postMessage('changed');c.close();}}
export function useKnowledge(){
  const [data,setData]=useState(emptyKnowledge);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const pending=useRef(0);const tail=useRef<Promise<unknown>>(Promise.resolve());
  const refresh=useCallback(async()=>{try{setData(await loadKnowledge());setError('');}catch{setError('อ่านหรือเก็บคลังความรู้ในเบราว์เซอร์ไม่ได้ ลองโหลดใหม่หรือคืนค่าคลังความรู้');}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();const c=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(channelName):null;if(c)c.onmessage=()=>void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{c?.close();window.removeEventListener('focus',focus);};},[refresh]);
  const perform=(action?:KnowledgeAction)=>{
    pending.current++;setBusy(true);
    const work=tail.current.catch(()=>undefined).then(async()=>{try{const result=action?await commitKnowledge(action):await resetKnowledge();setData(result.data);setError('');broadcast();}catch(e){setError('บันทึกคลังความรู้ไม่ได้ กรุณาลองโหลดใหม่หรือตรวจพื้นที่จัดเก็บ');throw e;}finally{pending.current--;setBusy(pending.current>0);}});
    tail.current=work;return work;
  };
  return {data,loading,busy,error,refresh,run:(action:KnowledgeAction)=>perform(action),reset:()=>perform()};
}
export type Knowledge=ReturnType<typeof useKnowledge>;
