import { applyAccumulation, emptyAccumulation, readAccumulation } from '../domain/accumulation';
import type { AccumulationAction, AccumulationState } from '../domain/accumulation';
let opening:Promise<IDBDatabase>|undefined;
function database(){
  if(!opening)opening=new Promise<IDBDatabase>((resolve,reject)=>{
    const r=indexedDB.open('livera-round9-accumulation',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');
    r.onerror=()=>{opening=undefined;reject(r.error);};r.onblocked=()=>{opening=undefined;reject(new Error('ปิดแท็บ LIVERA อื่นแล้วลองใหม่'));};
    r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=undefined;};resolve(db);};
  });return opening;
}
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function transaction(action?:AccumulationAction,reset=false){
  const db=await database();const tx=db.transaction('state','readwrite');
  const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('บันทึกแผนรวมเงินไม่สำเร็จ'));});
  try{const store=tx.objectStore('state');const raw=await request(store.get('accumulation'));const current=reset||raw===undefined?emptyAccumulation():readAccumulation(raw);const result={data:action?applyAccumulation(current,action):current};if(action||reset||raw===undefined)store.put(result.data,'accumulation');await done;return result;}
  catch(error){try{tx.abort();}catch{/* Already aborted. */}await done.catch(()=>undefined);throw error;}
}
export async function loadAccumulation():Promise<AccumulationState>{return (await transaction()).data;}
export const commitAccumulation=(action:AccumulationAction)=>transaction(action);
export const resetAccumulation=()=>transaction(undefined,true);
