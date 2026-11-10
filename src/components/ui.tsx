import { useEffect, useRef } from 'react';
import { ArrowUpRight, ChevronRight, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Logo({ compact = false }: { compact?: boolean }) {
  return <span className={`brand ${compact ? 'brand-compact' : ''}`}>
    <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 23 24 7l19 16v20H5Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /><path d="M17 37c-2-15 7-20 19-20-2 13-7 20-19 20Z" fill="currentColor" /><path d="m15 44 15-20" fill="none" stroke="var(--brand-cutout, #fff)" strokeWidth="2.8" /></svg>
    <span className="brand-wordmark">LIVERA<span className="brand-tagline">A NEW ERA OF LIVING</span></span>
  </span>;
}

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: 'neutral' | 'red' | 'blue' | 'soft' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function SectionTitle({ title, subtitle, href, onClick, action = 'ดูทั้งหมด' }: {
  title: string; subtitle?: string; href?: string; onClick?: () => void; action?: string;
}) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
    {href ? <a className="text-link" href={href}>{action}<ChevronRight size={16}/></a>
      : onClick ? <button className="text-link" onClick={onClick}>{action}<ChevronRight size={16}/></button> : null}
  </div>;
}

export function DemoNote({ children }: { children?: ReactNode }) {
  return <div className="demo-note"><Info size={16}/><span>{children ?? 'ข้อมูลสมมติสำหรับทดลองหน้าจอ ยังไม่มีการทำธุรกรรมหรือส่งคำขอจริง'}</span></div>;
}

export function Modal({ title, children, onClose, eyebrow }: { title: string; children: ReactNode; onClose: () => void; eyebrow?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose(); }} aria-labelledby="modal-title">
    <div className="modal-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="ปิดหน้าต่าง" onClick={onClose}><X size={22}/></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}

export function FutureAction({ children, onClick, secondary = false }: { children: ReactNode; onClick: () => void; secondary?: boolean }) {
  return <button className={secondary ? 'button button-secondary' : 'button button-primary'} onClick={onClick}>{children}<ArrowUpRight size={17}/></button>;
}

export function HouseIllustration({ club = false }: { club?: boolean }) {
  return <svg className={`house-art ${club ? 'club-art' : ''}`} viewBox="0 0 420 300" fill="none" aria-hidden="true">
    <circle cx="292" cy="86" r="58" fill={club ? '#edc5b8' : '#dbc4a3'} opacity=".95"/>
    <path d="M0 264c88-72 210-66 420-12v48H0Z" fill={club ? '#dde3de' : '#233f5f'}/>
    <path d="M84 160 202 75l123 85v116H84Z" fill={club ? '#fffaf0' : '#f0e9df'}/>
    <path d="m64 166 139-99 140 99" stroke={club ? '#9e534b' : '#d9bfa5'} strokeWidth="13" strokeLinejoin="round"/>
    <path d="M103 174h66v57h-66Z" fill="#adc6c9"/><path d="M135 174v57M103 201h66" stroke="#fffaf0" strokeWidth="5"/>
    <path d="M233 174h69v57h-69Z" fill="#adc6c9"/><path d="M267 174v57M233 201h69" stroke="#fffaf0" strokeWidth="5"/>
    <path d="M181 205c0-29 42-29 42 0v71h-42Z" fill={club ? '#b98e7b' : '#486881'}/>
    <path d="M174 276h57l17 24H158Z" fill={club ? '#d9c9b8' : '#3f5871'}/>
    <path d="M44 280V153M354 280V139" stroke={club ? '#738c78' : '#77958e'} strokeWidth="5"/>
    <ellipse cx="43" cy="162" rx="23" ry="43" fill={club ? '#a0b5a0' : '#5c807f'}/><ellipse cx="355" cy="152" rx="31" ry="53" fill={club ? '#b7c6ae' : '#77958e'}/>
    <path d="M20 280h365" stroke={club ? '#c3cbbc' : '#9daea6'} strokeWidth="2"/>
    <path d="M245 78c11-11 22-11 33 0M326 48c8-8 16-8 24 0" stroke={club ? '#ba9b86' : '#b8c6cf'} strokeWidth="2" strokeLinecap="round"/>
  </svg>;
}
