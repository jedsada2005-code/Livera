import { useEffect, useState } from 'react';
import { calculateRetirement } from '../domain/planning';
import type { RetirementInput } from '../domain/planning';
import { isValidDate } from '../domain/ledger';
import type { Policy } from '../data/demo';
export type SavedGoal = {policyId:Policy['id']; period:number; reservedSatang:number; targetSatang:number; updatedAt:string};
export type PlanningData = {version:1; goals:SavedGoal[]; retirement?:{input:RetirementInput; updatedAt:string}};
export const planningKey = 'livera:round2:planning';
const empty: PlanningData = {version:1,goals:[]};
function decode(raw:string|null):PlanningData {
  if (!raw) return empty;
  const data=JSON.parse(raw);
  if(data.version!==1 || !Array.isArray(data.goals))throw new Error('รูปแบบแผนไม่รองรับ');
  for(const goal of data.goals) {
    if(!['saving','pension','health'].includes(goal.policyId)||!Number.isInteger(goal.period)||goal.period<0||
      !Number.isSafeInteger(goal.reservedSatang)||goal.reservedSatang<0||goal.reservedSatang>10000000000||
      !Number.isSafeInteger(goal.targetSatang)||goal.targetSatang<0||!isValidDate(goal.updatedAt?.slice(0,10)))throw new Error('ข้อมูล Goal ไม่ถูกต้อง');
  }
  if(data.retirement){calculateRetirement(data.retirement.input); if(!isValidDate(data.retirement.updatedAt?.slice(0,10)))throw new Error('วันที่แผนไม่ถูกต้อง');}
  return data;
}
export function usePlanning() {
  const [data,setData]=useState<PlanningData>(()=>{try{return decode(localStorage.getItem(planningKey));}catch{return empty;}});
  const [error,setError]=useState('');
  const reload=()=>{try{setData(decode(localStorage.getItem(planningKey)));setError('');}catch{setError('อ่านแผนที่บันทึกไม่ได้ สามารถคำนวณได้ แต่ยังบันทึกทับข้อมูลเดิมไม่ได้');}};
  useEffect(()=>{reload(); const handler=(event:StorageEvent)=>{if(event.key===planningKey||event.key===null)reload();};window.addEventListener('storage',handler);return()=>window.removeEventListener('storage',handler);},[]);
  function write(update:(current:PlanningData)=>PlanningData){
    try{const next=update(decode(localStorage.getItem(planningKey)));localStorage.setItem(planningKey,JSON.stringify(next));setData(next);setError('');return true;}
    catch{setError('บันทึกแผนไม่สำเร็จ ข้อมูลบนหน้านี้ยังคำนวณได้ กรุณาตรวจพื้นที่จัดเก็บของเบราว์เซอร์');return false;}
  }
  return {data,error,
    reset:()=>{try{localStorage.removeItem(planningKey);setData(empty);setError('');return true;}catch{setError('ล้างแผนไม่สำเร็จ กรุณาลองใหม่');return false;}},
    saveGoal:(goal:SavedGoal)=>write(current=>({...current,goals:[...current.goals.filter(item=>!(item.policyId===goal.policyId&&item.period===goal.period)),goal]})),
    saveRetirement:(input:RetirementInput)=>write(current=>({...current,retirement:{input,updatedAt:new Date().toISOString()}})),
  };
}
export type Planning = ReturnType<typeof usePlanning>;
