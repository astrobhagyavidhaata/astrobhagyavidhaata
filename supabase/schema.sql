-- Astro Bhagya Vidhata: Supabase security + wallet schema
-- Run in Supabase SQL Editor. Never expose the service-role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_paise bigint not null default 0 check (balance_paise >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('recharge','consultation_debit','refund','adjustment')),
  amount_paise bigint not null check (amount_paise > 0),
  reference_id text,
  description text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions(user_id, created_at desc);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  astrologer_id text not null default 'vedic-astrologer',
  status text not null default 'active' check (status in ('active','stopped')),
  rate_paise_per_minute integer not null default 500 check (rate_paise_per_minute = 500),
  billed_minutes integer not null default 1 check (billed_minutes >= 1),
  started_at timestamptz not null default now(),
  last_billed_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists consultations_user_status_idx
  on public.consultations(user_id, status);

create unique index if not exists one_active_consultation_per_user
  on public.consultations(user_id) where status = 'active';

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'razorpay',
  order_id text not null unique,
  payment_id text unique,
  amount_paise bigint not null check (amount_paise >= 1000),
  status text not null default 'created' check (status in ('created','paid','failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.kundlis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'जन्म कुंडली',
  birth_details jsonb not null,
  chart_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists kundlis_user_created_idx on public.kundlis(user_id, created_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consultation_id uuid references public.consultations(id) on delete set null,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 5000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_user_created_idx on public.chat_messages(user_id, created_at);

-- New account gets an empty profile and wallet automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name',''));
  insert into public.wallets(user_id, balance_paise) values (new.id, 0);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Keep older deployments compatible with the heartbeat lease column.
alter table public.consultations add column if not exists last_activity_at timestamptz not null default now();

-- Atomic start: ₹5 is charged immediately for the first minute.
create or replace function public.start_consultation(p_user_id uuid, p_astrologer_id text default 'vedic-astrologer')
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare w public.wallets%rowtype; c public.consultations%rowtype;
begin
  update public.consultations set status='stopped', ended_at=last_activity_at + interval '45 seconds'
    where user_id=p_user_id and status='active' and last_activity_at < now()-interval '45 seconds';
  select * into w from public.wallets where user_id = p_user_id for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  if exists(select 1 from public.consultations where user_id=p_user_id and status='active') then
    raise exception 'ACTIVE_CONSULTATION_EXISTS';
  end if;
  if w.balance_paise < 500 then raise exception 'INSUFFICIENT_BALANCE'; end if;

  update public.wallets set balance_paise=balance_paise-500, updated_at=now()
    where user_id=p_user_id returning * into w;
  insert into public.wallet_transactions(user_id,kind,amount_paise,description)
    values(p_user_id,'consultation_debit',500,'पहले मिनट का परामर्श शुल्क');
  insert into public.consultations(user_id,astrologer_id)
    values(p_user_id,coalesce(nullif(p_astrologer_id,''),'vedic-astrologer'))
    returning * into c;
  return jsonb_build_object('consultation',to_jsonb(c),'wallet',to_jsonb(w));
end;
$$;

-- Charge only complete additional minutes. Locking wallet + session prevents double debit.
create or replace function public.heartbeat_consultation(p_user_id uuid, p_consultation_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare c public.consultations%rowtype; w public.wallets%rowtype;
        due_minutes integer; affordable integer; debit bigint;
begin
  select * into c from public.consultations
    where id=p_consultation_id and user_id=p_user_id for update;
  if not found or c.status <> 'active' then raise exception 'CONSULTATION_NOT_ACTIVE'; end if;
  select * into w from public.wallets where user_id=p_user_id for update;
  if c.last_activity_at < now()-interval '45 seconds' then
    update public.consultations set status='stopped', ended_at=last_activity_at + interval '45 seconds'
      where id=p_consultation_id returning * into c;
    return jsonb_build_object('consultation',to_jsonb(c),'wallet',to_jsonb(w));
  end if;
  due_minutes := greatest(0, floor(extract(epoch from (now()-c.last_billed_at))/60)::integer);
  if due_minutes > 0 then
    affordable := least(due_minutes, (w.balance_paise / 500)::integer);
    debit := affordable::bigint * 500;
    if debit > 0 then
      update public.wallets set balance_paise=balance_paise-debit, updated_at=now()
        where user_id=p_user_id returning * into w;
      insert into public.wallet_transactions(user_id,kind,amount_paise,reference_id,description)
        values(p_user_id,'consultation_debit',debit,p_consultation_id::text,
          'परामर्श शुल्क: '||affordable||' अतिरिक्त मिनट');
      update public.consultations set billed_minutes=billed_minutes+affordable,
        last_billed_at=last_billed_at + make_interval(mins=>affordable),
        last_activity_at=now()
        where id=p_consultation_id returning * into c;
    end if;
    if affordable < due_minutes then
      update public.consultations set status='stopped', ended_at=last_billed_at
        where id=p_consultation_id returning * into c;
    end if;
  else
    update public.consultations set last_activity_at=now()
      where id=p_consultation_id returning * into c;
  end if;
  return jsonb_build_object('consultation',to_jsonb(c),'wallet',to_jsonb(w));
end;
$$;

create or replace function public.stop_consultation(p_user_id uuid, p_consultation_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $
declare c public.consultations%rowtype; w public.wallets%rowtype;
        due_minutes integer; affordable integer; debit bigint; v_ended_at timestamptz;
begin
  select * into c from public.consultations
    where id=p_consultation_id and user_id=p_user_id for update;
  if not found then raise exception 'CONSULTATION_NOT_FOUND'; end if;
  select * into w from public.wallets where user_id=p_user_id for update;
  if c.status='active' then
    if c.last_activity_at >= now()-interval '45 seconds' then
      due_minutes := greatest(0,floor(extract(epoch from (now()-c.last_billed_at))/60)::integer);
      if due_minutes>0 then
        affordable := least(due_minutes,(w.balance_paise/500)::integer);
        debit := affordable::bigint*500;
        if debit>0 then
          update public.wallets set balance_paise=balance_paise-debit,updated_at=now()
            where user_id=p_user_id returning * into w;
          insert into public.wallet_transactions(user_id,kind,amount_paise,reference_id,description)
            values(p_user_id,'consultation_debit',debit,p_consultation_id::text,
              'परामर्श शुल्क: '||affordable||' अतिरिक्त मिनट');
          update public.consultations set billed_minutes=billed_minutes+affordable,
            last_billed_at=last_billed_at+make_interval(mins=>affordable)
            where id=p_consultation_id returning * into c;
        end if;
        if affordable<due_minutes then v_ended_at:=c.last_billed_at;
        else v_ended_at:=now(); end if;
      else
        v_ended_at:=now();
      end if;
    else
      v_ended_at:=c.last_activity_at+interval '45 seconds';
    end if;
    update public.consultations set status='stopped',ended_at=v_ended_at
      where id=p_consultation_id returning * into c;
  end if;
  return jsonb_build_object('consultation',to_jsonb(c),'wallet',to_jsonb(w));
end;
$;

-- Only trusted server-side service-role requests may execute money-changing functions.
revoke all on function public.start_consultation(uuid,text) from public, anon, authenticated;
revoke all on function public.heartbeat_consultation(uuid,uuid) from public, anon, authenticated;
revoke all on function public.stop_consultation(uuid,uuid) from public, anon, authenticated;
grant execute on function public.start_consultation(uuid,text) to service_role;
grant execute on function public.heartbeat_consultation(uuid,uuid) to service_role;
grant execute on function public.stop_consultation(uuid,uuid) to service_role;

-- Row-level security: customers can read only their own records. They cannot change wallet balances.
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.consultations enable row level security;
alter table public.payments enable row level security;
alter table public.kundlis enable row level security;
alter table public.chat_messages enable row level security;

create policy "profile read own" on public.profiles for select to authenticated using (id=auth.uid());
create policy "profile update own" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "wallet read own" on public.wallets for select to authenticated using (user_id=auth.uid());
create policy "transactions read own" on public.wallet_transactions for select to authenticated using (user_id=auth.uid());
create policy "consultations read own" on public.consultations for select to authenticated using (user_id=auth.uid());
create policy "payments read own" on public.payments for select to authenticated using (user_id=auth.uid());
create policy "kundlis read own" on public.kundlis for select to authenticated using (user_id=auth.uid());
create policy "kundlis insert own" on public.kundlis for insert to authenticated with check (user_id=auth.uid());
create policy "kundlis update own" on public.kundlis for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "kundlis delete own" on public.kundlis for delete to authenticated using (user_id=auth.uid());
create policy "chat read own" on public.chat_messages for select to authenticated using (user_id=auth.uid());
create policy "chat insert own" on public.chat_messages for insert to authenticated with check (user_id=auth.uid() and role='user');

-- No client-side insert/update/delete policies for wallets, payments, transactions or consultations.


-- Idempotent wallet credit: amount must match the stored Razorpay order.
drop function if exists public.credit_payment(text,text);
create or replace function public.credit_payment(p_order_id text, p_payment_id text, p_amount_paise bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare p public.payments%rowtype; w public.wallets%rowtype;
begin
  select * into p from public.payments where order_id=p_order_id for update;
  if not found then raise exception 'PAYMENT_ORDER_NOT_FOUND'; end if;
  if p.amount_paise <> p_amount_paise then raise exception 'PAYMENT_AMOUNT_MISMATCH'; end if;
  if p.status='paid' then
    if p.payment_id <> p_payment_id then raise exception 'PAYMENT_ID_MISMATCH'; end if;
    select * into w from public.wallets where user_id=p.user_id;
    return jsonb_build_object('credited',false,'wallet',to_jsonb(w));
  end if;
  if p.status<>'created' then raise exception 'PAYMENT_NOT_PAYABLE'; end if;
  update public.payments set status='paid',payment_id=p_payment_id,paid_at=now()
    where id=p.id returning * into p;
  update public.wallets set balance_paise=balance_paise+p.amount_paise,updated_at=now()
    where user_id=p.user_id returning * into w;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  insert into public.wallet_transactions(user_id,kind,amount_paise,reference_id,description)
    values(p.user_id,'recharge',p.amount_paise,p.order_id,'Razorpay wallet recharge');
  return jsonb_build_object('credited',true,'wallet',to_jsonb(w));
end;
$$;

revoke all on function public.credit_payment(text,text,bigint) from public, anon, authenticated;
grant execute on function public.credit_payment(text,text,bigint) to service_role;
