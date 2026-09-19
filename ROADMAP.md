# Formula Delta — Implementation Roadmap

## 1. Purpose

This document defines the implementation roadmap for **Formula Delta**.

Formula Delta is a free, local-first Formula 1 live timing companion designed to run alongside a Formula 1 broadcast.

The roadmap prioritizes:

1. validating the upstream Formula 1 data source;
2. understanding and preserving real data;
3. defining stable internal contracts;
4. building replay before depending heavily on live sessions;
5. implementing the backend pipeline;
6. building the race dashboard;
7. improving reliability;
8. adding advanced race analysis only after the core system is stable.

The roadmap is intentionally incremental.

Each phase has an explicit exit criterion.

A phase should not be considered complete simply because its happy path works.

## Phase Status Summary

| Phase                                      | Status                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| Documentation foundation                   | Complete                                                     |
| Phase 0 — Live Timing Discovery            | Partial — core connection observed; deltas/reconnect pending |
| Phase 1 — Repository Foundation            | Partial                                                      |
| Phase 2 — Internal Domain Model            | Complete                                                     |
| Phase 3 — F1 Ingestion Layer               | In progress                                                  |
| Phase 4 — Recording System                 | In progress                                                  |
| Phase 5 — Replay Engine                    | Complete                                                     |
| Phase 6 — Backend Application              | Complete                                                     |
| Phase 7 — Broadcast Delay                  | Complete                                                     |
| Phase 8 — UX/UI Foundation                 | Complete                                                     |
| Phase 9 — Frontend Foundation              | Complete                                                     |
| Phase 10 — Main Live Dashboard             | In progress — timing, race control, weather, and delay UI    |
| Phase 11 — Strategy View                   | Not started                                                  |
| Phase 12 — Docker and Reproducible Startup | Not started                                                  |
| Phase 13 — MVP Hardening                   | Not started                                                  |
| Phase 14 — Battle Mode                     | Not started                                                  |
| Phase 15 — Race Analytics                  | Not started                                                  |
| Phase 16 — Team Radio                      | Not started                                                  |
| Phase 17 — Experimental Telemetry          | Not started                                                  |
| Phase 18 — Experimental Track Map          | Not started                                                  |
| Phase 19 — Future Evolution                | Not started                                                  |

---

# Phase 0 — Live Timing Discovery

Status: Partial — negotiation, handshake, subscription, and a completed-session
snapshot have been observed; active deltas and recovery remain unverified.

## Goal

Validate what Formula Delta can actually receive from Formula 1 without paid infrastructure.

This phase exists to replace assumptions with captured evidence.

No main dashboard development should begin before the core results of this phase are understood.

---

## 0.1 Create the Probe

Build a minimal Node.js application whose only responsibilities are:

- connect to Formula 1 Live Timing;
- subscribe to relevant topics;
- receive events;
- identify topics;
- inspect payload structures;
- log connection lifecycle;
- optionally record raw events.

The probe should remain independent from the future Formula Delta backend.

Suggested location:

```text
tools/
└── f1-probe/
```

Current implementation:

- `tools/f1-probe/probe.mjs` performs negotiation, WebSocket setup, SignalR
  handshake, configurable subscription attempts, lifecycle logging, and raw
  diagnostic capture;
- output preserves extracted payloads without normalization;
- the exact subscription method and argument shape remain experimental until
  observed against the upstream endpoint.
- unexpected WebSocket closures trigger bounded reconnect attempts with
  exponential backoff;

Initial environment observation on 2026-09-19: the negotiation endpoint
responded successfully with HTTP 200 and advertised WebSockets, Server-Sent
Events, and Long Polling. The connection and subscription steps remain to be
observed.

---

## 0.2 Investigate Connection Lifecycle

Determine:

- negotiation requirements;
- WebSocket URL;
- SignalR protocol behavior;
- headers;
- anonymous connection behavior;
- connection timeout;
- heartbeat behavior;
- disconnection behavior;
- reconnect requirements.

Document findings.

---

## 0.3 Discover Topics

Attempt to observe:

```text
SessionInfo
SessionStatus
SessionData
DriverList
TimingData
TimingAppData
TimingStats
LapCount
TrackStatus
RaceControlMessages
WeatherData
TeamRadio
TopThree
ExtrapolatedClock
Heartbeat
CarData.z
Position.z
```

Do not assume this list is exhaustive.

Unknown topics should also be recorded.

---

## 0.4 Topic Availability Report

The probe should eventually produce a summary similar to:

```text
FORMULA DELTA — F1 LIVE PROBE

Connection       OK
Duration         01:32:17
Messages         18,291

SessionInfo             YES
SessionStatus           YES
DriverList              YES
TimingData              YES
TimingAppData           YES
TimingStats             YES
LapCount                YES
TrackStatus             YES
RaceControlMessages     YES
WeatherData             YES
TeamRadio               YES

CarData.z                NO
Position.z               NO

Unknown topics           2

Disconnects              1
Reconnects               1
```

This report is diagnostic, not a product UI.

---

## 0.5 Capture Raw Events

Capture representative events from each available topic.

Preserve:

- reception timestamp;
- topic;
- raw payload.

Example conceptual record:

```json
{
  "receivedAt": 1758210205123,
  "topic": "TimingData",
  "payload": {}
}
```

Do not normalize the payload at this stage.

---

## 0.6 Investigate Snapshot and Delta Semantics

Determine which topics:

- provide complete snapshots;
- provide partial updates;
- use sparse collections;
- require deep merge;
- append data;
- replace previous data.

Special attention:

```text
TimingData
TimingAppData
RaceControlMessages
DriverList
```

---

## 0.7 Investigate Compressed Topics

If available, investigate:

```text
CarData.z
Position.z
```

Determine:

- compression format;
- encoding;
- decompression procedure;
- message frequency;
- internal payload shape.

Their absence must not block Phase 0 completion.

---

## 0.8 Investigate Historical Session Data

Determine whether completed sessions can provide useful raw data for development.

The goal is to obtain representative fixtures even for capabilities unavailable during anonymous live sessions.

---

## 0.9 Create Initial Fixtures

Initial curated fixtures have been created from the observed completed-session
snapshot under `api/fixtures/`. They intentionally preserve upstream field names
and remain small; they are evidence fixtures, not normalized domain fixtures.

Create minimal fixtures from observed data.

Target:

```text
api/fixtures/
├── session/
├── driver-list/
├── timing-data/
├── timing-app-data/
├── timing-stats/
├── race-control/
├── weather/
├── team-radio/
├── track-status/
├── car-data/
├── position/
└── malformed/
```

Fixtures should be representative but small.

---

## 0.10 Update Documentation

Update:

```text
docs/DATA-SOURCES.md
docs/PROTOCOL.md
docs/KNOWN-LIMITATIONS.md
```

with verified findings.

The first negotiation, handshake, snapshot, topic, and fixture findings are
now documented. Live-session continuity, delta behavior, reconnect behavior,
and compressed telemetry remain open.

The current completed-session capture does not provide enough evidence to
classify topics as snapshot-only or delta-based. That classification must be
made from repeated messages during an active or actively updating session, not
inferred from the completed snapshot.

Clearly distinguish:

```text
Observed
Inferred
Experimental
Unavailable
Unknown
```

---

## Phase 0 Exit Criteria

Current status: not complete. The probe exists, but it still requires a
compatible Node.js runtime and a successful live observation run before the
criteria below can be assessed.

Phase 0 is complete when:

- a Node probe can connect or a documented technical blocker is confirmed;
- real Formula 1 payloads have been captured;
- available anonymous topics are documented;
- core payload structures are understood;
- delta/snapshot behavior is sufficiently understood;
- representative fixtures exist;
- optional telemetry capabilities have been tested;
- findings are documented.

---

# Phase 1 — Repository Foundation

Status: In progress — workspace structure, shared package, scoped instructions,
application start commands, and base tests are present. Linting and remaining
repository tooling remain pending.

## Goal

Create the maintainable Formula Delta repository structure.

---

## 1.1 Workspace

Create:

```text
formula-delta/
├── api/
├── packages/
├── tools/
├── tests/
├── api/fixtures/
├── api/recordings/
└── docs/
```

Configure pnpm workspace.

---

## 1.2 Applications

Create:

```text
api/ and client/
├── api/
└── client/
```

---

## 1.3 Shared Package

Create:

```text
packages/
└── shared/
```

This package will contain stable contracts shared between backend and frontend.

Do not place F1-specific raw schemas here.

---

## 1.4 Agent Structure

Create specialized instructions:

```text
AGENTS.md

api/AGENTS.md
api/src/f1/AGENTS.md

client/AGENTS.md
client/src/design-system/AGENTS.md

packages/shared/AGENTS.md

tests/AGENTS.md

docs/AGENTS.md
```

---

## 1.5 Development Standards

Configure:

- ESLint;
- Prettier;
- `.editorconfig`;
- `.gitignore`;
- `.env.example`;
- package scripts.

Avoid unnecessary tooling.

---

## 1.6 Base Tests

Configure the selected JavaScript testing framework.

Verify tests can run from repository root.

---

## Phase 1 Exit Criteria

Current status: not complete. The workspace, frontend, backend, and tests work;
linting and remaining repository tooling still need to be finalized.

- workspace installs correctly;
- frontend starts;
- backend starts;
- tests run;
- linting works;
- repository structure matches architecture;
- agent files are in place.

---

# Phase 2 — Internal Domain Model

Status: Complete — shared primitive normalization, capability defaults, and
delta helpers are implemented and covered by deterministic tests. Initial
entity normalizers for session, drivers, timing, stints, track, weather, and
Race Control are now also present. Observed fixture collections can be
transformed into normalized domain collections, and basic contract validation
is implemented.

## Goal

Create a stable Formula Delta model independent of Formula 1's raw protocol.

---

## 2.1 Define Core Entities

Initial entities may include:

```text
Session
Driver
TimingEntry
LapTiming
Sector
Stint
Tyre
PitState
TrackState
RaceControlEvent
Weather
CapabilityState
ConnectionState
```

---

## 2.2 Normalize Primitive Values

Normalize external values such as:

```text
"3"       → 3
"true"    → true
""        → null where appropriate
```

Do not leak upstream representation quirks.

---

## 2.3 Normalize Timing

Create consistent internal representations for:

- lap times;
- sectors;
- gaps;
- intervals;
- timestamps.

Avoid unnecessary floating-point conversion when textual timing precision matters.

---

## 2.4 Define Capability Model

Example:

```js
{
  timing: false,
  tyres: false,
  weather: false,
  raceControl: false,
  teamRadio: false,
  carTelemetry: false,
  livePosition: false
}
```

---

## 2.5 Document Model

Create/update:

```text
docs/DATA-MODEL.md
```

---

## Phase 2 Exit Criteria

- core domain model exists;
- model is independent from raw F1 structures;
- normalization rules are documented;
- fixtures can be transformed into normalized entities;
- normalization tests exist.

---

# Phase 3 — F1 Ingestion Layer

Status: In progress — pure topic parsers for the currently verified core
topics are implemented and tested. SignalR framing utilities are now also
implemented and tested, and `LiveSource` now covers negotiation, handshake,
subscription, raw event emission, and lifecycle callbacks. Reconnect policy
and production integration remain pending. A pure ingestion pipeline now
preserves raw events, applies topic parsers, and reconstructs domain state with
topic-aware current-state and history semantics.

## Goal

Turn the Phase 0 discoveries into production-quality ingestion code.

---

## 3.1 Live Source

Implement:

```text
LiveSource
```

Responsibilities:

- connection;
- subscription;
- receiving raw events;
- lifecycle;
- reconnect.

It must not contain UI or business logic.

---

## 3.2 Topic Parsers

Implement parsers for verified topics.

Potential modules:

```text
session
drivers
timing
timing-app
timing-stats
race-control
weather
track-status
team-radio
```

Experimental parsers remain isolated.

---

## 3.3 State Reconstruction

Implement the State Manager.

Responsibilities:

- maintain current session state;
- apply deltas;
- preserve unaffected properties;
- handle sparse collections;
- append event-like data correctly;
- prevent malformed optional data from destroying state.

---

## 3.4 Capability Detection

Capabilities should be derived from actual observed data.

Do not hardcode telemetry availability.

---

## 3.5 Reconnection

Test:

```text
CONNECTED
    ↓
DISCONNECTED
    ↓
RECONNECTING
    ↓
CONNECTED
```

Determine whether state must be rebuilt after reconnect.

---

## Phase 3 Exit Criteria

- live events enter the normalized pipeline;
- state can be reconstructed from fixtures;
- deltas are applied correctly;
- reconnect behavior exists;
- optional topics can disappear safely;
- core ingestion tests pass.

---

# Phase 4 — Recording System

Status: In progress — the filesystem recorder writes ordered raw JSONL events
and recording metadata. Replay integration and crash/backpressure policies
remain pending.

## Goal

Make every useful live session reusable for development.

---

## 4.1 Recording Format

Define:

```text
docs/RECORDING-FORMAT.md
```

The format must be versioned.

---

## 4.2 Raw Event Recording

Record:

- relative timestamp;
- absolute timestamp when useful;
- topic;
- raw payload.

Example:

```json
{
  "v": 1,
  "t": 18342,
  "topic": "TimingData",
  "payload": {}
}
```

---

## 4.3 Session Metadata

Store useful metadata such as:

- event;
- session;
- recording start;
- recording duration;
- detected capabilities.

---

## 4.4 Safe Recording

Handle:

- application termination;
- partial files;
- write errors;
- large sessions.

---

## Phase 4 Exit Criteria

- live events can be recorded;
- recordings preserve event order;
- recordings can be parsed later;
- interrupted recordings fail gracefully;
- recording format is documented.

---

# Phase 5 — Replay Engine

Status: Complete — recordings can be loaded and replayed through a shared
raw-event callback with play, pause, restart, and speed controls. Seeking and
full backend integration is intentionally deferred to the backend phase. A parity test now verifies that live
and replay event sequences produce equivalent normalized state through the same
ingestion pipeline.

## Goal

Allow Formula Delta development without a live Formula 1 session.

---

## 5.1 ReplaySource

Implement:

```text
ReplaySource
```

It must expose the same event interface as `LiveSource`.

---

## 5.2 Playback Controls

Support:

```text
play
pause
resume
restart
```

---

## 5.3 Playback Speed

Target:

```text
0.5x
1x
2x
5x
10x
```

---

## 5.4 Deterministic Replay

The same recording should reconstruct the same Formula Delta state.

This is important for debugging and regression testing.

---

## Phase 5 Exit Criteria

- recordings can be replayed;
- replay feeds the same State Manager as live;
- pause/resume works;
- playback speed works;
- deterministic state reconstruction is tested.

At this point Formula Delta development should no longer depend on race weekends.

---

# Phase 6 — Backend Application

Status: Complete — a local Node application exposes `/health` and
`/snapshot` over HTTP, owns the ingestion pipeline lifecycle, attaches the
WebSocket transport, sends authoritative snapshots on connect, and broadcasts
  normalized incremental state updates after processed events. Client command
  validation and formal client-side recovery behavior are implemented.
The transport now validates the `COMMAND` envelope, rejects malformed JSON
and unknown commands with machine-readable `ERROR` messages, and forwards
  supported commands to the application layer. Replay and delay command
execution remain pending until their respective phases.

## Goal

Expose Formula Delta state safely to frontend clients.

---

## 6.1 Backend Lifecycle

Create the backend application lifecycle.

Responsibilities:

```text
configuration
source selection
state manager
recorder
delay buffer
WebSocket server
HTTP diagnostics
```

---

## 6.2 WebSocket Server

Create the Formula Delta client protocol.

Do not expose raw F1 events.

---

## 6.3 Initial Snapshot

When a browser connects, it should receive sufficient current state immediately.

The user should not have to wait for every driver to generate another event.

---

## 6.4 Incremental Updates

After initialization, send efficient normalized updates.

Avoid unnecessarily sending the entire race state for every small change. The
backend now emits `STATE_UPDATE` messages with the changed domain kind and
section value; the full `STATE_SNAPSHOT` is reserved for connection
initialization and recovery.

---

## 6.5 HTTP Diagnostics

Potential endpoints:

```text
GET /health
GET /status
GET /recordings
```

Keep HTTP responsibilities small.

---

## 6.6 Protocol Documentation

Define:

```text
docs/WEBSOCKET-PROTOCOL.md
```

The implemented snapshot/update envelope and reconnect expectations are now
documented there. Client commands and protocol-version negotiation remain
future work.
All current server messages now include the shared protocol version.

---

## Phase 6 Exit Criteria

- frontend clients can connect;
- normalized initial state is delivered;
- incremental updates work;
- reconnecting clients recover current state;
- raw F1 structures do not leak through the API;
- protocol tests exist.

---

# Phase 7 — Broadcast Delay

## Goal

Synchronize Formula Delta with delayed television/streaming broadcasts.

Status: Complete — the presentation delay buffer is integrated between state
processing and WebSocket publication. Runtime sync commands can change the
delay while preserving event ordering, including rapid timing and event-like
updates. Recording remains independent from presentation delay.

---

## 7.1 Delay Buffer

Implement:

```text
Live Event
    ↓
State Processing
    ↓
Presentation Buffer
    ↓
WebSocket
```

Exact placement may be adjusted if architecture testing demonstrates a better approach.

---

## 7.2 Runtime Configuration

Allow delay changes without restarting.

---

## 7.3 Delay Accuracy

Test:

- ordering;
- rapid updates;
- Race Control;
- track status;
- timing changes.

Events must not be reordered incorrectly.

---

## Phase 7 Exit Criteria

- configurable delay works;
- event ordering remains valid;
- delay can change at runtime;
- synchronization does not affect recording integrity.

---

# Phase 8 — UX/UI Foundation

Status: Complete — UX principles, information hierarchy, design system,
component behavior, and initial screen specifications are documented. JSX and
CSS Module implementation is intentionally deferred to the project owner.

## Goal

Establish the Formula Delta visual language before building the complete dashboard.

---

## 8.1 UX Principles

Finalize:

```text
docs/design/UX-PRINCIPLES.md
```

Primary concepts:

- second-screen experience;
- glanceability;
- high information density;
- stable layout;
- minimal distraction;
- race-state awareness.

---

## 8.2 Information Hierarchy

Define:

```text
docs/design/INFORMATION-HIERARCHY.md
```

Determine what deserves:

- persistent visibility;
- secondary visibility;
- event-driven attention;
- detail views.

---

## 8.3 Design System

Define:

```text
docs/design/DESIGN-SYSTEM.md
```

Including:

- typography;
- spacing;
- numeric typography;
- status semantics;
- tyre semantics;
- race-state semantics;
- table behavior;
- component states.

---

## 8.4 Screen Specifications

Define:

```text
docs/design/SCREEN-SPECS.md
```

Initial screens:

```text
Live Dashboard
Driver Detail
Replay Controls
Settings
```

Battle and advanced strategy screens remain Post-MVP.

---

## Phase 8 Exit Criteria

- UX rules documented;
- visual semantics defined;
- primary screen hierarchy defined;
- reusable design primitives identified;
- implementation can proceed without inventing UX per component.

---

# Phase 9 — Frontend Foundation

Status: Complete — Vite/React startup, WebSocket protocol reconstruction,
connection/reconnection infrastructure, and the initial Zustand store are
implemented and tested. Dashboard feature work continues in Phase 10.

## Goal

Create the React application infrastructure.

---

## 9.1 WebSocket Client

Implement:

- connection;
- reconnect;
- initial snapshot;
- incremental updates;
- connection state.

---

## 9.2 Zustand Store

Initial conceptual slices:

```text
session
drivers
timing
strategy
raceControl
weather
capabilities
connection
replay
settings
```

Exact implementation should avoid unnecessary fragmentation.

---

## 9.3 Rendering Performance

Use granular subscriptions.

A timing update for one driver should not unnecessarily rerender the complete application.

Measure before introducing complex optimization.

---

## Phase 9 Exit Criteria

- React connects to backend;
- state is reconstructed correctly;
- reconnect works;
- store structure is stable enough for dashboard development;
- no raw F1 data reaches components.

---

# Phase 10 — Main Live Dashboard

Status: In progress — the React screen consumes normalized Zustand state and
renders a minimal session header, connection state, track status, timing tower,
Race Control messages, weather panel, and broadcast-delay control. Detailed
live dashboard behavior remains pending.

## Goal

Deliver the primary Formula Delta race companion experience.

---

## 10.1 Session Header

Display:

```text
Event
Session
Lap
Track Status
Connection Mode
```

---

## 10.2 Timing Tower

Display:

```text
Position
Driver
Gap
Interval
Last Lap
Tyre
Tyre Age
Pit Stops
Status
```

---

## 10.3 Sector Information

Display available sector information without destabilizing row layout.

---

## 10.4 Race Control Panel

Show recent relevant messages.

---

## 10.5 Weather

Display compact weather information.

---

## 10.6 Pit State

Make active pit events noticeable.

Avoid excessive animation.

---

## Phase 10 Exit Criteria

During a replay or live session, the user can understand the race using Formula Delta as a functional second screen.

Specifically:

- classification is clear;
- gaps are visible;
- intervals are visible;
- tyres are visible;
- tyre age is visible;
- timing is visible;
- pit information is visible;
- track state is obvious;
- Race Control is accessible;
- weather is available;
- layout remains stable during frequent updates.

This is the first major product milestone.

---

# Phase 11 — Strategy View

## Goal

Expose stint and tyre strategy clearly.

---

## 11.1 Stint Reconstruction

Build strategy history from normalized stint data.

---

## 11.2 Strategy Timeline

Represent compounds over race progression.

Example:

```text
NOR   M━━━━━━━━━━ H━━━━━━━━━━━━━━━━
VER   S━━━━ M━━━━━━━━ H━━━━━━━━━━━━
PIA   M━━━━━━━━━━━━ H━━━━━━━━━━━━━━
```

---

## 11.3 Pit History

Show:

- stop count;
- stint transitions;
- approximate lap of stop;
- current stint.

---

## Phase 11 Exit Criteria

The user can understand each driver's tyre strategy without manually reconstructing it from the timing tower.

---

# Phase 12 — Docker and Reproducible Startup

## Goal

Make Formula Delta simple to run.

---

## 12.1 Backend Container

Containerize backend.

---

## 12.2 Frontend Container

Containerize frontend.

---

## 12.3 Docker Compose

Target:

```bash
docker compose up
```

---

## 12.4 Volumes

Persist:

```text
api/recordings/
```

where appropriate.

---

## Phase 12 Exit Criteria

A clean machine with the documented prerequisites can start Formula Delta using the documented Docker workflow.

No paid infrastructure is required.

---

# Phase 13 — MVP Hardening

## Goal

Prepare Formula Delta for reliable use during an actual race.

---

## 13.1 Failure Testing

Simulate:

- network loss;
- F1 disconnect;
- malformed message;
- unknown topic;
- missing tyre data;
- missing weather;
- missing telemetry;
- frontend reconnect;
- backend restart where applicable;
- recording write failure.

---

## 13.2 Long Session Testing

Replay or run sessions long enough to detect:

- memory leaks;
- unbounded arrays;
- excessive logging;
- excessive disk usage;
- frontend degradation.

---

## 13.3 Performance Review

Inspect:

- event throughput;
- serialization;
- WebSocket traffic;
- React renders;
- memory consumption.

---

## 13.4 Documentation Review

Ensure implementation matches:

```text
README
PROJECT-SCOPE
ARCHITECTURE
DATA-SOURCES
DATA-MODEL
PROTOCOL
WEBSOCKET-PROTOCOL
RECORDING-FORMAT
TESTING
KNOWN-LIMITATIONS
```

---

## Phase 13 Exit Criteria — MVP

Formula Delta MVP is complete when:

- live/replay pipeline works;
- dashboard is useful during a race;
- recording works;
- replay works;
- TV delay works;
- core timing works;
- tyres/stints work;
- Race Control works;
- weather works when available;
- missing optional capabilities do not break the application;
- automated tests cover critical processing;
- Docker startup works;
- documentation reflects reality;
- operation remains €0.

---

# Phase 14 — Battle Mode

## Goal

Provide focused comparison between two drivers.

---

Display:

```text
position
gap
interval
last lap
best lap
sectors
tyre
tyre age
recent pace
```

Add gap history where available.

---

# Phase 15 — Race Analytics

## Goal

Derive useful information locally from captured timing data.

Potential features:

```text
3-lap pace
5-lap pace
gap trend
pace delta
tyre degradation estimate
stint comparison
position gains/losses
```

Derived values must be clearly distinguishable from official timing data.

---

# Phase 16 — Team Radio

## Goal

Investigate and integrate Team Radio if the source remains accessible and implementation is appropriate.

Potential features:

```text
radio event
driver
timestamp
playback
```

No paid transcription dependency.

---

# Phase 17 — Experimental Telemetry

## Goal

Use high-frequency car telemetry when available.

Capability:

```text
CarData.z
```

Potential display:

```text
Speed
RPM
Gear
Throttle
Brake
Active Aero
```

This phase must not modify the architecture so that Formula Delta requires this topic.

---

# Phase 18 — Experimental Track Map

## Goal

Visualize cars around the circuit.

Priority:

```text
Position.z
```

Fallback research:

```text
mini-sector based approximation
```

Approximate positions must be identified as approximate.

---

# Phase 19 — Future Evolution

Only after Formula Delta is stable should we evaluate:

- qualifying-specific UI;
- practice-specific UI;
- historical analytics;
- circuit database;
- local database;
- multi-monitor mode;
- dashboard customization;
- advanced strategy calculations;
- Python analytics service;
- FastF1 offline integration.

Each significant addition requires a new scope decision.

---

# Milestone Overview

```text
PHASE 0
F1 Discovery
      │
      ▼
PHASE 1
Repository Foundation
      │
      ▼
PHASE 2
Domain Model
      │
      ▼
PHASE 3
F1 Ingestion
      │
      ▼
PHASE 4
Recording
      │
      ▼
PHASE 5
Replay
      │
      ▼
PHASE 6
Backend
      │
      ▼
PHASE 7
TV Delay
      │
      ▼
PHASE 8
UX/UI Foundation
      │
      ▼
PHASE 9
Frontend Foundation
      │
      ▼
PHASE 10
Live Dashboard
      │
      ▼
PHASE 11
Strategy
      │
      ▼
PHASE 12
Docker
      │
      ▼
PHASE 13
Hardening
      │
      ▼
   MVP 1.0
      │
      ├────────► Battle Mode
      │
      ├────────► Analytics
      │
      ├────────► Team Radio
      │
      ├────────► Telemetry
      │
      └────────► Track Map
```

---

# Development Rule

Do not optimize Formula Delta for hypothetical future scale.

Optimize it for:

```text
one local machine
one Formula 1 session
one or a few browser clients
reliable real-time information
```

Architecture may evolve when actual requirements change.

---

# Final Roadmap Principle

Formula Delta development follows this sequence:

```text
Observe
   ↓
Understand
   ↓
Record
   ↓
Normalize
   ↓
Replay
   ↓
Expose
   ↓
Visualize
   ↓
Analyze
```

Do not reverse this sequence by designing advanced features around data that has not yet been verified.
