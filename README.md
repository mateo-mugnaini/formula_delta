# Formula Delta

**A free, local-first Formula 1 live timing companion.**

Formula Delta is a real-time dashboard designed to run alongside a Formula 1 broadcast and keep the information you actually want visible throughout the race.

Positions, gaps, intervals, tyres, stint age, lap times, sectors, pit stops, Race Control and more — without waiting for the television broadcast to decide when to show them.

> Formula Delta is an independent, unofficial project and is not affiliated with Formula 1, the FIA, or any Formula 1 team.

---

## Why Formula Delta?

Formula 1 broadcasts show a lot of information, but much of it is temporary.

You may see the current tyre compounds but not the intervals.

Then the gaps appear, but the tyre information disappears.

Strategy information may only appear occasionally.

Race Control messages can be easy to miss.

Formula Delta is designed to solve that problem.

It acts as a **second screen** while watching the race:

```text
┌──────────────────────────┐
│                          │
│      F1 BROADCAST        │
│                          │
│          📺              │
│                          │
└──────────────────────────┘

             +

┌───────────────────────────────────────────────┐
│ FORMULA DELTA                                 │
│                                               │
│ P  DRIVER   GAP      INT      TYRE   AGE      │
│ 1  NOR      LEADER   ---       M      14      │
│ 2  VER      +2.8     +2.8      H      21      │
│ 3  PIA      +6.2     +3.4      M      13      │
│                                               │
│ Race Control · Strategy · Weather · Timing   │
└───────────────────────────────────────────────┘
```

The broadcast shows the race.

**Formula Delta helps you understand it.**

---

# Core Goals

Formula Delta is built around a few simple principles.

### Free

The project should remain usable without paid APIs, subscriptions or cloud infrastructure.

### Local

Formula Delta runs on your own computer.

### Real-Time

During supported Formula 1 sessions, Formula Delta consumes live timing information and updates the dashboard continuously.

### Replayable

Sessions can be recorded and replayed later.

This allows Formula Delta to be developed, tested and demonstrated without waiting for the next race weekend.

### Resilient

Formula 1 timing infrastructure is not treated as a guaranteed stable API.

Formula Delta is designed to tolerate missing fields, optional capabilities, partial updates and upstream changes.

---

# Planned Live Dashboard

The primary race dashboard is expected to include information such as:

|   P | Driver |    Gap | Interval | Last Lap | Tyre | Age | Stops |
| --: | ------ | -----: | -------: | -------: | :--: | --: | ----: |
|   1 | NOR    | Leader |        — | 1:23.281 |  M   |  14 |     1 |
|   2 | VER    | +2.817 |   +2.817 | 1:23.194 |  H   |  21 |     1 |
|   3 | PIA    | +6.291 |   +3.474 | 1:23.391 |  M   |  13 |     1 |
|   4 | LEC    | +9.188 |   +2.897 | 1:23.218 |  H   |  20 |     1 |

Additional information is planned for:

- lap and sector times;
- tyre stints;
- pit stops;
- track status;
- Safety Car and Virtual Safety Car;
- Race Control messages;
- weather;
- session information;
- strategy visualization;
- driver comparisons.

---

# TV Synchronization

Live timing data may arrive before the same event appears on a television or streaming broadcast.

Formula Delta therefore plans to include a configurable delay:

```text
LIVE DATA
    │
    ▼
Delay Buffer
    │
    ▼
Formula Delta
    │
    ▼
Synchronized with TV
```

This helps prevent the dashboard from spoiling events a few seconds before they appear on screen.

---

# Live + Replay

Formula Delta is designed around interchangeable data sources.

```text
                  Data Source
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼

          F1 Live          Recording
             │                 │
             ▼                 ▼

         LiveSource        ReplaySource
             │                 │
             └────────┬────────┘
                      │
                      ▼
                Formula Delta
```

A recording should behave like a live session from the perspective of the rest of the application.

This makes debugging and testing considerably easier.

---

# Planned Technology Stack

Formula Delta intentionally uses a small stack.

### Frontend

- React
- Vite
- Zustand
- WebSocket
- JavaScript
- CSS

### Backend

- Node.js
- JavaScript
- ECMAScript Modules
- WebSocket
- SignalR-compatible Formula 1 ingestion
- filesystem-based recordings

### Infrastructure

- pnpm
- Docker
- Docker Compose

No database is required for the initial version.

---

# Architecture

The intended high-level architecture is:

```text
              FORMULA 1 LIVE TIMING
                       │
                       ▼
                 ┌───────────┐
                 │ LiveSource│
                 └─────┬─────┘
                       │
                       │ raw events
                       ▼
                 ┌───────────┐
                 │ Delay     │
                 │ Buffer    │
                 └─────┬─────┘
                       │
                       ▼
                 ┌───────────┐
                 │  Parser   │
                 └─────┬─────┘
                       │
                       ▼
                 ┌───────────┐
                 │Normalizer │
                 └─────┬─────┘
                       │
                 ┌───────────┐
                 │Presentation│
                 │State       │
                 └─────┬─────┘
                       │
                       ▼
                         WebSocket
                              │
                              ▼
                         React + Zustand
                              │
                              ▼
                      FORMULA DELTA UI
```

Raw events are recorded immediately after upstream topic extraction; the
diagram shows the delayed presentation path separately from that recording
branch.

The frontend never consumes raw Formula 1 payloads directly.

---

# Optional Telemetry

Some high-frequency Formula 1 data may not always be available without authenticated access.

This potentially includes:

- speed;
- RPM;
- gear;
- throttle;
- brake;
- live car coordinates.

Formula Delta treats these as optional capabilities.

The main dashboard must continue working when they are unavailable.

---

# Planned Race Analysis

Once the core live dashboard is stable, Formula Delta may calculate additional information locally.

Examples include:

- recent race pace;
- gap evolution;
- driver-vs-driver comparison;
- tyre degradation estimates;
- stint comparison;
- position gains and losses.

These values are derived by Formula Delta and should remain distinguishable from official timing information.

---

# Project Status

Formula Delta is currently in:

```text
Phase 0 — Live Timing Discovery (probe scaffolded)
```

The first objective is not to build the interface.

The first objective is to verify the real Formula 1 timing feed.

A first independent discovery probe exists under `tools/f1-probe/`. It has not
yet established verified endpoint behavior; live observations must still be
captured and documented before production ingestion work begins.

A dedicated Node.js probe will investigate:

- connection behavior;
- available topics;
- anonymous access;
- payload formats;
- update frequency;
- snapshot and delta behavior;
- compressed telemetry;
- reconnection;
- historical data availability.

Only verified behavior should become part of the core ingestion architecture.

---

# Roadmap

Development follows the general sequence:

```text
Discovery
    ↓
Repository Foundation
    ↓
Domain Model
    ↓
F1 Ingestion
    ↓
Recording
    ↓
Replay
    ↓
Backend
    ↓
TV Synchronization
    ↓
UX/UI
    ↓
Live Dashboard
    ↓
Strategy
    ↓
Docker

With Docker Desktop running, start the complete local stack from the repository root:

```bash
docker compose up --build
```

The frontend is available at `http://localhost:5173` and the backend health check is
available at `http://localhost:3000/health`. Recordings written by the backend are
persisted in `api/recordings/` through the Compose volume.
    ↓
MVP
    ↓
Advanced Analysis
```

See [`ROADMAP.md`](./ROADMAP.md) for the complete implementation plan.

---

# Documentation

Formula Delta is designed as a documented engineering project.

Important documentation includes:

```text
PROJECT-SCOPE.md

docs/
├── ARCHITECTURE.md
├── DATA-SOURCES.md
├── DATA-MODEL.md
├── PROTOCOL.md
├── WEBSOCKET-PROTOCOL.md
├── RECORDING-FORMAT.md
├── TESTING.md
├── KNOWN-LIMITATIONS.md
│
├── design/
│   ├── DESIGN-SYSTEM.md
│   ├── UX-PRINCIPLES.md
│   ├── INFORMATION-HIERARCHY.md
│   └── SCREEN-SPECS.md
│
└── adr/
```

Architectural decisions that require historical context are recorded as ADRs.

---

# Development Philosophy

Formula Delta follows a simple process when dealing with Formula 1 data:

```text
Observe
   ↓
Capture
   ↓
Understand
   ↓
Document
   ↓
Create Fixture
   ↓
Implement
   ↓
Test
```

The project should not encode assumptions about an undocumented upstream protocol without first attempting to verify them.

---

# Cost

Formula Delta is designed around a strict requirement:

```text
Formula Delta
Development      €0
Infrastructure   €0
Database         €0
Cloud            €0
Required APIs    €0
```

The objective is to build a useful engineering project using local infrastructure and freely accessible data.

---

# Disclaimer

Formula Delta is an unofficial, independent project created for educational and personal use.

Formula 1, F1, FIA, Grand Prix names, team names, driver names and related trademarks belong to their respective owners.

Formula Delta is not affiliated with, endorsed by, or sponsored by Formula 1, the FIA, Formula One Management, or any Formula 1 team.
