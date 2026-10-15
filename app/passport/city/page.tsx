import { Suspense } from 'react';
import { PassportQuery } from '@/features/stamps/passport-query';
export default function Page(){return <Suspense fallback={<p role="status">Opening city…</p>}><PassportQuery/></Suspense>;}
