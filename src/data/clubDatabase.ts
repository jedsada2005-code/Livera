import { applyClubAction, createClubSeed, readClubData } from '../domain/community';
import type { ClubAction, ClubData } from '../domain/community';
let opening:Promise<IDBDatabase>|undefined;
function database(){
  if(!opening)opening=new Promise<IDBDatabase>((resolve,reject)=>{
    const r=indexedDB.open('livera-round3-club',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('state');
    r.onerror=()=>{opening=undefined;reject(r.error);};
    r.onblocked=()=>{opening=undefined;reject(new Error('ปิดแท็บ LIVERA อื่นแล้วลองอีกครั้ง'));};
    r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=undefined;};resolve(db);};
  });return opening;
}
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function transaction(action?:ClubAction,reset=false){
  const db=await database();const tx=db.transaction('state','readwrite');
  const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('บันทึกข้อมูลคลับไม่สำเร็จ'));});
  try{
    const store=tx.objectStore('state');const raw=await request(store.get('club'));
    const current=reset||raw===undefined?createClubSeed():readClubData(raw);
    const result=action?applyClubAction(current,action):{data:current,createdId:undefined};
    if(action||reset||raw===undefined)store.put(result.data,'club');
    await done;return result;
  }catch(error){try{tx.abort();}catch{/* Already completed or aborted. */}await done.catch(()=>undefined);throw error;}
}
export async function loadClub():Promise<ClubData>{return (await transaction()).data;}
export const commitClub=(action:ClubAction)=>transaction(action);
export const resetClub=()=>transaction(undefined,true);
