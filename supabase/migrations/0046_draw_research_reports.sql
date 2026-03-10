-- Draw Research AI reports — persistent unit scout recommendations
create table draw_research_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  state text not null,
  species text not null,
  season text,
  wizard_inputs jsonb not null default '{}',
  recommendations jsonb not null default '[]',
  summary text,
  chat_history jsonb not null default '[]',
  user_rankings jsonb,
  status text not null default 'draft' check (status in ('draft', 'final', 'shared')),
  shared_with uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table draw_research_reports enable row level security;

create policy "owner_all" on draw_research_reports
  for all using (auth.uid() = user_id);

create policy "shared_read" on draw_research_reports
  for select using (auth.uid() = any(shared_with));

create index idx_draw_research_user on draw_research_reports(user_id);
create index idx_draw_research_shared on draw_research_reports using gin(shared_with);
