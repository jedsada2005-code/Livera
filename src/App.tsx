import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays, Check, ChevronRight,
  CircleHelp, Clock3, Compass, Eye, EyeOff, FileText, Heart, LayoutDashboard,
  RotateCcw, ShieldCheck,
  Sparkles, Target, Users, Wallet, Plus, LoaderCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge, DemoNote, Logo, Modal, SectionTitle } from './components/ui';
import { member, routeLabels } from './data/demo';
import type { Route, Policy } from './data/demo';
import { usePreferences } from './hooks/usePreferences';
import { useRoute, usePolicyId } from './routing';
import { useLedger } from './hooks/useLedger';
import { usePlanning } from './hooks/usePlanning';
import { useClub } from './hooks/useClub';
import { ClubPage } from './pages/Club';
import { useKnowledge } from './hooks/useKnowledge';
import { knowledge } from './data/knowledge';
import { useServices } from './hooks/useServices';
import { RetirementPage } from './pages/Retirement';
import { PaymentFlow } from './components/PaymentFlow';
import { PolicyCards, PolicyDetails } from './pages/Policies';
import { PhotoHero } from './components/PhotoHero';
import { ProgressRing } from './components/ProgressRing';
import { outstanding, todayISO, formatDate } from './domain/ledger';
import type { PolicySummary } from './domain/ledger';

const KnowledgePage = lazy(() => import('./pages/Knowledge').then(module => ({default:module.KnowledgePage})));
const AccountPage = lazy(() => import('./pages/Account').then(module => ({default:module.AccountPage})));
const ServicesPage = lazy(() => import('./pages/Services').then(module => ({default:module.ServicesPage})));

const nav: { route: Route; label: string; icon: LucideIcon }[] = [
  { route: 'overview', label: 'ภาพรวม', icon: LayoutDashboard },
  { route: 'policies', label: 'กรมธรรม์', icon: FileText },
  { route: 'retirement', label: 'แผนเกษียณ', icon: Compass },
  { route: 'club', label: 'คลับ', icon: Users },
  { route: 'services', label: 'บริการ', icon: Heart },
];
const money = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });
type DialogState = { kind: 'feature'; title: string; body: string; round: string } | { kind: 'reset' } | { kind: 'notifications' } | null;

function PolicyIcon({ policy }: { policy: PolicySummary }) {
  const Icon = policy.id === 'health' ? Heart : policy.id === 'pension' ? Compass : ShieldCheck;
  return <span className={`item-icon icon-${policy.color}`}><Icon size={22} strokeWidth={1.65}/></span>;
}

export default function App() {
  const route = useRoute();
  const policyId = usePolicyId();
  const ledger = useLedger();
  const planning = usePlanning();
  const club = useClub();
  const serviceRequests = useServices();
  const library = useKnowledge();
  const { policies, totals } = ledger;
  const selectedPolicy = route === 'policies' ? policies.find(policy => policy.id === policyId) : undefined;
  const nextPolicy = [...policies].filter(policy => policy.nextDueISO !== null).sort((a,b) => a.nextDueISO!.localeCompare(b.nextDueISO!))[0];
  const [paymentPolicy, setPaymentPolicy] = useState<Policy['id']>();
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const { preferences, setPreferences, reset } = usePreferences();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState('');
  const pageHeading = useRef<HTMLHeadingElement>(null);
  const previousRoute = useRef(`${route}/${policyId}`);
  useEffect(() => {
    document.documentElement.classList.toggle('text-large', preferences.largeText);
    return () => document.documentElement.classList.remove('text-large');
  }, [preferences.largeText]);
  useEffect(() => {
    document.title = `${selectedPolicy?.name ?? routeLabels[route].title} · LIVERA`;
    if (previousRoute.current !== `${route}/${policyId}`) pageHeading.current?.focus();
    previousRoute.current = `${route}/${policyId}`;
  }, [route, policyId, selectedPolicy?.name]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const amount = (value: number) => preferences.hideAmounts ? '•••,•••' : money.format(value);
  const openPayment = (id: Policy['id']) => setPaymentPolicy(id);
  const feature = (title: string, body: string, round: string) => setDialog({ kind: 'feature', title, body, round });


  return <div className={`app ${preferences.largeText ? 'large-text' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); pageHeading.current?.focus(); }}>ข้ามไปเนื้อหาหลัก</a>
    <aside className="sidebar">
      <a href="#/overview" className="brand-link" aria-label="LIVERA กลับหน้าภาพรวม"><Logo/></a>
      <div className="sidebar-divider"/>
      <div className="sidebar-label">YOUR PERSONAL SPACE</div>
      <nav aria-label="เมนูหลัก" className="desktop-nav">{nav.map(({ route: value, label, icon: Icon }) =>
        <a href={`#/${value}`} key={value} className={`nav-item ${route === value ? 'active' : ''}`} aria-current={route === value ? 'page' : undefined}><Icon size={21} strokeWidth={1.7}/><span>{label}</span>{route === value && <span className="nav-active-dot"/>}</a>)}</nav>
      <nav className="sidebar-secondary" aria-label="ความรู้และบัญชี"><a href="#/knowledge" className={route==='knowledge'?'active':''} aria-current={route==='knowledge'?'page':undefined}><BookOpen size={20}/>ศูนย์ความรู้</a><a href="#/account" className={route==='account'?'active':''} aria-current={route==='account'?'page':undefined}><ShieldCheck size={20}/>บัญชีของฉัน</a></nav>
      <div className="sidebar-club"><span className="eyebrow">A LIFE WELL PLANNED</span><p>ชีวิตบทใหม่<br/>เริ่มออกแบบได้วันนี้</p><a href="#/retirement">สำรวจแผนของคุณ <ArrowUpRight size={17}/></a><span className="sidebar-decoration" aria-hidden="true">✳</span></div>
      <div className="sidebar-bottom"><button className="support-button" onClick={() => feature('ติดต่อทีม LIVERA', 'ช่องทางประสานงานและช่วยเหลือสมาชิกจะเชื่อมต่อในรอบถัดไป ขณะนี้คุณสามารถทดลองเมนูและดูข้อมูลสาธิตได้ทั้งกรมธรรม์ แผนเกษียณ คลับ บริการ และศูนย์ความรู้', 'โครงบริการสมาชิก')}><CircleHelp size={20}/>ให้เราช่วยคุณ</button><span className="build-tag"><span/>PROTOTYPE · ROUND 5</span></div>
    </aside>

    <div className="workspace">
      <header className="topbar"><a href="#/overview" className="mobile-brand" aria-label="LIVERA กลับหน้าภาพรวม"><Logo compact/></a><div className="breadcrumb">พื้นที่สมาชิก <ChevronRight size={13}/><span>{routeLabels[route].title}</span></div>
        <div className="topbar-actions"><span className="demo-pill"><span/>โหมดสาธิต</span><span className="topbar-separator"/><button className="icon-button notification-button" aria-label="เปิดการแจ้งเตือน" onClick={() => setDialog({ kind: 'notifications' })}><Bell size={21}/><span className="notification-dot"/></button><a className="icon-button knowledge-top-button" href="#/knowledge" aria-current={route==='knowledge'?'page':undefined} aria-label="เปิดศูนย์ความรู้"><BookOpen size={21}/></a><a className="member-button" aria-label="บัญชีและการตั้งค่า" aria-current={route==='account'?'page':undefined} href="#/account"><span className="avatar">{member.initials}</span><span className="member-button-name">คุณ{member.name}</span><ChevronRight size={15}/></a></div>
      </header>

      <main id="main-content" className="main-content">
        <div className="page-header"><div><span className="eyebrow">{routeLabels[route].english}</span><h1 tabIndex={-1} ref={pageHeading}>{route === 'overview' ? `สวัสดี คุณ${member.name}` : selectedPolicy?.name ?? routeLabels[route].title}<span className="heading-dot">.</span></h1><p>{route === 'overview' ? 'ดูแลทุกก้าววันนี้ เพื่อชีวิตที่คุณเลือกในวันข้างหน้า' : route === 'policies' ? 'เข้าใจแผนของคุณ เห็นภาพครบในที่เดียว' : route === 'retirement' ? 'จากเป้าหมายในใจ สู่แผนที่ค่อย ๆ เป็นจริง' : route === 'club' ? 'พื้นที่ของบทสนทนา มิตรภาพ และประสบการณ์ใหม่' : route === 'account' ? 'ปรับพื้นที่ของคุณ และดูข้อมูลที่บันทึกไว้' : route === 'knowledge' ? 'เรื่องที่ควรรู้ สำหรับชีวิตบทต่อไป' : 'ความรู้และผู้ช่วยดี ๆ สำหรับทุกช่วงชีวิต'}</p></div><div className="page-header-end">{route === 'overview' ? <><span className="date-label">{formatDate(todayISO(), true)}</span><button className="subtle-button" onClick={() => setPreferences(p => ({ ...p, hideAmounts: !p.hideAmounts }))}>{preferences.hideAmounts ? <Eye size={16}/> : <EyeOff size={16}/>}{preferences.hideAmounts ? 'แสดงยอดเงิน' : 'ซ่อนยอดเงิน'}</button></> : <Badge variant="blue">สมาชิก LIVERA</Badge>}</div></div>

        {ledger.error && <div className="storage-error" role="alert"><p>{ledger.error}</p><button className="button button-secondary" onClick={() => void ledger.refresh()}>ลองโหลดอีกครั้ง</button></div>}
        <div className="route-stage" key={route === 'club' || route === 'services' || route === 'knowledge' ? route : `${route}/${policyId}`} >
        {route === 'overview' && <>
          <div className="overview-top-grid">
            <PhotoHero/>
            <section className="next-payment-card"><div className="card-topline"><span className="item-icon icon-red"><CalendarDays size={21}/></span><Badge variant="soft">งวดถัดไป</Badge></div><p className="payment-plan">{nextPolicy?.name ?? 'ทุกแผนบันทึกครบแล้ว'}</p><p className="next-payment-amount">{nextPolicy && nextPolicy.nextPeriod !== null ? amount(outstanding(ledger.entries, nextPolicy, nextPolicy.nextPeriod) / 100) : '—'}<span>บาท</span></p><div className="payment-date"><Clock3 size={15}/><span>{nextPolicy?.nextDue ?? 'รอทบทวนตารางรอบใหม่'}</span></div><button className="button button-primary" disabled={!nextPolicy || ledger.loading || Boolean(ledger.error)} onClick={() => nextPolicy && openPayment(nextPolicy.id)}><Plus size={17}/>บันทึกการชำระ<ArrowRight size={17}/></button>{totals.pending > 0 && <span className="payment-pending-note">มี {totals.pending} รายการรอตรวจหลักฐาน</span>}</section>
          </div>

          <div className="snapshot-heading"><h2>ภาพรวมแผนของคุณ</h2><span className="source-label"><span/>ข้อมูลตัวอย่างที่ผู้ใช้บันทึก</span></div>
          <section className="stats-grid" aria-label="ข้อมูลสรุปกรมธรรม์">
            <div className="stat-card"><div className="stat-heading"><span>กรมธรรม์ทั้งหมด</span><FileText size={19}/></div><div className="stat-value">{policies.length}<span>ฉบับ</span></div><p>เฉพาะกรมธรรม์ผ่าน LIVERA</p></div>
            <div className="stat-card"><div className="stat-heading"><span>เบี้ยที่บันทึกแล้ว</span><Wallet size={19}/></div><div className="stat-value">{amount(totals.paid)}<span>บาท</span></div><p>ข้อมูลสาธิต ยังไม่ยืนยันจากบริษัทประกัน</p></div>
            <div className="stat-card"><div className="stat-heading"><span>เบี้ยตามแผนที่เหลือ</span><ShieldCheck size={19}/></div><div className="stat-value">{amount(totals.remaining)}<span>บาท</span></div><p>รวม 2 ฉบับ ไม่รวมเบี้ยสุขภาพในอนาคต</p></div>
            <div className="stat-card"><div className="stat-heading"><span>บำนาญตามตัวอย่าง</span><Compass size={19}/></div><div className="stat-value">{amount(120000)}<span>บาท/ปี</span></div><p>เริ่มรับตามตัวอย่างเมื่ออายุ 60 ปี</p></div>
          </section>

          <a className="journey-card" href="#/policies/saving"><ProgressRing value={policies[0].progress}/><div><span className="eyebrow">YOUR NEXT CHAPTER</span><strong>ทุกงวด คืออีกก้าวของแผนที่ตั้งใจ</strong><p>แผนสะสมทรัพย์ · บันทึกครบ {policies[0].paidPeriods} จาก {policies[0].totalPeriods} งวด</p></div><span className="journey-cta">ดูเส้นทางของฉัน<ArrowUpRight size={17}/></span></a>
          <div className="overview-bottom-grid"><section className="panel portfolio-panel"><SectionTitle title="กรมธรรม์ของฉัน" subtitle="แผนแต่ละฉบับ ดูรายละเอียดได้ในที่เดียว" href="#/policies"/>
            <div className="policy-list">{policies.map(policy => <button key={policy.id} className="policy-row" onClick={() => { window.location.hash = `/policies/${policy.id}`; }}><PolicyIcon policy={policy}/><span className="policy-row-copy"><strong>{policy.name}</strong><span>{policy.english}</span></span><span className="policy-row-value">{amount(policy.premium)}<small>บาท / {policy.frequency}</small></span><ChevronRight size={17}/></button>)}</div>
            <div className="portfolio-footnote"><ShieldCheck size={15}/>กรมธรรม์และตัวเลขทั้งหมดเป็นข้อมูลสมมติ</div>
          </section>
          <section className="club-teaser photo-club-teaser"><img src={`${import.meta.env.BASE_URL}images/retirement-club.webp`} alt="ภาพประกอบสมจริงของสมาชิกผู้สูงอายุทำกิจกรรมในบ้านพัก" loading="lazy"/><div className="club-teaser-heading"><span className="eyebrow">A LITTLE MORE TO LIFE</span><Badge>เฉพาะสมาชิก</Badge></div><h2>Retirement<br/><span>Luxury Club</span></h2><p>พบเพื่อนใหม่ เติมประสบการณ์ดี ๆ<br/>ทั้งพบกันจริงและออนไลน์</p><div className="teaser-event"><span className="mini-date"><b>28</b>NOV</span><span><strong>มื้อสายและชีวิตบทใหม่</strong><small>กิจกรรมตัวอย่าง · พบกันจริง</small></span></div><a className="text-link" href="#/club">สำรวจกิจกรรมคลับ <ArrowUpRight size={17}/></a></section></div>
          <section className="quick-links" aria-label="ทางลัด"><a href="#/retirement"><span className="quick-icon"><Target size={20}/></span><span><strong>เริ่มวางเป้าหมาย</strong><small>ออมจ่ายเบี้ยและเตรียมเกษียณ</small></span><ArrowUpRight size={18}/></a><a href="#/services"><span className="quick-icon red"><Heart size={20}/></span><span><strong>สุขภาพกายและใจ</strong><small>รู้จักแนวทางบริการส่วนตัว</small></span><ArrowUpRight size={18}/></a><a href="#/knowledge"><span className="quick-icon warm"><BookOpen size={20}/></span><span><strong>ความรู้สำหรับบทใหม่</strong><small>ข่าวและเรื่องเกษียณที่เข้าใจง่าย</small></span><ArrowUpRight size={18}/></a></section>
        </>}

        {route === 'policies' && (selectedPolicy ? <PolicyDetails key={selectedPolicy.id} policy={selectedPolicy} ledger={ledger} amount={amount} onPayment={openPayment} onNotice={setNotice}/> : <PolicyCards ledger={ledger} amount={amount} onPayment={openPayment} onNotice={setNotice}/>)}

        {route === 'retirement' && <RetirementPage ledger={ledger} planning={planning} amount={amount} hideAmounts={preferences.hideAmounts} showAmounts={() => setPreferences(p => ({...p,hideAmounts:false}))} onPayment={openPayment} onNotice={setNotice}/>}

        {route === 'club' && <ClubPage club={club} onNotice={setNotice}/>}

        {route === 'services' && <Suspense fallback={<p role="status">กำลังเปิดบริการส่วนตัว…</p>}><ServicesPage services={serviceRequests} amount={amount} hideAmounts={preferences.hideAmounts} showAmounts={() => setPreferences(p => ({...p,hideAmounts:false}))} onNotice={setNotice} onFeature={feature}/></Suspense>}

        {route === 'knowledge' && <Suspense fallback={<p role="status">กำลังเปิดศูนย์ความรู้…</p>}><KnowledgePage library={library} id={policyId} onNotice={setNotice}/></Suspense>}
        {route === 'account' && <Suspense fallback={<p role="status">กำลังเปิดบัญชี…</p>}><AccountPage library={library} preferences={preferences} toggleAmounts={()=>setPreferences(p=>({...p,hideAmounts:!p.hideAmounts}))} toggleLarge={()=>setPreferences(p=>({...p,largeText:!p.largeText}))} resetDisplay={reset} resetLedger={()=>{setResetError('');setDialog({kind:'reset'});}} entries={ledger.entries} ledgerReady={!ledger.loading&&!ledger.error} amount={amount} onNotice={setNotice}/></Suspense>}
        </div>
        <footer className="page-footer"><span>© LIVERA · A New Era of Living</span><span>ต้นแบบรอบ 5 <span className="footer-dot">·</span> ข้อมูลสาธิต · ความรู้มีแหล่งอ้างอิง</span></footer>
      </main>
    </div>

    <nav className="mobile-nav" aria-label="เมนูหลักบนมือถือ">{nav.map(({ route: value, label, icon: Icon }) => <a href={`#/${value}`} key={value} className={route === value ? 'active' : ''} aria-current={route === value ? 'page' : undefined}><span><Icon size={21} strokeWidth={route === value ? 2.15 : 1.65}/></span><small>{label}</small></a>)}</nav>
    {notice && <div className="toast" role="status"><Check size={18}/>{notice}</div>}
    {dialog && <Modal title={dialog.kind === 'notifications' ? 'การแจ้งเตือน' : dialog.kind === 'reset' ? 'คืนค่าประวัติสาธิต' : dialog.title} eyebrow={dialog.kind === 'feature' ? dialog.round : 'LIVERA DEMO'} onClose={() => setDialog(null)}>
      {dialog.kind === 'feature' && <><div className="feature-modal-icon"><Sparkles size={28}/></div><p className="feature-body">{dialog.body}</p><DemoNote/><button className="button button-primary modal-done" onClick={() => setDialog(null)}>เข้าใจแล้ว<Check size={17}/></button></>}
      {dialog.kind === 'reset' && <><p className="feature-body">รายการที่คุณเพิ่มและไฟล์แนบในเบราว์เซอร์นี้จะถูกล้าง แล้วกลับเป็นข้อมูลตั้งต้น 21 รายการ การตั้งค่าการแสดงผลจะกลับค่าเริ่มต้นด้วย</p>{resetError && <p className="form-error" role="alert">{resetError}</p>}<div className="flow-actions"><button className="button button-secondary" disabled={resetting} onClick={() => setDialog(null)}>เก็บข้อมูลไว้</button><button className="button button-danger" disabled={resetting || Boolean(ledger.error)} onClick={async () => { if(resetting) return; setResetting(true); setResetError(''); try { await ledger.reset(); reset(); try { sessionStorage.removeItem('livera:round1:payment-draft'); } catch { /* Optional draft. */ } setDialog(null); setNotice('คืนค่าประวัติและไฟล์สาธิตแล้ว'); } catch { setResetError('คืนค่าไม่สำเร็จ กรุณาลองใหม่'); } finally { setResetting(false); } }}>{resetting ? <LoaderCircle size={17} className="spin"/> : <RotateCcw size={17}/>}ยืนยันคืนค่าประวัติ</button></div></>}
      {dialog.kind === 'notifications' && <>{library.data.newsInApp&&knowledge.filter(k=>library.data.interests.includes(k.topic)&&!library.data.activity[k.id]?.read&&!library.data.activity[k.id]?.completed).slice(0,1).map(item=><div key={item.id} className="notification-item"><span className="item-icon icon-blue"><BookOpen size={21}/></span><div><strong>ความรู้คัดสรรตามความสนใจ</strong><p>{item.title}</p><a href={`#/knowledge/${item.id}`} className="text-link" onClick={()=>setDialog(null)}>เปิดอ่านหรือดูคลิป<ArrowUpRight size={15}/></a></div></div>)}{totals.pending > 0 && <div className="notification-item"><span className="item-icon icon-red"><FileText size={21}/></span><div><strong>มี {totals.pending} รายการรอตรวจหลักฐาน</strong><p>คุณแนบไฟล์และบันทึกไว้ในเบราว์เซอร์นี้แล้ว</p><a className="text-link" href="#/policies" onClick={() => setDialog(null)}>ดูรายการกรมธรรม์<ArrowUpRight size={15}/></a></div></div>}<div className="notification-item"><span className="item-icon icon-red"><CalendarDays size={21}/></span><div><strong>งวดถัดไปในแผนตัวอย่าง</strong><p>{nextPolicy?.name ?? 'ทุกแผนบันทึกครบ'} · {nextPolicy ? amount(outstanding(ledger.entries, nextPolicy, nextPolicy.nextPeriod ?? 0) / 100) : '—'} บาท</p><small>{nextPolicy?.nextDue ?? 'รอทบทวนตาราง'} · ข้อมูลสาธิต</small></div></div><div className="notification-item"><span className="item-icon icon-blue"><Users size={21}/></span><div><strong>รู้จัก Retirement Luxury Club</strong><p>พบกันจริงและออนไลน์ สำหรับลูกค้าทุกช่วงวัย</p><a className="text-link" href="#/club" onClick={() => setDialog(null)}>สำรวจคลับ<ArrowUpRight size={15}/></a></div></div><DemoNote>การแจ้งเตือนตัวอย่างภายในแอป ยังไม่ส่ง SMS อีเมล หรือแจ้งเตือนตามเวลาจริง</DemoNote></>}
    </Modal>}
    {paymentPolicy && <PaymentFlow initialPolicy={paymentPolicy} ledger={ledger} onClose={() => setPaymentPolicy(undefined)} onComplete={() => setNotice('บันทึกเรียบร้อย ยอดทุกหน้าอัปเดตแล้ว')}/>}
  </div>;
}
