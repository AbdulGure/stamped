import { LandmarkArt } from '@/components/map/landmark-art';
export function completionDate(date:string){return new Date(date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}
/** Reuses STAMPED's original vector landmark; distressed frame remains sharp at any size. */
export function CityStamp({date,count}:{date:string;count?:number}){
 return <div className="collectible-stamp" aria-label={`Tokyo stamp, ${completionDate(date)}${count?`, ${count} completed experiences`:''}`}><span className="stamp-serial">JAPAN · 35°40′ N</span><div className="stamp-landmark"><LandmarkArt kind="pagoda" color="currentColor"/>{count!==undefined&&<b className="stamp-quantity">{count}</b>}</div><strong>TOKYO</strong><time dateTime={date}>{completionDate(date)}</time><span className="stamp-brand">★ STAMPED ★</span></div>;
}
