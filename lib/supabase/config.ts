export type DataMode = 'local' | 'cloud';
export function resolveCloudConfig(mode:string|undefined,url:string|undefined,key:string|undefined){
 if(!mode||mode==='local')return {mode:'local' as DataMode,url:'',key:'',error:''};
 if(mode!=='cloud')return {mode:'cloud' as DataMode,url:'',key:'',error:'NEXT_PUBLIC_DATA_MODE must be local or cloud.'};
 if(!url||!key)return {mode:'cloud' as DataMode,url:'',key:'',error:'Cloud mode needs a Supabase URL and publishable key. Your local data is untouched.'};
 try{const u=new URL(url);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw new Error();}catch{return {mode:'cloud' as DataMode,url:'',key:'',error:'Invalid Supabase URL.'};}
 if(key.startsWith('sb_secret_'))return {mode:'cloud' as DataMode,url:'',key:'',error:'Use a publishable key, never a secret key.'};
 try{if(key.split('.').length===3&&JSON.parse(atob(key.split('.')[1])).role==='service_role')return {mode:'cloud' as DataMode,url:'',key:'',error:'Service-role keys must never be exposed to the browser.'};}catch{/* Invalid keys are rejected by Supabase. */}
 return {mode:'cloud' as DataMode,url,key,error:''};
}
export const cloudConfig=resolveCloudConfig(process.env.NEXT_PUBLIC_DATA_MODE,process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const cloudMode=cloudConfig.mode==='cloud';
export function safeNext(value:string|null){return value&&/^\/(?!\/)/.test(value)&&!/[\\\r\n]/.test(value)&&!value.startsWith('/auth')?value:'/plan';}
