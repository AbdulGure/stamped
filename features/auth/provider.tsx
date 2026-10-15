'use client';
import { Fragment, createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { cloudConfig, cloudMode } from '@/lib/supabase/config';
import { getSupabase } from '@/lib/supabase/client';
const AuthContext=createContext<{user:User|null;ready:boolean}>({user:null,ready:false});
export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(!cloudMode),[error,setError]=useState(cloudConfig.error);const path=usePathname();
 useEffect(()=>{
  if(!cloudMode||cloudConfig.error)return;let live=true;const client=getSupabase();
  const {data}=client.auth.onAuthStateChange((_event,session)=>{if(live){setError('');setUser(session?.user??null);setReady(true);}});
  client.auth.getSession().then(({data,error})=>{if(live){if(error)setError(error.message);setUser(data.session?.user??null);setReady(true);}}).catch(()=>{if(live){setError('Could not restore your session. Reload to try again.');setReady(true);}});
  return()=>{live=false;data.subscription.unsubscribe();};
 },[]);
 const privatePage=['/plan','/passport','/stamp','/onboarding','/account'].some(p=>path===p||path.startsWith(p+'/'));
 return <AuthContext.Provider value={{user,ready}}>{cloudMode&&error?<main className="page-shell"><h1>ONE SMALL HOLD-UP.</h1><p role="alert">{error}</p></main>:cloudMode&&(!ready||privatePage&&!user)?<main className="page-shell"><h1>{ready?'YOUR STORIES. YOUR ACCOUNT.':'OPENING STAMPED…'}</h1>{ready?<><p>Log in to open your private plans and memories.</p><Link className="stamp-button" href={`/auth?next=${encodeURIComponent(path)}`}>Log in / sign up →</Link><Link className="text-link" href="/explore">Keep exploring</Link></>:<p role="status">Restoring your session…</p>}</main>:<Fragment key={user?.id??'local-demo'}>{children}</Fragment>}</AuthContext.Provider>;
}
