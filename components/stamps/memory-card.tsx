import Link from 'next/link';
import type { Stamp } from '@/types';
import { memoryHref } from '@/lib/passport-links';
import { experiences, cities } from '@/lib/data';
import { completionDate, CityStamp } from './city-stamp';
export function MemoryDetails({stamp}:{stamp:Stamp}){return <><dl className="memory-facts">{stamp.rating!==null&&<div><dt>RATING</dt><dd aria-label={`${stamp.rating} out of 5`}>{'★'.repeat(stamp.rating)}{'☆'.repeat(5-stamp.rating)}</dd></div>}{stamp.amountSpent!==null&&<div><dt>SPENT</dt><dd>£{stamp.amountSpent.toFixed(2)}</dd></div>}{stamp.durationMinutes!==null&&<div><dt>TIME</dt><dd>{stamp.durationMinutes} min</dd></div>}</dl>{stamp.tip&&<blockquote className="memory-tip">“{stamp.tip}”</blockquote>}</>;}
export function MemoryCard({stamp}:{stamp:Stamp}){
 const e=experiences.find(e=>e.id===stamp.experienceId);const title=stamp.experienceTitle??e?.title??'My experience';const city=cities.find(c=>c.id===stamp.cityId),name=stamp.cityName??city?.name??stamp.cityId;const cover=stamp.photos.find(p=>p.id===stamp.coverPhoto)??stamp.photos[0];
 return <article className="passport-memory-card"><Link href={memoryHref(stamp.cityId,stamp.experienceId)} className="memory-card-link">{cover?<img className="memory-cover" src={cover.src} alt={`My memory of ${title}: ${cover.alt}`}/>:<div className="memory-card-stamp"><CityStamp cityId={stamp.cityId} cityName={name} country={stamp.cityCountry??city?.country} date={stamp.completedAt}/></div>}<div className="memory-card-copy"><span className="eyebrow">{stamp.evidenceStatus==='photo'?'PHOTO STAMP':'STAMPED'} · {name.toUpperCase()}</span><h2>{title}</h2><time dateTime={stamp.completedAt}>{completionDate(stamp.completedAt)}</time></div></Link><MemoryDetails stamp={stamp}/><Link href={memoryHref(stamp.cityId,stamp.experienceId)} className="text-link">Open memory →</Link></article>;
}
