import { applyKnowledgeAction, emptyKnowledge, readKnowledgeData } from '../domain/knowledge';
import type { KnowledgeAction, KnowledgeData } from '../domain/knowledge';
let opening:Promise<IDBDatabase>|undefined;
function database(){
  if(!opening)opening=new Promise<IDBDatabase>((resolve,reject)=>{
    const r=indexedDB.open('livera-round5-knowledge',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');
    r.onerror=()=>{opening=undefined;reject(r.error);};r.onblocked=()=>{opening=undefined;reject(new Error('ปิดแท็บ LIVERA อื่นแล้วลองใหม่'));};
    r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=undefined;};resolve(db);};
  });return opening;
}
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function transaction(action?:KnowledgeAction,reset=false){
  const db=await database();const tx=db.transaction('state','readwrite');
  const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('บันทึกคลังความรู้ไม่สำเร็จ'));});
  try{const store=tx.objectStore('state');const raw=await request(store.get('knowledge'));const current=reset||raw===undefined?emptyKnowledge():readKnowledgeData(raw);const result={data:action?applyKnowledgeAction(current,action):current};if(action||reset||raw===undefined)store.put(result.data,'knowledge');await done;return result;}
  catch(error){try{tx.abort();}catch{/* Already aborted. */}await done.catch(()=>undefined);throw error;}
}
export async function loadKnowledge():Promise<KnowledgeData>{return (await transaction()).data;}
export const commitKnowledge=(action:KnowledgeAction)=>transaction(action);
export const resetKnowledge=()=>transaction(undefined,true);
