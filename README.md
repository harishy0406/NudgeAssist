# NudgeAssist – AI-Powered Internal Support & Ticketing Platform
> **Transforming internal support workflows with AI-driven categorization, semantic search, and intelligent agent copilots.**

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase)](https://supabase.com)
[![LangChain](https://img.shields.io/badge/LangChain-AI%20Orchestration-1C3C3C?logo=langchain)](https://langchain.com)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-LLM-4285F4?logo=google)](https://ai.google.dev)
[![Docker](https://img.shields.io/badge/Docker-Containerization-blue?logo=docker)](https://docker.com)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-black?logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-Backend-46E3B7?logo=render)](https://render.com)


## 🎯 Overview
<p align='center'>
<img width="418" height="65" alt="image" src="https://github.com/user-attachments/assets/bc112901-d279-4984-8aae-b53e6bb1600f" />
</p>
NudgeAssist is a production-ready, AI-native full-stack internal ticketing platform built for The/Nudge Institute. As the organization scales its programs across rural development, agriculture, skilling, and economic inclusion, internal support operations — spanning IT, HR, Finance, and Admin — previously relied on informal email and chat channels with no central tracking, no SLA visibility, and no institutional memory of resolved issues.

NudgeAssist provides every employee with a unified place to raise and track support requests while using AI to cut resolution times, prevent duplicate work, and surface organizational insights that would otherwise remain invisible. It is not a simple CRUD application — AI is a first-class product layer that works across every persona: employees get semantic self-service nudges, agents get AI-drafted first responses, and managers get LLM-generated weekly executive briefings.

## ✨ Highlights

- 🎫 **Role-based portals** — Distinct, purpose-built interfaces for Employees, Support Agents, and Managers under a unified auth layer
- 🤖 **AI auto-categorization** — Google Gemini 2.5 Flash predicts department, urgency, and confidence score on every ticket submission using structured Pydantic output enforcement
- 🔍 **Semantic similarity search** — pgvector cosine distance search against all resolved tickets, shown to employees *before* submission to nudge self-service and prevent duplicates
- ✍️ **Agent AI copilot** — RAG-augmented draft responses grounded in historically resolved similar tickets, editable by agents before sending
- 📊 **Manager analytics dashboard** — Animated counter stats, four Recharts visualizations (department breakdown, status donut, urgency heat map, daily trend), and an LLM-generated weekly executive briefing
- 🔔 **Real-time notifications** — In-app notification bell and optional Gmail SMTP email alerts on every ticket status transition
- 🔐 **Supabase Auth (ES256 JWT)** — Authentication fully delegated to Supabase; FastAPI only verifies tokens, never handles passwords
- 🚀 **100% free-tier deployed** — Vercel (frontend) + Render (backend) + Supabase Postgres — zero credit card needed

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React, Vanilla CSS |
| Animations | Framer Motion, anime.js |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python 3.11, FastAPI |
| ORM | SQLAlchemy 2.0 (async) + asyncpg |
| Database | Supabase Postgres (managed) |
| Vector Search | pgvector extension (`IVFFlat` cosine index) |
| Authentication | Supabase Auth (ES256 JWT — verified by FastAPI) |
| AI Orchestration | LangChain, langchain-google-genai |
| LLM | Google Gemini 2.5 Flash |
| Embeddings | Google Gemini Embedding-2 (768 dimensions) |
| Containerization | Docker, Docker Compose |
| Frontend Deployment | Vercel (free tier) |
| Backend Deployment | Render (free tier) |
| Notifications | In-app + Gmail SMTP |

## 🏗️ Architecture

NudgeAssist follows a clean three-tier architecture with a dedicated AI orchestration layer separating LLM concerns from API routing.

<p align="center">
<!-- SCREENSHOT PLACEHOLDER: System architecture diagram -->
<img width="900" height="500" alt="image" src="https://github.com/user-attachments/assets/00c397fd-bee6-4224-a880-c326860456ec" />
</p>

### Core Data Flow

1. **Authentication**: The frontend authenticates directly against Supabase Auth via `supabase-js`. FastAPI only *verifies* the Supabase-issued ES256 JWT on every request — it never issues tokens or handles passwords.
2. **Ticket Creation (AI Pipeline)**: On submission, the ticket description is simultaneously sent to the LangChain categorization chain (Gemini 2.5 Flash, structured output) and the embedding engine (Gemini Embedding-2). The generated 768-dimensional vector is stored in the `tickets.embedding` pgvector column.
3. **Semantic Similarity Search**: When an employee types a ticket description, a debounced query hits `/tickets/similar`, which runs a native PostgreSQL cosine distance query (`ORDER BY embedding <=> query_vector LIMIT 3`) against all resolved tickets using the IVFFlat index.
4. **RAG Draft Generation**: When an agent requests a draft, the backend retrieves the top 3 similar resolved tickets, injects their descriptions and resolution notes as few-shot context into a structured prompt, and Gemini 2.5 Flash returns a grounded first-response draft.
5. **Analytics & AI Summary**: The manager dashboard aggregates SQL statistics from the last 7 days and passes them to Gemini 2.5 Flash, which returns a structured three-section executive briefing (Key Highlights, Notable Trends, Recommendations).
6. **Notifications**: Every ticket status transition triggers an in-app notification row and optionally an SMTP email to the ticket creator.

## 📂 Project Structure

```text
NudgeAssist/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── categorize.py          # LangChain chain — Gemini structured ticket categorization
│   │   │   ├── embeddings.py          # Gemini Embedding-2 vector generation (768d)
│   │   │   ├── similarity.py          # pgvector cosine similarity SQL query
│   │   │   └── draft_response.py      # RAG-augmented agent draft generator
│   │   ├── api/
│   │   │   ├── tickets.py             # Ticket CRUD, status updates, similar search, draft endpoint
│   │   │   ├── analytics.py           # Dashboard metrics + AI weekly summary
│   │   │   ├── profile.py             # /me and /bootstrap profile endpoints
│   │   │   └── notifications.py       # Notification fetch and mark-read
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic-settings with DB URL auto-fixup validator
│   │   │   ├── db.py                  # Async SQLAlchemy engine + session factory
│   │   │   └── security.py            # Supabase JWKS fetch + JWT verify + get_current_user
│   │   ├── models/
│   │   │   ├── ticket.py              # Ticket SQLAlchemy model (with Vector(768) column)
│   │   │   ├── profile.py             # Profile model (FK to Supabase auth.users)
│   │   │   └── notification.py        # Notification model
│   │   ├── schemas/                   # Pydantic request/response schemas
│   │   └── main.py                    # FastAPI app factory, CORS, router registration
│   ├── supabase_schema.sql            # Full Postgres schema (run once on Supabase)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .python-version                # Pins Python 3.11.9 for Render
├── frontend/
│   ├── app/
│   │   ├── login/                     # Login + registration page (Supabase Auth)
│   │   ├── tickets/                   # Employee portal — My Tickets + Create Ticket
│   │   ├── agent/                     # Agent console — department queue + ticket detail
│   │   └── manager/                   # Manager dashboard — analytics + AI weekly summary
│   ├── components/
│   │   ├── animations/                # AnimatedBackground, CounterAnimation, AnimatedChart
│   │   └── ui/                        # Shared cards, modals, status badges
│   ├── lib/
│   │   ├── api.ts                     # Centralized axios API client
│   │   └── auth.tsx                   # AuthContext + Supabase client singleton
│   └── vercel.json
├── docker-compose.yml
├── render.yaml                        # Render deployment config
└── report.md                          # Detailed submission report
```

## ⚡ Getting Started

### Prerequisites

- Python 3.11 or newer
- Node.js 18+ and npm
- Docker & Docker Compose (for containerized deployment)
- A [Supabase](https://supabase.com) project (free tier)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)

### 1. Clone the Repository

```bash
git clone https://github.com/harishy0406/NudgeAssist
cd NudgeAssist
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the full schema from `backend/supabase_schema.sql`.
3. From **Project Settings → API**, copy:
   - Project URL
   - Anon/Public key
   - JWT Secret
4. From **Project Settings → Database**, copy the **Connection Pooler** URL (Session mode, port 5432).

### 3. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_DB_URL=postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_JWT_SECRET=<your-jwt-secret>
GEMINI_API_KEY=<your-gemini-api-key>
CORS_ORIGINS=http://localhost:3000
SMTP_USER=your@gmail.com          # Optional — for email notifications
SMTP_PASS=your-app-password       # Optional — Gmail App Password
```

> **Note:** If your database password contains special characters like `?` or `,`, URL-encode them (`?` → `%3F`, `,` → `%2C`).

### 4. Run the Backend

```bash
# Create virtualenv
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Backend API and docs available at: `http://localhost:8000/docs`

### 5. Configure & Run the Frontend

```bash
cd frontend
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm install
npm run dev
```

Frontend available at: `http://localhost:3000`

### Deployment with Docker Compose

```bash
# From the project root
docker-compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### Demo Accounts

Pre-seeded accounts for testing (run the seed script or create via registration):

```text
Employee : employee@nudge.org  /  demo123
Agent    : agent@nudge.org     /  demo123
Manager  : manager@nudge.org   /  demo123
```

> Change these credentials before any production use.

## 📖 Usage

### Employee Workflow

1. Register or sign in at `/login`.
2. View all your submitted tickets on the **My Tickets** page — filter by status.
3. Click **Raise New Ticket** to open the AI-assisted create form.
4. As you type your description, the system:
   - Shows up to 3 similar *resolved* tickets (semantic search) — read them before submitting!
   - Pre-fills **Category** and **Urgency** with AI predictions (editable).
5. Submit the ticket — you'll receive in-app and email notifications on every status change.

### Agent Workflow

1. Sign in — you're routed to the **Agent Console** automatically.
2. View your department's ticket queue, sorted by urgency and creation time.
3. Open a ticket and click **Generate AI Draft** to get a RAG-grounded first-response suggestion.
4. Edit the draft as needed, then update the ticket status (`Open → In Progress → Resolved → Closed`).
5. Each status change notifies the ticket creator automatically.

### Manager Workflow

1. Sign in — you're routed to the **Manager Dashboard** automatically.
2. Review animated headline metrics (total, open, resolved, avg resolution time).
3. Explore the four analytics charts for organizational insights.
4. Click **Generate AI Weekly Summary** for an LLM-written executive briefing on the last 7 days.

## 🔑 Key API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | ❌ | API root — service info |
| `GET` | `/docs` | ❌ | Swagger UI — interactive API docs |
| `GET` | `/health` | ❌ | Health check for Render uptime monitoring |
| `GET` | `/profile/me` | ✅ Any | Current user profile and role |
| `POST` | `/profile/bootstrap` | ✅ JWT | Create profile after first Supabase signup |
| `POST` | `/tickets` | ✅ Employee | Create ticket (triggers AI categorization + embedding) |
| `GET` | `/tickets` | ✅ Any | List tickets filtered by role/department |
| `GET` | `/tickets/similar` | ✅ Any | Semantic RAG search — top 3 similar resolved tickets |
| `PATCH` | `/tickets/{id}/status` | ✅ Agent/Manager | Update status, log event, send notification |
| `GET` | `/tickets/{id}/draft-response` | ✅ Agent | RAG-augmented AI first-response draft |
| `GET` | `/analytics/summary` | ✅ Manager | Aggregated dashboard metrics |
| `GET` | `/analytics/ai-weekly-summary` | ✅ Manager | LLM-generated 7-day executive briefing |
| `GET` | `/notifications` | ✅ Any | Fetch current user's notifications |
| `PATCH` | `/notifications/{id}/read` | ✅ Any | Mark notification as read |

## 📊 Data Models

| Model | Purpose |
| --- | --- |
| `Profile` | App-layer user (id FK to Supabase `auth.users`, role, department) |
| `Ticket` | Support request with title, description, category, urgency, status, embedding vector |
| `TicketEvent` | Immutable audit log of every status transition (actor, timestamp) |
| `Notification` | In-app notifications triggered on status changes |

## 🤖 AI Layer Summary

| Feature | Model | Technique |
| --- | --- | --- |
| Ticket auto-categorization | Gemini 2.5 Flash | LangChain structured output (Pydantic schema enforcement) |
| Semantic similarity search | Gemini Embedding-2 (768d) | pgvector cosine distance + IVFFlat index |
| Agent draft response | Gemini 2.5 Flash | RAG (resolved tickets as few-shot context) |
| Manager weekly summary | Gemini 2.5 Flash | SQL aggregation → LLM narrative generation |

## ⚙️ Configuration

All runtime settings live in `backend/app/core/config.py` and can be overridden via environment variables.

| Setting | Purpose | Env Variable |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase project URL | `SUPABASE_URL` |
| `SUPABASE_DB_URL` | Postgres connection string (pooler recommended) | `SUPABASE_DB_URL` |
| `SUPABASE_JWT_SECRET` | JWT verification secret (from Supabase Settings → API) | `SUPABASE_JWT_SECRET` |
| `GEMINI_API_KEY` | Google AI Studio API key for LLM + embeddings | `GEMINI_API_KEY` |
| `GROQ_API_KEY` | Optional Groq API key (fallback LLM) | `GROQ_API_KEY` |
| `CORS_ORIGINS` | Comma-separated allowed origins for CORS | `CORS_ORIGINS` |
| `SMTP_USER` | Gmail address for email notifications | `SMTP_USER` |
| `SMTP_PASS` | Gmail App Password | `SMTP_PASS` |
| `SMTP_HOST` | SMTP server host (default: smtp.gmail.com) | `SMTP_HOST` |
| `SMTP_PORT` | SMTP server port (default: 587) | `SMTP_PORT` |

For production, always set sensitive values (`SUPABASE_JWT_SECRET`, `GEMINI_API_KEY`, DB credentials) via environment variables — never commit them to source control.

## 🖼️ Screenshots

### Login Page
<p align="center">
<!-- SCREENSHOT PLACEHOLDER: Login page with animated background -->
<img width="900" height="500" alt="image" src="https://github.com/user-attachments/assets/6136a603-2084-481b-8aa5-d86e92a32c30" />
</p>

### Employee — Create Ticket (AI Suggestions + Similar Tickets)
<p align="center">
<!-- SCREENSHOT PLACEHOLDER: Create ticket form with AI category panel and similar tickets panel -->
<img width="900" height="500" alt="image" src="https://github.com/user-attachments/assets/a1b4344e-c3be-4663-b074-5f7c576b616e" />
</p>

### Employee — My Tickets
<p align="center">
<!-- SCREENSHOT PLACEHOLDER: My tickets view with status badges and notification bell -->
<img width="900" height="500" alt="image" src="https://github.com/user-attachments/assets/62b62b03-e274-4409-a21e-817576cef6be" />
</p>

### Agent — Ticket Queue
<p align="center">
<!-- SCREENSHOT PLACEHOLDER: Agent console with department ticket queue -->
<img width="900" height="500" alt="image" src="https://github.com/user-attachments/assets/7ad23f2b-397d-4544-aa77-0840e06197aa" />
</p>

### Agent — AI Draft Response Copilot
<p align="center">
<!-- SCREENSHOT PLACEHOLDER: Ticket detail with expanded AI draft response panel -->
<img width="900" height="500" alt="Screenshot 2026-06-21 224450" src="https://github.com/user-attachments/assets/3580b444-2a48-47fb-a204-ce39c4652dce" />
</p>

### Manager — Analytics Dashboard
<p align="center">
<!-- SCREENSHOT PLACEHOLDER: Manager dashboard with animated counters and all four charts -->
<img width="1000" height="1000" alt="nudge-assist vercel app_manager" src="https://github.com/user-attachments/assets/0135084e-74c6-4880-9c32-a12dc16ee70e" />
</p>

### Manager — AI Weekly Summary
<p align="center">
<!-- SCREENSHOT PLACEHOLDER: AI weekly summary panel with generated executive briefing -->
<img width="900" height="500" alt="Screenshot 2026-06-21 224654" src="https://github.com/user-attachments/assets/036a2683-870d-4495-8802-78efb3500f58" />
</p>

## 🚀 Deployment

### Deploying the Backend (Render)

1. Push the repo to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Root Directory** to `backend`.
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from the Configuration table above.
7. Use the **Supabase Connection Pooler URL** (not the direct DB URL) for `SUPABASE_DB_URL` to ensure IPv4 compatibility with Render's free tier.

### Deploying the Frontend (Vercel)

1. Import your GitHub repo on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (your Render backend URL).
4. Deploy — Vercel auto-detects Next.js with zero config.

### After Deployment

Add your Vercel frontend URL to the backend's `CORS_ORIGINS` environment variable on Render so cross-origin requests are allowed:

```
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

## 🤝 Contributing

Contributions are welcome. Please keep changes focused and document any schema or configuration changes.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a pull request.

---

<div align="center">

**Made with ❤️ by M Harish Gautham**

⭐ If you find this project helpful, please star it! ⭐

</div>
