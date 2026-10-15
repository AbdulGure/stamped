-- RLS is the authorization boundary; the browser's route gate is only UX.
do $$ declare t text;begin
 foreach t in array array['cities','interests','experiences','experience_interests','profiles','user_interests','travel_intents','plans','plan_items','itineraries','itinerary_items','stamps','stamp_media'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
 foreach t in array array['cities','interests'] loop execute format('create policy catalog_read on public.%I for select using (true)',t);execute format('grant select on public.%I to anon, authenticated',t);end loop;
 foreach t in array array['user_interests','travel_intents','plans','plan_items','itineraries','itinerary_items','stamps','stamp_media'] loop
 execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 execute format('create policy owner_write on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy profile_read on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy profile_write on public.profiles for all to authenticated using ((select auth.uid())=id) with check((select auth.uid())=id);
grant select on public.profiles to authenticated;
create policy published_read on public.experiences for select using (published);
create policy published_interest_read on public.experience_interests for select using (exists(select 1 from public.experiences e where e.id=experience_id and e.published));
grant select on public.experiences,public.experience_interests to anon,authenticated;
-- Writes go through narrow transactional RPCs. No direct stamp/profile mutation grant.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('stamp-evidence','stamp-evidence',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy evidence_read on storage.objects for select to authenticated using(bucket_id='stamp-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy evidence_upload on storage.objects for insert to authenticated with check(bucket_id='stamp-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.stamps s where s.id::text=(storage.foldername(name))[2] and s.user_id=(select auth.uid())));
create policy evidence_delete on storage.objects for delete to authenticated using(bucket_id='stamp-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
