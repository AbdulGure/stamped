import { Header, BottomNav, StampButton } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
export default function Page(){return <main><Header back="/explore"/><section className="page-shell empty-state"><p className="eyebrow">STILL IN THE MAKING</p><h1>MORE STORIES<br/>TO COME.</h1><p>Create, Community, and Passport are coming in a later chapter. For now, find something worth going out for.</p><StampButton href="/explore">Back to Explore <ArrowRight size={20}/></StampButton></section><BottomNav active=""/></main>}
