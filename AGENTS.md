# Formula Delta — AGENTS.md

## 1. Purpose

This file defines the global rules for any AI agent working on **Formula Delta**.

Formula Delta is a local-first, real-time Formula 1 companion dashboard designed to display live timing and race information while the user watches a Formula 1 session.

This file is the root source of instructions for the repository.

More specific `AGENTS.md` files may exist inside subdirectories. When working inside one of those areas, agents MUST follow both this root file and the closest applicable `AGENTS.md`.

If instructions conflict, the more specific `AGENTS.md` takes precedence for its area, unless it violates a global constraint defined here.

---

# 2. Project Principles

Formula Delta follows these non-negotiable principles.

## 2.1 Zero Cost

Formula Delta MUST be usable without paid infrastructure or paid APIs.

Do not introduce:

- paid APIs;
- mandatory subscriptions;
- cloud services required for normal operation;
- commercial databases;
- paid telemetry providers.

Optional integrations may only be considered if the core application remains completely functional without them.

---

## 2.2 Local First

The complete application MUST be capable of running locally.

The expected development workflow is eventually:

```bash
docker compose up
```

followed by access through localhost.

Internet access may be required to receive Formula 1 live timing data, but Formula Delta itself must not require cloud infrastructure.

Replay mode MUST work completely offline once a recording exists.

---

## 2.3 Live and Replay Are Equal Data Sources

Formula Delta must support at least two data sources:

```text
LiveSource
ReplaySource
```

Both MUST feed the same processing pipeline.

Downstream systems should not need to know whether events originated from a live Formula 1 session or a recording.

Conceptually:

```text
                 DataSource
                     │
           ┌─────────┴─────────┐
           │                   │
      LiveSource          ReplaySource
           │                   │
           └─────────┬─────────┘
                     │
                     ▼
                StateManager
                     │
                     ▼
                 WebSocket
                     │
                     ▼
                   React
```

Do not implement separate application logic for live and replay modes unless technically unavoidable.

---

# 3. Technology Baseline

The initial technology stack is intentionally small.

## Runtime

Node.js

## Language

JavaScript.

Use:

- modern JavaScript;
- ECMAScript Modules;
- `import` / `export`;
- functional programming patterns where practical.

Do NOT introduce TypeScript unless the project explicitly changes this decision.

Avoid class-based architecture unless a library requires it or there is a strong technical justification.

---

## Frontend

- React
- Vite
- Zustand
- native WebSocket client
- standard CSS / CSS Modules

Additional libraries require justification.

Avoid introducing large UI frameworks unless there is a demonstrated need.

---

## Backend

- Node.js
- ESM
- WebSocket
- SignalR-compatible communication where required
- Express only for HTTP endpoints where HTTP is appropriate
- Node filesystem APIs
- Node compression utilities where required

---

## Infrastructure

- Docker
- Docker Compose
- pnpm workspace

Do not introduce infrastructure merely for architectural appearance.

---

# 4. Explicitly Excluded Infrastructure

The initial architecture does NOT require:

- PostgreSQL
- MySQL
- MongoDB
- Redis
- Kafka
- RabbitMQ
- Kubernetes
- AWS
- Azure
- GCP
- Supabase
- Firebase
- Vercel
- Render

These technologies may only be introduced later when an actual technical requirement exists.

Do not introduce them preemptively.

---

# 5. Formula 1 Data Constraints

Formula Delta depends on Formula 1 timing infrastructure that is not guaranteed to behave as a stable public API.

Agents MUST assume that:

- topics may change;
- fields may appear;
- fields may disappear;
- field types may change;
- messages may arrive partially;
- messages may arrive as deltas;
- unknown fields may appear;
- connections may disconnect;
- reconnects may be required;
- some topics may require authentication;
- anonymous access may expose only part of the available data;
- high-frequency telemetry may not be available;
- live position data may not be available.

The application MUST degrade gracefully when optional data is unavailable.

---

# 6. Core vs Optional Capabilities

The application must distinguish between core and optional capabilities.

## Core

The project should primarily target:

- session information;
- driver information;
- live classification;
- gap to leader;
- interval to car ahead;
- lap count;
- lap times;
- sectors;
- mini-sectors when available;
- tyre compounds;
- tyre age;
- stints;
- pit information;
- track status;
- Race Control messages;
- weather;
- timing statistics;
- team radio metadata when available.

## Optional / Experimental

Treat these as capabilities rather than requirements:

- `CarData.z`;
- high-frequency speed;
- RPM;
- gear;
- throttle;
- brake;
- active aero;
- `Position.z`;
- accurate live track position.

The absence of an experimental capability MUST NOT break the primary dashboard.

Use capability detection where appropriate.

Example:

```js
{
  carTelemetry: false,
  livePosition: false,
  teamRadio: true
}
```

The UI should adapt accordingly.

---

# 7. Raw Data Must Be Preserved

Formula 1 payloads must not be immediately transformed and discarded.

When recording sessions, Formula Delta should preserve the original event payload whenever practical.

Conceptually:

```text
F1 event
   │
   ├──────────────► Recorder
   │                 raw event
   │
   ▼
Parser
   │
   ▼
Normalizer
   │
   ▼
State Manager
```

This allows future parsers to be tested against previously captured real-world data.

---

# 8. Formula 1 Data Must Not Reach React Directly

The frontend MUST NOT depend on Formula 1's raw schemas.

Forbidden architecture:

```text
F1 TimingData
      ↓
React component
```

Required architecture:

```text
F1
 ↓
Transport
 ↓
Parser
 ↓
Normalizer
 ↓
Internal Domain Model
 ↓
WebSocket Protocol
 ↓
Frontend Store
 ↓
React
```

This boundary is critical.

Formula 1 protocol changes should primarily affect the ingestion layer, not the user interface.

---

# 9. Normalize External Data

External data should be converted into stable internal representations.

For example, if the source provides:

```json
{
  "Position": "3"
}
```

the internal model should prefer:

```json
{
  "position": 3
}
```

Normalization should handle:

- primitive conversions;
- missing fields;
- timestamps;
- driver identifiers;
- status values;
- compound names;
- timing values;
- boolean-like values;
- collections;
- protocol-specific structures.

React should consume the normalized model.

---

# 10. Delta-Based State

Formula 1 timing messages may represent partial updates.

Never assume every event contains complete state.

The State Manager must support:

```text
Initial State
     +
Delta
     ↓
Updated State
```

Updates must not accidentally delete existing properties merely because they are absent from the latest event.

Delta merging behavior MUST be tested.

---

# 11. Defensive Parsing

Never trust an external payload.

Parsers must handle:

- undefined fields;
- null values;
- unexpected types;
- unknown keys;
- empty arrays;
- sparse objects;
- malformed events where practical.

A malformed optional field should not crash an entire live session.

Do not silently hide systemic failures. Log them appropriately.

---

# 12. Recording and Replay

Recording/replay is a core architectural capability, not a development-only hack.

Recordings should preserve enough information to reproduce event ordering and timing.

Replay must eventually support:

- play;
- pause;
- resume;
- restart;
- configurable speed.

Potential speeds include:

```text
0.5x
1x
2x
5x
10x
```

The exact recording format is defined separately.

---

# 13. TV Synchronization

Formula Delta is designed to operate alongside a television or streaming broadcast.

Live timing may be ahead of the user's video feed.

Therefore the architecture MUST support a configurable broadcast delay.

Conceptually:

```text
Incoming Event
      ↓
Delay Buffer
      ↓
WebSocket
      ↓
Dashboard
```

The delay should eventually be adjustable without restarting the application.

Do not couple source timestamps with presentation timestamps unnecessarily.

---

# 14. UX Principle: Second Screen

Formula Delta is not a traditional administration dashboard.

It is a **race companion**.

The user will frequently look away from Formula Delta to watch the race.

Therefore information should be understandable with very short glances.

Prioritize:

- information density;
- readability;
- stable layouts;
- persistent timing information;
- strong hierarchy;
- predictable positioning;
- minimal visual noise.

Avoid:

- unnecessary cards;
- excessive whitespace;
- decorative animation;
- layout movement during updates;
- modal-heavy workflows;
- animations for ordinary timing updates.

Important events may receive stronger visual treatment.

Examples include:

- Safety Car;
- Virtual Safety Car;
- Red Flag;
- major position changes;
- pit events;
- significant Race Control events.

Detailed UX/UI rules belong to the UX/UI agent.

---

# 15. Stable Live Layouts

Live data changes frequently.

Components displaying timing information MUST minimize layout shifts.

Prefer:

- tabular numerals;
- fixed or predictable column widths;
- stable row heights;
- predictable alignment.

Do not allow changing timing values to constantly resize surrounding UI.

---

# 16. Testing Philosophy

Formula Delta should be testable without waiting for a Formula 1 weekend.

Testing must rely heavily on:

- fixtures;
- captured raw events;
- replay sessions;
- deterministic parsers;
- deterministic normalization;
- state reconstruction tests.

Important ingestion logic should be testable without network access.

Particularly important test targets include:

- delta merging;
- parser behavior;
- normalization;
- malformed payload handling;
- reconnection behavior;
- event ordering;
- replay timing;
- broadcast delay;
- WebSocket contracts.

---

# 17. Fixtures

Realistic fixtures should be collected during the discovery phase.

Expected structure:

```text
api/fixtures/
├── timing-data/
├── timing-app-data/
├── driver-list/
├── race-control/
├── weather/
├── session/
├── malformed/
└── api/recordings/
```

Fixtures should remain small enough for tests and repository maintenance.

Do not commit unnecessarily huge session recordings unless explicitly intended.

---

# 18. Observability

Because the upstream protocol is unstable, useful logging is mandatory.

Important events include:

- connection established;
- connection lost;
- reconnect attempt;
- subscription status;
- unknown topic;
- parser failure;
- malformed payload;
- recording started;
- recording stopped;
- replay started;
- capability detected;
- capability lost.

Avoid logging high-frequency messages individually by default.

Logging must not significantly affect live performance.

---

# 19. Performance

Live timing may generate frequent updates.

Avoid unnecessary:

- serialization;
- deep cloning;
- React rerenders;
- disk writes;
- logging;
- state reconstruction.

Optimization should be evidence-driven, but obvious high-frequency inefficiencies should not be introduced.

Frontend subscriptions should be granular where practical.

---

# 20. Documentation Is Part of the Architecture

Documentation must evolve with the implementation.

When behavior changes, agents must check whether the following documents require updates:

- `README.md`
- `PROJECT-SCOPE.md`
- `ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA-SOURCES.md`
- `docs/DATA-MODEL.md`
- `docs/PROTOCOL.md`
- `docs/WEBSOCKET-PROTOCOL.md`
- `docs/RECORDING-FORMAT.md`
- `docs/TESTING.md`
- `docs/KNOWN-LIMITATIONS.md`
- relevant ADRs
- design documentation

Do not knowingly leave documentation contradicting implemented behavior.

---

# 21. Architecture Decision Records

Important architectural decisions should be documented in `docs/adr/`.

An ADR should explain:

1. context;
2. decision;
3. alternatives considered;
4. consequences.

Do not create ADRs for trivial implementation choices.

Use them for decisions that future developers may reasonably question.

---

# 22. Scope Control

Do not expand project scope simply because a technology or feature is interesting.

Before introducing a significant feature, determine whether it belongs to:

- MVP;
- Post-MVP;
- Experimental;
- Out of Scope.

`PROJECT-SCOPE.md` is authoritative for current scope.

---

# 23. Agent Routing

Specialized agents exist for different areas of the repository.

Agents should follow the closest relevant `AGENTS.md`.

## Backend Agent

Location:

```text
api/AGENTS.md
```

Responsible for:

- Node backend;
- WebSocket server;
- HTTP endpoints;
- delay buffer;
- recorder;
- replay engine;
- backend lifecycle;
- backend configuration.

---

## F1 Data Agent

Location:

```text
api/src/f1/AGENTS.md
```

Responsible for:

- Formula 1 connection;
- SignalR protocol;
- subscriptions;
- raw topics;
- decompression;
- parsing;
- normalization;
- delta semantics;
- upstream compatibility;
- capability detection.

Changes to Formula 1 protocol handling should be routed here.

---

## Frontend Agent

Location:

```text
client/AGENTS.md
```

Responsible for:

- React;
- Zustand;
- WebSocket client;
- frontend state;
- rendering;
- component architecture;
- frontend performance.

The agent has permission to implement the complete frontend, including `.jsx`
and `.module.css` files. Frontend implementation must follow the UX/UI rules
defined by `client/src/design-system/AGENTS.md` and remain separated from raw
Formula 1 payloads.

---

## UX/UI Agent

Location:

```text
client/src/design-system/AGENTS.md
```

Responsible for:

- UX;
- visual hierarchy;
- design system;
- design tokens;
- typography;
- spacing;
- responsive behavior;
- accessibility;
- interaction consistency;
- live-data visual behavior;
- information density.

The UX/UI agent defines presentation rules.

The frontend agent implements them.

Neither should silently override the responsibilities of the other.

---

## Shared Agent

Location:

```text
packages/shared/AGENTS.md
```

Responsible for:

- shared constants;
- domain contracts;
- WebSocket message definitions;
- shared utilities;
- stable internal models.

Shared code must not become a dumping ground for unrelated helpers.

---

## Testing Agent

Location:

```text
tests/AGENTS.md
```

Responsible for:

- testing strategy;
- fixtures;
- integration tests;
- replay validation;
- protocol regression tests;
- failure scenarios.

---

## Documentation Agent

Location:

```text
docs/AGENTS.md
```

Responsible for:

- technical documentation;
- architecture documentation;
- protocol documentation;
- ADR consistency;
- developer documentation.

---

# 24. Cross-Area Changes

Many Formula Delta features cross multiple areas.

For example:

```text
Add tyre age visualization
```

may require:

```text
F1 Data
   ↓
Domain Model
   ↓
WebSocket Contract
   ↓
Frontend Store
   ↓
UI
   ↓
Tests
   ↓
Documentation
```

Agents must identify these boundaries before modifying code.

Do not solve cross-layer features by bypassing architectural boundaries.

---

# 25. Dependency Policy

Prefer platform capabilities and existing dependencies before adding packages.

Before introducing a dependency, evaluate:

- what problem it solves;
- whether Node/browser APIs already solve it;
- maintenance status;
- package size where relevant;
- runtime cost;
- whether it introduces external infrastructure;
- whether the feature is core.

Avoid dependencies for trivial utilities.

---

# 26. Code Style

Use:

- ESM;
- `const` by default;
- pure functions where practical;
- small modules;
- explicit naming;
- early returns;
- async/await;
- named exports where practical.

Avoid:

- unnecessary classes;
- hidden global state;
- deeply nested conditionals;
- magic constants;
- giant utility files;
- premature abstractions.

Prefer code that communicates domain intent.

Example:

```js
applyTimingDelta(currentTiming, timingDelta);
```

is preferable to:

```js
merge(a, b);
```

when Formula Delta-specific semantics are involved.

---

# 27. Error Handling

Errors should be classified conceptually where useful:

```text
Transport Error
Protocol Error
Parsing Error
Normalization Error
State Error
Recording Error
Replay Error
Client Error
```

Recoverable upstream errors should not automatically terminate the application.

Fatal errors should be explicit.

---

# 28. Unknown Upstream Data

Unknown Formula 1 fields should generally be tolerated.

Do not reject an otherwise valid payload solely because Formula 1 added a field.

Unknown topics should be observable through logs or discovery tooling.

Discovery tooling should preserve raw data whenever useful.

---

# 29. Discovery Before Assumption

When behavior of the Formula 1 feed is uncertain:

**observe first.**

Do not implement speculative protocol behavior as fact.

Preferred workflow:

```text
Observe
   ↓
Capture
   ↓
Document
   ↓
Create fixture
   ↓
Implement parser
   ↓
Test
```

This rule is particularly important during Phase 0.

---

# 30. Phase 0 Rule

Before building the main Formula Delta application, the project must validate the upstream data source.

The initial probe should determine:

- whether anonymous connection succeeds;
- available topics;
- event frequency;
- payload shapes;
- snapshot behavior;
- delta behavior;
- compression behavior;
- reconnect behavior;
- availability of `CarData.z`;
- availability of `Position.z`;
- availability of Team Radio;
- session metadata;
- timing stability.

The probe should be capable of recording representative raw payloads.

Do not build major UI functionality based solely on assumptions about the upstream feed.

---

# 31. Security

Formula Delta is local-first but should still follow basic security practices.

Never commit:

- credentials;
- authentication tokens;
- session cookies;
- private keys;
- personally identifying data accidentally captured from unrelated systems.

If authenticated Formula 1 access is ever experimentally investigated, credentials MUST remain outside the repository.

The core application must remain functional without paid credentials.

---

# 32. Definition of Done

A change is not complete merely because it works once.

Where applicable, a completed change should include:

- implementation;
- error handling;
- tests;
- fixtures;
- documentation updates;
- protocol updates;
- design-system compliance;
- no known regression to replay mode;
- no unnecessary paid dependency;
- no unnecessary infrastructure.

Not every small change requires every item, but agents should consciously evaluate them.

---

# 33. Primary Rule

Formula Delta should remain:

**free, local, resilient, understandable, replayable and useful during an actual Formula 1 race.**

When choosing between architectural sophistication and practical usefulness, prefer the simplest architecture that reliably satisfies those goals.
