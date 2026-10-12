'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ArrowRight, ArrowUp, ArrowDown, Trash2, Clock, MapPin, Plus, Check, Bookmark, X } from 'lucide-react';
import type { Plan } from '@/types';
import { experiences } from '@/lib/data';
import { repository, announcePlanChange } from '@/lib/store';
import { Header, BottomNav } from '@/components/ui';
import './plan.css';

const spring={type:'spring' as const,stiffness:340,damping:31};
export default function PlanPage(){
 const [plan,setPlan]=useState<Plan|null>(null);
 const [day,setDay]=useState<number|null>(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const [picker,setPicker]=useState(false);
 const pending=useRef(false);
 const addButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  let active=true;
  const refresh=()=>{repository.getPlan().then(p=>{if(active){setPlan(p);setDay(d=>d!==null&&d>p.dayCount?p.dayCount:d);}}).catch(()=>{if(active)setError('Could not load your plan. Please enable browser storage and reload.');});};
  refresh();window.addEventListener('stamped-plan-change',refresh);window.addEventListener('storage',refresh);
  return()=>{active=false;window.removeEventListener('stamped-plan-change',refresh);window.removeEventListener('storage',refresh);};
 },[]);
 async function update(action:()=>Promise<Plan>,message:string,after?:()=>void){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError('');setNotice('');
  try{setPlan(await action());announcePlanChange();setNotice(message);after?.();}
  catch{setError('That change could not be saved. Please try again.');}
  finally{pending.current=false;setBusy(false);}
 }
 const visible=plan?.items.filter(item=>(item.day??null)===day)??[];
 const savedCount=plan?.items.filter(item=>item.day==null).length??0;
 const available=experiences.filter(e=>!plan?.items.some(item=>item.experienceId===e.id));
 function closePicker(){setPicker(false);addButton.current?.focus();}
 return <MotionConfig reducedMotion="user"><main className="itinerary-page">
  <Header back="/explore" backLabel="Back to Explore"/>
  <div className="page-shell itinerary-shell">
   <header className="itinerary-title"><p className="eyebrow">LESS SOMEDAY. MORE LET’S GO.</p><h1>MAKE A<br/><span>DAY OF IT.</span></h1><span className="itinerary-doodle" aria-hidden="true">↗</span></header>
   <section className="trip-ticket" aria-label="Tokyo trip summary"><div><span className="eyebrow"><MapPin size={13}/> JAPAN · YOUR NEXT CHAPTER</span><h2>TOKYO <span>東京</span></h2></div><div className="trip-tally"><strong>{plan?.dayCount??'—'}</strong><span>DAYS</span></div><p>Good places. Your pace.</p><span className="trip-ticket-code">TYO / 001</span></section>
   {error&&<p className="error" role="alert">{error}</p>}
   <p className="planner-status" role="status" aria-live="polite">{busy?'Saving…':notice||'Saved on this device · no dates needed yet'}</p>
   {!plan&&!error&&<div className="planner-loading" role="status">Unfolding your itinerary…<div/><div/></div>}
   {plan&&<>
    <div className="trip-days" aria-label="Choose a trip day">
     <button className={day===null?'selected':''} aria-pressed={day===null} onClick={()=>{setDay(null);setPicker(false);}}><Bookmark size={15}/>Saved <span>{savedCount}</span></button>
     {Array.from({length:plan.dayCount},(_,i)=>i+1).map(d=><button key={d} className={day===d?'selected':''} aria-pressed={day===d} onClick={()=>{setDay(d);setPicker(false);}}>Day {String(d).padStart(2,'0')}<span>{plan.items.filter(item=>item.day===d).length}</span></button>)}
     <button aria-label="Add a trip day" disabled={busy||plan.dayCount>=30} onClick={()=>{const next=plan.dayCount+1;void update(()=>repository.setDayCount(next),`Day ${next} added.`,()=>{setDay(next);setPicker(false);});}}><Plus size={18}/></button>
    </div>
    <div className="day-heading"><div><p className="eyebrow">{day===null?'KEEP A LITTLE INSPIRATION':'LEAVE ROOM FOR A DETOUR'}</p><h2>{day===null?'THE SHORTLIST.':`DAY ${String(day).padStart(2,'0')}.`}</h2></div><span>{visible.length} {visible.length===1?'stop':'stops'}</span></div>
    <div className="itinerary-stops" aria-label={day===null?'Unscheduled experiences':`Day ${day} experiences`}>
     <AnimatePresence initial={false} mode="popLayout">
      {visible.map((item,index)=>{const e=experiences.find(ex=>ex.id===item.experienceId)!;return <motion.article layout key={item.id} className="itinerary-stop" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.97}} transition={spring}>
       <div className="stop-number" aria-label={`Stop ${index+1}`}>{String(index+1).padStart(2,'0')}</div>
       <div className="stop-card"><Link href={`/experience/${e.id}`} className="stop-summary"><img src={e.image} alt={e.imageAlt} width={72} height={84} loading="lazy"/><div><span className="eyebrow">{e.category}</span><h3>{e.title}</h3><p><Clock size={12}/>{e.duration} · Tokyo</p></div></Link>
        <div className="plan-completion"><span>{item.status==='completed'?'✓ COMPLETED':'PLANNED'}</span><Link href={item.status==='completed'?`/passport/tokyo/${e.id}`:`/stamp/${e.id}`}>{item.status==='completed'?'VIEW MEMORY →':'MARK AS COMPLETE →'}</Link></div>
        <div className="stop-tools"><label><span className="sr-only">Day for {e.title}</span><select disabled={busy} value={item.day??''} onChange={event=>{const next=event.target.value?Number(event.target.value):null;void update(()=>repository.setItemDay(e.id,next),`${e.title} moved to ${next===null?'Saved':`Day ${next}`}.`);}}><option value="">Saved · no day yet</option>{Array.from({length:plan.dayCount},(_,i)=><option value={i+1} key={i}>Day {String(i+1).padStart(2,'0')}</option>)}</select></label><div>
         <button disabled={busy||index===0} aria-label={`Move ${e.title} earlier`} onClick={()=>void update(()=>repository.moveItem(e.id,-1),'Stop moved earlier.')}><ArrowUp size={16}/></button>
         <button disabled={busy||index===visible.length-1} aria-label={`Move ${e.title} later`} onClick={()=>void update(()=>repository.moveItem(e.id,1),'Stop moved later.')}><ArrowDown size={16}/></button>
         <button disabled={busy} aria-label={`Remove ${e.title} from plan`} onClick={()=>void update(()=>repository.removeFromPlan(e.id),`${e.title} removed.`)}><Trash2 size={15}/></button>
        </div></div>
       </div>
      </motion.article>;})}
     </AnimatePresence>
     {!visible.length&&<div className="day-empty"><span aria-hidden="true">✳</span><h3>{day===null?'A little possibility pile.':'A blank page. A whole city.'}</h3><p>{day===null?'Save places while exploring, then give them a day.':'Pick your first stop. The best days start somewhere.'}</p>{day!==null&&savedCount>0&&<button onClick={()=>setDay(null)}>Choose from {savedCount} saved {savedCount===1?'place':'places'} <ArrowRight size={16}/></button>}</div>}
    </div>
    <button ref={addButton} className="planner-add" aria-expanded={picker} aria-controls="planner-picker" onClick={()=>setPicker(!picker)}><Plus size={20}/>{day===null?'Find a place to save':'Add an experience'}</button>
    {picker&&<section id="planner-picker" className="planner-picker" aria-label="Choose Tokyo experiences"><div className="picker-heading"><h3>A LITTLE MORE TOKYO.</h3><button aria-label="Close experience picker" onClick={closePicker}><X size={20}/></button></div><p>Add a stop to {day===null?'your shortlist':`Day ${day}`}.</p>{available.map(e=><div className="picker-place" key={e.id}><img src={e.image} alt="" width={48} height={52}/><div><Link href={`/experience/${e.id}`}>{e.title}</Link><span>{e.category} · {e.duration}</span></div><button disabled={busy} aria-label={`Add ${e.title} to ${day===null?'Saved':`Day ${day}`}`} onClick={()=>void update(()=>repository.addToPlan(e.id,day),`${e.title} added.`,()=>{closePicker();})}><Plus size={19}/></button></div>)}{!available.length&&<p><Check size={16}/> All available Tokyo experiences are in your plan. Use each stop’s day selector to move it.</p>}</section>}
    {day===plan.dayCount&&plan.dayCount>1&&<button className="remove-day" disabled={busy} onClick={()=>void update(()=>repository.setDayCount(plan.dayCount-1),'Last day removed. Its stops are in Saved.',()=>{setDay(plan.dayCount-1);setPicker(false);})}>Remove this day · keep its stops in Saved</button>}
    <footer className="planner-footer"><span className="handwritten">More places. More stories.</span><Link href="/city/tokyo">Keep exploring Tokyo <ArrowRight size={17}/></Link></footer>
   </>}
  </div><BottomNav active="Plan"/>
 </main></MotionConfig>;
}
