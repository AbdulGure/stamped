'use client';
import { useSearchParams } from 'next/navigation';
import { Header, BottomNav, StampButton } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
export default function ComingSoon(){const section=useSearchParams().get('section')==='community'?'Community':'Create';return <main><Header back="/explore"/><section className="page-shell empty-state"><p className="eyebrow">{section.toUpperCase()} · STILL IN THE MAKING</p><h1>MORE STORIES<br/>TO COME.</h1><p>{section} is coming in a later chapter. For now, find something worth going out for.</p><StampButton href="/explore">Back to Explore <ArrowRight size={20}/></StampButton></section><BottomNav active={section}/></main>;}
