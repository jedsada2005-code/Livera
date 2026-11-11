import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, ExternalLink, GitCompareArrows, Search, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { PolicyAreaTabs } from '../components/AreaTabs';
import { Badge, Modal } from '../components/ui';
import { insuranceCheckedOn, insuranceCompanies, insurancePlans, coverLabel, findInsurancePlan } from '../data/insuranceCatalog';
import type { InsurancePlan } from '../data/insuranceCatalog';
import { emptyFilters, filterPlans, validateScenario } from '../domain/discovery';
import type { DiscoveryFilters, Scenario } from '../domain/discovery';
import { useDiscovery } from '../hooks/useDiscovery';
import { useJourney } from '../hooks/useJourney';
import { useServiceLocation } from '../routing';
import { formatDate, parseSatang } from '../domain/ledger';

const root = '#/policies/discover';
const money = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });
const message = (e: unknown) => e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่';
export function InsurerLogo({ providerId }: { providerId: string }) {
  const company = insuranceCompanies.find(p => p.id === providerId)!;
  return <span className="discovery-company"><img src={`${import.meta.env.BASE_URL}${company.logo}`} alt={`โลโก้ ${company.name}`} width="94" height="36"/><span>{company.name}</span></span>;
}
export function InsuranceDiscovery({ hideAmounts, showAmounts, onNotice }: { hideAmounts: boolean; showAmounts: () => void; onNotice: (s: string) => void }) {
  const discovery = useDiscovery();
  const journey = useJourney();
  const location = useServiceLocation();
  const [filters, setFilters] = useState<DiscoveryFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<'filters' | 'reset' | null>(null);
  const [error, setError] = useState('');
  const [detailTab, setDetailTab] = useState('overview');
  const heading = useRef<HTMLHeadingElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const id = location.id;
  const savedView = id === 'saved';
  const compareView = id === 'compare';
  const legacyProvider = insuranceCompanies.some(c => c.id === id) ? id : '';
  const plan = findInsurancePlan(id);
  const isList = !id || savedView || !!legacyProvider;
  useEffect(() => { setError(''); setDetailTab('overview'); setPage(1); }, [id]);
  useEffect(() => { if(error){errorBox.current?.scrollIntoView({block:'center'});errorBox.current?.focus({preventScroll:true});} }, [error]);
  useEffect(() => { if (!discovery.loading) heading.current?.focus({ preventScroll: true }); }, [id, discovery.loading]);
  const scenario = discovery.data.scenario;
  // Hiding amounts also stops private saved inputs influencing public search results.
  const publicScenario: Scenario = hideAmounts ? { age: null, annualBudgetSatang: null, sumAssuredSatang: null } : scenario;
  const effectiveFilters = { ...filters, providerId: legacyProvider || filters.providerId };
  const list = filterPlans(insurancePlans.filter(p => !savedView || discovery.data.savedIds.includes(p.id)), effectiveFilters, publicScenario);
  const pages = Math.max(1, Math.ceil(list.length / 3));
  const currentPage = Math.min(page, pages);
  const shown = list.slice((currentPage - 1) * 3, currentPage * 3);
  const compared = discovery.data.compareIds.map(id => findInsurancePlan(id)!);
  const pending = discovery.loading || discovery.busy || !!discovery.error;
  const execute = async (work: () => Promise<unknown>, notice?: string) => { setError(''); try { await work(); if (notice) onNotice(notice); } catch (e) { setError(message(e)); } };
  const save = (p: InsurancePlan) => void execute(() => discovery.run({ type: 'save', id: p.id, value: !discovery.data.savedIds.includes(p.id) }), discovery.data.savedIds.includes(p.id) ? 'นำออกจากแผนที่บันทึกแล้ว' : 'บันทึกแผนไว้แล้ว');
  const compare = (p: InsurancePlan) => void execute(() => discovery.run({ type: 'compare', id: p.id, value: !discovery.data.compareIds.includes(p.id) }));
  const interest = (p: InsurancePlan) => void execute(async () => {
    await journey.run({ type: 'plan-interest', planId: p.id, value: true });
    onNotice('เก็บแผนที่สนใจในเส้นทางแล้ว ยังไม่มีการซื้อหรือรวมเงิน');
    window.location.hash = '/retirement/future/summary';
  });
  const changeFilters = (next: DiscoveryFilters) => { setFilters(next); setPage(1); };
  const actions = (p: InsurancePlan) => <div className="discovery-card-actions"><a className="button button-primary" href={`${root}/${p.id}`}>ดูรายละเอียด<ArrowRight size={16}/></a><button className="discovery-compare-toggle" aria-pressed={discovery.data.compareIds.includes(p.id)} disabled={pending} onClick={() => compare(p)}><GitCompareArrows size={17}/>{discovery.data.compareIds.includes(p.id) ? 'เลือกแล้ว' : 'เปรียบเทียบ'}</button></div>;

  return <div className={`discovery-page ${compared.length && !compareView ? 'has-compare' : ''}`}>
    <PolicyAreaTabs discover/>
    {(discovery.error || journey.error) && <div className="storage-error" role="alert"><p>{discovery.error || journey.error}</p><button className="button button-secondary" onClick={() => { void discovery.refresh(); void journey.refresh(); }}>ลองโหลดอีกครั้ง</button>{discovery.error && <button className="text-link" onClick={() => setDialog('reset')}>คืนค่าเฉพาะรายการค้นหาแผน</button>}</div>}
    <nav className="discovery-tabs" aria-label="ส่วนค้นหาแผน"><a href={root} aria-current={isList && !savedView ? 'page' : undefined}><Search size={17}/>ค้นหา</a><a href={`${root}/saved`} aria-current={savedView ? 'page' : undefined}><Bookmark size={17}/>บันทึกไว้ <b>{discovery.data.savedIds.length}</b></a><a href={`${root}/compare`} aria-current={compareView ? 'page' : undefined}><GitCompareArrows size={17}/>เทียบแผน <b>{compared.length}</b></a></nav>
    {error && <div className="discovery-error" role="alert" tabIndex={-1} ref={errorBox}><p>{error}</p><button className="icon-button" aria-label="ปิดข้อความข้อผิดพลาด" onClick={() => setError('')}><X size={17}/></button></div>}
    {discovery.loading ? <p role="status">กำลังเปิดแคตตาล็อกประกัน…</p> : isList ? <>
      <section className="discovery-hero"><div><span className="eyebrow">A PLAN FOR YOUR NEXT CHAPTER</span><h2 ref={heading} tabIndex={-1}>{savedView ? 'แผนที่คุณอยากกลับมาดู' : <>เลือกแผนวันนี้<br/><span>ให้พอดีกับชีวิตข้างหน้า</span></>}</h2><p>เริ่มจากประกันสะสมทรัพย์ · 6 แผน จาก 2 บริษัท</p></div><div className="discovery-hero-mark" aria-hidden="true"><ShieldCheck size={54}/><span>เลือกอย่างเข้าใจ<br/>วางแผนอย่างมั่นใจ</span></div></section>
      <div className="discovery-search"><label><Search size={19}/><input aria-label="ค้นหาชื่อแผนหรือบริษัทประกัน" placeholder="เช่น ออมทรัพย์, AIA, เมืองไทย" value={filters.query} maxLength={100} onChange={e => changeFilters({ ...filters, query: e.target.value })}/></label><button className="button button-secondary" onClick={() => setDialog('filters')}><SlidersHorizontal size={18}/>ตัวกรอง</button></div>
      <div className="discovery-provider-filters" aria-label="กรองบริษัทประกัน"><button aria-pressed={!effectiveFilters.providerId} onClick={() => { if (legacyProvider) window.location.hash = '/policies/discover'; changeFilters({ ...filters, providerId: '' }); }}>ทุกบริษัท</button>{insuranceCompanies.map(c => <button key={c.id} aria-pressed={effectiveFilters.providerId === c.id} onClick={() => { if (legacyProvider) window.location.hash = '/policies/discover'; changeFilters({ ...filters, providerId: c.id }); }}><img src={`${import.meta.env.BASE_URL}${c.logo}`} alt=""/>{c.name}</button>)}</div>
      <div className="discovery-result-line" ref={results}><span role="status">{savedView ? 'ที่บันทึกไว้' : 'พบ'} <strong>{list.length}</strong> แผน{pages > 1 ? ` · หน้า ${currentPage}/${pages}` : ''}</span><button className="text-link" onClick={() => setDialog('filters')}>{hideAmounts ? 'เงื่อนไขส่วนตัวถูกซ่อน' : scenario.age === null ? 'ตั้งเงื่อนไขของคุณ' : `สำหรับอายุ ${scenario.age} ปี`}<SlidersHorizontal size={14}/></button></div>
      {!hideAmounts && scenario.annualBudgetSatang !== null && <p className="discovery-budget-note">งบที่ระบุ {money.format(scenario.annualBudgetSatang / 100)} บาท/ปี · ทั้ง {list.length} แผนยังรอใบเสนอราคา จึงยังยืนยันว่าอยู่ในงบไม่ได้</p>}
      <div className="discovery-grid">{shown.map(p => <article className="discovery-card" key={p.id}><div className="discovery-card-top"><InsurerLogo providerId={p.providerId}/><button className={`icon-button ${discovery.data.savedIds.includes(p.id) ? 'is-saved' : ''}`} aria-label={`${discovery.data.savedIds.includes(p.id) ? 'เลิกบันทึก' : 'บันทึก'} ${p.name}`} aria-pressed={discovery.data.savedIds.includes(p.id)} disabled={pending} onClick={() => save(p)}><Bookmark size={20}/></button></div><span className="discovery-category">สะสมทรัพย์</span><h3><a href={`${root}/${p.id}`}>{p.name}</a></h3><p className="discovery-highlight">{p.highlight}</p><dl className="discovery-metrics"><div><dt>จ่ายเบี้ย</dt><dd>{p.payYears === 1 ? 'ครั้งเดียว' : `${p.payYears} ปี`}</dd></div><div><dt>คุ้มครอง</dt><dd>{coverLabel(p)}</dd></div></dl><div className="discovery-card-quote"><span>เบี้ยสำหรับคุณ</span><strong>รอใบเสนอราคา</strong></div>{actions(p)}</article>)}</div>
      {!list.length && <div className="panel knowledge-empty"><Search size={28}/><h3>{savedView && !discovery.data.savedIds.length ? 'ยังไม่มีแผนที่บันทึกไว้' : 'ยังไม่พบแผนตามเงื่อนไขนี้'}</h3><p>{filters.category !== 'endowment' ? 'รอบนี้มีข้อมูลเฉพาะสะสมทรัพย์ หมวดอื่นอยู่ระหว่างรวบรวม' : 'ลองเปลี่ยนคำค้น บริษัท หรือช่วงเวลาที่ต้องการ'}</p>{savedView && !discovery.data.savedIds.length ? <a className="button button-secondary" href={root}>ค้นหาแผนเพื่อบันทึก</a> : <button className="button button-secondary" onClick={() => setDialog('filters')}>ปรับตัวกรอง</button>}</div>}
      {pages > 1 && <nav className="discovery-pagination" aria-label="หน้ารายการประกัน"><button disabled={currentPage === 1} onClick={() => { setPage(currentPage - 1);results.current?.scrollIntoView({block:'start'}); }}><ChevronLeft size={16}/>ก่อนหน้า</button><span>{currentPage} / {pages}</span><button disabled={currentPage === pages} onClick={() => { setPage(currentPage + 1);results.current?.scrollIntoView({block:'start'}); }}>ถัดไป<ChevronRight size={16}/></button></nav>}
    </> : plan ? <>
      <a className="text-link back-link" href={root}><ArrowLeft size={16}/>กลับไปค้นหาแผน</a>
      <article className="panel discovery-detail"><div className="discovery-detail-heading"><InsurerLogo providerId={plan.providerId}/><button className="button button-secondary" disabled={pending} aria-pressed={discovery.data.savedIds.includes(plan.id)} onClick={() => save(plan)}><Bookmark size={17}/>{discovery.data.savedIds.includes(plan.id) ? 'บันทึกแล้ว' : 'บันทึกแผน'}</button></div><Badge variant="blue">สะสมทรัพย์ · อ้างอิงบริษัทประกัน</Badge><h2 tabIndex={-1} ref={heading}>{plan.name}</h2><p className="discovery-english">{plan.englishName}</p><p>{plan.highlight}</p><dl className="discovery-metrics"><div><dt>ระยะจ่ายเบี้ย</dt><dd>{plan.payYears === 1 ? 'ครั้งเดียว' : `${plan.payYears} ปี`}</dd></div><div><dt>ระยะคุ้มครอง</dt><dd>{coverLabel(plan)}</dd></div><div><dt>ช่วงอายุในผลิตภัณฑ์</dt><dd>{plan.ageLabel}</dd></div></dl>
      <div className="discovery-detail-tabs" role="tablist" aria-label="รายละเอียดผลิตภัณฑ์">{[['overview','ภาพรวม'],['benefits','เงินคืนและเงินครบสัญญา'],['conditions','เงื่อนไข']].map(([value,label]) => <button role="tab" id={`tab-${value}`} aria-selected={detailTab === value} aria-controls={`panel-${value}`} tabIndex={detailTab === value ? 0 : -1} key={value} onClick={() => setDetailTab(value)} onKeyDown={e => { const tabs = ['overview','benefits','conditions']; const i = tabs.indexOf(value); const next = e.key === 'ArrowRight' ? tabs[(i+1)%3] : e.key === 'ArrowLeft' ? tabs[(i+2)%3] : e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[2] : null; if(next){e.preventDefault();setDetailTab(next);document.getElementById(`tab-${next}`)?.focus();} }}>{label}</button>)}</div>
      <div className="discovery-detail-panel" role="tabpanel" id={`panel-${detailTab}`} aria-labelledby={`tab-${detailTab}`} tabIndex={0}>{detailTab === 'overview' ? <><h3>รู้จังหวะเงิน ก่อนตัดสินใจ</h3><p>ดูระยะจ่ายเบี้ยและช่วงรับผลประโยชน์ให้ตรงกับเป้าหมาย แล้วขอใบเสนอราคาโดยใช้ข้อมูลของคุณจริง</p><div className="discovery-pending"><ShieldCheck size={24}/><div><strong>เบี้ย มูลค่าเวนคืน และผลตอบแทนสุทธิ</strong><p>รอใบเสนอราคาและตารางรายบุคคล จึงยังไม่คำนวณยอดเงินสำหรับคุณ</p></div></div></> : detailTab === 'benefits' ? <><p className="discovery-basis">เปอร์เซ็นต์ด้านล่างคิดจากทุนประกัน ไม่ใช่อัตราผลตอบแทนหรือเปอร์เซ็นต์ของเบี้ยที่จ่าย</p><ol className="discovery-timeline">{plan.benefits.map((b,i) => <li key={b.when}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{b.when}</h3><p>{b.description}</p></div></li>)}</ol><p className="discovery-note">สรุปเฉพาะผลประโยชน์กรณีมีชีวิตอยู่ตามเงื่อนไข ดูความคุ้มครองชีวิต ข้อยกเว้น หนี้สิน และตารางฉบับเต็มจากต้นทาง</p></> : <><h3>ก่อนเลือกแผนนี้</h3><ul>{plan.conditions.map(c => <li key={c}>{c}</li>)}</ul><p>ช่วงอายุเป็นข้อมูลคัดกรองเบื้องต้น การนับอายุ อาชีพ สุขภาพ และการรับประกันต้องตรวจตามเกณฑ์ของบริษัทอีกครั้ง</p><p>เวนคืนก่อนกำหนดอาจได้เงินน้อยกว่าเบี้ยที่จ่าย การใช้สิทธิภาษีต้องตรวจหลักเกณฑ์ของปีที่ใช้สิทธิ</p></>}</div>
      <Source plan={plan}/><div className="discovery-detail-actions"><button className="button button-secondary" disabled={pending} aria-pressed={discovery.data.compareIds.includes(plan.id)} onClick={() => compare(plan)}><GitCompareArrows size={18}/>{discovery.data.compareIds.includes(plan.id) ? 'นำออกจากการเทียบ' : 'เพิ่มเพื่อเปรียบเทียบ'}</button><button className="button button-primary" disabled={journey.busy || journey.loading || !!journey.error} onClick={() => interest(plan)}>{journey.data.interestedPlanIds.includes(plan.id) ? 'ไปดูในเส้นทางของฉัน' : 'ลองใส่ในแผนของฉัน'}<ArrowRight size={17}/></button></div><p className="discovery-note">เก็บไว้เป็นแผนที่สนใจ ยังไม่เพิ่มเป็นสินทรัพย์หรือกรมธรรม์ที่ซื้อแล้ว</p></article>
    </> : compareView ? <>
      <div className="discovery-compare-heading"><div><span className="eyebrow">SIDE BY SIDE</span><h2 ref={heading} tabIndex={-1}>เทียบให้เห็น ก่อนเลือกแผน</h2><p>เลือก 2–3 แผน ใช้เงื่อนไขส่วนตัวชุดเดียวกัน</p></div><button className="button button-secondary" onClick={() => setDialog('filters')}><SlidersHorizontal size={17}/>เงื่อนไขของฉัน</button></div>
      <ScenarioSummary scenario={scenario} hidden={hideAmounts}/>
      {compared.length < 2 ? <div className="panel knowledge-empty"><GitCompareArrows size={30}/><h3>เลือกเพิ่มอีก {2-compared.length} แผนเพื่อเริ่มเทียบ</h3><a className="button button-primary" href={root}>ค้นหาแผนเพิ่ม<ArrowRight size={16}/></a></div> : <><p className="discovery-basis">เทียบโครงสร้างและเวลาได้ แต่ยังจัดอันดับความคุ้มค่าหรือยืนยันเบี้ยในงบไม่ได้ เพราะยังไม่มีใบเสนอราคาภายใต้เงื่อนไขเดียวกัน</p><div className="discovery-table-scroll" role="region" aria-label="ตารางเปรียบเทียบแผน เลื่อนซ้ายขวาเพื่อดูทุกแผน" tabIndex={0}><table className="discovery-table"><caption>เปรียบเทียบประกันสะสมทรัพย์ {compared.length} แผน · เลื่อนซ้ายขวาบนมือถือ</caption><thead><tr><th scope="col">หัวข้อ</th>{compared.map(p => <th scope="col" key={p.id}><InsurerLogo providerId={p.providerId}/><a href={`${root}/${p.id}`}>{p.name}</a><button className="text-link" disabled={pending} onClick={() => compare(p)} aria-label={`นำ ${p.name} ออกจากการเปรียบเทียบ`}><X size={14}/>นำออก</button></th>)}</tr></thead><tbody>{[
        ['จ่ายเบี้ย', (p: InsurancePlan) => p.payYears === 1 ? 'ครั้งเดียว' : `${p.payYears} ปี`],
        ['คุ้มครอง', (p: InsurancePlan) => coverLabel(p)],
        ['ช่วงอายุ', (p: InsurancePlan) => p.ageLabel],
        ['อายุตามที่คุณระบุ', (p: InsurancePlan) => hideAmounts ? 'ซ่อนข้อมูล' : scenario.age === null ? 'ยังไม่ระบุ' : scenario.age >= p.ageMinYears && scenario.age <= p.ageMaxYears ? 'อยู่ในช่วงอายุผลิตภัณฑ์*' : 'อยู่นอกช่วงอายุผลิตภัณฑ์'],
        ['เบี้ยภายใต้เงื่อนไขนี้', () => 'รอใบเสนอราคา'],
        ['ตรวจงบที่ระบุ', () => hideAmounts ? 'ซ่อนข้อมูล' : scenario.annualBudgetSatang === null ? 'ยังไม่ระบุงบ' : 'ยังยืนยันไม่ได้'],
        ['เงินคืนระหว่างทาง', (p: InsurancePlan) => `${p.benefits[0].when} · ${p.benefits[0].description}`],
        ['เงินครบสัญญา', (p: InsurancePlan) => `${p.benefits[1].when} · ${p.benefits[1].description}`],
        ['มูลค่าเวนคืน / ผลตอบแทนสุทธิ', () => 'รอตารางรายบุคคล'],
      ].map(([label,value]) => <tr key={label as string}><th scope="row">{label as string}</th>{compared.map(p => <td key={p.id}>{(value as (p: InsurancePlan) => string)(p)}</td>)}</tr>)}<tr><th scope="row">ไปต่อ</th>{compared.map(p => <td key={p.id}><button className="button button-primary" disabled={journey.loading || journey.busy || !!journey.error} onClick={() => interest(p)}>ลองใส่ในแผน<ArrowRight size={15}/></button><Source plan={p}/></td>)}</tr></tbody></table></div><p className="discovery-note">* การรับประกันยังขึ้นกับวิธีนับอายุและเกณฑ์บริษัท · เปอร์เซ็นต์ผลประโยชน์อ้างอิงทุนประกันตามแต่ละแบบ ไม่ใช่อัตราผลตอบแทนบนเบี้ย</p></>}
      {!!compared.length && <div className="discovery-selected-list"><span>เลือกไว้ {compared.length}/3 แผน</span>{compared.map(p => <button key={p.id} disabled={pending} onClick={() => compare(p)}>{p.name}<X size={14}/></button>)}<button className="text-link" disabled={pending} onClick={() => void execute(() => discovery.run({ type: 'clear-compare' }))}>ล้างการเลือก</button></div>}
    </> : <div className="panel knowledge-empty"><h2 ref={heading} tabIndex={-1}>ไม่พบแผนนี้</h2><a className="button button-primary" href={root}>กลับไปค้นหาแผน</a></div>}
    {!discovery.loading && <p className="discovery-reference-note">แคตตาล็อกอ้างอิงสาธารณะ · ตรวจต้นทาง {formatDate(insuranceCheckedOn,true)} · รายชื่อและโลโก้ยังไม่ยืนยันสถานะคู่สัญญากับ LIVERA</p>}
    {!!compared.length && !compareView && <aside className="discovery-compare-tray" aria-label="แผนที่เลือกเปรียบเทียบ"><div><GitCompareArrows size={20}/><span><strong>เลือกไว้ {compared.length}/3 แผน</strong><small>{compared.length < 2 ? 'เลือกอีก 1 แผนเพื่อเริ่มเทียบ' : 'พร้อมเปิดดูข้างกัน'}</small></span></div><a className="button button-primary" href={`${root}/compare`}>ดูการเทียบ<ArrowRight size={16}/></a></aside>}
    {dialog === 'filters' && <Modal title="เงื่อนไขค้นหาและเปรียบเทียบ" onClose={() => setDialog(null)} canClose={!discovery.busy}><FilterForm key={`${discovery.data.scenario.age}/${hideAmounts}`} filters={filters} scenario={scenario} hidden={hideAmounts} showAmounts={showAmounts} busy={pending} onApply={async (next,context) => { await discovery.run({ type: 'scenario', scenario: context }); changeFilters(next); if(legacyProvider)window.location.hash='/policies/discover';setDialog(null); }}/></Modal>}
    {dialog === 'reset' && <Modal title="คืนค่ารายการค้นหาแผน" onClose={() => setDialog(null)} canClose={!discovery.busy}><p>ล้างแผนที่บันทึก รายการเทียบ และเงื่อนไขส่วนตัวของหน้าค้นหานี้เท่านั้น</p><button className="button button-danger" disabled={discovery.busy} onClick={() => void execute(async () => { await discovery.reset(); setDialog(null); })}>ยืนยันคืนค่า</button></Modal>}
  </div>;
}
function Source({ plan }: { plan: InsurancePlan }) {
  return <div className="discovery-source"><a href={plan.sourceUrl} target="_blank" rel="noopener noreferrer">ข้อมูลบริษัทประกัน<ExternalLink size={13}/></a>{plan.brochureUrl && <a href={plan.brochureUrl} target="_blank" rel="noopener noreferrer">โบรชัวร์ PDF<ExternalLink size={13}/></a>}<small>ตรวจต้นทาง {formatDate(insuranceCheckedOn,true)}</small></div>;
}
function ScenarioSummary({ scenario, hidden }: { scenario: Scenario; hidden: boolean }) {
  return <div className="discovery-scenario"><ShieldCheck size={20}/><p>{hidden ? 'เงื่อนไขส่วนตัวถูกซ่อน เปิดแสดงยอดในบัญชีเพื่อดู' : <>อายุ {scenario.age ?? 'ยังไม่ระบุ'} ปี · งบเบี้ย {scenario.annualBudgetSatang === null ? 'ยังไม่ระบุ' : `${money.format(scenario.annualBudgetSatang/100)} บาท/ปี`} · ทุนประกันที่อยากขอเทียบ {scenario.sumAssuredSatang === null ? 'ยังไม่ระบุ' : `${money.format(scenario.sumAssuredSatang/100)} บาท`}<small>เป็นเงื่อนไขที่คุณระบุ ไม่ใช่ใบเสนอราคา และยังไม่ได้ส่งให้บริษัทประกัน</small></>}</p></div>;
}
function FilterForm({ filters, scenario, hidden, showAmounts, busy, onApply }: { filters: DiscoveryFilters; scenario: Scenario; hidden: boolean; showAmounts: () => void; busy: boolean; onApply: (f: DiscoveryFilters, s: Scenario) => Promise<void> }) {
  const [draft, setDraft] = useState(filters);
  const [age, setAge] = useState(scenario.age === null ? '' : String(scenario.age));
  const [budget, setBudget] = useState(scenario.annualBudgetSatang === null ? '' : String(scenario.annualBudgetSatang/100));
  const [sum, setSum] = useState(scenario.sumAssuredSatang === null ? '' : String(scenario.sumAssuredSatang/100));
  const [error, setError] = useState('');
  const parseMoney = (value: string) => { if (!value.trim()) return null; const parsed = parseSatang(value.trim()); if (parsed === null) throw new Error('กรอกจำนวนเงินเป็นตัวเลข ไม่เกิน 2 ตำแหน่งทศนิยม'); return parsed; };
  return <form className="discovery-filter-form" noValidate onSubmit={async e => { e.preventDefault(); setError(''); try { const context = hidden ? scenario : validateScenario({ age: !age.trim() ? null : /^\d+$/.test(age.trim()) ? Number(age) : NaN, annualBudgetSatang: parseMoney(budget), sumAssuredSatang: parseMoney(sum) }); await onApply(draft,context); } catch(e) { setError(message(e)); } }}>
    <div className="discovery-form-grid"><label>หมวดประกัน<select value={draft.category} onChange={e => setDraft({ ...draft,category:e.target.value })}><option value="endowment">สะสมทรัพย์</option><option value="pension">บำนาญ (ยังไม่มีข้อมูล)</option><option value="health">สุขภาพ (ยังไม่มีข้อมูล)</option></select></label><label>บริษัท<select value={draft.providerId} onChange={e => setDraft({ ...draft,providerId:e.target.value })}><option value="">ทุกบริษัท</option>{insuranceCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>จ่ายเบี้ยไม่เกิน<select value={draft.maxPayYears??''} onChange={e => setDraft({ ...draft,maxPayYears:e.target.value?Number(e.target.value):null })}><option value="">ไม่จำกัด</option>{[1,5,10,15,16,20].map(n => <option value={n} key={n}>{n === 1 ? 'ครั้งเดียว' : `${n} ปี`}</option>)}</select></label><label>คุ้มครองไม่เกิน<select value={draft.maxCoverYears??''} onChange={e => setDraft({ ...draft,maxCoverYears:e.target.value?Number(e.target.value):null })}><option value="">ไม่จำกัด</option>{[11,20,25,40,60,81].map(n => <option key={n} value={n}>{n} ปี</option>)}</select></label></div>
    <fieldset disabled={busy}><legend>เงื่อนไขเดียวกันสำหรับทุกแผน</legend>{hidden ? <div className="discovery-locked"><p>เปิดแสดงยอดเพื่อใส่อายุ งบเบี้ย และทุนประกัน</p><button type="button" className="button button-secondary" onClick={showAmounts}>เปิดแสดงยอด</button></div> : <div className="discovery-form-grid"><label>อายุปัจจุบัน (ปี)<input inputMode="numeric" value={age} maxLength={3} placeholder="เว้นว่างได้" onChange={e => setAge(e.target.value)}/></label><label>งบเบี้ยที่ตั้งไว้ (บาท/ปี)<input inputMode="decimal" value={budget} maxLength={16} placeholder="เว้นว่างได้" onChange={e => setBudget(e.target.value)}/></label><label className="discovery-full-field">ทุนประกันที่อยากขอเทียบ (บาท)<input inputMode="decimal" value={sum} maxLength={16} placeholder="เว้นว่างได้ · ไม่ใช่ยอดเบี้ย" onChange={e => setSum(e.target.value)}/></label></div>}<p className="discovery-note">เก็บในเบราว์เซอร์นี้ · งบเบี้ยใช้เป็นโจทย์ขอราคา ยังไม่ตัดแผนที่ไม่ทราบเบี้ยออก · ทุนประกันยังไม่ใช้คำนวณผลประโยชน์เฉพาะบุคคล</p></fieldset>
    <p className="discovery-note">แผนคุ้มครองถึงอายุ 99 ปีต้องระบุอายุก่อน จึงจะใช้ตัวกรองระยะคุ้มครองได้</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="flow-actions"><button type="button" className="button button-secondary" disabled={busy} onClick={() => { setDraft(emptyFilters());setAge('');setBudget('');setSum('');setError(''); }}>ล้างเงื่อนไข</button><button className="button button-primary" disabled={busy}><Check size={17}/>ใช้เงื่อนไขนี้</button></div>
  </form>;
}
