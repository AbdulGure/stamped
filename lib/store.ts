'use client';
import { experiences } from '@/lib/data';
import { createLocalRepository } from '@/lib/repository';
import { cloudMode } from '@/lib/supabase/config';
import { getSupabase } from '@/lib/supabase/client';
import { createSupabaseRepository } from '@/lib/supabase/repository';
import type { StampedRepository } from '@/lib/repository';
export const localRepository = createLocalRepository(()=>window.localStorage,experiences.map(item=>item.id),Object.fromEntries(experiences.map(item=>[item.id,item.cityId])));
export function announcePlanChange() { window.dispatchEvent(new Event('stamped-plan-change')); }

let cloud:StampedRepository|undefined;
// Lazy selection: no SDK client or browser storage during static rendering.
export const repository:StampedRepository=new Proxy({} as StampedRepository,{get(_target,method:keyof StampedRepository){const adapter=cloudMode?(cloud??=createSupabaseRepository(getSupabase())):localRepository;return adapter[method].bind(adapter);}});
