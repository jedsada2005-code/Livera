import { useId, useState } from 'react';
import { ArrowUpRight, Coins, Eye, EyeOff, Target } from 'lucide-react';
import { nvlCurrent, nvlProgress, nvlSeries, nvlTarget } from '../data/overview';
import type { NvlPeriod } from '../data/overview';

function plot(values: number[]) {
  const left=54, right=626, top=26, bottom=205, max=4_000_000;
  const points=values.map((value,index)=>({x:left+(right-left)*index/Math.max(1,values.length-1),y:bottom-(bottom-top)*value/max,value}));
  const line=points.map((p,index)=>`${index?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return { points, line, area:`${line} L ${right} ${bottom} L ${left} ${bottom} Z` };
}

export function NVLOverview({hideAmounts,toggleAmounts,amount,onExplain}:{hideAmounts:boolean;toggleAmounts:()=>void;amount:(value:number)=>string;onExplain:()=>void}){
  const [period,setPeriod]=useState<NvlPeriod>('1y');
  const gradient=useId().replaceAll(':','');
  const data=nvlSeries[period];
  const chart=plot(data.values);
  const remaining=nvlTarget-nvlCurrent;
  const visibleAmount=(value:number)=>hideAmounts?'•••,•••':amount(value);
  return <><section className="overview-life-hero" aria-label="ชีวิตหลังเกษียณ"><img src={`${import.meta.env.BASE_URL}images/retirement-residence.webp`} alt="คู่ผู้สูงอายุพักผ่อนร่วมกันในห้องนั่งเล่นของบ้านพัก" fetchPriority="high"/><div><span>A LIFE WELL PLANNED</span><h2>ชีวิตบทใหม่<br/>เริ่มออกแบบได้วันนี้</h2><i/></div><small>ภาพประกอบจำลองด้วย AI</small></section><section className="nvl-card" aria-labelledby="nvl-heading">
    <header className="nvl-summary">
      <div><span className="nvl-kicker">NVL · เงินสะสมสุทธิ</span><h2 id="nvl-heading">{visibleAmount(nvlCurrent)} <small>บาท</small></h2><p>ยอดตัวอย่างในแผนเกษียณ ณ เดือนพฤศจิกายน 2569</p></div>
      <button className="nvl-privacy" onClick={toggleAmounts}>{hideAmounts?<Eye size={18}/>:<EyeOff size={18}/>}<span>{hideAmounts?'แสดงยอด':'ซ่อนยอด'}</span></button>
    </header>
    <div className="nvl-body">
      <div className="nvl-history">
        <div className="nvl-section-heading"><div><span>เส้นทางเงินสะสม</span><small>ข้อมูลย้อนหลังตัวอย่าง</small></div><div className="nvl-periods" role="group" aria-label="ช่วงเวลากราฟเงินสะสม">{([['6m','6 เดือน'],['1y','1 ปี'],['all','ทั้งหมด']] as const).map(([value,label])=><button key={value} aria-pressed={period===value} onClick={()=>setPeriod(value)}>{label}</button>)}</div></div>
        <svg className="nvl-chart" viewBox="0 0 660 245" role="img" aria-labelledby="nvl-chart-title nvl-chart-desc">
          <title id="nvl-chart-title">กราฟเส้นเงินสะสมสุทธิช่วง {period==='6m'?'6 เดือน':period==='1y'?'1 ปี':'ทั้งหมด'}</title>
          <desc id="nvl-chart-desc">ข้อมูลสาธิตเพิ่มจาก {visibleAmount(data.values[0])} บาท เป็น {visibleAmount(data.values.at(-1) ?? 0)} บาท</desc>
          <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a9c9ed" stopOpacity=".72"/><stop offset="1" stopColor="#dceafb" stopOpacity=".2"/></linearGradient></defs>
          {[26,115.5,205].map((y,index)=><g key={y}><line x1="54" y1={y} x2="626" y2={y} className="nvl-grid-line"/><text x="44" y={y+5} textAnchor="end" className="nvl-axis-label">{hideAmounts?'••':index===0?'4 ล้าน':index===1?'2 ล้าน':'0'}</text></g>)}
          <path d={chart.area} fill={`url(#${gradient})`}/><path d={chart.line} className="nvl-line" pathLength="1"/>
          {chart.points.map((point,index)=><circle key={index} cx={point.x} cy={point.y} r={index===chart.points.length-1?5:3.5} className="nvl-point"><title>{data.labels[index]} {visibleAmount(point.value)} บาท</title></circle>)}
          {data.labels.map((label,index)=>{if(index!==0&&index!==data.labels.length-1&&index!==Math.floor((data.labels.length-1)/2))return null;const x=54+(626-54)*index/Math.max(1,data.labels.length-1);return <text key={label} x={x} y="232" textAnchor={index===0?'start':index===data.labels.length-1?'end':'middle'} className="nvl-axis-label">{label}</text>;})}
          {!hideAmounts&&<g className="nvl-chart-tip" transform={`translate(${Math.max(470,chart.points.at(-1)!.x-128)} ${Math.max(6,chart.points.at(-1)!.y-36)})`}><rect width="128" height="29" rx="7"/><text x="64" y="19" textAnchor="middle">3.20 ล้านบาท</text></g>}
        </svg>
      </div>
      <aside className="nvl-goal" aria-label={`ความคืบหน้า ${nvlProgress} เปอร์เซ็นต์ของเป้าหมาย`}>
        <div className="nvl-goal-title"><Target size={18}/><span>เป้าหมาย</span></div>
        <div className="nvl-goal-layout"><div className="nvl-goal-copy"><strong>{nvlProgress}%</strong><span>ของเป้าหมาย</span></div></div>
        <div className="nvl-progress-mobile" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={nvlProgress} aria-label="ความคืบหน้าเงินสะสม"><span style={{width:`${nvlProgress}%`}}/></div>
        <dl><div><dt>เป้าหมาย</dt><dd>{visibleAmount(nvlTarget)} บาท</dd></div><div><dt>สะสมแล้ว</dt><dd>{visibleAmount(nvlCurrent)} บาท</dd></div><div><dt>ยังต้องเตรียม</dt><dd>{visibleAmount(remaining)} บาท</dd></div></dl>
      </aside>
    </div>
    <button className="nvl-source" onClick={onExplain}>ดูที่มาของยอด NVL<ArrowUpRight size={16}/></button>
    <div className="nvl-actions"><a href="#/retirement/accumulation"><Coins size={20}/><span><strong>เติมข้อมูลเงินสะสม</strong><small>เพิ่มหรือทบทวนแหล่งเงิน</small></span><ArrowUpRight size={18}/></a><a href="#/retirement"><Target size={20}/><span><strong>ดูแผนเกษียณ</strong><small>เป้าหมายและเครื่องคำนวณ</small></span><ArrowUpRight size={18}/></a></div>
  </section></>;
}
