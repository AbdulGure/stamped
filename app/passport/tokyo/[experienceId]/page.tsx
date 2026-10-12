import { notFound } from 'next/navigation';
import { experiences } from '@/lib/data';
import { ExperienceMemory } from '@/features/stamps/passport';
export function generateStaticParams(){return experiences.map(e=>({experienceId:e.id}));}
export const dynamicParams=false;
export default async function Page({params}:{params:Promise<{experienceId:string}>}){const {experienceId}=await params;const experience=experiences.find(e=>e.id===experienceId);if(!experience)notFound();return <ExperienceMemory experienceId={experience.id}/>;}
