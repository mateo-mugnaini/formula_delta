# Formula Delta — Data Sources

## 1. Purpose

This document catalogs the external Formula 1 timing data that Formula Delta may consume.

Its objectives are to document:

* available upstream topics;
* expected information contained in each topic;
* how Formula Delta intends to use that information;
* whether the topic is required or optional;
* expected update behavior;
* known uncertainties;
* Phase 0 verification requirements;
* fallback behavior when data is unavailable.

Formula 1 Live Timing is an unofficial and potentially unstable upstream dependency from Formula Delta's perspective.

Therefore this document must distinguish between:

```text
OBSERVED
DOCUMENTED
INFERRED
EXPERIMENTAL
UNKNOWN
UNAVAILABLE
```

No upstream behavior should be considered guaranteed simply because it existed historically.

---

# 2. Primary Data Source

Formula Delta's primary live source is the Formula 1 Live Timing infrastructure.

Conceptually:

```text
Formula 1 Live Timing
        │
        ▼
SignalR / WebSocket
        │
        ▼
Formula Delta LiveSource
```

The exact connection and transport details are documented separately in:

```text
docs/PROTOCOL.md
```

---

# 3. Data Source Policy

Formula Delta follows these rules when consuming external data.

## Rule 1 — No Paid Dependency

The core application must not require a paid API.

---

## Rule 2 — Anonymous Availability Must Be Verified

Historical availability does not guarantee current anonymous availability.

Phase 0 must test every relevant topic.

---

## Rule 3 — Missing Topics Must Degrade Gracefully

If an optional topic is unavailable:

```text
Topic unavailable
      │
      ▼
Capability disabled
      │
      ▼
Relevant UI hidden/degraded
      │
      ▼
Main dashboard continues
```

---

## Rule 4 — Preserve Unknown Data

Unknown fields should not automatically be discarded during discovery.

They may become useful later.

---

## Rule 5 — Real Payloads Beat Assumptions

When captured data contradicts this document, captured behavior should be investigated and the documentation updated.

---

# 4. Topic Classification

Formula Delta classifies topics as:

### Core

Important to the main timing dashboard.

### Supporting

Useful for context but not sufficient alone to justify application failure.

### Optional

Useful feature that may not always be available.

### Experimental

Availability or semantics are uncertain enough that the application must not depend on them.

---

# 5. Topic Overview

Initial expected topics:

| Topic                 | Classification | Primary Use                  |
| --------------------- | -------------- | ---------------------------- |
| `SessionInfo`         | Core           | Event/session metadata       |
| `SessionStatus`       | Core           | Session lifecycle            |
| `SessionData`         | Supporting     | Session events/context       |
| `DriverList`          | Core           | Driver/team metadata         |
| `TimingData`          | Core           | Classification and timing    |
| `TimingAppData`       | Core           | Tyres and stints             |
| `TimingStats`         | Supporting     | Additional timing statistics |
| `LapCount`            | Core           | Current/total laps           |
| `TrackStatus`         | Core           | Green/yellow/SC/VSC/red      |
| `RaceControlMessages` | Core           | Official race messages       |
| `WeatherData`         | Supporting     | Track/weather conditions     |
| `ExtrapolatedClock`   | Supporting     | Session clock                |
| `TopThree`            | Supporting     | Top-three summary            |
| `TeamRadio`           | Optional       | Radio events/audio metadata  |
| `Heartbeat`           | Supporting     | Connection/session timing    |
| `CarData.z`           | Experimental   | High-frequency car telemetry |
| `Position.z`          | Experimental   | Car position coordinates     |

This table must be updated after Phase 0 observations.

---

# 6. SessionInfo

## Classification

```text
CORE
```

## Purpose

Provides information describing the current Formula 1 event and session.

Potential information includes:

* meeting/event name;
* circuit;
* country;
* session name;
* session type;
* session start/end;
* meeting identifiers;
* session identifiers.

Formula Delta uses this topic to construct the session header and recording metadata.

---

## Potential Internal Mapping

```text
SessionInfo
      │
      ▼
session.eventName
session.sessionName
session.sessionType
session.location
session.country
session.startTime
```

Exact mapping must follow observed payloads.

---

## Update Frequency

Expected to be:

```text
LOW
```

Most information should remain stable throughout a session.

---

## Phase 0 Questions

Verify:

* initial snapshot availability;
* field structure;
* timestamp format;
* whether fields change during session;
* whether session identifiers are stable;
* whether circuit/location metadata is sufficient.

---

# 7. SessionStatus

## Classification

```text
CORE
```

## Purpose

Represents the current lifecycle state of the session.

Potential values may represent states such as:

```text
Inactive
Started
Finished
Finalised
Ends
```

Exact values must be observed.

Formula Delta should normalize these into stable internal states.

---

## Use

Possible UI:

```text
RACE
LIVE

LAP 37 / 53
```

or:

```text
QUALIFYING
FINISHED
```

---

## Phase 0 Questions

Verify:

* all observed status values;
* transitions;
* timing of transitions;
* whether red flags affect this topic or only TrackStatus;
* final session behavior.

---

# 8. SessionData

## Classification

```text
SUPPORTING
```

## Purpose

Potentially provides additional session-level events and status information.

Its exact role must be confirmed through captured data.

Do not duplicate information already modeled more reliably from another topic unless there is a reason.

---

## Phase 0 Questions

Determine:

* payload structure;
* relationship to `SessionStatus`;
* relationship to `RaceControlMessages`;
* whether it contains unique useful information;
* update semantics.

---

# 9. DriverList

## Classification

```text
CORE
```

## Purpose

Provides driver metadata.

Expected information may include:

* racing number;
* abbreviation;
* first name;
* last name;
* full name;
* team name;
* team colour;
* broadcast name;
* headshot URL or similar metadata.

---

## Internal Mapping

Conceptually:

```js
{
  racingNumber: '1',
  abbreviation: 'VER',
  firstName: 'Max',
  lastName: 'Verstappen',
  fullName: 'Max Verstappen',
  team: '...',
  teamColor: '...'
}
```

Not all fields are guaranteed.

---

## Identity

Formula Delta should use a stable identifier internally.

The likely candidate is racing number within a session.

This assumption must be verified.

Do not use display name as the primary identifier.

---

## Phase 0 Questions

Verify:

* key structure;
* racing-number representation;
* team colour format;
* late driver updates;
* substitute drivers;
* whether metadata changes during session;
* whether initial snapshot is complete.

---

# 10. TimingData

## Classification

```text
CORE
```

## Importance

`TimingData` is expected to be one of Formula Delta's most important topics.

It potentially drives the primary timing tower.

---

## Expected Information

Potential fields include:

* current position;
* gap to leader;
* interval to car ahead;
* last lap time;
* best lap time;
* sector times;
* mini-sector information;
* speed traps;
* pit status;
* pit-out status;
* number of pit stops;
* retired state;
* stopped state;
* personal-best indicators.

Exact fields must be verified.

---

## Primary UI Mapping

```text
P
DRIVER
GAP
INTERVAL
LAST
SECTORS
PIT
STATUS
```

---

## Update Frequency

Expected:

```text
HIGH
```

TimingData may update many times during a lap.

Frontend design must assume frequent changes.

---

# 11. TimingData Delta Behavior

TimingData is expected to use partial updates.

Example:

Current state:

```js
{
  position: 4,
  gapToLeader: '+8.231',
  intervalToAhead: '+1.142',
  lastLap: '1:24.121'
}
```

Possible incoming update:

```js
{
  intervalToAhead: '+0.982'
}
```

The application must preserve the other fields.

---

## Phase 0 Priority

This is one of the highest-priority topics for understanding merge semantics.

Capture:

* initial state;
* normal racing updates;
* lap completion;
* position change;
* pit entry;
* pit exit;
* Safety Car;
* retirement if possible.

---

# 12. TimingData — Sectors

Potential timing information may include:

```text
Sector 1
Sector 2
Sector 3
```

with status information such as:

* personal best;
* overall/session best;
* normal;
* unavailable.

Formula Delta should normalize semantic status rather than exposing raw protocol markers to React.

Example:

```js
{
  sector1: {
    time: '28.412',
    status: 'personal-best'
  }
}
```

Exact status representation depends on observed payloads.

---

# 13. TimingData — Mini-Sectors

Mini-sector data may provide more granular progress through each sector.

Potential uses:

* visual sector progression;
* performance comparison;
* approximate circuit progress;
* Battle Mode.

Mini-sector behavior must be investigated carefully.

Questions:

* how many segments exist?
* are they circuit-dependent?
* what do status codes represent?
* when are segments reset?
* how frequently do they update?

Mini-sectors are valuable but should not block the basic timing tower.

---

# 14. TimingData — Speed Traps

Potential values may include speed measurements at circuit timing points.

Possible uses:

* driver detail;
* qualifying analysis;
* comparison.

They are not essential to the primary race dashboard.

Verify actual availability and naming.

---

# 15. TimingAppData

## Classification

```text
CORE
```

## Purpose

Expected to provide tyre and stint information.

This is critical for Formula Delta's strategy functionality.

---

## Expected Information

Potential fields include:

* stint number;
* tyre compound;
* new/used tyre;
* tyre age;
* total laps on tyre;
* stint start;
* stint history.

---

## Internal Mapping

Conceptually:

```js
{
  currentStint: 2,

  stints: [
    {
      number: 1,
      compound: 'MEDIUM',
      startLap: 1,
      endLap: 18
    },
    {
      number: 2,
      compound: 'HARD',
      startLap: 19,
      tyreAge: 12
    }
  ]
}
```

This is an internal target, not an assumption about raw structure.

---

# 16. Tyre Compounds

Formula Delta should normalize known compounds into:

```text
SOFT
MEDIUM
HARD
INTERMEDIATE
WET
UNKNOWN
```

Unknown future values must map safely to:

```text
UNKNOWN
```

while preserving the raw value for diagnostics where useful.

---

# 17. Tyre Age

Tyre age can be ambiguous depending on whether the tyre was previously used.

Formula Delta must determine whether upstream values represent:

* laps in current stint;
* total tyre laps;
* tyre age at stint start;
* another representation.

Do not derive tyre age incorrectly before Phase 0 evidence exists.

This is a specific investigation target.

---

# 18. TimingStats

## Classification

```text
SUPPORTING
```

## Purpose

Expected to contain additional timing statistics.

Potential information may include:

* best lap;
* best sectors;
* speed traps;
* session timing statistics.

Some information may overlap with `TimingData`.

---

## Architecture Rule

Do not duplicate state simply because two topics expose similar information.

After discovery, determine which source is authoritative for each internal field.

---

## Phase 0 Questions

Determine:

* unique fields;
* overlap with TimingData;
* update frequency;
* usefulness during race vs qualifying;
* snapshot/delta behavior.

---

# 19. LapCount

## Classification

```text
CORE
```

## Purpose

Provides race lap progress.

Expected information:

```text
CurrentLap
TotalLaps
```

or equivalent.

---

## UI

```text
LAP 37 / 53
```

---

## Phase 0 Questions

Verify:

* exact field names;
* formation-lap behavior;
* first-lap transition;
* red flag behavior;
* final lap;
* session types where LapCount is absent.

---

# 20. TrackStatus

## Classification

```text
CORE
```

## Purpose

Represents the current circuit/race control track state.

Potential states include:

```text
GREEN
YELLOW
DOUBLE YELLOW
VSC
VSC ENDING
SAFETY CAR
RED
```

Exact codes and meanings must be verified.

---

# 21. Track Status Normalization

Raw status codes must never reach UI components.

Example:

```text
Raw "4"
    │
    ▼
SAFETY_CAR
    │
    ▼
track-safety-car
```

The mapping belongs in the F1 ingestion/normalization layer.

---

# 22. Track Status Priority

Track status has high visual priority.

Changes such as:

```text
GREEN → VSC
GREEN → SAFETY CAR
GREEN → RED
```

should become explicit frontend events.

Ordinary timing updates must not visually overpower critical race-state changes.

---

# 23. RaceControlMessages

## Classification

```text
CORE
```

## Purpose

Provides official race control information.

Potential messages include:

* investigations;
* incidents noted;
* penalties;
* track limits;
* deleted lap times;
* yellow flags;
* Safety Car;
* VSC;
* red flags;
* DRS state;
* pit-lane information.

---

## Data Model

Race Control behaves primarily as event history rather than current state.

Conceptually:

```js
[
  {
    id: '...',
    timestamp: '...',
    category: '...',
    message: '...'
  }
]
```

---

# 24. Race Control Append Semantics

Special attention is required to avoid duplicating messages.

If upstream sends:

```text
Message 1
Message 2
```

followed by a delta containing:

```text
Message 3
```

Formula Delta should produce:

```text
Message 1
Message 2
Message 3
```

not replace the history.

If upstream resends previous entries, deduplication may be necessary.

Phase 0 must determine actual behavior.

---

# 25. Race Control Structured Information

Where practical, Formula Delta may extract structured metadata.

Example:

```js
{
  category: 'Penalty',
  driverNumber: '16',
  message: '...',
  lap: 31
}
```

The original message should still be preserved.

Do not over-parse free-form messages unless the structure is reliable.

---

# 26. WeatherData

## Classification

```text
SUPPORTING
```

## Expected Information

Potential values:

* air temperature;
* track temperature;
* humidity;
* pressure;
* rainfall;
* wind speed;
* wind direction.

---

## Internal Representation

Prefer numeric values where safe.

Example:

```js
{
  airTemperature: 24.8,
  trackTemperature: 38.1,
  humidity: 61,
  rainfall: false,
  windSpeed: 2.8,
  windDirection: 194
}
```

Units must be documented.

Never assume units without verification.

---

# 27. Weather Update Frequency

Expected to update much less frequently than timing.

The frontend should not treat weather as high-frequency state.

Phase 0 should measure approximate update cadence.

---

# 28. ExtrapolatedClock

## Classification

```text
SUPPORTING
```

## Purpose

Potentially provides session clock information that can continue locally between server updates.

Useful particularly for timed sessions such as:

```text
Practice
Qualifying
```

---

## Phase 0 Questions

Determine:

* payload structure;
* timestamp reference;
* extrapolation behavior;
* stopped clock behavior;
* red flag behavior;
* whether local extrapolation is necessary.

---

# 29. TopThree

## Classification

```text
SUPPORTING
```

## Purpose

Provides information about the leading drivers.

Much of this may overlap with `TimingData`.

---

## Policy

Do not make the timing tower depend on `TopThree`.

Investigate whether it contains unique presentation or timing information.

---

# 30. TeamRadio

## Classification

```text
OPTIONAL
```

## Purpose

Potentially provides metadata for team radio messages.

Expected information may include:

* driver;
* timestamp;
* audio path/URL.

---

## Potential Flow

```text
TeamRadio
    │
    ▼
Radio Event
    │
    ▼
Driver + timestamp + media reference
```

---

# 31. Team Radio Audio

The topic may expose a path rather than audio directly.

Phase 0 should determine:

* URL construction;
* whether authentication is required;
* media format;
* availability delay;
* browser playback compatibility;
* whether historical radio remains accessible.

Do not assume that receiving `TeamRadio` means audio playback is automatically available.

---

# 32. Team Radio Transcription

Automatic transcription is not part of the core data source.

Formula Delta will not introduce a paid transcription service.

Potential local transcription may be investigated separately in the future.

---

# 33. Heartbeat

## Classification

```text
SUPPORTING
```

## Purpose

Potential uses:

* connection health;
* server timing;
* diagnostics.

The application should determine whether heartbeat is required for protocol lifecycle or simply useful metadata.

---

# 34. CarData.z

## Classification

```text
EXPERIMENTAL
```

## Importance

Potentially provides high-frequency vehicle telemetry.

This is valuable but not required for Formula Delta's core purpose.

---

## Potential Data

May include:

* speed;
* RPM;
* gear;
* throttle;
* brake;
* DRS or active-aero state.

Exact channels must be verified.

---

# 35. CarData.z Compression

The `.z` suffix indicates that special decoding/decompression may be required.

Potential processing:

```text
Encoded Payload
      │
      ▼
Decode
      │
      ▼
Decompress
      │
      ▼
Telemetry Payload
```

The actual process must be determined from observed data and protocol research.

Do not implement speculative decoding without tests.

---

# 36. Car Telemetry Frequency

Expected frequency may be significantly higher than normal timing topics.

This has architectural implications for:

* CPU usage;
* WebSocket traffic;
* recording size;
* frontend rendering;
* storage.

If available, raw telemetry should not automatically be forwarded at full frequency to every React component.

Downsampling may eventually be appropriate.

---

# 37. CarData Capability

If unavailable:

```js
{
  carTelemetry: false
}
```

The application continues normally.

No placeholder fake telemetry should be generated.

---

# 38. Position.z

## Classification

```text
EXPERIMENTAL
```

## Purpose

Potentially provides relative car positions.

Possible information:

```text
X
Y
Z
Status
```

Exact semantics require verification.

---

# 39. Potential Track Map

If sufficiently accurate position data is available:

```text
Position.z
     │
     ▼
Position Parser
     │
     ▼
Normalized Coordinates
     │
     ▼
Track Map
```

This is not an MVP dependency.

---

# 40. Coordinate Questions

Phase 0 should determine:

* coordinate system;
* units;
* origin;
* orientation;
* update frequency;
* missing-driver behavior;
* pit-lane behavior;
* circuit-specific transformation requirements.

Do not assume coordinates map directly to screen pixels.

---

# 41. Position Capability

If unavailable:

```js
{
  livePosition: false
}
```

Formula Delta may later investigate approximate progress using timing/mini-sector data.

Approximate positions must not be presented as GPS positions.

---

# Phase 0 Observations — 2026-09-19

The first successful probe run connected anonymously to the expected endpoint
and received a completed-session snapshot after the `Subscribe` invocation.
Observed topics included:

- `SessionInfo`, `SessionStatus`, and `SessionData`;
- `DriverList`;
- `TimingData`, `TimingAppData`, and `TimingStats`;
- `LapCount` and `TrackStatus`;
- `RaceControlMessages`;
- `WeatherData`;
- `TeamRadio`;
- `TopThree`, `ExtrapolatedClock`, and `Heartbeat`.

This is evidence from one completed session. It does not yet prove live
availability, update frequency, delta semantics, or stable access to every
topic. The captured values were used to create small fixtures under
`fixtures/` while preserving the original upstream field names.

No delta behavior is claimed from this capture. A complete `result` object is
evidence of a snapshot response for this subscription, not proof that later
updates will have the same shape.

The same day, a second connection attempt failed before WebSocket
establishment. Repeated connection and reconnection tests remain required.

---

# 42. Unknown Topics

Formula 1 may expose topics not currently documented by Formula Delta.

The probe should report them.

Example:

```text
UNKNOWN TOPIC DETECTED

Name: SomeFutureTopic
Messages: 42
First Seen: 14:03:22
```

During discovery, representative raw payloads should be preserved.

Do not automatically subscribe to arbitrary unknown topics if doing so could create excessive traffic.

---

# 43. Topic Frequency Classification

After Phase 0, each topic should receive an approximate frequency classification.

Example:

```text
VERY LOW
LOW
MEDIUM
HIGH
VERY HIGH
```

Potential initial expectations:

| Topic               | Expected Frequency |
| ------------------- | ------------------ |
| SessionInfo         | Very Low           |
| DriverList          | Very Low           |
| SessionStatus       | Very Low           |
| LapCount            | Low                |
| WeatherData         | Low                |
| RaceControlMessages | Event-driven       |
| TimingAppData       | Low/Medium         |
| TimingData          | High               |
| CarData.z           | Very High          |
| Position.z          | Very High          |

These are expectations until measured.

---

# 44. Snapshot Classification

Each topic should eventually be classified as:

```text
SNAPSHOT
DELTA
APPEND
MIXED
UNKNOWN
```

Example target table:

| Topic               | Behavior     |
| ------------------- | ------------ |
| DriverList          | TBD          |
| TimingData          | Delta / TBD  |
| TimingAppData       | TBD          |
| RaceControlMessages | Append / TBD |
| WeatherData         | TBD          |
| CarData.z           | TBD          |

Phase 0 must replace `TBD` with observed behavior.

---

# 45. Data Authority

When multiple topics expose similar information, Formula Delta should define one preferred source.

Example future table:

| Domain Value  | Primary Source    | Fallback    |
| ------------- | ----------------- | ----------- |
| Position      | TimingData        | —           |
| Last Lap      | TimingData        | TimingStats |
| Best Lap      | TBD               | TBD         |
| Compound      | TimingAppData     | —           |
| Track State   | TrackStatus       | RaceControl |
| Session Clock | ExtrapolatedClock | SessionInfo |

Do not establish authority until the relevant behavior has been observed.

---

# 46. Missing Values

Formula Delta must distinguish between:

```text
0
false
empty string
null
undefined
not yet received
not supported
```

These values are not interchangeable.

Example:

```text
pitStops = 0
```

means something different from:

```text
pitStops = null
```

where the information may not yet be known.

---

# 47. Data Freshness

Some state may become stale if a topic stops updating.

Future capability/state models may need:

```js
{
  value: {},
  updatedAt: 1758210205123
}
```

for diagnostic purposes.

Not every frontend field needs to expose timestamps.

---

# 48. Session Types

Topic availability may differ between:

```text
Practice
Sprint Qualifying / Sprint Shootout
Sprint
Qualifying
Race
```

Phase 0 and later recordings should eventually cover multiple session types.

Do not assume race behavior applies identically to qualifying.

---

# 49. Development Priority

Topic implementation priority should follow product value.

## Priority A

```text
SessionInfo
SessionStatus
DriverList
TimingData
TimingAppData
LapCount
TrackStatus
RaceControlMessages
```

## Priority B

```text
WeatherData
ExtrapolatedClock
TimingStats
SessionData
TopThree
```

## Priority C

```text
TeamRadio
```

## Experimental

```text
CarData.z
Position.z
```

This ordering may change based on Phase 0 findings.

---

# 50. Phase 0 Capture Checklist

During a live discovery session, attempt to capture:

### Session startup

* initial connection;
* initial topic state;
* driver list;
* session status.

### Normal running

* timing updates;
* sectors;
* lap completion;
* gaps;
* intervals;
* weather.

### Position change

Capture if possible.

### Pit stop

Capture:

* pit entry;
* stop;
* pit exit;
* stint transition;
* tyre change.

### Track event

Capture if possible:

* yellow;
* VSC;
* Safety Car;
* red flag.

### Race Control

Capture several message categories.

### Session ending

Capture:

* final lap;
* chequered flag;
* session status transition;
* final timing state.

---

# 51. Data Source Status Matrix

This table should become the central Phase 0 result.

Initial status:

| Topic               | Required | Live Anonymous | Replay | Parsed | Normalized | Fixture |
| ------------------- | -------: | -------------- | ------ | ------ | ---------- | ------- |
| SessionInfo         |      Yes | TBD            | TBD    | No     | No         | No      |
| SessionStatus       |      Yes | TBD            | TBD    | No     | No         | No      |
| SessionData         |       No | TBD            | TBD    | No     | No         | No      |
| DriverList          |      Yes | TBD            | TBD    | No     | No         | No      |
| TimingData          |      Yes | TBD            | TBD    | No     | No         | No      |
| TimingAppData       |      Yes | TBD            | TBD    | No     | No         | No      |
| TimingStats         |       No | TBD            | TBD    | No     | No         | No      |
| LapCount            |      Yes | TBD            | TBD    | No     | No         | No      |
| TrackStatus         |      Yes | TBD            | TBD    | No     | No         | No      |
| RaceControlMessages |      Yes | TBD            | TBD    | No     | No         | No      |
| WeatherData         |       No | TBD            | TBD    | No     | No         | No      |
| ExtrapolatedClock   |       No | TBD            | TBD    | No     | No         | No      |
| TopThree            |       No | TBD            | TBD    | No     | No         | No      |
| TeamRadio           |       No | TBD            | TBD    | No     | No         | No      |
| Heartbeat           |       No | TBD            | TBD    | No     | No         | No      |
| CarData.z           |       No | TBD            | TBD    | No     | No         | No      |
| Position.z          |       No | TBD            | TBD    | No     | No         | No      |

Do not replace `TBD` with assumptions.

---

# 52. Evidence Standard

When updating this document after discovery, prefer statements such as:

```text
OBSERVED — 2026 Italian GP Race

TimingData was received anonymously throughout the session.
```

over:

```text
TimingData is always available.
```

One observed session proves that behavior occurred.

It does not prove permanent availability.

---

# 53. Observation Metadata

Important observations should identify context.

Example:

```text
Observed:
2026-09-XX

Event:
Italian Grand Prix

Session:
Race

Access:
Anonymous

Client:
Formula Delta F1 Probe v0.1
```

This allows future developers to understand how old an assumption is.

---

# 54. Historical Data

Historical completed sessions may be useful for:

* development;
* fixtures;
* parser testing;
* understanding topics unavailable anonymously live.

However:

```text
Historical availability
        ≠
Live anonymous availability
```

These must remain separate capability assessments.

---

# 55. External Libraries

Libraries such as FastF1 may be useful for:

* understanding historical data;
* validating interpretations;
* offline analytics.

They should not automatically become Formula Delta's live runtime dependency.

Formula Delta's core live architecture remains Node.js.

---

# 56. OpenF1

OpenF1 may be useful as:

* documentation/reference;
* historical comparison;
* development research.

Formula Delta must not rely on paid OpenF1 real-time access for its core live functionality.

The project requirement remains:

```text
€0
```

---

# 57. Fallback Philosophy

Formula Delta should prefer honest absence over fabricated information.

If data is unavailable:

```text
Unavailable
```

is preferable to estimating it unless the feature explicitly represents an estimate.

For derived values, the UI must make their calculated nature clear.

---

# 58. Data Source Success Criteria

The data-source layer is successful when:

* Formula Delta knows which capabilities are actually available;
* raw upstream changes remain isolated;
* missing topics do not break unrelated features;
* every core field has a known source;
* important topic semantics have fixtures;
* assumptions are documented;
* live and historical availability are not confused;
* optional telemetry remains optional.

---

# 59. Data Source Principle

The central rule for Formula Delta data is:

> **Never build a required product feature around data we have not verified we can reliably obtain.**

Formula Delta should expose everything useful that the source provides, while remaining functional when the source provides less than expected.
