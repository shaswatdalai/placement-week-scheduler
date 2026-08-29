# MIRAI Labs — Placement Week Scheduler

An intelligent, priority-driven placement scheduling and minimum-disturbance replanning platform with conflict detection, reason tracking, real-time WebSocket updates, and interactive diff/metrics dashboard.

---

## Features Matrix (18 Requirements Checklist)

| # | Requirement | Status | Implementation Details |
|---|-------------|:------:|------------------------|
| 1 | **Core Placement Scheduling** | ✅ | Pure-function scheduler (`scheduler.service.ts`) assigning time, room, panel, or failure reason |
| 2 | **Priority-Based Scheduling** | ✅ | Tier 1 (Dream), Tier 2 (Core), Tier 3 (Mass) scheduled in strict priority order |
| 3 | **Eligibility Checking** | ✅ | CGPA & Branch checks enforced inside the scheduling engine before slot allocation |
| 4 | **Conflict Detection** | ✅ | Student, Panel, Room, and contiguous Time Window overlapping prevention |
| 5 | **Failure / Reason Tracking** | ✅ | Structured reasons (`INELIGIBLE_CGPA`, `NO_TIME_WINDOW`, `STUDENT_CONFLICT`, etc.) + `reasonTrace[]` |
| 6 | **Replanning Engine** | ✅ | 4 atomic disruptions + compound multi-disruption pipeline |
| 7 | **Minimum-Disturbance Replanning** | ✅ | Mutates *only* directly affected interviews; unaffected schedule preserved |
| 8 | **Schedule Diff** | ✅ | Field-level diff (`time`, `room`, `panel`, `status`) persisted with reason details |
| 9 | **Snapshots** | ✅ | `snapshotBefore` captured before any mutation to generate accurate diffs |
| 10 | **Quality Metrics** | ✅ | % scheduled, room utilization, panel utilization, and student wait times via `/api/metrics` |
| 11 | **Explanation / Reasoning Layer** | ✅ | Deterministic reason trace summary + optional Groq Llama enhancement with offline fallback |
| 12 | **REST APIs** | ✅ | Full suite of scheduler, disruption, diff, metrics, and entity endpoints |
| 13 | **Realistic Dataset** | ✅ | Deterministic seed: 150 students, 12 companies, 39 panels, 10 rooms, 36 slots, 290 shortlists |
| 14 | **Frontend Dashboard** | ✅ | React + Tailwind dashboard with Metrics, Schedule table, Disruption triggers, Diff viewer & Explanations |
| 15 | **Real-Time Updates** | ✅ | WebSocket server (`ws://localhost:5000`) broadcasting updates on disruptions/scheduling |
| 16 | **Automated Tests** | ✅ | Jest test suite with 100% pass rate across scheduler, replanner, and metrics services |
| 17 | **Postman Collection** | ✅ | Exported in `postman/placement-scheduler.postman_collection.json` |
| 18 | **Documentation** | ✅ | Architecture, API specs, setup instructions, and demo guide |

---

## Architecture Overview

```
                        ┌──────────────────────────────┐
                        │   React / Vite Dashboard     │
                        │ (Metrics, Diffs, Explanations)│
                        └───────▲───────────────┬──────┘
                                │               │
                  WebSocket (ws)│               │ REST API (http)
                                │               ▼
                        ┌───────┴──────────────────────┐
                        │    Express + WS API Server   │
                        └───────┬───────────────┬──────┘
                                │               │
           ┌────────────────────▼─────┐   ┌─────▼────────────────────┐
           │ Deterministic Scheduler  │   │  Replanning Engine       │
           │ • Priority Queue         │   │  • Minimum Disturbance   │
           │ • Eligibility Engine     │   │  • Snapshot & Diff       │
           │ • Conflict Detector      │   │  • 4 Disruption Types    │
           │ • Reason Trace Logger    │   │  • Compound Pipeline     │
           └────────────────────┬─────┘   └─────┬────────────────────┘
                                │               │
                                └───────┬───────┘
                                        ▼
                        ┌──────────────────────────────┐
                        │       MongoDB Atlas          │
                        │ (Interviews, Diffs, Entities)│
                        └──────────────────────────────┘
```

---

## Getting Started

### 1. Environment Setup
Create a `.env` file in the project root (see `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/placement-scheduler
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=optional_groq_api_key
```

### 2. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Run Backend & Frontend
In terminal 1 (Backend):
```bash
npm run dev
```

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 5. Run Automated Tests
```bash
npm test
```

---

## API Reference

### Scheduler & Disruptions
- `POST /api/scheduler/generate` — Generate initial schedule for all pending interviews.
- `POST /api/disruptions/company-delay` — Replan after company arrival delay `{ companyId, delayHours }`.
- `POST /api/disruptions/panel-unavailable` — Replan after panel dropout `{ panelId }`.
- `POST /api/disruptions/student-withdrawal` — Cancel future interviews for student `{ studentId }`.
- `POST /api/disruptions/room-unavailable` — Replan interviews in unavailable room `{ roomId }`.
- `POST /api/disruptions/compound` — Run compound multi-disruption pipeline.

### Schedule, Diffs & Explanations
- `GET /api/schedule` — Get all interviews (filter by `?status=scheduled` or `?companyId=...`).
- `GET /api/schedule/diff` — Get the latest disruption diff (or `?all=true` for history).
- `GET /api/metrics` — Get schedule percentage, room/panel utilization, and wait times.
- `GET /api/schedule/explanations/:interviewId` — Get human-readable reason trace explanation.
