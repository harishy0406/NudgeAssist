# Product Requirements Document (PRD)
## NudgeAssist — AI-Powered Internal Support & Ticketing Platform

| | |
|---|---|
| **Author** | [Your Name] |
| **Status** | Draft |
| **Version** | 1.0 |
| **Date** | [Date] |
| **Related Assignment** | Intern, AI Product Engineer — The/Nudge Institute (Option A) |

---

## 1. Purpose

Define scope, requirements, and success criteria for NudgeAssist — an internal ticketing platform with an AI layer for categorization, duplicate-reduction, agent assistance, and leadership reporting, built for The/Nudge Institute's internal support workflows (IT, HR, Finance, Admin).

---

## 2. Problem Statement

The/Nudge has no centralized system for internal support requests. Issues are scattered across email/chat, with no lifecycle tracking, no SLA visibility, no reuse of past resolutions, and no leadership visibility into recurring organizational pain points. This causes slow resolution, duplicated agent effort, and invisible operational trends.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target (prototype demo) |
|---|---|---|
| Centralize support requests | % of test tickets routed correctly | ≥ 90% |
| Reduce duplicate tickets | Similar-ticket surfaced before submit | Demonstrated on ≥ 3 test cases |
| Speed up agent response | Time agent takes to send first reply | Reduced via AI draft (qualitative demo) |
| Give leadership visibility | Working analytics dashboard | All 6 chart types functional |
| Demonstrate agentic AI | End-to-end automated triage pipeline | Full pipeline runs on ticket creation |

---

## 4. Non-Goals (Out of Scope for Prototype)

- Multi-tenant support for external organizations
- Mobile native app (web-responsive only)
- SLA breach auto-escalation (listed as future improvement)
- Multilingual UI
- Payment/billing integration
- Fine-tuned/custom-trained LLM (use off-the-shelf free-tier LLM APIs)

---

## 5. User Personas

| Persona | Description | Key Needs |
|---|---|---|
| **Employee** | Any staff member raising a request | Fast ticket creation, status visibility, no duplicate effort |
| **Agent** | IT/HR/Finance/Admin staff resolving tickets | Clear queue, fast triage, drafting help |
| **Manager** | Department/program lead | Trends, recurring issues, org-wide visibility |

---

## 6. User Stories

### Employee
- As an employee, I want to raise a ticket with title/description/urgency so my issue gets tracked.
- As an employee, I want the system to suggest the right department automatically so I don't have to guess.
- As an employee, I want to see similar resolved tickets before submitting so I can self-resolve if possible.
- As an employee, I want to be notified when my ticket status changes so I don't have to check manually.

### Agent
- As an agent, I want a queue filtered to my department so I only see relevant tickets.
- As an agent, I want an AI-drafted first response so I can reply faster.
- As an agent, I want to update ticket status through a fixed lifecycle so progress is tracked consistently.

### Manager
- As a manager, I want a dashboard of ticket volume/status/department so I can spot bottlenecks.
- As a manager, I want an AI-generated weekly summary so I don't have to read every ticket myself.

---

## 7. Functional Requirements

### 7.1 Ticket Management
- FR1: User can create a ticket (title, description, category, urgency).
- FR2: System auto-suggests category + priority via LLM; user can override.
- FR3: Ticket routes to correct department queue on creation.
- FR4: Agent can update status: Open → In Progress → Resolved → Closed.
- FR5: Every status change is logged with timestamp + actor.

### 7.2 AI Layer
- FR6: System performs vector similarity search against resolved tickets and shows top 3 matches pre-submission.
- FR7: System generates a draft first response for agents, grounded in similar resolved tickets (RAG).
- FR8: System runs an automated multi-step agent pipeline (categorize → search → draft → route → notify) on ticket creation.
- FR9: Manager can trigger an AI-generated natural-language weekly summary of ticket trends.

### 7.3 Notifications
- FR10: User receives email + in-app notification on every status change to their ticket.

### 7.4 Analytics
- FR11: Dashboard shows: tickets by department, tickets by status, average resolution time, AI categorization accuracy, department load, recurring issue tags.

### 7.5 Auth & Roles
- FR12: Login/signup handled via **Supabase Auth** (hosted); roles = employee, agent, manager stored in `profiles` table.
- FR13: Role-based route/data access (agents see only their department; managers see all) enforced via verified Supabase JWT.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Ticket creation + AI categorization response < 3s (LLM-dependent) |
| Availability | Demo-grade uptime acceptable (free-tier hosting may cold-start/sleep) |
| Security | Auth/passwords fully managed by Supabase Auth; JWT secret + DB connection string in env vars, never committed |
| Cost | $0 — all tools on free tiers (Supabase free project, Render free, Vercel free, Gemini/Groq free API) |
| Usability | Mobile-responsive UI; ticket creation completable in < 1 minute |
| Maintainability | Modular backend (separate AI layer from core ticket service) |

---

## 9. Technical Requirements Summary

| Layer | Choice |
|---|---|
| Frontend | Next.js + Tailwind CSS (deployed on Vercel, free) |
| Backend | FastAPI (deployed on Render, free) |
| Database | Supabase Postgres (free tier, 500MB) |
| Vector Search | pgvector extension (built-in, free) |
| AI Orchestration | LangChain / LangGraph |
| LLM | Google Gemini 1.5 Flash or Groq Llama 3.1 (free API tier) |
| Embeddings | Gemini `text-embedding-004` or local `sentence-transformers` (free) |
| Auth | Supabase Auth (hosted, free) |
| Notifications | Gmail SMTP (free) |
| Containerization | Docker + Docker Compose (local dev) |

*(Full architecture, schema, and API spec live in the companion document: `NudgeAssist_Project_Spec.md`)*

---

## 10. Data Requirements

- Tables: `profiles` (linked to Supabase `auth.users`), `tickets`, `ticket_events`, `notifications`, `departments` (Supabase Postgres).
- `tickets.embedding` column (pgvector type) stores vector for similarity queries.
- Seed data needed for demo: ~15–20 pre-resolved sample tickets across IT/HR/Finance/Admin to make similarity search and AI draft response meaningful in the recording.

---

## 11. UX Requirements

- Ticket creation form shows live AI category suggestion + similar-ticket panel as user types/submits.
- Agent console shows AI draft response inline, with Accept/Edit/Discard actions — never auto-sent.
- Manager dashboard separated from agent console (different personas, different views).
- Status badges color-coded (Open/In Progress/Resolved/Closed) for fast scanning.

---

## 12. Assumptions

- LLM free-tier rate limits are sufficient for a demo-scale prototype (not production load).
- Render free-tier cold start (~30–60s after idle) is acceptable for a recorded demo.
- Sample/seed ticket data will be used to populate similarity search results, since no historical org data exists yet.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Free LLM API rate limits hit during demo | Cache/test ahead of recording; have a fallback model (Gemini ↔ Groq) |
| Render free instance cold-starts mid-recording | Ping/warm the backend before recording starts |
| Vector search returns weak matches with too little seed data | Seed at least 15–20 realistic resolved tickets before demo |
| Time constraint before deadline | Prioritize FR1–FR7 (core lifecycle + key AI features) over FR8–FR9 (agentic pipeline, exec summary) if time runs short |

---

## 14. Milestones

| Milestone | Deliverable |
|---|---|
| M1 | Supabase Auth + ticket CRUD + lifecycle working on Postgres |
| M2 | AI categorization + pgvector similarity live |
| M3 | Agent draft-response + notifications working |
| M4 | Analytics dashboard + AI weekly summary |
| M5 | Agentic pipeline (LangGraph) wired end-to-end |
| M6 | Deployed demo (Vercel + Render) + 2-page note + recorded video |

---

## 15. Open Questions

- [ ] Final LLM choice: Gemini vs Groq — confirm based on free-tier latency/quota during testing.
- [ ] Should agentic pipeline (FR8) run synchronously on ticket creation, or async via background task, given Render free-tier cold starts?
- [ ] Is a seeded demo dataset acceptable, or should the recording show a cold/empty system first?

---

## 16. Appendix

- Companion technical spec: `NudgeAssist_Project_Spec.md`
- Companion submission template: `Submission_Report_Template.md`
