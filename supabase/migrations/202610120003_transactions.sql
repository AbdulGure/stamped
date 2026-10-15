create function public.ensure_plan() returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p uuid;
begin if u is null then raise exception 'Authentication required';end if;
insert into public.profiles(id) values(u) on conflict do nothing;
insert into public.plans(user_id) values(u) on conflict do nothing;
select id into p from public.plans where user_id=u;return p;end $$;
create function public.save_profile(p_home text,p_interests text[],p_trips jsonb) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();begin perform public.ensure_plan();
if jsonb_array_length(p_trips)<1 or cardinality(p_interests)<1 then raise exception 'Choose interests and a destination';end if;
perform 1 from public.profiles where id=u for update;
update public.profiles set home_city_id=p_home,onboarding_complete=true where id=u;
delete from public.user_interests where user_id=u;
insert into public.user_interests select u,unnest(p_interests) on conflict do nothing;
delete from public.travel_intents where user_id=u;
insert into public.travel_intents(user_id,city_id,status) select u,x->>'cityId',x->>'status' from jsonb_array_elements(p_trips) x;end $$;
create function public.mutate_plan(p_action text,p_experience text default null,p_day int default null,p_direction int default null,p_count int default null) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();p uuid;days int;pos int;target uuid;otherpos int;currentday int;
begin p:=public.ensure_plan();select day_count into days from public.plans where id=p for update;
if p_day is not null and (p_day<1 or p_day>days) then raise exception 'Invalid day';end if;
if p_action='add' then
 if not exists(select 1 from public.experiences where id=p_experience and published) then raise exception 'Experience not found';end if;
 insert into public.plan_items(user_id,plan_id,experience_id,day,position) values(u,p,p_experience,p_day,(select coalesce(max(position),0)+1 from public.plan_items where user_id=u)) on conflict(user_id,experience_id) do nothing;
elsif p_action='remove' then delete from public.plan_items where user_id=u and experience_id=p_experience;
elsif p_action='day' then
 update public.plan_items set day=p_day,position=(select coalesce(max(position),0)+1 from public.plan_items where user_id=u) where user_id=u and experience_id=p_experience;
 if not found then raise exception 'Experience not in plan';end if;
elsif p_action='count' then
 if p_count is null or p_count<1 or p_count>30 then raise exception 'Invalid day count';end if;
 update public.plans set day_count=p_count where id=p;update public.plan_items set day=null where user_id=u and day>p_count;
elsif p_action='move' then
 if p_direction not in (-1,1) or p_direction is null then raise exception 'Invalid direction';end if;
 select position,day into pos,currentday from public.plan_items where user_id=u and experience_id=p_experience;
 if not found then raise exception 'Experience not in plan';end if;
 select id,position into target,otherpos from public.plan_items where user_id=u and day is not distinct from currentday and (position-pos)*p_direction>0 order by abs(position-pos) limit 1;
 if target is not null then update public.plan_items set position=pos where id=target;update public.plan_items set position=otherpos where user_id=u and experience_id=p_experience;end if;
else raise exception 'Unknown action';end if;end $$;
create function public.complete_experience(p_experience text,p_completed_at timestamptz default null) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();sid uuid;p uuid;
begin p:=public.ensure_plan();perform 1 from public.plans where id=p for update;
select id into sid from public.stamps where user_id=u and experience_id=p_experience;if sid is not null then return sid;end if;
if not exists(select 1 from public.plan_items where user_id=u and experience_id=p_experience) then raise exception 'Add experience to plan first';end if;
if p_completed_at>now() then raise exception 'Completion cannot be in the future';end if;
insert into public.stamps(user_id,experience_id,city_id,completed_at) select u,id,city_id,coalesce(p_completed_at,now()) from public.experiences where id=p_experience and published returning id into sid;
if sid is null then raise exception 'Experience not found';end if;return sid;end $$;
create function public.save_memory(p_stamp uuid,p_rating int,p_amount numeric,p_minutes int,p_tip text,p_cover text,p_photos jsonb) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();photo jsonb;slot int:=0;begin
if u is null then raise exception 'Authentication required';end if;
perform 1 from public.stamps where id=p_stamp and user_id=u for update;if not found then raise exception 'Stamp not found';end if;
if jsonb_typeof(p_photos)<>'array' or jsonb_array_length(p_photos)>5 then raise exception 'Choose up to five photos';end if;
if p_cover is not null and not exists(select 1 from jsonb_array_elements(p_photos) x where x->>'id'=p_cover) then raise exception 'Invalid cover';end if;
for photo in select * from jsonb_array_elements(p_photos) loop
 if split_part(photo->>'storagePath','/',1)<>u::text or split_part(photo->>'storagePath','/',2)<>p_stamp::text or not exists(select 1 from storage.objects where bucket_id='stamp-evidence' and name=photo->>'storagePath') then raise exception 'Invalid private photo reference';end if;
end loop;
delete from public.stamp_media where stamp_id=p_stamp and user_id=u;
for photo in select * from jsonb_array_elements(p_photos) loop slot:=slot+1;
insert into public.stamp_media(id,stamp_id,user_id,storage_path,alt,slot) values(photo->>'id',p_stamp,u,photo->>'storagePath',coalesce(photo->>'alt','Memory photo'),slot);end loop;
update public.stamps set rating=p_rating,amount_spent=p_amount,duration_minutes=p_minutes,tip=trim(coalesce(p_tip,'')),cover_photo=p_cover,evidence_status=case when slot>0 then 'photo' else 'standard' end where id=p_stamp and user_id=u;
end $$;
revoke execute on function public.ensure_plan(),public.save_profile(text,text[],jsonb),public.mutate_plan(text,text,int,int,int),public.complete_experience(text,timestamptz),public.save_memory(uuid,int,numeric,int,text,text,jsonb) from public,anon;
grant execute on function public.ensure_plan(),public.save_profile(text,text[],jsonb),public.mutate_plan(text,text,int,int,int),public.complete_experience(text,timestamptz),public.save_memory(uuid,int,numeric,int,text,text,jsonb) to authenticated;
