# Formula Delta — Data Model

## 1. Purpose

This document defines the internal domain model used by **Formula Delta**.

The model represents Formula 1 session information after upstream data has passed through:

```text
F1 Protocol
    ↓
Parser
    ↓
Normalizer
    ↓
FORMULA DELTA DOMAIN MODEL
```

Everything downstream should depend primarily on this model rather than on Formula 1's raw payload structure.

## Implementation Status

The shared package currently contains the first pure domain helpers for
primitive normalization, lap times, gaps, capabilities, initial state, and
delta merging. Collection helpers now transform observed driver, timing, stint,
and Race Control fixture collections. These helpers are intentionally small and
do not yet represent the complete normalized session model. Basic validation
helpers also verify normalized timing entries and capability maps before they
cross the shared contract boundary.

This includes:

* state management;
* WebSocket contracts;
* frontend stores;
* React components;
* recording-derived analytics;
* tests.

---

# 2. Design Goals

The Formula Delta data model should be:

### Stable

Upstream protocol changes should not unnecessarily propagate through the application.

### Explicit

Values should have clear meaning.

### Typed by Meaning

Even though the project uses JavaScript, structures should have well-defined contracts.

### Null-Safe

Missing information must be represented intentionally.

### Replay-Compatible

Live and replay processing must produce the same domain structures.

### Extensible

Optional telemetry and future analytics should fit without redesigning the core race model.

---

# 3. Model Layers

Formula Delta distinguishes three important representations.

```text
RAW
 │
 ▼
NORMALIZED
 │
 ▼
DERIVED
```

---

## Raw

Exactly or nearly exactly what Formula 1 provides.

Example:

```js
{
  Position: "3",
  GapToLeader: "+4.821"
}
```

Raw structures belong at the F1 boundary.

---

## Normalized

Formula Delta's interpretation.

```js
{
  position: 3,
  gapToLeader: {
    display: "+4.821"
  }
}
```

This is the core domain layer.

---

## Derived

Values calculated by Formula Delta.

Example:

```js
{
  recentPace: {
    averageLast5LapsMs: 83214
  }
}
```

Derived values must remain distinguishable from official upstream information.

---

# 4. Root Session State

The backend maintains a current session state conceptually similar to:

```js
{
  session: {},
  drivers: {},
  timing: {},
  stints: {},
  track: {},
  raceControl: [],
  weather: {},
  capabilities: {},
  connection: {}
}
```

Future versions may add:

```js
{
  telemetry: {},
  positions: {},
  analytics: {}
}
```

The root should not become a direct mirror of F1 topics.

---

# 5. Identifiers

Identifiers must be stable within a session.

For drivers, the expected primary identifier is:

```text
racing number
```

Example:

```text
"1"
"4"
"16"
"44"
```

Store racing numbers as strings unless Phase 0 identifies a strong reason not to.

This avoids unnecessary numeric assumptions.

---

# 6. Driver

A `Driver` represents relatively stable driver metadata.

Conceptual model:

```js
{
  id: "16",
  racingNumber: "16",
  abbreviation: "LEC",
  firstName: "Charles",
  lastName: "Leclerc",
  fullName: "Charles Leclerc",
  broadcastName: "C LECLERC",

  team: {
    name: "Ferrari",
    color: "E8002D"
  },

  headshotUrl: null
}
```

Not every property is guaranteed.

---

# 7. Driver Identity vs Timing

Do not mix relatively static metadata with rapidly changing race state.

Avoid:

```js
{
  firstName: "...",
  lastName: "...",
  team: "...",
  position: 3,
  gap: "...",
  lastLap: "..."
}
```

as the canonical driver object.

Prefer:

```text
Driver
+
TimingEntry
```

This keeps update responsibilities clearer.

---

# 8. Session

`Session` describes the current event/session.

Conceptual model:

```js
{
  id: null,

  eventName: "Italian Grand Prix",
  sessionName: "Race",
  sessionType: "race",

  location: "Monza",
  country: "Italy",

  startTime: null,
  endTime: null,

  status: "live",

  lap: {
    current: 37,
    total: 53
  },

  clock: null
}
```

Fields depend on session type.

---

# 9. Session Type

Normalize known session types.

Potential values:

```text
practice
qualifying
sprint-qualifying
sprint
race
unknown
```

Do not make UI components compare arbitrary upstream strings.

---

# 10. Session Status

Potential normalized states:

```text
inactive
starting
live
suspended
finished
finalised
unknown
```

Exact mapping must be finalized after Phase 0.

Raw values should be preserved at the normalization boundary when unknown.

---

# 11. Lap Count

Conceptual structure:

```js
{
  current: 37,
  total: 53
}
```

Missing information:

```js
{
  current: null,
  total: null
}
```

Never use `0` to mean "unknown".

---

# 12. TimingEntry

`TimingEntry` represents a driver's current timing/classification state.

Conceptually:

```js
{
  driverId: "16",

  position: 3,

  gapToLeader: {},
  intervalToAhead: {},

  lastLap: {},
  bestLap: {},

  sectors: [],

  pit: {},
  status: {}
}
```

This is one of the most frequently updated entities in Formula Delta.

---

# 13. Position

Position is represented as:

```js
position: 3
```

Unknown:

```js
position: null
```

Do not use:

```js
position: 0
```

to represent missing data.

---

# 14. Gap

Gaps require more care than simple strings.

Potential states include:

```text
leader
time gap
lap gap
unknown
```

Conceptual representation:

```js
{
  type: "time",
  milliseconds: 4821,
  display: "+4.821"
}
```

Leader:

```js
{
  type: "leader",
  milliseconds: 0,
  display: "LEADER"
}
```

Lapped driver:

```js
{
  type: "laps",
  laps: 1,
  display: "+1 LAP"
}
```

Unknown:

```js
{
  type: "unknown",
  display: null
}
```

---

# 15. Why Preserve Display Values

Formula 1 timing strings can contain domain-specific representations.

Therefore Formula Delta should avoid converting every timing value into a number and reconstructing the display later.

Where useful, retain both:

```js
{
  milliseconds: 4821,
  display: "+4.821"
}
```

This supports:

* calculations;
* faithful presentation;
* debugging.

---

# 16. Interval

`intervalToAhead` uses the same general timing-value concept.

Example:

```js
{
  type: "time",
  milliseconds: 721,
  display: "+0.721"
}
```

The semantic distinction remains:

```text
gapToLeader
≠
intervalToAhead
```

---

# 17. LapTime

Conceptual representation:

```js
{
  milliseconds: 83281,
  display: "1:23.281",
  valid: true
}
```

Unknown:

```js
{
  milliseconds: null,
  display: null,
  valid: null
}
```

Additional metadata may be added only if observed data supports it.

---

# 18. Why Milliseconds

Milliseconds provide a useful calculation unit for:

* pace;
* differences;
* averages;
* trends.

Example:

```text
1:23.281
    ↓
83281 ms
```

Do calculations on numeric values.

Use display values for presentation.

---

# 19. Sector

Conceptual model:

```js
{
  number: 1,

  time: {
    milliseconds: 28142,
    display: "28.142"
  },

  status: "normal"
}
```

Potential status values:

```text
normal
personal-best
session-best
invalid
unknown
```

Exact mapping depends on observed protocol behavior.

---

# 20. MiniSector

If available:

```js
{
  index: 0,
  status: "normal"
}
```

Potential semantic statuses:

```text
normal
personal-best
session-best
slow
unknown
```

Do not expose raw numeric F1 status codes to the frontend.

---

# 21. Driver Race Status

A driver may have race-specific state beyond position.

Conceptual representation:

```js
{
  retired: false,
  stopped: false,
  knockedOut: false
}
```

Only include fields that have useful and verified semantics.

Potential future normalized aggregate:

```text
running
pit
stopped
retired
finished
unknown
```

must not erase useful underlying information.

---

# 22. PitState

Conceptual model:

```js
{
  inPit: false,
  pitOut: false,
  stopCount: 1
}
```

Potential future additions:

```js
{
  lastPitLap: 18
}
```

only if reliable data exists.

---

# 23. Stint

A `Stint` represents a period driven on one tyre set.

Conceptual model:

```js
{
  number: 2,
  compound: "HARD",

  startLap: 19,
  endLap: null,

  tyreAgeAtStart: 0,
  currentTyreAge: 18,

  newTyre: true
}
```

The exact tyre-age fields must be validated against real data.

---

# 24. Compound

Internal compounds:

```text
SOFT
MEDIUM
HARD
INTERMEDIATE
WET
UNKNOWN
```

These are domain values, not visual values.

Do not store:

```js
compoundColor: "yellow"
```

in the domain model.

The design system decides presentation.

---

# 25. Unknown Compound

Unexpected upstream compound:

```text
SUPERSOFT_2030
```

should not crash normalization.

Normalize:

```js
compound: "UNKNOWN"
```

and preserve the original value for diagnostics where useful.

---

# 26. Stint Collection

Stints belong to drivers.

Conceptually:

```js
{
  "16": [
    {
      number: 1,
      compound: "MEDIUM"
    },
    {
      number: 2,
      compound: "HARD"
    }
  ]
}
```

Ordering should be explicit by stint number rather than accidentally dependent on object insertion order.

---

# 27. TrackState

Conceptual representation:

```js
{
  status: "green"
}
```

Potential normalized statuses:

```text
green
yellow
double-yellow
vsc
vsc-ending
safety-car
red
unknown
```

Phase 0 determines exact mappings.

---

# 28. Track State Semantics

The domain stores semantic meaning:

```text
safety-car
```

The UI decides presentation:

```text
yellow background
SC badge
animation
```

Do not mix these layers.

---

# 29. RaceControlEvent

Race Control is modeled as event history.

Conceptual structure:

```js
{
  id: "rc-184",

  timestamp: null,
  lap: 31,

  category: "penalty",

  driverId: "16",

  message: "..."
}
```

Not every event will have:

* driver;
* lap;
* category;
* structured metadata.

---

# 30. Race Control Categories

Potential normalized categories:

```text
flag
incident
investigation
penalty
track-limits
safety-car
vsc
drs
pit-lane
information
other
```

Do not over-classify messages without reliable evidence.

Fallback:

```text
other
```

---

# 31. Original Race Control Message

The original message text should be preserved.

Structured interpretation should supplement it rather than replace it.

Conceptually:

```js
{
  category: "penalty",
  message: "CAR 16 (...)"
}
```

This allows Formula Delta to improve parsers later without losing the authoritative message.

---

# 32. Weather

Conceptual model:

```js
{
  airTemperatureC: 24.8,
  trackTemperatureC: 38.1,
  humidityPercent: 61,
  pressure: null,

  rainfall: false,

  wind: {
    speed: 2.8,
    directionDegrees: 194
  }
}
```

Units must be explicit in either property names or contract documentation.

---

# 33. Weather Unknowns

Prefer:

```js
airTemperatureC: null
```

over:

```js
airTemperatureC: 0
```

unless zero is genuinely observed.

---

# 34. SessionClock

For timed sessions:

```js
{
  remainingMs: 524000,
  running: true,
  referenceTime: null
}
```

Exact implementation depends on `ExtrapolatedClock` behavior.

Race lap count remains separate from timed-session clocks.

---

# 35. ConnectionState

Formula Delta tracks upstream connection state independently from session state.

Conceptual model:

```js
{
  status: "live",
  attempt: 0,
  connectedAt: null,
  lastMessageAt: null,
  error: null
}
```

Potential statuses:

```text
idle
connecting
live
reconnecting
disconnected
failed
```

---

# 36. Why Connection Is Domain-Visible

Connection state affects product truthfulness.

If the timing feed disconnects, the frontend must not continue displaying stale information as if it were current.

Therefore connection state is exposed to the frontend.

---

# 37. CapabilityState

Conceptual representation:

```js
{
  timing: true,
  tyres: true,
  raceControl: true,
  weather: true,
  teamRadio: false,
  carTelemetry: false,
  livePosition: false
}
```

Capabilities represent actual availability for the current source/session.

---

# 38. Capability States

A boolean may eventually be insufficient.

A richer model may be useful:

```js
{
  carTelemetry: {
    status: "unavailable",
    reason: "authorization"
  }
}
```

Potential states:

```text
unknown
available
unavailable
degraded
```

Start simple unless the richer representation solves a real UX or diagnostic need.

---

# 39. TeamRadioEvent

If implemented:

```js
{
  id: "radio-123",
  driverId: "4",
  timestamp: null,
  mediaUrl: null
}
```

Do not assume transcript availability.

---

# 40. CarTelemetry

Experimental model:

```js
{
  driverId: "4",
  timestamp: null,

  speedKph: 312,
  rpm: 11842,
  gear: 8,

  throttlePercent: 100,
  brake: false,

  activeAero: null
}
```

Exact channels must be based on observed telemetry.

---

# 41. Telemetry Samples

Telemetry is time-series data.

Do not add every telemetry sample to the root current-state object indefinitely.

Separate:

```text
latest telemetry
```

from:

```text
telemetry history
```

History requires bounded storage or streaming strategy.

---

# 42. CarPosition

Experimental representation:

```js
{
  driverId: "4",
  timestamp: null,

  x: 1234,
  y: 842,
  z: 17,

  status: "on-track"
}
```

Coordinates remain source-relative until a track transformation is defined.

---

# 43. Approximate Position

If Formula Delta later estimates track progress from mini-sectors, do not store it as `CarPosition`.

Use a distinct derived concept.

Example:

```js
{
  driverId: "4",
  progress: 0.728,
  source: "estimated"
}
```

This prevents estimated positions from being confused with upstream coordinates.

---

# 44. Derived Analytics

Post-MVP analytics belong under a distinct domain.

Conceptually:

```js
{
  driverId: "4",

  recentPace: {},
  gapTrend: {},
  tyreDegradation: {}
}
```

Derived analytics must declare:

* source data;
* calculation window;
* insufficient-data state where relevant.

---

# 45. Recent Pace

Example:

```js
{
  laps: 5,
  averageMs: 83421,
  sampleCount: 5
}
```

If only two valid laps exist:

```js
{
  laps: 5,
  averageMs: 83510,
  sampleCount: 2
}
```

The UI can decide whether that is enough to display.

---

# 46. Gap Trend

Conceptually:

```js
{
  opponentDriverId: "1",
  windowLaps: 5,
  changeMs: -820
}
```

Interpretation:

```text
negative
→ gap reduced

positive
→ gap increased
```

Exact semantics must be documented before implementation.

---

# 47. Tyre Degradation

Tyre degradation is derived, not official.

Conceptually:

```js
{
  compound: "MEDIUM",
  stintNumber: 2,
  estimatedLossPerLapMs: 74,
  confidence: null
}
```

Do not imply scientific precision unsupported by the available data.

---

# 48. Collections

Frequently accessed driver-indexed collections should prefer keyed structures.

Example:

```js
drivers: {
  "1": {},
  "4": {},
  "16": {}
}
```

instead of requiring repeated:

```js
drivers.find(...)
```

during high-frequency updates.

Presentation ordering can be derived separately.

---

# 49. Classification Ordering

Timing data should not rely on object ordering.

A selector may produce:

```js
[
  timing["4"],
  timing["1"],
  timing["16"]
]
```

sorted explicitly by:

```text
position
```

This matters because positions change during the race.

---

# 50. Null Policy

Formula Delta uses `null` for known fields whose value is currently unavailable.

Example:

```js
bestLap: null
```

Use absence/`undefined` primarily when a property does not belong to that structure or during internal partial updates.

Do not mix `null`, empty string and `undefined` randomly.

---

# 51. Boolean Policy

Boolean values must preserve three-state situations where necessary.

Example:

```js
rainfall: false
```

means:

> Weather data reports no rainfall.

Whereas:

```js
rainfall: null
```

means:

> Rainfall information is not currently known.

---

# 52. Empty String Policy

Empty upstream strings should normally not propagate into the domain.

Depending on field semantics:

```text
""
```

should become:

```text
null
```

or a semantic state.

Exceptions must be documented.

---

# 53. Number Policy

Convert numeric strings to numbers when:

* arithmetic is meaningful;
* precision is safe;
* units are understood.

Example:

```text
"37"
↓
37
```

Do not convert identifiers simply because they contain digits.

Example:

```text
driverId = "04"
```

should not automatically become:

```text
4
```

---

# 54. Time Policy

Human-readable timing and calculable timing may coexist.

Prefer:

```js
{
  milliseconds: 83281,
  display: "1:23.281"
}
```

over forcing every consumer to repeatedly parse:

```text
"1:23.281"
```

---

# 55. Timestamp Policy

Absolute timestamps should use a consistent machine representation.

Preferred internal representation:

```text
Unix milliseconds
```

unless implementation reveals a stronger requirement.

Human-readable ISO strings belong primarily at boundaries/logging/presentation.

---

# 56. Immutable vs Mutable State

The conceptual domain model does not mandate full deep immutability inside the backend.

Performance and implementation simplicity may justify controlled mutation in the State Manager.

However:

* ownership must be clear;
* emitted frontend messages must not expose mutable references;
* tests must remain deterministic.

Frontend Zustand updates should follow React-compatible state practices.

---

# 57. Delta Model

Internal normalized deltas may differ from complete domain entities.

Example:

```js
{
  driverId: "16",
  gapToLeader: {
    type: "time",
    milliseconds: 4812,
    display: "+4.812"
  }
}
```

This does not imply all other `TimingEntry` fields are null.

It means:

> Only this field changed.

This distinction is fundamental.

---

# 58. Null vs Missing in Deltas

Consider:

```js
{
  bestLap: null
}
```

versus:

```js
{}
```

They may mean different things.

Potential semantics:

```text
property absent
→ no update

property present with null
→ explicitly clear value
```

Topic-specific behavior must determine whether this rule applies.

---

# 59. State Snapshot

A complete Formula Delta snapshot sent to a newly connected client may conceptually look like:

```js
{
  protocolVersion: 1,

  session: {},
  drivers: {},
  timing: {},
  stints: {},
  track: {},
  raceControl: [],
  weather: {},
  capabilities: {},
  connection: {}
}
```

This is Formula Delta's snapshot.

It is not the raw Formula 1 initial subscription response.

---

# 60. Frontend Contracts

Frontend components should receive meaningful domain values.

Example:

```js
timing.gapToLeader.display
```

rather than:

```js
TimingData.Lines["16"].GapToLeader
```

The latter is forbidden outside the upstream integration boundary.

---

# 61. Shared Contracts

Stable domain constants required by both applications may live in:

```text
packages/shared/
```

Examples:

```text
session types
track states
compound names
connection states
WebSocket message types
protocol version
```

Avoid moving every backend structure into shared merely because it could theoretically be imported.

---

# 62. Runtime Validation

Because Formula Delta consumes an unstable external source, runtime validation is useful at critical boundaries.

Potential validation points:

```text
raw protocol extraction
        ↓
normalized domain
        ↓
frontend protocol
```

Validation strategy should balance:

* safety;
* performance;
* implementation complexity.

Do not validate every high-frequency nested value multiple times without reason.

---

# 63. Unknown Values

Enums from an external system must always have an unknown fallback.

Example:

```js
normalizeTrackStatus(rawStatus)
```

must be able to return:

```text
unknown
```

rather than throwing because Formula 1 introduced a new status.

---

# 64. Raw Value Diagnostics

When useful, normalization failures should retain raw values in diagnostics.

Example:

```text
Unknown track status: "9"
```

This helps protocol maintenance.

The raw value does not need to become part of the frontend model.

---

# 65. Source Metadata

Most UI entities do not need to carry their source topic.

Avoid structures such as:

```js
{
  position: 3,
  sourceTopic: "TimingData"
}
```

everywhere.

Source authority belongs in documentation and normalization logic.

Add provenance only where it materially matters, particularly for derived/estimated values.

---

# 66. Official vs Derived

Formula Delta must preserve the distinction:

```text
UPSTREAM / OFFICIAL TIMING DATA
```

versus:

```text
FORMULA DELTA CALCULATION
```

Examples of upstream data:

```text
position
official gap
compound
Race Control message
```

Examples of derived data:

```text
5-lap average
gap trend
degradation estimate
approximate circuit progress
```

The UI should be able to communicate this distinction when necessary.

---

# 67. State Growth

Current state must remain bounded.

Dangerous examples:

```js
timingUpdates.push(event)
```

forever.

Or:

```js
weatherHistory.push(event)
```

for every update without limit.

Historical information should have an explicit retention strategy.

---

# 68. Event History Retention

Some histories naturally remain small enough for a complete session:

```text
Race Control
pit events
stints
Team Radio metadata
```

High-frequency histories require bounded storage:

```text
telemetry
positions
gap samples
```

Retention rules belong with each feature.

---

# 69. Session Reset

When a new session begins, Formula Delta must not accidentally preserve state from the previous session.

Conceptually:

```text
Race
  ↓
Session Ends
  ↓
New Qualifying/Practice/Race
  ↓
New Session State
```

The State Manager requires an explicit session-reset strategy.

Exact session identity rules depend on observed data.

---

# 70. Reconnect vs Session Reset

These are different events.

```text
NETWORK DISCONNECT
```

should normally preserve/reconcile the current session.

```text
NEW SESSION
```

should create a new session state.

Do not infer a new session simply because the WebSocket reconnects.

---

# 71. Replay Compatibility

Given the same recording and parser version:

```text
Recording
    ↓
ReplaySource
    ↓
Parser
    ↓
Normalizer
    ↓
State Manager
```

should reconstruct the same domain state deterministically.

This property is central to Formula Delta testing.

---

# 72. Model Evolution

The domain model will evolve.

Changes should be classified.

## Additive

Example:

```js
weather.visibilityKm
```

Low risk.

## Semantic

Example:

changing what `tyreAge` means.

High risk and requires documentation/tests.

## Breaking

Example:

changing:

```js
gapToLeader
```

from object to string.

Requires protocol/version consideration.

---

# 73. Avoid Premature Generalization

Do not create generic abstractions such as:

```text
MotorsportParticipant
VehicleSessionEntity
GenericTimingMetric
```

Formula Delta is an F1 application.

Use Formula 1 domain terminology when it makes the model easier to understand.

---

# 74. Avoid Raw Mirroring

Likewise, do not create:

```js
{
  Lines: {},
  Stints: {},
  Withheld: false
}
```

simply because the upstream payload uses those names.

The domain model exists specifically to prevent that coupling.

---

# 75. Example Current Race State

A simplified Formula Delta state might eventually resemble:

```js
{
  session: {
    eventName: "Example Grand Prix",
    sessionType: "race",
    status: "live",

    lap: {
      current: 37,
      total: 53
    }
  },

  drivers: {
    "4": {
      id: "4",
      racingNumber: "4",
      abbreviation: "NOR",
      fullName: "Lando Norris",
      team: {
        name: "McLaren",
        color: "FF8000"
      }
    }
  },

  timing: {
    "4": {
      driverId: "4",
      position: 1,

      gapToLeader: {
        type: "leader",
        milliseconds: 0,
        display: "LEADER"
      },

      intervalToAhead: null,

      lastLap: {
        milliseconds: 83281,
        display: "1:23.281",
        valid: true
      },

      pit: {
        inPit: false,
        pitOut: false,
        stopCount: 1
      }
    }
  },

  stints: {
    "4": [
      {
        number: 2,
        compound: "MEDIUM",
        startLap: 24,
        endLap: null,
        currentTyreAge: 14,
        newTyre: true
      }
    ]
  },

  track: {
    status: "green"
  },

  raceControl: [],

  weather: {
    airTemperatureC: 24.8,
    trackTemperatureC: 38.1,
    humidityPercent: 61,
    rainfall: false
  },

  capabilities: {
    timing: true,
    tyres: true,
    raceControl: true,
    weather: true,
    teamRadio: false,
    carTelemetry: false,
    livePosition: false
  },

  connection: {
    status: "live",
    error: null
  }
}
```

This example demonstrates intended relationships.

It is not yet the final JavaScript schema.

---

# 76. Model Validation Checklist

Before introducing a new domain field, ask:

1. What does this value mean?
2. What upstream source provides it?
3. Is the source verified?
4. Is it current state or event history?
5. Is it official or derived?
6. What does `null` mean?
7. Can the value change?
8. Does the frontend genuinely need it?
9. Does it require historical retention?
10. What happens if F1 stops providing it?

If these questions cannot be answered, the field may not yet belong in the stable domain model.

---

# 77. Data Model Success Criteria

The model is successful when:

* React does not depend on raw F1 structures;
* protocol changes are isolated;
* timing calculations use consistent units;
* missing data has explicit semantics;
* official and derived values remain distinguishable;
* current state and event history remain distinct;
* optional capabilities fit naturally;
* replay reconstructs the same structures as live;
* the model remains understandable without studying the F1 protocol.

---

# 78. Central Data Model Principle

> **Formula Delta models the race, not the feed.**

The upstream protocol is only one way of obtaining information.

The domain model should describe what Formula Delta understands about the session in stable Formula 1 concepts.
