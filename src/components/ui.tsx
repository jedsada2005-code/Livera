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

export function Modal({ title, children, onClose, eyebrow, canClose = true }: { title: string; children: ReactNode; onClose: () => void; eyebrow?: string; canClose?: boolean }) {
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
  return <dialog ref={ref} className="modal" onCancel={event => { event.preventDefault(); if (canClose) onClose(); }} onClick={event => { if (canClose && event.target === ref.current) onClose(); }} aria-labelledby="modal-title">
    <div className="modal-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="ปิดหน้าต่าง" onClick={onClose} disabled={!canClose}><X size={22}/></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}

export function FutureAction({ children, onClick, secondary = false }: { children: ReactNode; onClick: () => void; secondary?: boolean }) {
  return <button className={secondary ? 'button button-secondary' : 'button button-primary'} onClick={onClick}>{children}<ArrowUpRight size={17}/></button>;
}
