import { notFound } from 'next/navigation';
import { experiences } from '@/lib/data';
import CompletionScreen from '@/features/stamps/completion';
export function generateStaticParams(){return experiences.map(e=>({experienceId:e.id}));}
export const dynamicParams=false;
export default async function Page({params}:{params:Promise<{experienceId:string}>}){const {experienceId}=await params;const experience=experiences.find(e=>e.id===experienceId);if(!experience)notFound();return <CompletionScreen experience={experience}/>;}
