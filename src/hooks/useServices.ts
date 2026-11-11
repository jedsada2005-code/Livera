import { useCallback, useEffect, useRef, useState } from 'react';
import { commitService, loadServices, resetServices } from '../data/serviceDatabase';
import { emptyServices } from '../domain/services';
import type { ServiceAction } from '../domain/services';
const channelName='livera-round4-services';
function broadcast(){if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel(channelName);c.postMessage('changed');c.close();}}
export function useServices(){
  const [data,setData]=useState(emptyServices);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
  const refresh=useCallback(async()=>{try{setData(await loadServices());setError('');}catch{setError('อ่านหรือเก็บคำขอในเบราว์เซอร์ไม่ได้ ลองโหลดใหม่หรือคืนค่าข้อมูลบริการ');}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();const c=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(channelName):null;if(c)c.onmessage=()=>void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{c?.close();window.removeEventListener('focus',focus);};},[refresh]);
  const perform=async(action?:ServiceAction)=>{if(lock.current)throw new Error('กำลังบันทึก กรุณารอสักครู่');lock.current=true;setBusy(true);try{const result=action?await commitService(action):await resetServices();setData(result.data);setError('');broadcast();return result.createdId;}catch(e){if(e instanceof DOMException)setError('บันทึกไม่ได้ กรุณาตรวจพื้นที่จัดเก็บของเบราว์เซอร์');throw e;}finally{lock.current=false;setBusy(false);}};
  return {data,loading,busy,error,refresh,run:(action:ServiceAction)=>perform(action),reset:()=>perform()};
}
export type Services=ReturnType<typeof useServices>;
