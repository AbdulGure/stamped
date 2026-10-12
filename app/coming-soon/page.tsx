import { Suspense } from 'react';
import ComingSoon from '@/features/coming-soon';
export default function Page(){return <Suspense fallback={<p role="status">Opening STAMPED…</p>}><ComingSoon/></Suspense>;}
