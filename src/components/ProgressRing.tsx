import type { CSSProperties } from 'react';

export function ProgressRing({ value, large = false, label = 'ความคืบหน้าเบี้ยที่บันทึก' }: { value: number | null; large?: boolean; label?: string }) {
  const percent = Math.max(0, Math.min(100, value ?? 0));
  return <div className={`progress-ring ${large ? 'ring-large' : ''}`} style={{ '--progress': `${percent}%` } as CSSProperties} aria-label={value === null ? 'แผนต่ออายุรายปี ไม่มีจำนวนงวดรวม' : `${label} ${percent.toFixed(1)} เปอร์เซ็นต์`}>
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ring-track" cx="50" cy="50" r="43"/><circle className="ring-fill" cx="50" cy="50" r="43" pathLength="100" strokeDasharray={`${percent} 100`} /></svg>
    <span><strong>{value === null ? 'รายปี' : <>{Number(percent.toFixed(1))}<small>%</small></>}</strong>{large && <em>{value === null ? 'ทบทวนต่ออายุ' : 'เบี้ยที่บันทึก'}</em>}</span>
  </div>;
}
