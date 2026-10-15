import { Suspense } from 'react';
import AuthScreen from '@/features/auth/screen';
export default function Page(){return <Suspense fallback={<p role="status">Opening account…</p>}><AuthScreen/></Suspense>;}
