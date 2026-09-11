'use client';
import { useEffect, useState } from 'react';
import { regionIds, type Region, type RegionId } from './model';
/** Independent requests stream SVG segments into already-reserved canvas slots.
 * A failed region keeps its sketch and can be retried without moving any pins. */
export function useRegions(){
 const [regions,setRegions]=useState<Partial<Record<RegionId,Region>>>({});
 const [failed,setFailed]=useState<RegionId[]>([]);const [attempt,setAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController();
  for(const id of regionIds){fetch(`/map-regions/${id}.json`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('Region unavailable');const region:Region=await response.json();if(region.id!==id||!Array.isArray(region.paths)||!region.paths.every(p=>typeof p==='string'))throw new Error('Invalid region');setRegions(previous=>({...previous,[id]:region}));setFailed(previous=>previous.filter(item=>item!==id));}).catch(()=>{if(!controller.signal.aborted)setFailed(previous=>previous.includes(id)?previous:[...previous,id]);});}
  return()=>controller.abort();
 },[attempt]);
 return {regions,failed,loading:Object.keys(regions).length<regionIds.length,retry:()=>setAttempt(a=>a+1)};
}
