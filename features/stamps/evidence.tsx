'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Experience, Stamp, StampMemory } from '@/types';
import { repository, announcePlanChange } from '@/lib/store';
import { Header, BottomNav } from '@/components/ui';
import { EvidenceUploader } from '@/components/stamps/evidence-uploader';
import { ReflectionForm } from '@/components/stamps/reflection-form';
import './stamps.css';
import { cities } from '@/lib/data';
import { cloudMode } from '@/lib/supabase/config';
export default function EvidenceScreen({experience}:{experience:Experience}){
 const [progress,setProgress]=useState(0);
 const router=useRouter(),pending=useRef(false);const [stamp,setStamp]=useState<Stamp|null>(null),[memory,setMemory]=useState<StampMemory|null>(null),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[photoBusy,setPhotoBusy]=useState(false);
 useEffect(()=>{let live=true;repository.getStamps().then(stamps=>{if(!live)return;const found=stamps.find(s=>s.experienceId===experience.id);setStamp(found??null);setMemory(found??null);setLoaded(true);}).catch(()=>{if(live){setError('Could not read your stamp. Check your connection and reload.');setLoaded(true);}});return()=>{live=false;};},[experience.id]);
 useEffect(()=>{if(!memory||!stamp||JSON.stringify(memory)===JSON.stringify(stamp))return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[memory,stamp]);
 async function save(){if(!stamp||!memory||pending.current||photoBusy)return;pending.current=true;setBusy(true);setError('');try{await repository.saveStampMemory(stamp.id,memory,setProgress);announcePlanChange();router.push('/passport');}catch(err){setError(err instanceof Error?err.message:'Could not save this memory. Please try again.');pending.current=false;setBusy(false);}}
 return <main className="memory-page"><Header back="/passport" backLabel="Back to Passport"/><div className="page-shell memory-shell"><p className="eyebrow">STAMP EARNED. STORY STILL UNFOLDING.</p><h1>MAKE IT<br/><span>YOURS.</span></h1><p className="memory-place-name">{experience.title} · {cities.find(c=>c.id===experience.cityId)?.name}</p>{error&&<p className="error" role="alert">{error}</p>}{!loaded&&<p role="status">Opening your stamp…</p>}{loaded&&!stamp&&!error&&<p>Earn your stamp first. <Link className="text-link" href={`/stamp/${experience.id}`}>Stamp this experience →</Link></p>}{stamp&&memory&&<form onSubmit={e=>{e.preventDefault();void save();}}><EvidenceUploader photos={memory.photos} cover={memory.coverPhoto} disabled={busy} onBusy={setPhotoBusy} onChange={(photos,coverPhoto)=>setMemory({...memory,photos,coverPhoto})}/><ReflectionForm memory={memory} onChange={setMemory} disabled={busy||photoBusy}/><button className="stamp-button memory-save" disabled={busy||photoBusy} type="submit">{busy?(cloudMode?`Saving… ${progress}%`:'Saving your memory…'):'SAVE MY MEMORY →'}</button><p className="memory-storage-note">{cloudMode?'Photos are private to your account. Keep your originals.':'Photos stay in this browser. Keep your originals.'}</p></form>}</div><BottomNav active="Passport"/></main>;
}
