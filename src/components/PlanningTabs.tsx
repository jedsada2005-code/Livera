import { Compass, Layers3, Target } from 'lucide-react';
export function PlanningTabs({current}:{current:'accumulation'|'future'|'goal'|'calculator'}){
  return <nav className="planner-nav round6-planner-nav" aria-label="เลือกเครื่องมือวางแผน">
    <a href="#/retirement/accumulation" className={(current==='future'||current==='accumulation')?'selected':''} aria-current={(current==='future'||current==='accumulation')?'page':undefined}><Layers3 size={19}/><span>เงินปลายทาง<small>รวมข้อมูลหลายแหล่ง</small></span></a>
    <a href="#/retirement/goal" className={current==='goal'?'selected':''} aria-current={current==='goal'?'page':undefined}><Target size={19}/><span>ออมจ่ายเบี้ย<small>เป้าหมายงวดถัดไป</small></span></a>
    <a href="#/retirement/calculator" className={current==='calculator'?'selected':''} aria-current={current==='calculator'?'page':undefined}><Compass size={19}/><span>งบเกษียณ<small>เครื่องคำนวณเดิม</small></span></a>
  </nav>;
}
