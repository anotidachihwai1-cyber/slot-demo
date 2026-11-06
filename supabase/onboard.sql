-- Replace OWNER_UUID with a real Auth user UUID. Run as dashboard admin.
-- Fictional example; don't publish it as a real business.
begin;
insert into public.providers(owner_id,slug,name,category,area,address,published)
values('OWNER_UUID','your-barber','Your verified business','barber','Avondale','Verified address',true);
insert into public.services(provider_id,name,duration_minutes,buffer_minutes,price_minor,currency)
select id,'Signature fade',30,10,800,'USD' from public.providers where slug='your-barber';
insert into public.working_hours(provider_id,weekday,opens,closes)
select p.id,d,'09:00'::time,'17:00'::time from public.providers p cross join generate_series(1,6) d where p.slug='your-barber';
commit;
-- For later schedule/service edits, BEGIN; SELECT id FROM public.providers
-- WHERE id='PROVIDER_UUID' FOR UPDATE; make edits; COMMIT.
-- Check existing appointments before shortening working hours; never silently cancel.
