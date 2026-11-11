import { useState } from 'react';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Badge } from './ui';

const images = {
  residence: `${import.meta.env.BASE_URL}images/retirement-residence.webp`,
  club: `${import.meta.env.BASE_URL}images/retirement-club.webp`,
};
export function PhotoHero({ club = false }: { club?: boolean }) {
  const [slide, setSlide] = useState(0);
  if (club) return <section className="club-hero photo-club-hero"><img src={images.club} alt="ภาพประกอบสมจริงของผู้สูงอายุร่วมกิจกรรมศิลปะในสวนของบ้านพัก" fetchPriority="high"/><div className="photo-club-copy"><Badge variant="red">RETIREMENT LUXURY CLUB</Badge><h2>มิตรภาพใหม่ ๆ<br/>ในบทชีวิตที่คุณเลือก</h2><p>พื้นที่ของประสบการณ์ที่มีคุณค่า<br/>สำหรับลูกค้า LIVERA ทุกวัย</p><span className="club-hero-meta"><CalendarDays size={17}/>กิจกรรมหลักเดือนละครั้ง</span></div><span className="photo-credit">ภาพประกอบจำลองด้วย AI</span></section>;
  const story = slide === 0 ? { tag: 'A LIFE WELL PLANNED', title: <>ชีวิตบทใหม่ที่ดี<br/>เริ่มเตรียมได้ตั้งแต่วันนี้</>, body: 'ค่อย ๆ สร้างความมั่นใจ ให้ชีวิตข้างหน้าเป็นแบบที่คุณเลือก', link: '#/policies', action: 'ดูแผนของฉัน', image: images.residence } : { tag: 'LIFE IS BETTER TOGETHER', title: <>มากกว่าการเตรียมเงิน<br/>คือการเตรียมชีวิตที่มีความหมาย</>, body: 'พบเพื่อนใหม่และประสบการณ์ดี ๆ ผ่านคลับของคนที่เข้าใจกัน', link: '#/club', action: 'สำรวจ LIVERA Club', image: images.club };
  return <section className="welcome-card photo-hero" aria-label="แนวคิดชีวิตหลังเกษียณ"><img key={story.image} className="hero-photograph" src={story.image} alt={slide === 0 ? 'ภาพประกอบสมจริงของคู่ผู้สูงอายุพักผ่อนในห้องนั่งเล่นของบ้านพัก' : 'ภาพประกอบสมจริงของผู้สูงอายุทำกิจกรรมร่วมกันในสวน'} fetchPriority="high"/><div className="welcome-copy" key={slide}><span className="hero-eyebrow"><span/>{story.tag}</span><h2>{story.title}</h2><p>{story.body}</p><a className="hero-link" href={story.link}>{story.action}<span><ArrowUpRight size={17}/></span></a></div><div className="hero-story-controls" role="group" aria-label="เปลี่ยนภาพบรรยากาศ">{[0, 1].map(index => <button key={index} className={slide === index ? 'active' : ''} onClick={() => setSlide(index)} aria-pressed={slide === index} aria-label={`แสดงภาพที่ ${index + 1}`}><span/></button>)}</div><span className="photo-credit">ภาพประกอบจำลองด้วย AI</span></section>;
}
