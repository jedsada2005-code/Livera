import { useState } from 'react';
import { ArrowUpRight, Building2 } from 'lucide-react';
import { estimateHousing, housingMatchesTarget, housingModels } from '../domain/housing';
import { findHousingPlace } from '../data/housingCatalog';
import type { Journey } from '../hooks/useJourney';
const money = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });
export function HousingBudgetSummary({ journey, onNotice }: { journey: Journey; onNotice: (s: string) => void }) {
  const [error, setError] = useState('');
  const budget = journey.data.housingBudget;
  if (!budget) return <a className="round6-inline-destination" href="#/explore"><Building2 size={21}/><span><strong>เตรียมงบที่พัก 5–20 ปี</strong><small>สำรวจสถานที่และลองคำนวณจากงบของคุณ</small></span><ArrowUpRight size={18}/></a>;
  const p = budget.plan;
  const result = estimateHousing(p);
  const matches = housingMatchesTarget(budget, journey.data);
  return <section className="panel housing-journey-budget"><div className="housing-section-heading"><h3>งบที่พักในแผนนี้</h3><span className="housing-assumption">สมมติฐานที่คุณระบุ</span></div><h4>{findHousingPlace(p.residenceId)?.name}</h4><p>{housingModels[p.model]} · {p.startYear+543}–{p.startYear+p.years-1+543} · {p.years} ปี · {p.occupants} คน</p>{!matches && <p className="housing-warning">เป้าหมายที่พัก ระยะเวลา หรือจำนวนผู้พักเปลี่ยนแล้ว งบนี้ยังเป็นฉบับเดิม กรุณาปรับและนำเข้ามาใหม่</p>}<dl className="housing-summary-stats"><div><dt>{result.outlaySatang === null ? 'รวมเฉพาะรายการที่ระบุ' : 'งบจ่ายไม่รวมเงินประกัน'}</dt><dd>{result.knownOutlaySatang === null ? 'รอข้อมูล' : `${money.format(result.knownOutlaySatang/100)} บาท`}</dd></div><div><dt>เงินประกันคืนได้ แยกต่างหาก</dt><dd>{p.depositSatang === null ? 'ยังไม่ระบุ' : `${money.format(p.depositSatang/100)} บาท`}</dd></div></dl><p className="housing-note">{result.status === 'complete' ? 'ข้อมูลครบตามแบบจำลอง' : `ยังขาด: ${result.missing.join(' · ')}`} · ยังไม่ใช่ราคาจากโครงการหรือผลคำนวณเงินที่คุณมี</p><div className="housing-inline-actions"><a className="text-link" href={`#/explore/housing/${p.residenceId}/budget`}>ปรับงบที่พัก<ArrowUpRight size={15}/></a><button className="text-link" disabled={journey.busy || !!journey.error} onClick={async () => { try { await journey.run({type:'housing-budget',budget:null});setError('');onNotice('นำงบออกจากแผนปลายทางแล้ว งบที่บันทึกในเมนูที่พักยังอยู่'); } catch(e) { setError(e instanceof Error ? e.message : 'นำงบออกไม่สำเร็จ'); } }}>นำงบออกจากแผนนี้</button></div>{error && <p className="form-error" role="alert">{error}</p>}</section>;
}
