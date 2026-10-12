'use client';
import { experiences } from '@/lib/data';
import { createLocalRepository } from '@/lib/repository';
// Swap this adapter for a Supabase implementation of StampedRepository.
export const repository = createLocalRepository(()=>window.localStorage,experiences.map(item=>item.id),Object.fromEntries(experiences.map(item=>[item.id,item.cityId])));
export function announcePlanChange() { window.dispatchEvent(new Event('stamped-plan-change')); }
