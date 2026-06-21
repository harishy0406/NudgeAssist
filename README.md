# NudgeAssist — AI-Powered Internal Support & Ticketing Platform

> Built for The/Nudge Institute | Intern, AI Product Engineer Assignment (Option A)

An AI-native full-stack internal ticketing platform that uses LLM-powered categorization, RAG-based similarity search, agent copilot, and agentic workflows to streamline support operations.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.11+
- **MongoDB Atlas** M0 free cluster (or local MongoDB)
- **API Key**: Google AI Studio (Gemini) or Groq

### 1. Clone & Configure

```bash
git clone <repo-url>
cd NudgeAssist

# Backend
cd backend
cp .env.example .env
# Edit .env with your credentials:
#   MONGODB_URI=mongodb+srv://...
#   GEMINI_API_KEY=...  (or GROQ_API_KEY=...)
#   JWT_SECRET=<random-string>

# Install Python dependencies
pip install -r requirements.txt

# Frontend
cd ../frontend
cp .env.local.example .env.local  # or create manually
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
```

### 2. Seed Demo Data

```bash
cd backend
python -m seed.seed_tickets
```

This creates 4 demo users and 20 realistic tickets with event history.

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Access the app at **http://localhost:3000**

### 4. Demo Credentials

| Role     | Email               | Password |
|----------|---------------------|----------|
| Employee | employee@nudge.org  | demo123  |
| Agent    | agent@nudge.org     | demo123  |
| Manager  | manager@nudge.org   | demo123  |

### 5. Or Use Docker

```bash
docker-compose up --build
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Next.js Frontend (3000)                   │
│  Login │ Employee Portal │ Agent Console │ Manager Dash   │
│  anime.js + Framer Motion 3D Animations                  │
└───────────────────────┬─────────────────────────────────┘
                        │ REST/JSON (JWT auth)
┌───────────────────────▼─────────────────────────────────┐
│                  FastAPI Backend (8000)                    │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Ticket CRUD  │  │ Auth/JWT │  │ Notifications        │ │
│  └──────┬──────┘  └──────────┘  └──────────────────────┘ │
│         │                                                  │
│  ┌──────▼──────────────────────────────────────────────┐  │
│  │          AI Orchestration (LangChain)                 │  │
│  │  Categorizer │ Embeddings │ Similarity │ Draft Gen   │  │
│  └──────┬──────────────────────────────────────────────┘  │
└─────────┼──────────────────────────────────────────────┘
          │
  ┌───────▼────────┐      ┌──────────────────┐
  │ MongoDB Atlas   │      │ Gemini / Groq    │
  │ (DB + Vector)   │      │ (Free LLM API)   │
  └─────────────────┘      └──────────────────┘
```

## 🛠️ Tech Stack

| Layer            | Technology                                |
|------------------|-------------------------------------------|
| Frontend         | Next.js 16 + Tailwind CSS                 |
| Animations       | anime.js 3.2 + Framer Motion             |
| Charts           | Recharts                                  |
| Backend          | FastAPI (Python 3.11)                     |
| Database         | MongoDB Atlas M0 (free)                   |
| Vector Search    | MongoDB Atlas Vector Search               |
| AI Orchestration | LangChain / LangGraph                    |
| LLM              | Google Gemini 1.5 Flash / Groq Llama 3.1 |
| Embeddings       | Gemini text-embedding-004 / sentence-transformers |
| Auth             | JWT (self-rolled) + RBAC                  |
| Email            | Gmail SMTP                                |
| Deployment       | Vercel (frontend) + Render (backend)      |

## 📱 Features

### For Employees
- Create support tickets with AI-powered category suggestion
- See similar resolved tickets before submission (reduces duplicates)
- Track ticket status with real-time notifications
- Mobile-responsive 3D animated UI

### For Agents
- Department-filtered ticket queue
- AI copilot: draft first responses grounded in past resolutions
- Status lifecycle management (Open → In Progress → Resolved → Closed)
- Accept, edit, or discard AI suggestions

### For Managers
- Real-time analytics dashboard with 6 chart types
- AI-generated weekly executive summary
- Organization-wide ticket visibility
- Department load and trending analysis

### AI Layer
- **Auto-Categorization**: LLM classifies tickets into IT/HR/Finance/Admin
- **RAG Similarity Search**: Vector embeddings find resolved tickets similar to new ones
- **Agent Copilot**: Draft responses grounded in past resolutions
- **Executive AI Summary**: Natural language weekly trend analysis

## 📁 Project Structure

```
NudgeAssist/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── ai/           # LangChain AI modules
│   │   ├── core/         # Config, security, DB, email
│   │   ├── models/       # Beanie ODM document models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   └── main.py       # FastAPI app entry point
│   ├── seed/             # Demo data seeding script
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── login/        # Auth page
│   │   ├── tickets/      # Employee views
│   │   ├── agent/        # Agent console
│   │   └── manager/      # Analytics dashboard
│   ├── components/
│   │   └── animations/   # anime.js + Framer Motion components
│   ├── lib/              # API client, auth context
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 📄 License

Built for The/Nudge Institute AI Product Engineer internship assignment.