# NudgeAssist — AI-Powered Internal Support & Ticketing Platform

**Assignment:** Intern, AI Product Engineer — The/Nudge Institute
**Selected Option:** Option A — Internal Ticketing Tool (with Agentic AI Layer)
**Prepared for submission to:** sno@thenudge.org (CC: anurag.vaishnav@thenudge.org)

---

## 1. Introduction

The/Nudge Institute runs programs across rural development, agriculture, skilling, and economic inclusion at national scale, supported by a growing internal workforce spread across offices and field locations. As the organization scales, internal support requests — IT issues, HR queries, finance approvals, admin needs — are typically routed through email or chat, with no central tracking, no SLA visibility, and no institutional memory of how past issues were resolved.

**NudgeAssist** is a full-stack, AI-native internal ticketing platform that gives every employee a single place to raise, track, and resolve support requests — while using AI to cut resolution time, reduce duplicate work, and surface organizational insights that would otherwise be invisible.

This is not just a CRUD ticketing app. It is designed to demonstrate **product thinking, full-stack engineering, applied AI/RAG, and agentic automation** — directly aligned with what an AI Product Engineer at The/Nudge would be expected to build.

---

## 2. Problem Statement

- Employees have no unified channel to raise IT/HR/Finance/Admin issues.
- Support agents have no structured queue, lifecycle, or SLA tracking.
- Repeated/duplicate issues consume agent time unnecessarily.
- Leadership has no visibility into recurring pain points or department load.
- Manual categorization and first-response drafting slow down resolution.

---

## 3. Goals & Objectives

| Goal | Outcome |
|---|---|
| Centralize support requests | One platform for IT/HR/Finance/Admin |
| Reduce duplicate tickets | AI similarity search before submission |
| Speed up triage | AI auto-categorization + priority detection |
| Speed up agent response | AI-drafted first responses |
| Improve visibility | Real-time analytics dashboard |
| Demonstrate agentic AI | End-to-end automated ticket-handling agent |

---

## 4. Tech Stack

**All tools below have a free tier — zero cost to build and demo this project.**

| Layer | Technology | Why (Free Tier) |
|---|---|---|
| Frontend | Next.js (React) + Tailwind CSS | Open source, free |
| Backend | FastAPI (Python) | Open source, free |
| Database | **Supabase (Postgres, free tier)** | 500MB free, managed Postgres, no card needed |
| Vector Store | **pgvector extension (built into Supabase Postgres)** | No separate vector DB — RAG runs inside same Postgres |
| AI Orchestration | LangChain / LangGraph | Open source, free |
| LLM Provider | **Google Gemini 1.5 Flash (free tier)** or **Groq (Llama 3.1, free + very fast)** | Generous free request quotas, no card needed |
| Embeddings | **Gemini `text-embedding-004` (free)** or local `sentence-transformers` (100% free, no API) | Either keeps cost at $0 |
| Auth | **Supabase Auth (built-in, free)** | Hosted login/signup/JWT issuance — no custom auth code |
| Notifications | Gmail SMTP (free) + in-app toast/bell | Free for low-volume sending |
| Containerization | Docker + Docker Compose | Free, local |
| Deployment | **Frontend → Vercel (free)** · **Backend → Render free web service** | No-cost hosting for demo |
| Analytics | Recharts (frontend) + Postgres SQL aggregation (backend) | No paid BI tool needed |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                        │
│  Employee Portal | Agent Console | Manager Dashboard             │
└───────────────────────────┬───────────────────────────────────┘
                             │ REST/JSON (Supabase JWT auth)
┌───────────────────────────▼───────────────────────────────────┐
│                        FastAPI Backend                          │
│  ┌───────────────┐  ┌───────────────────┐  ┌─────────────────┐ │
│  │ Ticket Service │  │ Supabase Auth      │  │ Notification    │ │
│  │                │  │ (JWT verify only)  │  │ Service          │ │
│  └───────┬───────┘  └───────────────────┘  └─────────────────┘ │
│          │                                                       │
│  ┌───────▼─────────────────────────────────────────────────┐   │
│  │              AI Orchestration Layer (LangChain)           │   │
│  │  Categorizer │ Embedding Search │ Draft Generator │ Agent │   │
│  └───────┬─────────────────────────────────────────────────┘   │
└──────────┼───────────────────────────────────────────────────┘
           │
   ┌───────▼────────┐      ┌──────────────────┐
   │ Supabase        │      │  LLM API (Gemini/ │
   │ Postgres +      │      │   Groq — free)    │
   │ pgvector (free) │      └──────────────────┘
   └─────────────────┘
```

**Auth note:** Frontend authenticates directly against **Supabase Auth** (via `supabase-js`), not through FastAPI. FastAPI only *verifies* the Supabase-issued JWT on incoming requests — it never issues or stores passwords itself.

---

## 6. Core Ticket Lifecycle (Functional Requirements)

### 6.1 Employee Actions
- Sign in (Supabase Auth)
- Create ticket: Title, Description, Category (or let AI infer), Urgency
- View own tickets + status history
- Receive notifications on status change

### 6.2 System Actions
- Auto-route ticket to correct department queue based on category
- Trigger AI categorization + similarity search at submission time
- Log every status transition with timestamp + actor

### 6.3 Agent Actions
- View department-specific ticket queue
- Update status through fixed lifecycle:

```
Open → In Progress → Resolved → Closed
```

- Use AI-drafted response as starting point, edit, and send
- Reassign/escalate ticket if needed

### 6.4 Notifications
- Email + in-app notification on every status change
- Optional: daily digest for agents on pending queue

---

## 7. AI Layer (Core Differentiator)

### 7.1 Auto-Categorization
- On ticket creation, LLM classifies description into: IT / HR / Finance / Admin
- Returns category + confidence score
- Employee can override before final submit

**Example:**
```
Input: "My laptop VPN is not working"
Output: { department: "IT", priority: "High", confidence: 0.94 }
```

### 7.2 Similar Ticket Retrieval (RAG)
- Ticket description embedded (Gemini embeddings or local model)
- Vector similarity search via **pgvector** (cosine distance, native SQL) against resolved tickets
- Top 3 similar resolved tickets shown before submission, with their resolution
- Reduces duplicate ticket creation

### 7.3 AI Draft Response (Agent Copilot)
- When agent opens a ticket, LLM generates a suggested first response
- Grounded in similar resolved tickets (RAG-augmented generation)
- Agent can accept, edit, or discard

### 7.4 Executive AI Insights
- Manager-only "Generate Weekly Summary" button
- LLM summarizes ticket trends in natural language:
  - % tickets per department
  - Notable spikes (e.g., VPN issues +27%)
  - Average resolution time trend

### 7.5 Agentic Workflow (Stretch Feature)
A LangGraph-based agent pipeline triggered on ticket creation:

```
Ticket Created
     │
     ▼
Categorize (LLM)
     │
     ▼
Search Similar Tickets (RAG)
     │
     ▼
Draft Resolution Suggestion
     │
     ▼
Recommend Department + Priority
     │
     ▼
Notify Employee + Route to Agent Queue
```

This demonstrates true **agentic AI** — multi-step, tool-using, autonomous workflow — rather than a single LLM call.

---

## 8. Data Model (Supabase Postgres Tables)

```sql
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
  ai_confidence float,
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
```

`profiles.id` is a foreign key into Supabase's own `auth.users` table — user identity/password lives in Supabase Auth, app-specific fields (role, department) live in `profiles`, joined automatically on every authenticated request via the verified JWT's `sub` claim.

Similarity search uses a plain SQL query (`ORDER BY embedding <=> query_embedding LIMIT 3`) — no separate vector DB service, runs inside the same Supabase Postgres instance.

---

## 9. Key API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | *(handled client-side by Supabase Auth — frontend calls `supabase.auth.signInWithPassword()` directly, not this backend)* |
| POST | `/tickets` | Create ticket (triggers AI pipeline) |
| GET | `/tickets/similar?desc=` | RAG similarity search |
| GET | `/tickets` | List tickets (filtered by role/department) |
| PATCH | `/tickets/{id}/status` | Update ticket status |
| GET | `/tickets/{id}/draft-response` | AI agent-copilot suggestion |
| GET | `/analytics/summary` | Dashboard metrics |
| GET | `/analytics/ai-weekly-summary` | LLM-generated executive summary |
| GET | `/notifications` | Fetch user notifications |

---

## 10. Frontend Pages

1. **Login** — role-based redirect
2. **Employee Dashboard** — "Raise Ticket" + "My Tickets"
3. **Create Ticket Form** — live AI category suggestion + similar tickets panel
4. **Agent Console** — department queue, status update, AI draft response panel
5. **Manager Dashboard** — analytics charts + AI weekly summary generator
6. **Notification Bell** — dropdown with recent status changes

---

## 11. Analytics Dashboard (Built-in Analytics Requirement)

Charts to include:
- Tickets by Department (bar)
- Tickets by Status (pie/donut)
- Average Resolution Time (line, over time)
- AI Categorization Accuracy (gauge — % agent overrides vs AI suggestion)
- Department Load (stacked bar, open vs resolved)
- Recurring Issue Tags (word cloud or top-N table)

---

## 12. Authentication & Roles

| Role | Permissions |
|---|---|
| Employee | Create/view own tickets, receive notifications |
| Agent | View department queue, update status, use AI copilot |
| Manager | Full visibility, analytics dashboard, AI weekly summary |

**Supabase Auth** handles login/signup/password reset/JWT issuance — no custom auth code in FastAPI. Frontend signs in via `supabase-js`, gets a Supabase JWT, sends it as `Authorization: Bearer <token>` on every API call. FastAPI verifies the JWT (Supabase JWT secret, HS256) and looks up `profiles.role` for that user to enforce route guards. Role lives in the `profiles` table, not in Supabase Auth itself.

---

## 13. Deployment Plan (100% Free Tier)

1. **Database/Auth:** Create free Supabase project (Postgres + Auth included), enable `vector` extension, run schema SQL, create `ivfflat` index on `tickets.embedding`.
2. **Backend:** Dockerize FastAPI, deploy to **Render free web service** (auto-sleeps when idle — fine for a demo).
3. **Frontend:** Deploy Next.js to **Vercel free tier** (instant, zero-config for Next.js); configure `supabase-js` with project URL + anon key.
4. **LLM keys:** Free API key from **Google AI Studio (Gemini)** or **Groq** — both no-card signup.
5. **Email:** Use free **Gmail SMTP** (app password) for status-change notifications.
6. **Env vars:** Set `SUPABASE_URL`, `SUPABASE_DB_URL` (direct Postgres connection string), `SUPABASE_JWT_SECRET`, `GEMINI_API_KEY` (or `GROQ_API_KEY`), `SMTP_USER`, `SMTP_PASS` on Render/Vercel dashboards.

> This entire stack — Supabase, Render, Vercel, Gemini/Groq — runs at **$0** for prototype/demo scale, no credit card needed anywhere.

---

## 14. Suggested Build Roadmap (Given Tight Deadline)

| Phase | Time | Deliverable |
|---|---|---|
| 1 | Day 1 (AM) | DB schema, auth, basic ticket CRUD |
| 2 | Day 1 (PM) | Ticket lifecycle + status workflow + notifications |
| 3 | Day 2 (AM) | AI categorization + embeddings + similarity search |
| 4 | Day 2 (PM) | Agent copilot draft response + analytics dashboard |
| 5 | Final hours | Agentic pipeline (LangGraph), polish UI, record demo, write 2-page note |

> Adjust phases to your actual remaining time before the deadline (10:00 AM, Monday, June 22, 2026). Prioritize Phases 1–3 first — a working core + one strong AI feature beats an incomplete agentic pipeline.

---

## 15. Mapping to Official Evaluation Criteria

| Evaluation Criterion | How NudgeAssist Addresses It |
|---|---|
| Strong design thinking | Role-based flows, clear ticket lifecycle, RAG-assisted UX |
| User-first design | Live AI category suggestion, similar-ticket nudge before submission |
| Functional AI layer | Categorization + RAG retrieval + draft generation + agentic pipeline |
| Built-in analytics | Full manager dashboard with 6 chart types + AI-generated summary |

---

## 16. Suggested Folder Structure

```
nudgeassist/
├── backend/
│   ├── app/
│   │   ├── api/            # route handlers
│   │   ├── ai/              # langchain chains, agent graph
│   │   ├── models/          # SQLAlchemy models (Postgres/Supabase)
│   │   ├── schemas/         # Pydantic schemas
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js app router pages
│   ├── components/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 17. Local Setup Instructions (for README)

```bash
# 1. Clone & configure
git clone <repo-url> && cd nudgeassist
cp .env.example .env
# .env contents:
# SUPABASE_URL=https://<project>.supabase.co
# SUPABASE_DB_URL=postgresql://postgres:<pass>@db.<project>.supabase.co:5432/postgres
# SUPABASE_JWT_SECRET=...     # Project Settings → API → JWT Secret
# GEMINI_API_KEY=...          # or GROQ_API_KEY=...
# SMTP_USER=you@gmail.com
# SMTP_PASS=<gmail app password>

# 2. Run via Docker Compose (backend connects to hosted Supabase, no local DB container needed)
docker-compose up --build

# 3. Access
Frontend: http://localhost:3000
Backend docs (Swagger): http://localhost:8000/docs
```

---

## 18. Why This Project Stands Out

Most candidates will submit a basic create/view/update ticket app. NudgeAssist differentiates by treating AI as a **product layer**, not a bolt-on:

- AI reduces duplicate work (RAG similarity search)
- AI reduces agent effort (draft responses)
- AI reduces leadership blind spots (auto-generated weekly insights)
- An actual multi-step **agent** (not just a single prompt) handles ticket triage end-to-end

This directly mirrors the role's mandate: *"identifying workflows that can be optimized using AI"* and *"building intelligent solutions that improve program delivery and organizational scale."*
