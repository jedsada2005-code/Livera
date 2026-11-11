import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays, Check, ChevronRight,
  CircleHelp, Clock3, Compass, Eye, EyeOff, FileText, Heart, LayoutDashboard,
  LockKeyhole, MapPin, MessageCircle, RotateCcw, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Target, UserRound, Users, Video, Wallet, Plus, LoaderCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge, DemoNote, FutureAction, Logo, Modal, SectionTitle } from './components/ui';
import { events, member, routeLabels } from './data/demo';
import type { Route, Policy } from './data/demo';
import { usePreferences } from './hooks/usePreferences';
import { useRoute, usePolicyId } from './routing';
import { useLedger } from './hooks/useLedger';
import { PaymentFlow } from './components/PaymentFlow';
import { PolicyCards, PolicyDetails } from './pages/Policies';
import { PhotoHero } from './components/PhotoHero';
import { ProgressRing } from './components/ProgressRing';
import { outstanding, todayISO, formatDate } from './domain/ledger';
import type { PolicySummary } from './domain/ledger';

const nav: { route: Route; label: string; icon: LucideIcon }[] = [
  { route: 'overview', label: 'ภาพรวม', icon: LayoutDashboard },
  { route: 'policies', label: 'กรมธรรม์', icon: FileText },
  { route: 'retirement', label: 'แผนเกษียณ', icon: Compass },
  { route: 'club', label: 'คลับ', icon: Users },
  { route: 'services', label: 'บริการ', icon: Heart },
];
const money = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });
type DialogState = { kind: 'feature'; title: string; body: string; round: string } | { kind: 'reset' } | { kind: 'settings' } | { kind: 'notifications' } | null;

function PolicyIcon({ policy }: { policy: PolicySummary }) {
  const Icon = policy.id === 'health' ? Heart : policy.id === 'pension' ? Compass : ShieldCheck;
  return <span className={`item-icon icon-${policy.color}`}><Icon size={22} strokeWidth={1.65}/></span>;
}

export default function App() {
  const route = useRoute();
  const policyId = usePolicyId();
  const ledger = useLedger();
  const { policies, totals } = ledger;
  const selectedPolicy = route === 'policies' ? policies.find(policy => policy.id === policyId) : undefined;
  const nextPolicy = [...policies].filter(policy => policy.nextDueISO !== null).sort((a,b) => a.nextDueISO!.localeCompare(b.nextDueISO!))[0];
  const [paymentPolicy, setPaymentPolicy] = useState<Policy['id']>();
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const { preferences, setPreferences, reset } = usePreferences();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState('');
  const [clubFilter, setClubFilter] = useState('all');
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
  const eventDetail = (event: typeof events[number]) => feature(event.subtitle,
    `${event.description}\n\n${event.date} · ${event.time}\n${event.location}\n\nกิจกรรมนี้เป็นตัวอย่างสำหรับวางโครงหน้าจอ ยังไม่เปิดรับจองจริง`, 'รอบ 3 · คลับและชุมชน');

  return <div className={`app ${preferences.largeText ? 'large-text' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); pageHeading.current?.focus(); }}>ข้ามไปเนื้อหาหลัก</a>
    <aside className="sidebar">
      <a href="#/overview" className="brand-link" aria-label="LIVERA กลับหน้าภาพรวม"><Logo/></a>
      <div className="sidebar-divider"/>
      <div className="sidebar-label">YOUR PERSONAL SPACE</div>
      <nav aria-label="เมนูหลัก" className="desktop-nav">{nav.map(({ route: value, label, icon: Icon }) =>
        <a href={`#/${value}`} key={value} className={`nav-item ${route === value ? 'active' : ''}`} aria-current={route === value ? 'page' : undefined}><Icon size={21} strokeWidth={1.7}/><span>{label}</span>{route === value && <span className="nav-active-dot"/>}</a>)}</nav>
      <div className="sidebar-club"><span className="eyebrow">A LIFE WELL PLANNED</span><p>ชีวิตบทใหม่<br/>เริ่มออกแบบได้วันนี้</p><a href="#/retirement">สำรวจแผนของคุณ <ArrowUpRight size={17}/></a><span className="sidebar-decoration" aria-hidden="true">✳</span></div>
      <div className="sidebar-bottom"><button className="support-button" onClick={() => feature('ติดต่อทีม LIVERA', 'ช่องทางประสานงานและช่วยเหลือสมาชิกจะเชื่อมต่อในรอบถัดไป ขณะนี้คุณสามารถทดลองเมนูและดูข้อมูลสาธิตได้ครบ 5 ส่วน', 'โครงบริการสมาชิก')}><CircleHelp size={20}/>ให้เราช่วยคุณ</button><span className="build-tag"><span/>PROTOTYPE · ROUND 1</span></div>
    </aside>

    <div className="workspace">
      <header className="topbar"><a href="#/overview" className="mobile-brand" aria-label="LIVERA กลับหน้าภาพรวม"><Logo compact/></a><div className="breadcrumb">พื้นที่สมาชิก <ChevronRight size={13}/><span>{routeLabels[route].title}</span></div>
        <div className="topbar-actions"><span className="demo-pill"><span/>โหมดสาธิต</span><span className="topbar-separator"/><button className="icon-button notification-button" aria-label="เปิดการแจ้งเตือน" onClick={() => setDialog({ kind: 'notifications' })}><Bell size={21}/><span className="notification-dot"/></button><button className="member-button" aria-label="บัญชีและการตั้งค่า" onClick={() => setDialog({ kind: 'settings' })}><span className="avatar">{member.initials}</span><span className="member-button-name">คุณ{member.name}</span><ChevronRight size={15}/></button></div>
      </header>

      <main id="main-content" className="main-content">
        <div className="page-header"><div><span className="eyebrow">{routeLabels[route].english}</span><h1 tabIndex={-1} ref={pageHeading}>{route === 'overview' ? `สวัสดี คุณ${member.name}` : selectedPolicy?.name ?? routeLabels[route].title}<span className="heading-dot">.</span></h1><p>{route === 'overview' ? 'ดูแลทุกก้าววันนี้ เพื่อชีวิตที่คุณเลือกในวันข้างหน้า' : route === 'policies' ? 'เข้าใจแผนของคุณ เห็นภาพครบในที่เดียว' : route === 'retirement' ? 'จากเป้าหมายในใจ สู่แผนที่ค่อย ๆ เป็นจริง' : route === 'club' ? 'พื้นที่ของบทสนทนา มิตรภาพ และประสบการณ์ใหม่' : 'ความรู้และผู้ช่วยดี ๆ สำหรับทุกช่วงชีวิต'}</p></div><div className="page-header-end">{route === 'overview' ? <><span className="date-label">{formatDate(todayISO(), true)}</span><button className="subtle-button" onClick={() => setPreferences(p => ({ ...p, hideAmounts: !p.hideAmounts }))}>{preferences.hideAmounts ? <Eye size={16}/> : <EyeOff size={16}/>}{preferences.hideAmounts ? 'แสดงยอดเงิน' : 'ซ่อนยอดเงิน'}</button></> : <Badge variant="blue">สมาชิก LIVERA</Badge>}</div></div>

        {ledger.error && <div className="storage-error" role="alert"><p>{ledger.error}</p><button className="button button-secondary" onClick={() => void ledger.refresh()}>ลองโหลดอีกครั้ง</button></div>}
        <div className="route-stage" key={`${route}/${policyId}`}>
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
          <section className="quick-links" aria-label="ทางลัด"><a href="#/retirement"><span className="quick-icon"><Target size={20}/></span><span><strong>เริ่มวางเป้าหมาย</strong><small>ออมจ่ายเบี้ยและเตรียมเกษียณ</small></span><ArrowUpRight size={18}/></a><a href="#/services"><span className="quick-icon red"><Heart size={20}/></span><span><strong>สุขภาพกายและใจ</strong><small>รู้จักแนวทางบริการส่วนตัว</small></span><ArrowUpRight size={18}/></a><a href="#/services"><span className="quick-icon warm"><BookOpen size={20}/></span><span><strong>ความรู้สำหรับบทใหม่</strong><small>ข่าวและเรื่องเกษียณที่เข้าใจง่าย</small></span><ArrowUpRight size={18}/></a></section>
        </>}

        {route === 'policies' && (selectedPolicy ? <PolicyDetails key={selectedPolicy.id} policy={selectedPolicy} ledger={ledger} amount={amount} onPayment={openPayment} onNotice={setNotice}/> : <PolicyCards ledger={ledger} amount={amount} onPayment={openPayment} onNotice={setNotice}/>)}

        {route === 'retirement' && <>
          <section className="retirement-banner"><span className="eyebrow">MAKE ROOM FOR YOUR FUTURE</span><h2>เป้าหมายต่างกัน<br/>แผนที่เตรียมก็ต่างกัน</h2><p>แยกเงินให้พอจ่ายเบี้ยวันนี้ กับเงินที่อยากมีไว้ใช้ในวันเกษียณ</p><span className="retirement-star" aria-hidden="true">✳</span></section>
          <div className="planning-grid"><article className="panel planning-card"><span className="item-icon icon-red"><Target size={24}/></span><Badge variant="soft">เป้าหมายระยะใกล้</Badge><h2>ออมให้พอจ่ายเบี้ย</h2><p>กันเงินทีละเดือน ให้พร้อมก่อนถึงกำหนดงวดถัดไป</p><div className="goal-preview"><div><span>เบี้ยงวดตัวอย่าง</span><strong>{amount(120000)} บาท</strong></div><div><span>เงินที่ระบุว่ากันไว้</span><strong>{amount(30000)} บาท</strong></div><div><span>เวลาที่เหลือ</span><strong>9 เดือน</strong></div><div className="goal-result"><span>ตัวอย่างควรกันเพิ่ม</span><strong>{amount(10000)} <small>บาท/เดือน</small></strong></div></div><FutureAction onClick={() => feature('Goal ออมจ่ายเบี้ย', 'ตัวอย่าง: เบี้ย 120,000 บาท หักเงินที่กันไว้ 30,000 บาท เหลือ 9 เดือน จึงกันเพิ่ม 10,000 บาทต่อเดือน โดยไม่คิดผลตอบแทน\n\nรอบที่ 2 จะเพิ่มการกรอกและคำนวณจริง เงินที่กันไว้เป็นข้อมูลผู้ใช้ระบุ ไม่ใช่ยอดเงินฝากกับ LIVERA', 'รอบ 2 · แผนเงิน')}>ดูแนวทาง Goal</FutureAction></article>
          <article className="panel planning-card"><span className="item-icon icon-blue"><Compass size={24}/></span><Badge variant="blue">เป้าหมายระยะยาว</Badge><h2>เงินใช้หลังเกษียณ</h2><p>เห็นภาพเงินที่ต้องเตรียม จากรูปแบบชีวิตที่คุณเลือก</p><div className="retirement-input-preview"><div><UserRound size={17}/><span>อายุปัจจุบัน</span><strong>35 ปี</strong></div><div><CalendarDays size={17}/><span>อายุเกษียณ</span><strong>60 ปี</strong></div><div><Wallet size={17}/><span>รายจ่ายในมูลค่าเงินวันนี้</span><strong>{amount(30000)} บาท/เดือน</strong></div><div><SlidersHorizontal size={17}/><span>ปรับเงินเฟ้อและระยะใช้เงิน</span><Check size={17}/></div></div><FutureAction onClick={() => feature('เครื่องคำนวณเงินเกษียณ', 'จะเพิ่มช่องอายุ ค่าใช้จ่าย เงินเฟ้อ เงินออม และรายรับตามเวลา พร้อมผลคำนวณที่ปรับสมมติฐานได้\n\nรอบนี้เป็นการวางโครงหน้าจอ ยังไม่มีผลประเมินความพร้อมทางการเงินจริง', 'รอบ 2 · แผนเงิน')} secondary>ดูแนวทางแผนเกษียณ</FutureAction></article></div>
          <DemoNote>ตัวเลขในหน้านี้เป็นตัวอย่างอธิบายการออกแบบ ยังไม่ใช่แผนเฉพาะบุคคล</DemoNote>
        </>}

        {route === 'club' && <>
          <PhotoHero club/>
          <SectionTitle title="กิจกรรมที่อยากชวนคุณมาเจอ" subtitle="รูปแบบและวันเวลาเป็นตัวอย่างสำหรับ Prototype"/>
          <div className="filter-chips" role="group" aria-label="กรองรูปแบบกิจกรรม">{[{ value: 'all', label: 'ทั้งหมด' }, { value: 'in-person', label: 'พบกันจริง' }, { value: 'online', label: 'ออนไลน์' }].map(filter => <button key={filter.value} className={clubFilter === filter.value ? 'filter-chip selected' : 'filter-chip'} aria-pressed={clubFilter === filter.value} onClick={() => setClubFilter(filter.value)}>{filter.value === 'in-person' ? <MapPin size={15}/> : filter.value === 'online' ? <Video size={15}/> : <CalendarDays size={15}/>}{filter.label}</button>)}</div>
          <div className="events-grid">{events.filter(event => clubFilter === 'all' || event.type === clubFilter).map(event => <article key={event.id} className={`panel event-card event-${event.type}`}><div className="event-visual"><div className="event-visual-copy"><span className="eyebrow">LIVERA CLUB</span><h3>{event.title}</h3></div><img className="event-photo" src={`${import.meta.env.BASE_URL}images/${event.type === 'online' ? 'retirement-residence' : 'retirement-club'}.webp`} alt="ภาพประกอบบรรยากาศการใช้ชีวิตหลังเกษียณ" loading="lazy"/><span className="event-date"><strong>{event.day}</strong>{event.month}</span></div><div className="event-body"><Badge variant={event.type === 'online' ? 'blue' : 'soft'}>{event.tag}</Badge><h3>{event.subtitle}</h3><p><CalendarDays size={15}/>{event.date} · {event.time}</p><p>{event.type === 'online' ? <Video size={15}/> : <MapPin size={15}/>}{event.location}</p><button className="text-link" onClick={() => eventDetail(event)}>ดูรายละเอียดตัวอย่าง<ArrowUpRight size={17}/></button></div></article>)}</div>
          <section className="community-preview panel"><div className="community-icon"><MessageCircle size={27}/></div><div><span className="eyebrow">YOUR PEOPLE, YOUR SPACE</span><h2>พื้นที่ของคนที่เตรียมบทใหม่ไปด้วยกัน</h2><p>กลุ่มเตรียมเกษียณ งานอดิเรก และประสบการณ์ดูแล สำหรับลูกค้าเท่านั้น</p></div><button className="button button-secondary" onClick={() => feature('Community สำหรับสมาชิก', 'รอบที่ 3 จะเพิ่มกลุ่ม กระทู้ ความคิดเห็น และการรายงานโพสต์แบบสาธิต\n\nข้อมูลกรมธรรม์และสุขภาพส่วนตัวจะแยกจากพื้นที่ชุมชนเสมอ', 'รอบ 3 · คลับและชุมชน')}>ดูแนวทางชุมชน<ArrowUpRight size={16}/></button></section>
        </>}

        {route === 'services' && <>
          <div className="services-intro"><span className="item-icon icon-red"><Heart size={23}/></span><div><h2>เพราะชีวิตที่ดี มีมากกว่าแผนการเงิน</h2><p>สำรวจแนวทางบริการที่เชื่อมการเตรียมตัวกับการใช้ชีวิต</p></div></div>
          <div className="services-grid">{[
            { icon: Heart, tag: 'PRIVATE CONSULTATION', title: 'สุขภาพกายและใจ', body: 'แนวทางนัดปรึกษาส่วนตัวกับแพทย์หรือผู้เชี่ยวชาญ แยกจากกิจกรรมคลับ', round: 'รอบ 4 · บริการส่วนตัว', detail: 'เลือกสุขภาพกายหรือใจ เลือกสาขา แจ้งวันเวลาที่สะดวก ดูค่าบริการและสิทธิ แล้วส่งคำขอให้ประสานนัด\n\nยังไม่มีการนัดหรือส่งข้อมูลสุขภาพจริงใน Prototype', action: 'ดูขั้นตอนนัดส่วนตัว', color: 'red' },
            { icon: ShieldCheck, tag: 'COVERAGE REVIEW', title: 'ทบทวนความคุ้มครอง', body: 'มองความต้องการและงบของคุณร่วมกับแผนเดิม ก่อนพิจารณาทางเลือก', round: 'รอบ 4 · บริการส่วนตัว', detail: 'วางแบบสำรวจความต้องการ งบ และข้อมูลที่ยินยอมให้ใช้ ก่อนให้ผู้เชี่ยวชาญประเมิน\n\nไม่มีการรับรองว่าจะรับประกันหรือคุ้มครองโรคประจำตัว และไม่ใช้ข้อมูลจากการปรึกษาแพทย์โดยปริยาย', action: 'ดูแนวทางประเมิน', color: 'blue' },
            { icon: BookOpen, tag: 'KNOWLEDGE FOR LIFE', title: 'ข่าวและคลิปความรู้', body: 'ข่าวภาครัฐ เรื่องเกษียณ และคลิปสั้นที่ช่วยให้เข้าใจแผนของคุณ', round: 'รอบ 5 · ความรู้และบัญชี', detail: 'จะเพิ่มข่าวที่มีแหล่งข้อมูลและวันที่ พร้อมคลิปแนวตั้งที่มีคำบรรยายและเนื้อหาสรุป\n\nรอบนี้แสดงโครงหมวดหมู่ ยังไม่ได้ดึงข่าวหรือเล่นคลิปจริง', action: 'ดูแนวทางความรู้', color: 'warm' },
            { icon: MapPin, tag: 'LIVING YOUR WAY', title: 'บ้านพักและบริการดูแล', body: 'สำรวจรูปแบบชีวิต ทําเล และระดับการดูแลที่อยากเตรียมไว้', round: 'แนวทางบริการระยะถัดไป', detail: 'การเปรียบเทียบบ้านพักและบริการดูแลจะใช้ข้อมูลราคา ระดับการดูแล และวันที่อัปเดตจากคู่ค้าจริง\n\nPrototype ยังไม่มีการจองห้องพักหรือรับประกันสิทธิเข้าพัก', action: 'ดูแนวทางบริการดูแล', color: 'sage' },
          ].map(({ icon: Icon, title, tag, body, detail, action, color, round }) => <article key={title} className="panel service-card"><div className="service-card-top"><span className={`item-icon icon-${color}`}><Icon size={24}/></span><ArrowUpRight size={20}/></div><span className="eyebrow">{tag}</span><h2>{title}</h2><p>{body}</p><button className="text-link" onClick={() => feature(title, detail, round)}>{action}<ChevronRight size={17}/></button></article>)}</div>
          <div className="privacy-note"><LockKeyhole size={22}/><div><strong>พื้นที่ส่วนตัวของคุณ ยังคงเป็นส่วนตัว</strong><p>ข้อมูลสุขภาพและการเงินไม่เปิดเผยใน Community หรือใช้เสนอขายโดยอัตโนมัติ</p></div></div>
        </>}

        </div>
        <footer className="page-footer"><span>© LIVERA · A New Era of Living</span><span>ต้นแบบรอบ 1 <span className="footer-dot">·</span> ข้อมูลสมมติทั้งหมด</span></footer>
      </main>
    </div>

    <nav className="mobile-nav" aria-label="เมนูหลักบนมือถือ">{nav.map(({ route: value, label, icon: Icon }) => <a href={`#/${value}`} key={value} className={route === value ? 'active' : ''} aria-current={route === value ? 'page' : undefined}><span><Icon size={21} strokeWidth={route === value ? 2.15 : 1.65}/></span><small>{label}</small></a>)}</nav>
    {notice && <div className="toast" role="status"><Check size={18}/>{notice}</div>}
    {dialog && <Modal title={dialog.kind === 'settings' ? 'บัญชีและการตั้งค่า' : dialog.kind === 'notifications' ? 'การแจ้งเตือน' : dialog.kind === 'reset' ? 'คืนค่าประวัติสาธิต' : dialog.title} eyebrow={dialog.kind === 'feature' ? dialog.round : 'LIVERA DEMO'} onClose={() => setDialog(null)}>
      {dialog.kind === 'feature' && <><div className="feature-modal-icon"><Sparkles size={28}/></div><p className="feature-body">{dialog.body}</p><DemoNote/><button className="button button-primary modal-done" onClick={() => setDialog(null)}>เข้าใจแล้ว<Check size={17}/></button></>}
      {dialog.kind === 'reset' && <><p className="feature-body">รายการที่คุณเพิ่มและไฟล์แนบในเบราว์เซอร์นี้จะถูกล้าง แล้วกลับเป็นข้อมูลตั้งต้น 21 รายการ การตั้งค่าการแสดงผลจะกลับค่าเริ่มต้นด้วย</p>{resetError && <p className="form-error" role="alert">{resetError}</p>}<div className="flow-actions"><button className="button button-secondary" disabled={resetting} onClick={() => setDialog({kind:'settings'})}>เก็บข้อมูลไว้</button><button className="button button-danger" disabled={resetting || Boolean(ledger.error)} onClick={async () => { if(resetting) return; setResetting(true); setResetError(''); try { await ledger.reset(); reset(); try { sessionStorage.removeItem('livera:round1:payment-draft'); } catch { /* Optional draft. */ } setDialog(null); setNotice('คืนค่าประวัติและไฟล์สาธิตแล้ว'); } catch { setResetError('คืนค่าไม่สำเร็จ กรุณาลองใหม่'); } finally { setResetting(false); } }}>{resetting ? <LoaderCircle size={17} className="spin"/> : <RotateCcw size={17}/>}ยืนยันคืนค่าประวัติ</button></div></>}
      {dialog.kind === 'settings' && <><div className="profile-summary"><span className="avatar avatar-large">{member.initials}</span><div><strong>คุณ{member.fullName}</strong><span>{member.membership} · บัญชีสมมติ</span></div></div><div className="settings-list"><button className="setting-row" role="switch" aria-checked={preferences.hideAmounts} onClick={() => setPreferences(p => ({ ...p, hideAmounts: !p.hideAmounts }))}><EyeOff size={20}/><span><strong>ซ่อนยอดเงิน</strong><small>ปิดบังตัวเลขเงินบนหน้าจอ</small></span><span className={`switch ${preferences.hideAmounts ? 'on' : ''}`} aria-hidden="true"/></button><button className="setting-row" role="switch" aria-checked={preferences.largeText} onClick={() => setPreferences(p => ({ ...p, largeText: !p.largeText }))}><Settings2 size={20}/><span><strong>ตัวอักษรใหญ่</strong><small>เพิ่มขนาดข้อความสำหรับอ่านสะดวก</small></span><span className={`switch ${preferences.largeText ? 'on' : ''}`} aria-hidden="true"/></button><button className="setting-row" onClick={() => { reset(); setNotice('คืนค่าการตั้งค่าสาธิตแล้ว'); }}><RotateCcw size={20}/><span><strong>คืนค่าการแสดงผล</strong><small>ตั้งค่าการแสดงผลกลับเป็นค่าเริ่มต้น</small></span><ChevronRight size={17}/></button><button className="setting-row" onClick={() => { setResetError(''); setDialog({kind:'reset'}); }}><RotateCcw size={20}/><span><strong>คืนค่าประวัติสาธิต</strong><small>ล้างรายการที่เพิ่มและไฟล์แนบ แล้วเริ่มใหม่</small></span><ChevronRight size={17}/></button></div><DemoNote>รายการและไฟล์เก็บในเบราว์เซอร์นี้เท่านั้น ไม่ซิงก์ข้ามเครื่อง ไม่มีการส่งข้อมูลให้บริษัทประกัน</DemoNote></>}
      {dialog.kind === 'notifications' && <>{totals.pending > 0 && <div className="notification-item"><span className="item-icon icon-red"><FileText size={21}/></span><div><strong>มี {totals.pending} รายการรอตรวจหลักฐาน</strong><p>คุณแนบไฟล์และบันทึกไว้ในเบราว์เซอร์นี้แล้ว</p><a className="text-link" href="#/policies" onClick={() => setDialog(null)}>ดูรายการกรมธรรม์<ArrowUpRight size={15}/></a></div></div>}<div className="notification-item"><span className="item-icon icon-red"><CalendarDays size={21}/></span><div><strong>งวดถัดไปในแผนตัวอย่าง</strong><p>{nextPolicy?.name ?? 'ทุกแผนบันทึกครบ'} · {nextPolicy ? amount(outstanding(ledger.entries, nextPolicy, nextPolicy.nextPeriod ?? 0) / 100) : '—'} บาท</p><small>{nextPolicy?.nextDue ?? 'รอทบทวนตาราง'} · ข้อมูลสาธิต</small></div></div><div className="notification-item"><span className="item-icon icon-blue"><Users size={21}/></span><div><strong>รู้จัก Retirement Luxury Club</strong><p>พบกันจริงและออนไลน์ สำหรับลูกค้าทุกช่วงวัย</p><a className="text-link" href="#/club" onClick={() => setDialog(null)}>สำรวจคลับ<ArrowUpRight size={15}/></a></div></div><DemoNote>การแจ้งเตือนตัวอย่างภายในแอป ยังไม่ส่ง SMS อีเมล หรือแจ้งเตือนตามเวลาจริง</DemoNote></>}
    </Modal>}
    {paymentPolicy && <PaymentFlow initialPolicy={paymentPolicy} ledger={ledger} onClose={() => setPaymentPolicy(undefined)} onComplete={() => setNotice('บันทึกเรียบร้อย ยอดทุกหน้าอัปเดตแล้ว')}/>}
  </div>;
}
