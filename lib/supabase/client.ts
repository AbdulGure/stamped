'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cloudConfig } from './config';
let instance:SupabaseClient|null=null;
/** Client-only auth keeps the existing static export. PostgreSQL RLS is the security boundary. */
export function getSupabase(){
 if(cloudConfig.mode!=='cloud')throw new Error('Cloud accounts are not enabled in this local demo.');
 if(cloudConfig.error)throw new Error(cloudConfig.error);
 if(typeof window==='undefined')throw new Error('The browser client cannot run on the server.');
 return instance??=createClient(cloudConfig.url,cloudConfig.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
}
