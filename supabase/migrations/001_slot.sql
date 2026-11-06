-- Run once on a fresh Supabase project. PostgreSQL is the booking authority.
begin;
create extension if not exists btree_gist;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 1 and 100),
 phone text check (phone ~ '^\+263[0-9]{9}$')
);
create table public.providers (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
 name text not null check (char_length(name) between 1 and 100),
 category text not null check (category in ('barber','nails')),
 city text not null default 'Harare', area text not null,
 address text not null, bio text not null default '',
 timezone text not null default 'Africa/Harare' check(timezone='Africa/Harare'),
 published boolean not null default false,
 created_at timestamptz not null default now()
);
create index providers_owner on public.providers(owner_id);
create table public.services (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.providers(id),
 name text not null check (char_length(name) between 1 and 100),
 duration_minutes integer not null check(duration_minutes between 15 and 480),
 buffer_minutes integer not null default 0 check(buffer_minutes between 0 and 120),
 price_minor integer not null check(price_minor between 0 and 10000000),
 currency text not null default 'USD' check(currency in ('USD','ZWG')),
 active boolean not null default true
);
create index services_provider on public.services(provider_id);
create table public.working_hours (
 provider_id uuid not null references public.providers(id),
 weekday integer not null check(weekday between 0 and 6), -- Sunday=0
 opens time not null, closes time not null check(closes>opens),
 primary key(provider_id,weekday)
);
-- One provider represents one bookable person/chair. Each additional staff member
-- needs a separate provider in v1. Blocks share the exact same exclusion constraint.
create table public.appointments (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.providers(id),
 service_id uuid references public.services(id),
 customer_id uuid references auth.users(id),
 kind text not null default 'booking' check(kind in ('booking','block')),
 status text not null default 'confirmed' check(status in ('confirmed','cancelled','completed','no_show')),
 starts_at timestamptz not null, ends_at timestamptz not null,
 busy_until timestamptz not null,
 service_name text, price_minor integer, currency text,
 request_key uuid,
 created_at timestamptz not null default now(),
 check(ends_at>starts_at and busy_until>=ends_at),
 check((kind='booking' and customer_id is not null and service_id is not null and service_name is not null and price_minor is not null and price_minor>=0 and currency is not null and currency in ('USD','ZWG') and request_key is not null) or
       (kind='block' and customer_id is null and service_id is null)),
 unique(customer_id,request_key),
 exclude using gist(provider_id with =,tstzrange(starts_at,busy_until,'[)') with &&)
 where(status <> 'cancelled')
);
create index appointments_customer on public.appointments(customer_id,starts_at);
create index appointments_provider on public.appointments(provider_id,starts_at);
alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.working_hours enable row level security;
alter table public.appointments enable row level security;
-- Default deny. Public discovery never exposes customer information.
create policy own_profile_read on public.profiles for select to authenticated using(id=auth.uid());
create policy own_profile_insert on public.profiles for insert to authenticated with check(id=auth.uid());
create policy own_profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy provider_read on public.providers for select to anon,authenticated using(published or owner_id=auth.uid());
create policy provider_edit on public.providers for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy service_read on public.services for select to anon,authenticated using(exists(select 1 from public.providers p where p.id=provider_id and ((p.published and active) or p.owner_id=auth.uid())));
create policy hours_read on public.working_hours for select to anon,authenticated using(exists(select 1 from public.providers p where p.id=provider_id and (p.published or p.owner_id=auth.uid())));
create policy participant_read on public.appointments for select to authenticated using(customer_id=auth.uid() or exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()));
revoke all on public.profiles,public.providers,public.services,public.working_hours,public.appointments from anon,authenticated;
grant select on public.providers,public.services,public.working_hours to anon,authenticated;
grant select,insert,update on public.profiles to authenticated;
grant update(name,area,address,bio) on public.providers to authenticated;
grant select on public.appointments to authenticated;
-- Services, hours, ownership and publication are concierge-administered in MVP.
-- No browser/service-role key; use the SQL dashboard for verified onboarding.

create function public.available_slots(p_service uuid,p_day date)
returns table(starts_at timestamptz)
language sql stable security definer set search_path='' as $$
 with s as (
 select s.*,p.timezone from public.services s join public.providers p on p.id=s.provider_id
 where s.id=p_service and s.active and p.published
 ), candidates as (
 select s.provider_id,s.duration_minutes,s.buffer_minutes,g.t
 from s join public.working_hours h on h.provider_id=s.provider_id
 and h.weekday=extract(dow from p_day)::int
 cross join lateral generate_series(
 (p_day+h.opens) at time zone s.timezone,
 ((p_day+h.closes) at time zone s.timezone)-make_interval(mins=>s.duration_minutes+s.buffer_minutes),
 interval '30 minutes') g(t)
 where p_day between (now() at time zone 'Africa/Harare')::date and (now() at time zone 'Africa/Harare')::date+60
 ) select c.t from candidates c where c.t>now()+interval '30 minutes'
 and not exists(select 1 from public.appointments a where a.provider_id=c.provider_id and a.status<>'cancelled'
 and tstzrange(a.starts_at,a.busy_until,'[)') && tstzrange(c.t,c.t+make_interval(mins=>c.duration_minutes+c.buffer_minutes),'[)'))
 order by c.t;
$$;

create function public.book_appointment(p_service uuid,p_start timestamptz,p_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.services; p public.providers; a public.appointments; result uuid; day date;
begin
 if auth.uid() is null then raise exception 'Sign in before booking'; end if;
 if p_key is null then raise exception 'Request key required'; end if;
 -- Serialize bookings for a customer (including different providers), cap abuse.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into a from public.appointments where customer_id=auth.uid() and request_key=p_key;
 if found then
  if a.service_id<>p_service or a.starts_at<>p_start then raise exception 'Request key already used'; end if;
  return a.id;
 end if;
 select * into s from public.services where id=p_service;
 if not found then raise exception 'Service unavailable'; end if;
 select * into p from public.providers where id=s.provider_id for update;
 -- Re-read under lock: admin schedule changes must take this same provider lock.
 select * into s from public.services where id=p_service;
 if not p.published or not s.active then raise exception 'Service unavailable'; end if;
 if (select count(*) from public.appointments where customer_id=auth.uid() and status='confirmed' and starts_at>now())>=10 then raise exception 'Upcoming booking limit reached'; end if;
 if not exists(select 1 from public.available_slots(p_service,(p_start at time zone 'Africa/Harare')::date) x where x.starts_at=p_start) then raise exception 'This time is no longer available'; end if;
 insert into public.appointments(provider_id,service_id,customer_id,starts_at,ends_at,busy_until,service_name,price_minor,currency,request_key)
 values(s.provider_id,s.id,auth.uid(),p_start,p_start+make_interval(mins=>s.duration_minutes),p_start+make_interval(mins=>s.duration_minutes+s.buffer_minutes),s.name,s.price_minor,s.currency,p_key)
 returning id into result;
 return result;
exception when exclusion_violation then raise exception 'This time has just been booked. Choose another slot';
end $$;

create function public.cancel_appointment(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.appointments a set status='cancelled' where a.id=p_id and a.status='confirmed'
 and a.starts_at>now() and (a.customer_id=auth.uid() or exists(select 1 from public.providers p where p.id=a.provider_id and p.owner_id=auth.uid()));
 if not found then raise exception 'Appointment cannot be cancelled'; end if;
end $$;

create function public.block_time(p_provider uuid,p_start timestamptz,p_end timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform 1 from public.providers where id=p_provider and owner_id=auth.uid() for update;
 if not found then raise exception 'Not your business'; end if;
 if p_start<=now() or p_end<=p_start or p_end>p_start+interval '7 days' then raise exception 'Invalid block'; end if;
 insert into public.appointments(provider_id,kind,starts_at,ends_at,busy_until)
 values(p_provider,'block',p_start,p_end,p_end) returning id into result;
 return result;
end $$;

create function public.finish_appointment(p_id uuid,p_status text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_status not in ('completed','no_show') then raise exception 'Invalid outcome'; end if;
 update public.appointments a set status=p_status where a.id=p_id and a.kind='booking' and a.status='confirmed'
 and a.ends_at<=now() and exists(select 1 from public.providers p where p.id=a.provider_id and p.owner_id=auth.uid());
 if not found then raise exception 'Appointment cannot be updated'; end if;
end $$;
revoke all on function public.available_slots(uuid,date),public.book_appointment(uuid,timestamptz,uuid),public.cancel_appointment(uuid),public.block_time(uuid,timestamptz,timestamptz),public.finish_appointment(uuid,text) from public;
grant execute on function public.available_slots(uuid,date) to anon,authenticated;
grant execute on function public.book_appointment(uuid,timestamptz,uuid),public.cancel_appointment(uuid),public.block_time(uuid,timestamptz,timestamptz),public.finish_appointment(uuid,text) to authenticated;
commit;
