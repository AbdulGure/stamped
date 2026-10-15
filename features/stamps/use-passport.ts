'use client';
import { useEffect, useState } from 'react';
import type { Stamp } from '@/types';
import { useAuth } from '@/features/auth/provider';
import { cloudMode } from '@/lib/supabase/config';
import { repository } from '@/lib/store';
export function usePassport(){
 const {user}=useAuth();
 const [stamps,setStamps]=useState<Stamp[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;const refresh=()=>{(cloudMode&&!user?Promise.resolve([]):repository.getStamps()).then(items=>{if(active){setStamps(items);setError('');setLoading(false);}}).catch(()=>{if(active){setError('Could not open your memories. Check your connection and reload.');setLoading(false);}});};refresh();const timer=cloudMode?setInterval(refresh,45*60*1000):undefined;window.addEventListener('focus',refresh);window.addEventListener('stamped-plan-change',refresh);window.addEventListener('storage',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('stamped-plan-change',refresh);window.removeEventListener('storage',refresh);};},[user]);
 return {stamps,loading,error};
}
