import { notFound } from 'next/navigation';
import { experiences } from '@/lib/data';
import ExperienceDetail from '@/features/experience';
export function generateStaticParams(){return experiences.map(e=>({slug:e.id}))}
export const dynamicParams=false;
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const experience=experiences.find(e=>e.id===slug);if(!experience)notFound();return <ExperienceDetail experience={experience}/>}
