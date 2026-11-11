import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, Download, FileText, Heart, Image as ImageIcon, LoaderCircle, Paperclip, Plus, Search, ShieldCheck, Trash2, Wallet, X } from 'lucide-react';
import { Badge, DemoNote, Modal } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { formatDate, statusLabels } from '../domain/ledger';
import type { Payment, PolicySummary, PaymentStatus } from '../domain/ledger';
import type { Ledger } from '../hooks/useLedger';
import type { Policy } from '../data/demo';
import { loadAttachment } from '../data/database';

type Props = { ledger: Ledger; amount: (value: number) => string; onPayment: (id: Policy['id']) => void; onNotice: (message: string) => void };

export function PolicyCards({ ledger, amount, onPayment }: Props) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const list = ledger.policies.filter(policy => (filter === 'all' || policy.id === filter) && `${policy.name} ${policy.english} ${policy.number}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <>
    <div className="policy-page-toolbar"><div className="filter-chips" role="group" aria-label="กรองประเภทกรมธรรม์">{[{ id: 'all', text: 'ทุกแผน' }, { id: 'saving', text: 'สะสมทรัพย์' }, { id: 'pension', text: 'บำนาญ' }, { id: 'health', text: 'สุขภาพ' }].map(item => <button className={`filter-chip ${filter === item.id ? 'selected' : ''}`} key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.text}</button>)}</div><label className="search-field"><Search size={17}/><input aria-label="ค้นหากรมธรรม์" value={query} placeholder="ค้นหาชื่อหรือเลขกรมธรรม์" onChange={event => setQuery(event.target.value)}/>{query && <button aria-label="ล้างคำค้น" onClick={() => setQuery('')}><X size={15}/></button>}</label></div>
    <div className="policy-cards round1-policy-cards">{list.map((policy, index) => <article className={`panel policy-interactive policy-theme-${policy.id}`} key={policy.id} style={{ animationDelay: `${index * 60}ms` }}>
      <div className="policy-card-kicker"><Badge>{policy.type}</Badge><span>{policy.number}</span></div>
      <div className="policy-title-row"><div><span className="eyebrow">{policy.english}</span><h2>{policy.name}</h2></div><ProgressRing value={policy.totalPeriods ? policy.progress : null}/></div>
      <p className="policy-description">{policy.description}</p>
      <div className="policy-main-value">{amount(policy.premium)} <small>บาท / {policy.frequency}</small></div>
      <div className="policy-mini-stats"><div><span>เบี้ยที่บันทึกแล้ว</span><strong>{amount(policy.paid)}</strong></div><div><span>งวดที่บันทึกครบ</span><strong>{policy.paidPeriods}{policy.totalPeriods ? ` / ${policy.totalPeriods}` : ''}<small> งวด</small></strong></div></div>
      <div className="progress-track"><span style={{ width: `${policy.progress}%` }}/></div>
      <div className="policy-next-row"><CalendarDays size={16}/><span>{policy.nextDue}</span>{policy.pending > 0 && <Badge variant="soft">รอตรวจ {policy.pending}</Badge>}</div>
      <div className="policy-card-actions"><a className="button button-secondary" href={`#/policies/${policy.id}`}>ดูรายละเอียด<ArrowUpRight size={17}/></a><button className="button button-primary" onClick={() => onPayment(policy.id)} disabled={ledger.loading || Boolean(ledger.error) || policy.nextPeriod === null}><Plus size={17}/>บันทึกเบี้ย</button></div>
    </article>)}</div>
    {list.length === 0 && <div className="empty-state panel"><Search size={30}/><h3>ยังไม่พบแผนที่ค้นหา</h3><p>ลองเปลี่ยนคำค้นหรือเลือกทุกแผน</p><button className="button button-secondary" onClick={() => { setQuery(''); setFilter('all'); }}>แสดงทุกกรมธรรม์</button></div>}
    <DemoNote>ความคืบหน้าคิดจากเบี้ยที่บันทึก ไม่ใช่คะแนนความพร้อมเกษียณ และยังไม่ยืนยันจากบริษัทประกัน</DemoNote>
  </>;
}

function PaymentHistory({ policy, ledger, amount, onNotice }: Props & { policy: PolicySummary }) {
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [limit, setLimit] = useState(5);
  const [view, setView] = useState<{ kind: 'detail' | 'void' | 'proof'; entry: Payment; url?: string }>();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const urlRef = useRef('');
  const all = useMemo(() => ledger.entries.filter(entry => entry.policyId === policy.id).sort((a, b) => b.paidDate.localeCompare(a.paidDate) || b.createdAt.localeCompare(a.createdAt)), [ledger.entries, policy.id]);
  const filtered = all.filter(entry => filter === 'all' || entry.status === filter);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  function close() { if (busy) return; setView(undefined); setReason(''); setError(''); if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = ''; }
  async function proof(entry: Payment) {
    if (!entry.attachment) return;
    setBusy(true); setError('');
    try {
      const blob = await loadAttachment(entry.attachment.id);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob); setView({ kind: 'proof', entry, url: urlRef.current });
    } catch (err) { onNotice(err instanceof Error ? err.message : 'เปิดไฟล์ไม่ได้'); }
    finally { setBusy(false); }
  }
  async function cancel() {
    if (!view || busy) return;
    setBusy(true); setError('');
    try { await ledger.cancel(view.entry.id, reason); setView(undefined); setReason(''); onNotice('ยกเลิกบันทึกแล้ว ยอดและประวัติอัปเดตเรียบร้อย'); }
    catch (err) { setError(err instanceof Error ? err.message : 'ยกเลิกไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  return <section className="history-panel" aria-labelledby="history-heading">
    <div className="history-heading"><div><h3 id="history-heading">ทุกก้าวที่บันทึกไว้</h3><p>ประวัติการชำระและสถานะหลักฐานของแผนนี้</p></div><span>{all.length} รายการ</span></div>
    <div className="history-filters" role="group" aria-label="กรองสถานะรายการ">{(['all', 'recorded', 'pending', 'voided'] as const).map(value => <button className={filter === value ? 'selected' : ''} aria-pressed={filter === value} onClick={() => { setFilter(value); setLimit(5); }} key={value}>{value === 'all' ? 'ทั้งหมด' : statusLabels[value]}{value === 'pending' && policy.pending > 0 ? ` (${policy.pending})` : ''}</button>)}</div>
    <div className="history-list">{filtered.slice(0, limit).map(entry => <article className={`history-row ${entry.status === 'voided' ? 'is-void' : ''} ${entry.source === 'member' ? 'is-member' : ''}`} key={entry.id}>
      <span className={`history-entry-icon ${entry.status === 'voided' ? 'void-icon' : ''}`}>{entry.status === 'voided' ? <X size={19}/> : <Wallet size={19}/>}</span>
      <button className="history-open" onClick={() => { setError(''); setView({ kind: 'detail', entry }); }}><strong>{formatDate(entry.paidDate)}</strong><span>งวด {entry.period + 1} · กำหนด {formatDate(entry.dueDate)}</span><small>{entry.source === 'seed' ? 'รายการตั้งต้นสาธิต' : entry.reference || 'บันทึกโดยคุณ'}</small></button>
      <div className="history-money"><strong>{amount(entry.satang / 100)} <small>บาท</small></strong><Badge variant={entry.status === 'pending' ? 'soft' : 'neutral'}>{statusLabels[entry.status]}</Badge></div>
      <div className="history-actions">{entry.attachment && <button className="icon-button" aria-label={`ดูหลักฐานงวด ${entry.period + 1}`} disabled={busy} onClick={() => void proof(entry)}><Paperclip size={17}/></button>}<button className="icon-button" aria-label={`ดูรายการงวด ${entry.period + 1} วันที่ ${formatDate(entry.paidDate)}`} onClick={() => setView({ kind: 'detail', entry })}><ArrowUpRight size={17}/></button></div>
    </article>)}</div>
    {filtered.length === 0 && <div className="empty-state"><FileText size={27}/><h3>ยังไม่มีรายการในสถานะนี้</h3><p>รายการใหม่จะแสดงที่นี่หลังบันทึก</p></div>}
    {filtered.length > limit && <button className="history-more" onClick={() => setLimit(value => value + 5)}>แสดงประวัติเพิ่มเติม<ChevronDown size={16}/></button>}
    {view && <Modal title={view.kind === 'void' ? 'ยกเลิกบันทึกการชำระ' : view.kind === 'proof' ? 'หลักฐานที่แนบไว้' : 'รายละเอียดรายการ'} eyebrow="LIVERA · PAYMENT RECORD" onClose={close}>
      {view.kind === 'detail' && <><div className="review-amount">{amount(view.entry.satang / 100)} <small>บาท</small></div><Badge variant={view.entry.status === 'pending' ? 'soft' : 'blue'}>{statusLabels[view.entry.status]}</Badge><div className="detail-rows"><div><span>กรมธรรม์</span><strong>{policy.name}</strong></div><div><span>วันที่ชำระ</span><strong>{formatDate(view.entry.paidDate)}</strong></div><div><span>งวด / กำหนดจ่าย</span><strong>{view.entry.period + 1} · {formatDate(view.entry.dueDate)}</strong></div><div><span>เลขอ้างอิง</span><strong>{view.entry.reference || 'ไม่ได้ระบุ'}</strong></div><div><span>หมายเหตุ</span><strong>{view.entry.note || 'ไม่ได้ระบุ'}</strong></div><div><span>หลักฐาน</span><strong>{view.entry.attachment?.name || 'ยังไม่แนบ'}</strong></div>{view.entry.voidReason && <><div><span>เหตุผลที่ยกเลิก</span><strong>{view.entry.voidReason}</strong></div><div><span>บันทึกการยกเลิก</span><strong>{view.entry.voidedAt ? formatDate(view.entry.voidedAt.slice(0, 10)) : ''}</strong></div></>}</div><DemoNote>สถานะนี้ยังไม่ใช่การยืนยันรับเงินจากบริษัทประกัน</DemoNote><div className="record-detail-actions">{view.entry.attachment && <button className="button button-secondary" onClick={() => void proof(view.entry)} disabled={busy}><Paperclip size={17}/>ดูหลักฐาน</button>}{view.entry.source === 'member' && view.entry.status !== 'voided' && <button className="button button-danger" onClick={() => { setView({ kind: 'void', entry: view.entry }); setReason(''); }}><Trash2 size={16}/>ยกเลิกบันทึกนี้</button>}</div></>}
      {view.kind === 'proof' && <><p className="proof-name">{view.entry.attachment?.name}</p>{view.entry.attachment?.type.startsWith('image/') ? <img className="proof-image" src={view.url} alt="หลักฐานตัวอย่างที่แนบกับรายการ"/> : <div className="pdf-cover"><FileText size={48}/><h3>ไฟล์หลักฐาน PDF</h3><p>ดาวน์โหลดเพื่อเปิดด้วยโปรแกรมอ่าน PDF</p></div>}<a className="button button-secondary" href={view.url} download={view.entry.attachment?.name}><Download size={16}/>ดาวน์โหลดหลักฐาน</a><DemoNote>ไฟล์อยู่ในเบราว์เซอร์นี้เท่านั้น การแสดงไฟล์ไม่ได้ยืนยันการรับเงิน</DemoNote></>}
      {view.kind === 'void' && <><p className="feature-body">ยกเลิกบันทึก {amount(view.entry.satang / 100)} บาท ของงวด {view.entry.period + 1} ยอดจะถูกคำนวณใหม่ และยังเก็บรายการพร้อมเหตุผลไว้ในประวัติ นี่ไม่ใช่การคืนเงินหรือยกเลิกกรมธรรม์</p><label className="form-field">เหตุผลการยกเลิก<textarea rows={3} minLength={3} maxLength={160} value={reason} onChange={event => setReason(event.target.value)} placeholder="เช่น บันทึกจำนวนเงินผิด ต้องการเพิ่มรายการใหม่"/></label>{error && <p role="alert" className="form-error">{error}</p>}<div className="flow-actions"><button className="button button-secondary" disabled={busy} onClick={() => setView({ kind: 'detail', entry: view.entry })}>กลับไปตรวจรายการ</button><button className="button button-danger" disabled={busy} onClick={() => void cancel()}>{busy ? <LoaderCircle size={17} className="spin"/> : <Trash2 size={17}/>}ยืนยันยกเลิกบันทึก</button></div></>}
    </Modal>}
  </section>;
}

export function PolicyDetails({ policy, ...props }: Props & { policy: PolicySummary }) {
  const { ledger, amount, onPayment } = props;
  const [tab, setTab] = useState('overview');
  const tabs = [{ id: 'overview', title: 'ภาพรวม' }, { id: 'coverage', title: 'ความคุ้มครอง' }, { id: 'history', title: 'ประวัติชำระ' }, { id: 'documents', title: 'เอกสาร' }];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className="policy-detail-page">
    <a href="#/policies" className="back-link"><ArrowLeft size={17}/>กลับไปกรมธรรม์ทั้งหมด</a>
    <section className={`policy-detail-hero policy-theme-${policy.id}`}><div><Badge variant="blue">ข้อมูลกรมธรรม์ตัวอย่าง</Badge><span className="eyebrow">{policy.english}</span><h2>{policy.name}</h2><p>{policy.number}</p><span className="policy-snapshot-note">ความคืบหน้าตามบันทึกของคุณ</span></div><ProgressRing value={policy.totalPeriods ? policy.progress : null} large/></section>
    <nav className="policy-tabs" role="tablist" aria-label="รายละเอียดกรมธรรม์">{tabs.map((item, index) => <button key={item.id} ref={element => { tabRefs.current[index] = element; }} role="tab" id={`tab-${item.id}`} aria-controls="policy-tabpanel" aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)} onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; setTab(tabs[next].id); tabRefs.current[next]?.focus(); }}>{item.title}{item.id === 'history' && policy.pending > 0 && <span className="tab-counter">{policy.pending}</span>}</button>)}</nav>
    <div role="tabpanel" id="policy-tabpanel" aria-labelledby={`tab-${tab}`} className="policy-tab-content" key={tab}>
      {tab === 'overview' && <>
        <div className="detail-summary-grid"><div><span>เบี้ยที่บันทึกแล้ว</span><strong>{amount(policy.paid)}<small> บาท</small></strong></div><div><span>เบี้ยตามแผนที่เหลือ</span><strong>{policy.remaining === null ? 'ทบทวนรายปี' : amount(policy.remaining)}<small>{policy.remaining === null ? '' : ' บาท'}</small></strong></div><div><span>งวดที่บันทึกครบ</span><strong>{policy.paidPeriods}<small>{policy.totalPeriods ? ` / ${policy.totalPeriods}` : ''} งวด</small></strong></div></div>
        <div className="detail-overview-grid"><section className="panel next-installment"><span className="item-icon icon-red"><CalendarDays size={22}/></span><div><span className="eyebrow">NEXT PAYMENT</span><h3>{policy.nextDueISO ? policy.nextDue : policy.nextDue}</h3><p>{policy.nextPeriod !== null ? `งวดที่ ${policy.nextPeriod + 1} · ยอดที่ยังไม่มีบันทึกครบ` : 'ยังไม่มีงวดที่เปิดให้บันทึกเพิ่มเติม'}</p></div><div className="installment-value">{policy.nextPeriod !== null ? amount(Math.max(0, policy.premium - ledger.entries.filter(entry => entry.policyId === policy.id && entry.period === policy.nextPeriod && entry.status !== 'voided').reduce((sum, entry) => sum + entry.satang, 0) / 100)) : '—'}<small>บาท</small></div><button className="button button-primary" onClick={() => onPayment(policy.id)} disabled={ledger.loading || Boolean(ledger.error) || policy.nextPeriod === null}><Plus size={17}/>บันทึกการชำระ</button></section>
        <section className="panel contract-milestones"><h3>คนละหมุดหมาย ในแผนเดียวกัน</h3><div><span className="milestone-dot"/><p><small>ชำระเบี้ยครบ</small><strong>{policy.premiumEnd}</strong></p></div><div><span className="milestone-dot end"/><p><small>ครบสัญญา / รับผลประโยชน์</small><strong>{policy.maturity}</strong></p></div></section></div>
        <DemoNote>เบี้ยที่บันทึกแล้วไม่ใช่มูลค่าเวนคืนหรือเงินเกษียณที่ถอนได้ ความคืบหน้าไม่ใช่สถานะรับเงินจากบริษัทประกัน</DemoNote>
        <PaymentHistory policy={policy} {...props}/>
      </>}
      {tab === 'history' && <PaymentHistory policy={policy} {...props}/>}
      {tab === 'coverage' && <div className="coverage-grid"><section className="panel coverage-card"><span className="item-icon icon-blue">{policy.id === 'health' ? <Heart size={23}/> : <ShieldCheck size={23}/>}</span><h3>ความคุ้มครองตามเอกสารตัวอย่าง</h3><div className="detail-rows"><div><span>ประเภทแผน</span><strong>{policy.type}</strong></div><div><span>การชำระเบี้ย</span><strong>{amount(policy.premium)} บาท / {policy.frequency}</strong></div><div><span>ข้อมูลความคุ้มครอง</span><strong>{policy.id === 'health' ? 'ค่ารักษาพยาบาลตามเงื่อนไขตัวอย่าง' : 'ความคุ้มครองชีวิตและผลประโยชน์ตามสัญญา'}</strong></div><div><span>ข้อยกเว้นและระยะรอ</span><strong>ตรวจจากเอกสารกรมธรรม์ก่อนใช้สิทธิ</strong></div><div><span>สถานะกับบริษัทประกัน</span><strong>ยังไม่มีข้อมูลยืนยันใน Prototype</strong></div></div></section><section className="panel coverage-card"><span className="item-icon icon-red"><Heart size={23}/></span><h3>ผู้รับผลประโยชน์</h3><div className="beneficiary-avatar">น</div><strong>นางสาว น••• ใ•••</strong><p>ผู้รับผลประโยชน์สมมติ · สัดส่วน 100%</p><DemoNote>ข้อมูลปกปิดบางส่วน การเปลี่ยนผู้รับผลประโยชน์จริงต้องดำเนินการกับผู้รับผิดชอบกรมธรรม์</DemoNote></section></div>}
      {tab === 'documents' && <section className="panel documents-panel"><h3>เอกสารและผลประโยชน์</h3><div className="document-card"><FileText size={27}/><div><strong>ข้อมูลประกอบแผนตัวอย่าง</strong><p>{policy.note}</p></div><Badge>ข้อมูลสาธิต</Badge></div><div className="document-card"><ImageIcon size={27}/><div><strong>หลักฐานการชำระที่คุณแนบ</strong><p>เปิดจากรายการในแท็บประวัติชำระ เก็บเฉพาะเบราว์เซอร์นี้</p></div><button className="text-link" onClick={() => setTab('history')}>ดูประวัติ<ArrowRight size={16}/></button></div><div className="document-card"><FileText size={27}/><div><strong>มูลค่าเวนคืน / หนังสือรับรองภาษี</strong><p>ยังไม่มีเอกสารจากบริษัทประกัน จึงไม่แสดงยอดหรือออกหนังสือรับรองเอง</p></div><Badge>รอข้อมูล</Badge></div></section>}
    </div>
    <div className="sticky-policy-action"><div><strong>{policy.name}</strong><span>{policy.nextPeriod === null ? 'บันทึกครบตามขอบเขตตัวอย่าง' : `งวดถัดไป ${policy.nextDue}`}</span></div><button className="button button-primary" disabled={ledger.loading || Boolean(ledger.error) || policy.nextPeriod === null} onClick={() => onPayment(policy.id)}><Plus size={17}/>บันทึกเบี้ย</button></div>
  </div>;
}
