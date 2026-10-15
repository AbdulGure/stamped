'use client';
import { useSearchParams } from 'next/navigation';
import { CityPassport, ExperienceMemory } from './passport';
export function PassportQuery({memory=false}:{memory?:boolean}){const q=useSearchParams();return memory?<ExperienceMemory experienceId={q.get('experience')??''}/>:<CityPassport cityId={q.get('city')??'tokyo'}/>;}
