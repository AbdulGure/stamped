import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Logo, StampButton } from '@/components/ui';
export default function Welcome(){return <main className="welcome"><div className="welcome-brand"><Logo/></div><div className="welcome-actions"><StampButton href="/onboarding">Get Started <ArrowRight size={21}/></StampButton><Link href="/auth" className="return-link">I already have an account</Link></div></main>}
