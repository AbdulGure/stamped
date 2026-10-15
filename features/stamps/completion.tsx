'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Experience, Stamp } from '@/types';
import { repository, announcePlanChange } from '@/lib/store';
import { Header, BottomNav, StampButton } from '@/components/ui';
import { CityStamp } from '@/components/stamps/city-stamp';
import { StampAnimation } from '@/components/stamps/stamp-animation';
import './stamps.css';
import { cities } from '@/lib/data';
export default function CompletionScreen({experience}:{experience:Experience}){
 const city=cities.find(c=>c.id===experience.cityId);
 const [phase,setPhase]=useState<'loading'|'ready'|'unplanned'|'impact'|'earned'|'existing'>('loading');
 const [stamp,setStamp]=useState<Stamp|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const pending=useRef(false),rewardHeading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{let live=true;Promise.all([repository.getPlan(),repository.getStamps()]).then(([plan,stamps])=>{if(!live)return;const existing=stamps.find(s=>s.experienceId===experience.id);setStamp(existing??null);setPhase(existing?'existing':plan.items.some(i=>i.experienceId===experience.id)?'ready':'unplanned');}).catch(()=>{if(live)setError('Could not read your plan. Check your connection and reload.');});return()=>{live=false;};},[experience.id]);
 const finish=useCallback(()=>{setPhase('earned');},[]);
 useEffect(()=>{if(phase==='earned')rewardHeading.current?.focus();},[phase]);
 async function stampIt(){if(pending.current)return;pending.current=true;setBusy(true);setError('');try{const result=await repository.completeExperience(experience.id);setStamp(result);setPhase('impact');announcePlanChange();}catch{setError('Your stamp could not be saved. Check your connection and try again.');}finally{pending.current=false;setBusy(false);}}
 const rewarded=phase==='earned'||phase==='existing';
 return <main className="completion-page"><Header back="/plan" backLabel="Back to Plan"/><section className="completion-content">
  <p className="eyebrow">A PLACE BECOMES A STORY.</p><h1 ref={rewardHeading} tabIndex={-1}>{rewarded?'IT’S YOURS.':'YOU DID IT.'}</h1><h2>{experience.title}</h2><p className="completion-city">{city?.name.toUpperCase()} · {city?.country.toUpperCase()}</p>
  {error&&<p className="error" role="alert">{error}</p>}
  {phase==='loading'&&!error&&<p role="status">Opening your next memory…</p>}
  {phase==='unplanned'&&<div className="completion-actions"><p>Add this experience to your plan first.</p><StampButton href={`/experience/${experience.id}`}>Open experience</StampButton></div>}
  {phase==='ready'&&<div className="completion-actions"><div className="stamp-landing-guide" aria-hidden="true">YOUR NEXT<br/>STAMP GOES HERE</div><StampButton disabled={busy} onClick={()=>void stampIt()}>{busy?'Saving your stamp…':'STAMP IT'}</StampButton></div>}
  {phase==='impact'&&stamp&&<StampAnimation cityId={experience.cityId} cityName={city?.name} country={city?.country} date={stamp.completedAt} onFinish={finish}/>}
  {rewarded&&stamp&&<><div className="earned-stamp"><CityStamp cityId={experience.cityId} cityName={city?.name} country={city?.country} date={stamp.completedAt}/></div><p className="earned-message" role="status">{phase==='earned'?'+1 STAMP · A STORY WORTH KEEPING.':'ALREADY STAMPED. ALWAYS YOURS.'}</p><div className="completion-actions"><StampButton href={`/stamp/${experience.id}/evidence`}>MAKE IT YOURS →</StampButton><Link href="/passport">{phase==='earned'?'Keep it simple · open Passport':'Open my Passport'}</Link></div></>}
 </section><BottomNav active="Plan"/></main>;
}
