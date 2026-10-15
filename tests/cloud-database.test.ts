import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
test('PostgreSQL migrations, transactions and RLS isolate two users',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth,storage to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 insert into auth.users values('${a}'),('${b}');`);
 for(const name of ['core','security','transactions','seed']){const n=['core','security','transactions','seed'].indexOf(name)+1;await db.exec(await readFile(new URL(`../supabase/migrations/20261012000${n}_${name}.sql`,import.meta.url),'utf8'));}
 const asUser=async(id:string)=>{await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`);};
 await asUser(a);await db.exec(`select public.save_profile('london',array['gaming','film'],'[{"cityId":"tokyo","status":"Definitely going"}]');select public.mutate_plan('add','akihabara-electric-town',1);`);
 const r=await db.query<{id:string}>(`select public.complete_experience('akihabara-electric-town') as id`);const id=r.rows[0].id;
 const again=await db.query<{id:string}>(`select public.complete_experience('akihabara-electric-town') as id`);assert.equal(again.rows[0].id,id);
 await db.exec(`insert into storage.objects(bucket_id,name) values('stamp-evidence','${a}/${id}/photo.jpg');`);
 const photos=JSON.stringify([{id:'photo',storagePath:`${a}/${id}/photo.jpg`,alt:'Arcade'}]);
 await db.query(`select public.save_memory($1,5,42,180,'Great arcades','photo',$2::jsonb)`,[id,photos]);
 assert.equal((await db.query<{evidence_status:string}>(`select evidence_status from public.stamps`)).rows[0].evidence_status,'photo');
 await assert.rejects(db.exec(`update public.stamps set user_id='${b}'`));
 await asUser(b);assert.equal((await db.query('select * from public.stamps')).rows.length,0);assert.equal((await db.query('select * from public.stamp_media')).rows.length,0);assert.equal((await db.query('select * from public.profiles')).rows.length,0);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await assert.rejects(db.query(`select public.save_memory($1,1,0,1,'stolen',null,'[]')`,[id]));
 await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values('stamp-evidence','${a}/${id}/stolen.jpg')`));
 await db.exec(`select public.mutate_plan('add','south-bank-walk');select public.complete_experience('south-bank-walk');`);assert.equal((await db.query<{city_id:string}>('select city_id from public.stamps')).rows[0].city_id,'london');
 await asUser(a);assert.equal((await db.query('select * from public.stamps')).rows.length,1);assert.equal((await db.query('select * from public.stamp_media')).rows.length,1);
 await assert.rejects(db.exec(`select public.mutate_plan('count',null,null,null,99)`));
 const tooMany=JSON.stringify(Array.from({length:6},(_,i)=>({id:`p${i}`,storagePath:`${a}/${id}/photo.jpg`,alt:'x'})));
 await assert.rejects(db.query(`select public.save_memory($1,5,42,180,'bad','p0',$2::jsonb)`,[id,tooMany]));
 assert.equal((await db.query<{tip:string}>('select tip from public.stamps')).rows[0].tip,'Great arcades');
 await db.exec(`reset role;set role anon;select set_config('request.jwt.claim.sub','',false);`);await assert.rejects(db.exec('select public.ensure_plan()'));await assert.rejects(db.exec('select * from public.stamps'));assert.ok((await db.query('select * from public.experiences')).rows.length>=5);
 }finally{await db.close();}
});
