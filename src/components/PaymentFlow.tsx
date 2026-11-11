import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCheck, FileCheck2, FilePlus2, LoaderCircle, LockKeyhole, Paperclip, X } from 'lucide-react';
import { Badge, DemoNote, Modal } from './ui';
import { policies as definitions } from '../data/demo';
import type { Policy } from '../data/demo';
import { dueDate, formatDate, outstanding, parseSatang, PaymentError, todayISO, validateDraft } from '../domain/ledger';
import type { Payment, PaymentDraft } from '../domain/ledger';
import { validateFile } from '../data/database';
import type { Ledger } from '../hooks/useLedger';

const draftKey = 'livera:round1:payment-draft';
const fullMoney = (value: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
function readDraft(policyId: string) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null');
    return saved?.policyId === policyId ? saved : null;
  } catch { return null; }
}

export function PaymentFlow({ initialPolicy, ledger, onClose, onComplete }: {
  initialPolicy: Policy['id']; ledger: Ledger; onClose: () => void; onComplete: (payment: Payment) => void;
}) {
  const [restored] = useState(() => readDraft(initialPolicy));
  const [policyId, setPolicyId] = useState<Policy['id']>(initialPolicy);
  const policy = definitions.find(item => item.id === policyId)!;
  const summary = ledger.policies.find(item => item.id === policyId)!;
  const [period, setPeriod] = useState<number>(() => restored && Number.isInteger(restored.period) ? restored.period : summary.nextPeriod ?? 0);
  const [paidDate, setPaidDate] = useState<string>(() => restored?.paidDate || todayISO());
  const [value, setValue] = useState<string>(() => typeof restored?.value === 'string' ? restored.value : String(outstanding(ledger.entries, policy, period) / 100));
  const [reference, setReference] = useState<string>(() => restored?.reference || '');
  const [note, setNote] = useState<string>(() => restored?.note || '');
  const [file, setFile] = useState<File>();
  const [fileUrl, setFileUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<Payment>();
  const busyRef = useRef(false);
  const validationRef = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const firstStepHeading = useRef<HTMLDivElement>(null);
  const maxPeriod = policy.totalPeriods ?? policy.paidPeriods + 1;
  const periodOptions = Array.from({ length: Math.min(maxPeriod, (summary.nextPeriod ?? maxPeriod) + 6) }, (_, index) => index).filter(index => outstanding(ledger.entries, policy, index) > 0);
  const draft: PaymentDraft = { policyId, period, paidDate, satang: parseSatang(value) ?? 0, reference, note };

  useEffect(() => {
    if (step === 2) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ policyId, period, paidDate, value, reference, note, hadFile: Boolean(file) })); } catch { /* Draft saving is optional. */ }
  }, [policyId, period, paidDate, value, reference, note, file, step]);
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setFileUrl(''); return; }
    const url = URL.createObjectURL(file); setFileUrl(url); return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => { if (step !== 0) firstStepHeading.current?.focus(); }, [step]);
  useEffect(() => {
    if (!Object.keys(errors).length) return;
    const field = document.querySelector('.payment-flow [aria-invalid="true"]');
    if (field instanceof HTMLElement) field.focus();
  }, [errors]);

  function choosePolicy(id: Policy['id']) {
    const newPolicy = definitions.find(item => item.id === id)!;
    const target = ledger.policies.find(item => item.id === id)!.nextPeriod ?? 0;
    validationRef.current++; setFileBusy(false); setPolicyId(id); setPeriod(target);
    setValue(String(outstanding(ledger.entries, newPolicy, target) / 100));
    setFile(undefined); setFileError(''); setReference(''); setNote(''); setErrors({});
  }
  async function chooseFile(selected?: File) {
    const token = ++validationRef.current;
    if (!selected) { setFile(undefined); setFileError(''); setFileBusy(false); return; }
    setFileBusy(true); setFileError(''); setFile(undefined);
    try {
      const metadata = await validateFile(selected);
      if (token === validationRef.current) setFile(new File([selected], selected.name, { type: metadata.type }));
    } catch (error) { if (token === validationRef.current) setFileError(error instanceof Error ? error.message : 'อ่านไฟล์ไม่ได้'); }
    finally { if (token === validationRef.current) setFileBusy(false); }
  }
  async function exampleFile() {
    setFileBusy(true); setFileError('');
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}images/demo-payment-proof.png`);
      if (!response.ok) throw new Error('เปิดไฟล์ตัวอย่างไม่ได้ กรุณาลองใหม่');
      await chooseFile(new File([await response.blob()], 'หลักฐานสาธิต-LIVERA.png', { type: 'image/png' }));
    } catch (error) { setFileBusy(false); setFileError(error instanceof Error ? error.message : 'เปิดไฟล์ตัวอย่างไม่ได้'); }
  }
  function review() {
    setErrors({});
    if (parseSatang(value) === null) { setErrors({ satang: 'กรอกจำนวนเงินเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง' }); return; }
    try { validateDraft(draft, ledger.entries); setStep(1); }
    catch (error) { setErrors({ [error instanceof PaymentError ? error.field : 'form']: error instanceof Error ? error.message : 'ตรวจสอบข้อมูลอีกครั้ง' }); }
  }
  async function save() {
    if (busyRef.current) return;
    if (!accepted) { setErrors({ accepted: 'ยืนยันว่ากำลังใช้ข้อมูลและไฟล์ตัวอย่างก่อนบันทึก' }); return; }
    busyRef.current = true; setBusy(true); setErrors({});
    try {
      const payment = await ledger.add(draft, file);
      try { sessionStorage.removeItem(draftKey); } catch { /* Optional draft. */ }
      setResult(payment); setStep(2); onComplete(payment);
    } catch (error) { setErrors({ form: error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ ข้อมูลยังไม่ถูกเพิ่ม กรุณาลองใหม่' }); }
    finally { busyRef.current = false; setBusy(false); }
  }
  const fieldError = (field: string) => errors[field] ? <span className="field-error" id={`error-${field}`} role="alert">{errors[field]}</span> : null;
  return <Modal title={step === 2 ? 'บันทึกรายการเรียบร้อย' : 'บันทึกการชำระเบี้ย'} eyebrow="LIVERA · DEMO PAYMENT" canClose={!busy} onClose={onClose}>
    <div className="payment-flow">
      <ol className="flow-stepper" aria-label="ขั้นตอนบันทึกเบี้ย">{['ข้อมูลการชำระ', 'ตรวจสรุป', 'บันทึกสำเร็จ'].map((label, index) => <li key={label} className={step === index ? 'current' : step > index ? 'done' : ''} aria-current={step === index ? 'step' : undefined}><span>{step > index ? <Check size={15}/> : index + 1}</span><small>{label}</small></li>)}</ol>
      {errors.form && <p role="alert" className="form-error">{errors.form}</p>}
      {ledger.error && <p role="alert" className="form-error">{ledger.error}</p>}
      {step === 0 && <form noValidate onSubmit={event => { event.preventDefault(); review(); }}>
        <div className="flow-heading" ref={firstStepHeading} tabIndex={-1}><h3>อีกหนึ่งก้าวของแผนที่ตั้งใจ</h3><p>บันทึกตามวันที่จ่ายจริง พร้อมหลักฐานถ้ามี</p></div>
        {restored && <p className="draft-note">โหลดร่างจากแท็บนี้แล้ว{restored.hadFile ? ' · กรุณาแนบไฟล์อีกครั้ง' : ''}</p>}
        <label className="form-field">กรมธรรม์<select value={policyId} onChange={event => choosePolicy(event.target.value as Policy['id'])}>{ledger.policies.filter(item => item.nextPeriod !== null).map(item => <option key={item.id} value={item.id}>{item.name} · {item.number}</option>)}</select>{fieldError('policyId')}</label>
        <label className="form-field">งวดที่ต้องการบันทึก<select aria-label="งวดที่ต้องการบันทึก" value={period} onChange={event => { const target = Number(event.target.value); setPeriod(target); setValue(String(outstanding(ledger.entries, policy, target) / 100)); setErrors({}); }} aria-invalid={Boolean(errors.period)} aria-describedby={errors.period ? 'error-period' : undefined}>
          {!periodOptions.includes(period) && <option value={period}>งวดนี้มีบันทึกครบแล้ว · เลือกงวดอื่น</option>}
          {periodOptions.map(index => <option key={index} value={index}>งวด {index + 1} · {formatDate(dueDate(policy, index))} · เหลือ {fullMoney(outstanding(ledger.entries, policy, index) / 100)} บาท</option>)}</select>{fieldError('period')}</label>
        <div className="form-two-columns"><label className="form-field">วันที่ชำระจริง<input aria-label="วันที่ชำระจริง" type="date" value={paidDate} max={todayISO()} onChange={event => setPaidDate(event.target.value)} aria-invalid={Boolean(errors.paidDate)} aria-describedby={errors.paidDate ? 'error-paidDate' : undefined}/>{fieldError('paidDate')}</label>
        <label className="form-field">จำนวนเงิน (บาท)<input aria-label="จำนวนเงิน (บาท)" type="text" inputMode="decimal" value={value} onChange={event => setValue(event.target.value)} aria-invalid={Boolean(errors.satang)} aria-describedby={errors.satang ? 'error-satang' : 'amount-help'}/>{fieldError('satang')}</label></div>
        <p id="amount-help" className="field-hint">บันทึกบางส่วนได้ ยอดต้องไม่เกินที่เหลือของงวด{policy.id === 'health' ? ' · เบี้ยต่ออายุนี้เป็นอัตราตัวอย่าง' : ''}</p>
        <label className="form-field">เลขอ้างอิงการชำระ <small>(ถ้ามี)</small><input aria-label="เลขอ้างอิงการชำระ (ถ้ามี)" maxLength={60} value={reference} placeholder="ช่วยแยกกรณีจ่ายหลายรายการในวันเดียวกัน" onChange={event => setReference(event.target.value)} aria-invalid={Boolean(errors.reference)}/>{fieldError('reference')}</label>
        <label className="form-field">หมายเหตุ <small>(ถ้ามี)</small><textarea rows={2} maxLength={250} value={note} onChange={event => setNote(event.target.value)} placeholder="เช่น บันทึกยอดบางส่วนของงวดนี้"/></label>
        <div className="attachment-heading"><strong>หลักฐานประกอบ</strong><span>ไม่บังคับ</span></div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => { void chooseFile(event.target.files?.[0]); event.target.value = ''; }} className="sr-only" tabIndex={-1} aria-label="เลือกไฟล์หลักฐาน"/>
        {file ? <div className="attachment-selected">{fileUrl ? <img src={fileUrl} alt="ตัวอย่างไฟล์ที่เลือก"/> : <FileCheck2 size={34}/>}<div><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB · เก็บในเบราว์เซอร์นี้</small></div><button type="button" className="icon-button" aria-label="เอาไฟล์ที่เลือกออก" onClick={() => void chooseFile()}><X size={18}/></button></div>
          : <button type="button" className={`upload-zone ${dragging ? 'is-dragging' : ''}`} onClick={() => fileInput.current?.click()} onDragOver={event => { event.preventDefault(); if (!fileBusy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (fileBusy) return; if (event.dataTransfer.files.length > 1) { setFileError('แนบหลักฐานได้ครั้งละ 1 ไฟล์'); return; } void chooseFile(event.dataTransfer.files[0]); }} disabled={fileBusy}><span>{fileBusy ? <LoaderCircle className="spin" size={24}/> : <FilePlus2 size={24}/>}</span><strong>{fileBusy ? 'กำลังอ่านไฟล์…' : 'เลือกไฟล์หลักฐานตัวอย่าง'}</strong><small>ลากไฟล์มาวางได้ · JPG, PNG, WebP หรือ PDF · ไม่เกิน 5 MB</small></button>}
        {fileError && <><p className="field-error" role="alert">{fileError}</p><button type="button" className="text-link" onClick={() => void chooseFile()}>ดำเนินการโดยไม่แนบไฟล์</button></>}
        <button type="button" className="sample-file-button" onClick={() => void exampleFile()} disabled={fileBusy}><Paperclip size={15}/>ใช้ไฟล์สาธิตที่เตรียมไว้</button>
        <p className="local-only-note"><LockKeyhole size={15}/>ใช้ข้อมูลและไฟล์ตัวอย่างเท่านั้น ไม่มีการส่งไฟล์ให้ LIVERA หรือบริษัทประกัน ร่างข้อความเก็บในแท็บนี้ แต่ต้องแนบไฟล์ใหม่หากปิดก่อนบันทึก</p>
        <button type="submit" className="button button-primary flow-continue" disabled={fileBusy || Boolean(fileError) || ledger.loading || Boolean(ledger.error)}>ตรวจสรุปรายการ<ArrowRight size={17}/></button>
      </form>}
      {step === 1 && <div>
        <div className="flow-heading" ref={firstStepHeading} tabIndex={-1}><h3>ตรวจอีกครั้ง ก่อนบันทึก</h3><p>รายการนี้จะเพิ่มในประวัติและยอดของแผนสาธิต</p></div>
        <div className="review-amount">{fullMoney(draft.satang / 100)} <small>บาท</small></div>
        <div className="detail-rows"><div><span>กรมธรรม์</span><strong>{policy.name}</strong></div><div><span>งวดที่</span><strong>{period + 1} · กำหนด {formatDate(dueDate(policy, period))}</strong></div><div><span>ชำระจริงวันที่</span><strong>{formatDate(paidDate)}</strong></div><div><span>เลขอ้างอิง</span><strong>{reference.trim() || 'ไม่ได้ระบุ'}</strong></div><div><span>หลักฐาน</span><strong>{file?.name || 'ยังไม่แนบ'}</strong></div><div><span>สถานะหลังบันทึก</span><Badge variant={file ? 'soft' : 'blue'}>{file ? 'รอตรวจหลักฐาน' : 'ผู้ใช้บันทึก'}</Badge></div>{note.trim() && <div><span>หมายเหตุ</span><strong>{note}</strong></div>}</div>
        <DemoNote>การแนบไฟล์ไม่ได้ยืนยันว่าบริษัทประกันได้รับเงินหรือกรมธรรม์มีผล</DemoNote>
        <label className="confirmation-checkbox"><input type="checkbox" aria-invalid={Boolean(errors.accepted)} checked={accepted} onChange={event => setAccepted(event.target.checked)}/><span>ฉันกำลังทดลองด้วยข้อมูลและไฟล์ตัวอย่าง</span></label>{fieldError('accepted')}
        <div className="flow-actions"><button className="button button-secondary" disabled={busy} onClick={() => { setStep(0); setErrors({}); }}><ArrowLeft size={16}/>กลับไปแก้ไข</button><button className="button button-primary" onClick={() => void save()} disabled={busy || Boolean(ledger.error)}>{busy ? <LoaderCircle className="spin" size={17}/> : <Check size={17}/>}ยืนยันบันทึก</button></div>
      </div>}
      {step === 2 && result && <div className="payment-success" ref={firstStepHeading} tabIndex={-1}><span className="success-orbit"><CheckCheck size={37}/></span><span className="eyebrow">ONE STEP CLOSER</span><h3>เก็บอีกหนึ่งก้าวไว้แล้ว</h3><p>บันทึก {fullMoney(result.satang / 100)} บาท<br/>ในประวัติของ{policy.name}เรียบร้อย</p><Badge variant={result.status === 'pending' ? 'soft' : 'blue'}>{result.status === 'pending' ? 'รอตรวจหลักฐาน' : 'ผู้ใช้บันทึก'}</Badge><p className="success-private"><LockKeyhole size={14}/>ข้อมูลและไฟล์อยู่เฉพาะเบราว์เซอร์นี้</p><button className="button button-primary" onClick={() => { window.location.hash = `/policies/${policy.id}`; onClose(); }}>ดูประวัติและยอดล่าสุด<ArrowRight size={17}/></button></div>}
    </div>
  </Modal>;
}
