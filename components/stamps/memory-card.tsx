import Link from 'next/link';
import type { Stamp } from '@/types';
import { experiences } from '@/lib/data';
import { completionDate, CityStamp } from './city-stamp';
export function MemoryDetails({stamp}:{stamp:Stamp}){return <><dl className="memory-facts">{stamp.rating!==null&&<div><dt>RATING</dt><dd aria-label={`${stamp.rating} out of 5`}>{'★'.repeat(stamp.rating)}{'☆'.repeat(5-stamp.rating)}</dd></div>}{stamp.amountSpent!==null&&<div><dt>SPENT</dt><dd>£{stamp.amountSpent.toFixed(2)}</dd></div>}{stamp.durationMinutes!==null&&<div><dt>TIME</dt><dd>{stamp.durationMinutes} min</dd></div>}</dl>{stamp.tip&&<blockquote className="memory-tip">“{stamp.tip}”</blockquote>}</>;}
export function MemoryCard({stamp}:{stamp:Stamp}){
 const e=experiences.find(e=>e.id===stamp.experienceId);if(!e)return null;const cover=stamp.photos.find(p=>p.id===stamp.coverPhoto)??stamp.photos[0];
 return <article className="passport-memory-card"><Link href={`/passport/tokyo/${e.id}`} className="memory-card-link">{cover?<img className="memory-cover" src={cover.src} alt={`My memory of ${e.title}: ${cover.alt}`}/>:<div className="memory-card-stamp"><CityStamp date={stamp.completedAt}/></div>}<div className="memory-card-copy"><span className="eyebrow">{stamp.evidenceStatus==='photo'?'PHOTO STAMP':'STAMPED'} · TOKYO</span><h2>{e.title}</h2><time dateTime={stamp.completedAt}>{completionDate(stamp.completedAt)}</time></div></Link><MemoryDetails stamp={stamp}/><Link href={`/passport/tokyo/${e.id}`} className="text-link">Open memory →</Link></article>;
}
