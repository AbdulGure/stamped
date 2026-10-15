'use client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StampedRepository } from '@/lib/repository';
import type { Plan, Profile, Stamp, StampMemory, StampPhoto, TravelIntent } from '@/types';
interface StampRow {id:string;user_id:string;experience_id:string;city_id:string;completed_at:string;rating:number|null;amount_spent:number|null;duration_minutes:number|null;tip:string;evidence_status:'standard'|'photo';cover_photo:string|null;stamp_media:{id:string;storage_path:string;alt:string;slot:number}[];cities:{name:string;country:string};experiences:{title:string}}
const bucket='stamp-evidence';
function check(error:{message:string}|null){if(error)throw new Error(error.message);}
export function createSupabaseRepository(client:SupabaseClient):StampedRepository {
 async function user(){const {data,error}=await client.auth.getUser();check(error);if(!data.user)throw new Error('Log in to save your plans and memories.');return data.user.id;}
 async function rpc(name:string,args:Record<string,unknown>={}){await user();const {data,error}=await client.rpc(name,args);check(error);return data;}
 async function getStamps():Promise<Stamp[]>{const uid=await user();const {data,error}=await client.from('stamps').select('*,stamp_media(*),cities(name,country),experiences(title)').eq('user_id',uid).order('completed_at');check(error);
 return Promise.all(((data??[]) as StampRow[]).map(async s=>{const photos=await Promise.all(s.stamp_media.sort((a,b)=>a.slot-b.slot).map(async p=>{const {data,error}=await client.storage.from(bucket).createSignedUrl(p.storage_path,3600);check(error);return {id:p.id,storagePath:p.storage_path,src:data!.signedUrl,alt:p.alt};}));return {id:s.id,userId:s.user_id,experienceId:s.experience_id,cityId:s.city_id,cityName:s.cities.name,cityCountry:s.cities.country,experienceTitle:s.experiences.title,completedAt:s.completed_at,rating:s.rating,amountSpent:s.amount_spent===null?null:Number(s.amount_spent),currency:'GBP',durationMinutes:s.duration_minutes,tip:s.tip,evidenceStatus:s.evidence_status,coverPhoto:s.cover_photo,photos};}));}
 async function getPlan():Promise<Plan>{const uid=await user();await rpc('ensure_plan');const {data,error}=await client.from('plans').select('*,plan_items(*)').eq('user_id',uid).single();check(error);const stamps=await getStamps();return {id:data.id,profileId:uid,dayCount:data.day_count,items:(data.plan_items as {id:string;experience_id:string;added_at:string;day:number|null;position:number}[]).sort((a,b)=>a.position-b.position).map(i=>({id:i.id,experienceId:i.experience_id,addedAt:i.added_at,day:i.day,completedAt:stamps.find(s=>s.experienceId===i.experience_id)?.completedAt,status:stamps.some(s=>s.experienceId===i.experience_id)?'completed':'planned'}))};}
 async function mutate(action:string,args:Record<string,unknown>){await rpc('mutate_plan',{p_action:action,...args});return getPlan();}
 const repository:StampedRepository={
 getStamps,getPlan,
 async getProfile(){const uid=await user();const {data,error}=await client.from('profiles').select('*,user_interests(interest_id),travel_intents(city_id,status)').eq('id',uid).maybeSingle();check(error);if(!data?.onboarding_complete)return null;const trips=(data.travel_intents as {city_id:string;status:TravelIntent['status']}[]).map(t=>({cityId:t.city_id,status:t.status}));return {id:uid,homeCityId:data.home_city_id,interestIds:(data.user_interests as {interest_id:string}[]).map(i=>i.interest_id),travelIntents:trips,travelIntent:trips[0],onboardingComplete:true};},
 async saveProfile(profile:Profile){await rpc('save_profile',{p_home:profile.homeCityId,p_interests:profile.interestIds,p_trips:profile.travelIntents??[profile.travelIntent]});},
 addToPlan:(experienceId,day=null)=>mutate('add',{p_experience:experienceId,p_day:day}),
 removeFromPlan:experienceId=>mutate('remove',{p_experience:experienceId}),
 setItemDay:(experienceId,day)=>mutate('day',{p_experience:experienceId,p_day:day}),
 moveItem:(experienceId,direction)=>mutate('move',{p_experience:experienceId,p_direction:direction}),
 setDayCount:count=>mutate('count',{p_count:count}),
 async completeExperience(experienceId){const id=await rpc('complete_experience',{p_experience:experienceId});const stamp=(await getStamps()).find(s=>s.id===id);if(!stamp)throw new Error('Stamp saved but could not reload. Refresh your Passport.');return stamp;},
 async saveStampMemory(stampId:string,memory:StampMemory,onProgress?:(percent:number)=>void){
  const uid=await user(),old=(await getStamps()).find(s=>s.id===stampId);if(!old)throw new Error('Stamp not found.');
  if(memory.photos.length>5)throw new Error('Choose up to five photographs.');
  const uploaded:string[]=[],photos:StampPhoto[]=[];let committed=false;
  onProgress?.(0);
  try{for(const [index,p] of memory.photos.entries()){
   if(p.storagePath){if(!old.photos.some(o=>o.id===p.id&&o.storagePath===p.storagePath))throw new Error('Unknown photo reference.');photos.push(p);}
   else{if(!/^data:image\/(jpeg|png|webp);base64,/.test(p.src)||p.src.length>7000000)throw new Error('Choose a supported photo under 5 MB.');
    const blob=await (await fetch(p.src)).blob();const id=crypto.randomUUID(),path=`${uid}/${stampId}/${id}.jpg`;
    const {error}=await client.storage.from(bucket).upload(path,blob,{contentType:blob.type,upsert:false});check(error);uploaded.push(path);photos.push({...p,id,storagePath:path});
   }onProgress?.(Math.round((index+1)/Math.max(1,memory.photos.length)*85));
  }
  const coverIndex=memory.photos.findIndex(p=>p.id===memory.coverPhoto);
  await rpc('save_memory',{p_stamp:stampId,p_rating:memory.rating,p_amount:memory.amountSpent,p_minutes:memory.durationMinutes,p_tip:memory.tip,p_cover:photos[coverIndex<0?0:coverIndex]?.id??null,p_photos:photos.map(p=>({id:p.id,alt:p.alt,storagePath:p.storagePath}))});committed=true;
  const removed=old.photos.filter(p=>p.storagePath&&!photos.some(n=>n.storagePath===p.storagePath)).map(p=>p.storagePath!);
  if(removed.length){const {error}=await client.storage.from(bucket).remove(removed);if(error)throw new Error('Your memory was saved, but old photo files could not be removed. Contact support to clean up private orphaned files.');}
  onProgress?.(100);const updated=(await getStamps()).find(s=>s.id===stampId);if(!updated)throw new Error('Memory saved. Refresh your Passport to load it.');return updated;
  }catch(error){if(!committed&&uploaded.length)await client.storage.from(bucket).remove(uploaded);throw error;}
 }
 };
 return repository;
}
