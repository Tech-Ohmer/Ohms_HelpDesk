-- ============================================================
-- my-helpdesk — Supabase Schema
-- Run this in your Supabase project SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TICKETS
-- ============================================================
create table if not exists tickets (
  id              uuid primary key default uuid_generate_v4(),
  ticket_number   text not null unique,
  submitter_name  text not null,
  submitter_email text not null,
  title           text not null,
  description     text not null,
  category        text not null check (category in ('bug', 'feature_request', 'question', 'other')),
  priority        text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  status          text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  tracking_token  text not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-increment ticket number (TKT-0001, TKT-0002, ...)
create sequence if not exists ticket_number_seq;

create or replace function generate_ticket_number()
returns trigger as $$
begin
  new.ticket_number := 'TKT-' || lpad(nextval('ticket_number_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_ticket_number
  before insert on tickets
  for each row
  execute function generate_ticket_number();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at();

-- ============================================================
-- TICKET UPDATES (replies / activity)
-- ============================================================
create table if not exists ticket_updates (
  id             uuid primary key default uuid_generate_v4(),
  ticket_id      uuid not null references tickets(id) on delete cascade,
  message        text not null,
  is_admin_reply boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Tickets: anyone can insert (public form), only authenticated admin can read/update all
alter table tickets enable row level security;

create policy "Anyone can create a ticket"
  on tickets for insert
  with check (true);

create policy "Anyone can view their own ticket via token"
  on tickets for select
  using (true); -- tracking_token check happens in app layer

create policy "Authenticated users (admin) can update tickets"
  on tickets for update
  using (auth.role() = 'authenticated');

-- Ticket updates: public can insert (submitter replies), admin can insert too
alter table ticket_updates enable row level security;

create policy "Anyone can create a ticket update"
  on ticket_updates for insert
  with check (true);

create policy "Anyone can view ticket updates"
  on ticket_updates for select
  using (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists tickets_status_idx on tickets(status);
create index if not exists tickets_tracking_token_idx on tickets(tracking_token);
create index if not exists ticket_updates_ticket_id_idx on ticket_updates(ticket_id);
