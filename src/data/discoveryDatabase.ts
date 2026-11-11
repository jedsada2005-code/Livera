import { applyDiscovery, emptyDiscovery, readDiscovery } from '../domain/discovery';
import type { DiscoveryAction, DiscoveryState } from '../domain/discovery';
let opening:Promise<IDBDatabase>|undefined;
function database(){
  if(!opening)opening=new Promise<IDBDatabase>((resolve,reject)=>{
    const r=indexedDB.open('livera-round7-discovery',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');
    r.onerror=()=>{opening=undefined;reject(r.error);};r.onblocked=()=>{opening=undefined;reject(new Error('ปิดแท็บ LIVERA อื่นแล้วลองใหม่'));};
    r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=undefined;};resolve(db);};
  });return opening;
}
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function transaction(action?:DiscoveryAction,reset=false){
  const db=await database();const tx=db.transaction('state','readwrite');
  const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('บันทึกรายการค้นหาแผนไม่สำเร็จ'));});
  try{const store=tx.objectStore('state');const raw=await request(store.get('discovery'));const current=reset||raw===undefined?emptyDiscovery():readDiscovery(raw);const result={data:action?applyDiscovery(current,action):current};if(action||reset||raw===undefined)store.put(result.data,'discovery');await done;return result;}
  catch(error){try{tx.abort();}catch{/* Already aborted. */}await done.catch(()=>undefined);throw error;}
}
export async function loadDiscovery():Promise<DiscoveryState>{return (await transaction()).data;}
export const commitDiscovery=(action:DiscoveryAction)=>transaction(action);
export const resetDiscovery=()=>transaction(undefined,true);
