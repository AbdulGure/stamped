'use client';
import { localRepository, repository, announcePlanChange } from '@/lib/store';
import { getSupabase } from './client';
/** Explicit account-scoped import. Originals remain untouched; existing cloud memories win. */
export async function importLocalData(onProgress:(message:string)=>void){
 const client=getSupabase();const {data:{user},error}=await client.auth.getUser();if(error||!user)throw new Error('Log in before importing.');
 const [profile,plan,stamps]=await Promise.all([localRepository.getProfile(),localRepository.getPlan(),localRepository.getStamps()]);
 if(profile&&!await repository.getProfile())await repository.saveProfile(profile);
 let cloud=await repository.getPlan();await repository.setDayCount(Math.max(plan.dayCount,cloud.dayCount));
 for(const item of plan.items){if(!cloud.items.some(i=>i.experienceId===item.experienceId))await repository.addToPlan(item.experienceId,item.day??null);}
 const existing=await repository.getStamps();let imported=0;
 for(const stamp of stamps){onProgress(`Importing memory ${++imported} of ${stamps.length}…`);
  const previous=existing.find(s=>s.experienceId===stamp.experienceId);
  if(previous&&(Date.parse(previous.completedAt)!==Date.parse(stamp.completedAt)||previous.photos.length||previous.rating!==null||previous.tip||previous.amountSpent!==null||previous.durationMinutes!==null))continue;
  await repository.addToPlan(stamp.experienceId);
  const {data:id,error}=await client.rpc('complete_experience',{p_experience:stamp.experienceId,p_completed_at:stamp.completedAt});if(error)throw error;
  await repository.saveStampMemory(id,stamp);
 }
 cloud=await repository.getPlan();announcePlanChange();return `Import finished: ${cloud.items.length} planned places in this account. Original local data has been kept.`;
}
export async function exportLocalData(){return {version:1,exportedAt:new Date().toISOString(),profile:await localRepository.getProfile(),plan:await localRepository.getPlan(),stamps:await localRepository.getStamps()};}
