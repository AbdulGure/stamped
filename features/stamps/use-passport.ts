'use client';
import { useEffect, useState } from 'react';
import type { Stamp } from '@/types';
import { repository } from '@/lib/store';
export function usePassport(){
 const [stamps,setStamps]=useState<Stamp[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;const refresh=()=>{repository.getStamps().then(items=>{if(active){setStamps(items);setError('');setLoading(false);}}).catch(()=>{if(active){setError('Could not open your memories. Please allow browser storage and reload.');setLoading(false);}});};refresh();window.addEventListener('stamped-plan-change',refresh);window.addEventListener('storage',refresh);return()=>{active=false;window.removeEventListener('stamped-plan-change',refresh);window.removeEventListener('storage',refresh);};},[]);
 return {stamps,loading,error};
}
