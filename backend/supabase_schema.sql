-- profiles (extends Supabase auth.users — role/department not native to Auth)
create table profiles (
  id uuid references auth.users(id) primary key,
  name text,
  role text check (role in ('employee','agent','manager')),
  department text
);

-- tickets
create extension if not exists vector;

create table tickets (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  category text,
  urgency text check (urgency in ('Low','Medium','High')),
  status text check (status in ('Open','In Progress','Resolved','Closed')) default 'Open',
  created_by uuid references profiles(id),
  assigned_to uuid references profiles(id),
  department text,
  ai_confidence float,
  ai_suggested_category text,
  ai_suggested_urgency text,
  resolution_note text,
  embedding vector(768),         -- dimension matches chosen embedding model
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ticket_events
create table ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id),
  old_status text,
  new_status text,
  actor_id uuid references profiles(id),
  timestamp timestamptz default now()
);

-- notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  ticket_id uuid references tickets(id),
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- departments
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text
);

-- vector similarity index (IVFFlat or HNSW, pgvector)
create index on tickets using ivfflat (embedding vector_cosine_ops);
