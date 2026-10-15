'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header, StampButton } from '@/components/ui';
import { getSupabase } from '@/lib/supabase/client';
import { cloudMode, safeNext } from '@/lib/supabase/config';
import { useAuth } from './provider';
import './auth.css';
import { repository } from '@/lib/store';
export default function AuthScreen({reset=false}:{reset?:boolean}){
 const query=useSearchParams(),router=useRouter(),{user,ready}=useAuth();
 const [mode,setMode]=useState(query.get('mode')==='signup'?'signup':'login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');try{
  const client=getSupabase();
  if(reset){if(!user)throw new Error('Open the reset link from your email first.');const {error}=await client.auth.updateUser({password});if(error)throw error;setNotice('Password updated. You can open your account.');setPassword('');}
  else if(mode==='forgot'){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/reset`});if(error)throw error;setNotice('If an account exists for this email, a reset link is on its way.');}
  else if(mode==='signup'){const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/auth`}});if(error)throw error;if(data.session)router.replace('/onboarding');else setNotice('Check your email to confirm your account, then log in to get started.');}
  else{const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;router.replace(await repository.getProfile()?safeNext(query.get('next')):'/onboarding');}
 }catch(err){setError(err instanceof Error?err.message:'Could not connect. Please try again.');}finally{setBusy(false);}}
 return <main><Header back="/explore"/><section className="page-shell auth-shell"><p className="eyebrow">TAKE YOUR STORIES WITH YOU.</p><h1>{reset?'A FRESH START.':mode==='signup'?'YOUR NEXT CHAPTER.':mode==='forgot'?'BACK IN A MOMENT.':'WELCOME BACK.'}</h1>{!cloudMode?<><p>This build is the local demo. Accounts become available after Supabase is configured.</p><StampButton href="/onboarding">Continue local demo →</StampButton></>:<>{reset&&ready&&!user?<><p>Open the password-reset link from your email.</p><Link href="/auth">Request a new link</Link></>:<form onSubmit={submit}>{!reset&&<label>Email<input autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>}{(reset||mode!=='forgot')&&<label>Password<input autoComplete={reset||mode==='signup'?'new-password':'current-password'} type="password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>}<button className="stamp-button" disabled={busy||!ready}>{busy?'One moment…':reset?'Update password':mode==='signup'?'Create account →':mode==='forgot'?'Send reset link':'Log in →'}</button></form>}{!reset&&<div className="auth-links"><button disabled={busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setError('');setNotice('');}}>{mode==='signup'?'Already have an account? Log in':'New here? Create an account'}</button><button disabled={busy} onClick={()=>{setMode('forgot');setError('');setNotice('');}}>Forgot password?</button></div>}</>}{error&&<p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{user&&<Link className="text-link" href="/account">Open my account →</Link>}</section></main>;
}
