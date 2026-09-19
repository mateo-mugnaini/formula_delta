# Formula Delta — Architecture

## 1. Purpose

This document describes the technical architecture of **Formula Delta**.

Formula Delta is a free, local-first Formula 1 live timing companion designed to operate as a second screen while watching a Formula 1 session.

The architecture is optimized for:

* real-time information;
* local execution;
* zero required infrastructure cost;
* unreliable or evolving upstream data;
* deterministic replay;
* offline development;
* clear separation between Formula 1 protocol details and application logic;
* maintainability by a small development team or individual developer.

This document describes the intended architecture.

Implementation details may evolve as Phase 0 discovery produces real evidence about the Formula 1 timing feed.

---

# 2. Architectural Goals

Formula Delta should satisfy the following architectural properties.

## Local

The complete application runs on one local machine.

## Free

No paid API, database or cloud service is required.

## Resilient

Unexpected or missing Formula 1 data should degrade individual capabilities rather than crash the application.

## Replayable

Recorded sessions must travel through the same processing pipeline as live sessions.

## Testable

Core data processing must be testable without network access.

## Decoupled

Frontend components must not understand Formula 1's upstream protocol.

## Observable

Protocol changes and parsing failures should be visible to developers.

## Simple

Infrastructure should reflect the actual scale of the application.

---

# 3. System Context

Formula Delta sits between Formula 1 timing infrastructure and a local browser.

```text id="b68c0j"
┌───────────────────────────────┐
│                               │
│    Formula 1 Live Timing      │
│                               │
└───────────────┬───────────────┘
                │
                │ Internet
                │
                ▼
┌───────────────────────────────┐
│                               │
│     Formula Delta Backend     │
│                               │
│  Connection                   │
│  Parsing                      │
│  Normalization                │
│  State                        │
│  Recording                    │
│  Replay                       │
│  Delay                        │
│                               │
└───────────────┬───────────────┘
                │
                │ Local WebSocket
                │
                ▼
┌───────────────────────────────┐
│                               │
│     Formula Delta Frontend    │
│                               │
│      React + Zustand          │
│                               │
└───────────────────────────────┘
```

The browser never connects directly to Formula 1 timing infrastructure.

---

# 4. Repository Architecture

The intended repository structure is:

```text id="oow7m6"
formula-delta/
│
├── api/
│   │
│   ├── api/
│   │   └── src/
│   │       ├── f1/
│   │       ├── sources/
│   │       ├── state/
│   │       ├── recording/
│   │       ├── replay/
│   │       ├── delay/
│   │       ├── websocket/
│   │       ├── http/
│   │       └── config/
│   │
│   └── client/
│       └── src/
│           ├── components/
│           ├── features/
│           ├── stores/
│           ├── websocket/
│           ├── design-system/
│           └── utils/
│
├── packages/
│   └── shared/
│
├── tools/
│   └── f1-probe/
│
├── tests/
│
├── api/fixtures/
│
├── api/recordings/
│
└── docs/
```

The exact internal folder structure may change if implementation reveals a simpler organization.

The architectural boundaries should remain.

---

# 5. High-Level Data Flow

The core Formula Delta pipeline is:

```text id="w11e44"
Upstream Data
     │
     ▼
Data Source
     │
     ▼
Raw Event
     │
     ├──────────────► Recorder
     │
     ▼
Presentation Delay Buffer
     │
     ▼
Parser
     │
     ▼
Normalizer
     │
     ▼
Presentation State Manager
     │
     ▼
Publisher
     │
     ▼
WebSocket Server
     │
     ▼
Frontend Store
     │
     ▼
React
```

Each stage has a distinct responsibility.

The recorder receives events immediately after SignalR topic extraction so
the recording reflects what Formula Delta received. Live presentation events
then pass through the configurable delay buffer before parsing and state
reconstruction. This ordering prevents the presentation state manager from
learning future race state and accidentally exposing it in a snapshot to a
newly connected client. Operational connection diagnostics may bypass this
buffer. Replay normally does not apply the TV delay.

---

# 6. Data Sources

Formula Delta supports interchangeable data sources.

The first two are:

```text id="sgfmvp"
LiveSource
ReplaySource
```

Both emit a common internal raw-event representation.

Conceptually:

```js id="khsamz"
{
  receivedAt: 1758210205123,
  topic: 'TimingData',
  payload: {}
}
```

The exact contract will be defined after Phase 0.

---

# 7. LiveSource

`LiveSource` communicates with Formula 1 timing infrastructure.

Responsibilities:

* negotiate connection where required;
* establish transport;
* subscribe to topics;
* receive events;
* identify topic;
* preserve raw payload;
* detect disconnects;
* reconnect;
* expose lifecycle state.

It should not:

* calculate gaps;
* build UI objects;
* store React-specific data;
* calculate strategy;
* write directly to frontend clients.

Conceptually:

```text id="56fqva"
Formula 1
    │
    ▼
LiveSource
    │
    ▼
RawEvent
```

Formula 1-specific transport implementation belongs primarily under:

```text id="ol6wxg"
api/src/f1/
```

---

# 8. ReplaySource

`ReplaySource` reads previously recorded Formula Delta events.

Its output contract must match `LiveSource`.

```text id="3j7kx7"
LiveSource ─────┐
               │
               ▼
            RawEvent
               ▲
               │
ReplaySource ──┘
```

This is one of the most important architectural constraints in Formula Delta.

If downstream code needs:

```js id="ls4ctc"
if (replayMode) {
  // completely different processing
}
```

the architecture should be reconsidered.

Some source-specific lifecycle behavior is acceptable, but domain processing should remain shared.

---

# 9. Raw Event Boundary

A raw event represents upstream information before Formula Delta applies domain interpretation.

Conceptually:

```js id="ws87rj"
{
  receivedAt: 1758210205123,
  source: 'live',
  topic: 'TimingData',
  payload: {}
}
```

Replay may replace `source` with:

```text id="1c1bl8"
replay
```

but the payload should remain equivalent to the captured original whenever possible.

---

# 10. Recorder

The Recorder operates close to the raw-event boundary.

```text id="pwhnr7"
              RawEvent
                  │
          ┌───────┴───────┐
          │               │
          ▼               ▼
       Recorder          Parser
```

This placement is intentional.

If Formula Delta's parser contains a bug, the original event should still be preserved.

After fixing the parser, the recording can be replayed.

---

# 11. Parser Layer

Parsers understand Formula 1-specific structures.

Examples may include:

```text id="a3mv6v"
parseTimingData()
parseTimingAppData()
parseDriverList()
parseRaceControlMessages()
parseWeatherData()
```

Parsers should remain topic-focused.

They convert protocol structures into forms that are easier to normalize.

They must tolerate:

* missing properties;
* unknown properties;
* sparse arrays/objects;
* null values;
* unexpected optional values.

---

# 12. Normalization Layer

Normalization converts upstream representations into Formula Delta domain representations.

Example:

```text id="6e1lv3"
UPSTREAM

{
  "Position": "3",
  "NumberOfPitStops": "1"
}

          ↓

FORMULA DELTA

{
  position: 3,
  pitStops: 1
}
```

Normalization may include:

* naming;
* type conversion;
* identifier normalization;
* status mapping;
* compound mapping;
* timestamp conversion;
* missing-value handling.

Formula 1 terminology may remain where it represents the actual racing domain.

Protocol-specific representation should not.

---

# 13. State Manager

The State Manager maintains the current reconstructed Formula Delta session.

Conceptually:

```text id="hflwum"
Current State
      +
Normalized Delta
      │
      ▼
New Current State
```

The State Manager is responsible for correctly applying partial updates.

---

# 14. Why State Reconstruction Is Necessary

Live timing systems often avoid retransmitting complete state for every update.

For example:

Initial state:

```js id="c8nhqx"
{
  driver: 'VER',
  position: 2,
  gap: '+3.212',
  tyre: 'MEDIUM'
}
```

Incoming delta:

```js id="c9odks"
{
  gap: '+2.941'
}
```

Correct result:

```js id="50i7y5"
{
  driver: 'VER',
  position: 2,
  gap: '+2.941',
  tyre: 'MEDIUM'
}
```

Incorrect result:

```js id="1ok5o1"
{
  gap: '+2.941'
}
```

Missing properties in a delta must not automatically imply deletion.

---

# 15. Merge Semantics

Generic deep merge utilities may not always be sufficient.

Different Formula 1 topics may require different semantics.

Examples:

```text id="w0tqgf"
TimingData
→ update driver state

RaceControlMessages
→ append new messages

DriverList
→ update driver metadata

TimingAppData
→ update stint information
```

Therefore merging should remain domain-aware where necessary.

Avoid one universal `deepMerge()` function becoming responsible for every upstream behavior.

---

# 16. Current State

The State Manager may eventually maintain a structure conceptually similar to:

```js id="6wwg8j"
{
  session: {},
  drivers: {},
  timing: {},
  stints: {},
  trackStatus: {},
  raceControl: [],
  weather: {},
  capabilities: {},
  connection: {}
}
```

This is illustrative.

The authoritative structure belongs in:

```text id="06y8yq"
docs/DATA-MODEL.md
```

---

# 17. Event History vs Current State

Formula Delta needs b
