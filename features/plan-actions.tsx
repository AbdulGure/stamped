'use client';
import { useCallback, useEffect, useState } from 'react';
import { Check, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { memoryHref } from '@/lib/passport-links';
import { cloudMode } from '@/lib/supabase/config';
import { useAuth } from '@/features/auth/provider';
import { usePassport } from '@/features/stamps/use-passport';
import { StampButton } from '@/components/ui';
import { repository, announcePlanChange } from '@/lib/store';
export function AddToPlan({experienceId}:{experienceId:string}){
 const {user}=useAuth();
 const {stamps}=usePassport();const completed=stamps.find(s=>s.experienceId===experienceId);
 const [saved,setSaved]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{if(cloudMode&&!user)return;let active=true;repository.getPlan().then(plan=>{if(active){setSaved(plan.items.some(i=>i.experienceId===experienceId));setLoading(false);}}).catch(()=>{if(active){setLoading(false);setError('Could not read your plan. Please log in or check your connection.');}});return()=>{active=false}},[experienceId,user]);
 const add=useCallback(async()=>{setBusy(true);setError('');try{await repository.addToPlan(experienceId);setSaved(true);announcePlanChange();return {experienceId,saved:true};}catch{setError('Could not save your plan. Check your connection and try again.');throw new Error('Plan could not be saved.');}finally{setBusy(false)}},[experienceId]);
 useEffect(()=>{
  type Context={registerTool:(tool:{name:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>Promise<unknown>},options:{signal:AbortSignal})=>void|Promise<void>};
  const context=(document as Document&{modelContext?:Context}).modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();
  try{void Promise.resolve(context.registerTool({name:'add_current_experience_to_plan',description:'Save this experience to the local STAMPED plan and update the visible saved state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');return add();}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return()=>lifecycle.abort();
 },[add]);
 if(cloudMode&&!user)return <div className="save-actions"><StampButton href={`/auth?next=${encodeURIComponent(`/experience/${experienceId}`)}`}>Log in to plan →</StampButton></div>;
 return completed?<div className="save-actions"><span className="success">✓ STAMPED · This story is yours.</span><StampButton href={memoryHref(completed.cityId,experienceId)}>VIEW MEMORY <ArrowRight size={18}/></StampButton></div>:<div className="save-actions"><StampButton className={saved?'saved-button':''} disabled={loading||busy||saved} onClick={()=>{void add().catch(()=>{});}}>{saved?<><Check size={20}/> In your plan</>:<><Plus size={20}/>{loading?'Loading plan…':busy?'Adding…':'Add to Plan'}</>}</StampButton>{saved&&<div role="status" className="saved-confirmation"><span className="success">Saved. Make a day of it.</span><Link className="text-link" href="/plan">Open my plan <ArrowRight size={18}/></Link></div>}{error&&<p role="alert" className="error">{error}</p>}</div>
}
