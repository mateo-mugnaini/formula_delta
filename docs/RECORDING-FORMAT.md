# Formula Delta — Recording Format

## 1. Purpose

This document defines how **Formula Delta** records Formula 1 timing sessions for later replay, development, debugging and protocol analysis.

Recordings are a core architectural capability.

They allow Formula Delta to:

- replay previously captured sessions;
- develop without a live Formula 1 session;
- reproduce parser bugs;
- test state reconstruction;
- investigate protocol changes;
- build realistic fixtures;
- compare parser versions;
- validate future Formula Delta releases.

The recording format should remain simple, append-friendly and inspectable.

---

# 2. Core Principle

Formula Delta records upstream events as close as practical to the raw protocol boundary.

```text id="0xyvfc"
Formula 1
    │
    ▼
LiveSource
    │
    ▼
RawEvent
    │
    ├────────────► Recorder
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

The Recorder must operate before application interpretation can destroy information.

---

# 3. What Is Recorded

The primary recording contains:

```text id="ug5q7e"
RAW FORMULA DELTA EVENTS
```

A raw Formula Delta event contains:

- topic;
- original upstream payload;
- Formula Delta reception timing;
- optional upstream timestamp;
- minimal source metadata required for replay/debugging.

It does not contain React state.

---

# 4. What Is Not the Primary Recording

Do not use the following as the authoritative session recording:

```text id="pxu42f"
Zustand state
frontend WebSocket messages
rendered timing rows
derived analytics
TV-delayed events
```

These can be regenerated from raw events.

---

# 5. Why Record Raw Events

Suppose Formula Delta incorrectly interprets:

```text id="m9hzru"
TimingAppData
```

and calculates tyre age incorrectly.

If only normalized state was recorded:

```text id="8ed2fw"
Raw F1 Data
    X
Wrong Normalization
    ↓
Recording
```

the original information may be lost.

With raw recording:

```text id="exs82r"
Recording
    │
    ▼
Fixed Parser
    │
    ▼
Fixed Normalization
    │
    ▼
Correct State
```

Old sessions remain useful after bugs are fixed.

---

# 6. Format

Initial session event format:

```text id="unpp4a"
JSON Lines
```

File extension:

```text id="rj50g8"
.jsonl
```

Each line is one complete JSON object.

Example:

```text id="hw3kz2"
{"type":"event",...}
{"type":"event",...}
{"type":"event",...}
```

---

# 7. Why JSONL

JSONL is appropriate because it is:

- append-friendly;
- streamable;
- human inspectable;
- simple in Node.js;
- easy to process incrementally;
- resilient to incomplete final writes;
- compatible with large recordings.

A complete recording does not need to be loaded into RAM.

---

# 8. Recording Directory

Default local location:

```text id="fktw1c"
recordings/
```

Conceptually:

```text id="vrrt9i"
recordings/
├── 2026-italian-gp-race/
├── 2026-singapore-gp-qualifying/
└── ...
```

Exact naming is an implementation detail.

---

# 9. Recording Package

A recording should preferably be represented by a directory rather than a single isolated file.

Example:

```text id="2vk74u"
recordings/
└── 2026-italian-gp-race/
    ├── metadata.json
    └── events.jsonl
```

Future optional files could include:

```text id="grs15p"
diagnostics.json
summary.json
```

without changing the event stream format.

---

# 10. metadata.json

`metadata.json` describes the recording.

Conceptual example:

```json id="guyhd5"
{
  "formatVersion": 1,
  "createdAt": "2026-09-18T18:42:31.412Z",

  "application": {
    "name": "Formula Delta",
    "version": "0.1.0"
  },

  "source": {
    "type": "live",
    "access": "anonymous"
  },

  "session": {
    "eventName": "Italian Grand Prix",
    "sessionName": "Race",
    "sessionType": "race",
    "year": 2026
  },

  "recording": {
    "status": "completed"
  }
}
```

The final schema will depend on information reliably available during recording.

---

# 11. Metadata vs Event Data

Metadata contains information describing the recording as a whole.

Events contain time-ordered upstream data.

Do not repeatedly store:

```text id="1eqzfc"
eventName
sessionName
applicationVersion
```

on every event unless required for recovery.

---

# 12. Recording Format Version

Every recording must identify its format version.

Initial:

```json id="t7u3nb"
{
  "formatVersion": 1
}
```

This version describes:

```text id="pvyg0c"
Formula Delta recording structure
```

not:

```text id="z03jkg"
Formula 1 protocol version
```

because Formula 1 may not expose a meaningful protocol version.

---

# 13. Event Envelope

Conceptual event:

```json id="g7h5nr"
{
  "type": "event",
  "sequence": 18422,
  "elapsedMs": 183420,
  "receivedAt": 1758210205123,
  "topic": "TimingData",
  "payload": {}
}
```

Fields may be adjusted after Phase 0.

---

# 14. type

`type` distinguishes recording entries.

Primary value:

```text id="2kszvs"
event
```

Potential additional values:

```text id="af9psf"
system
marker
```

These should only be introduced when useful.

---

# 15. sequence

`sequence` is a monotonically increasing recording-local integer.

Example:

```text id="f67lr1"
1
2
3
4
...
```

Benefits:

- preserves explicit ordering;
- simplifies debugging;
- detects malformed/truncated recordings;
- helps deterministic tests.

Sequence starts at:

```text id="iw4cqa"
1
```

for each recording.

---

# 16. elapsedMs

`elapsedMs` represents elapsed recording time since the recording's reference start.

Example:

```text id="aw8ar7"
event 1 → 0
event 2 → 127
event 3 → 241
event 4 → 1082
```

Replay primarily uses this value for scheduling.

---

# 17. Why Relative Time

Replay should reproduce event spacing.

Example recording:

```text id="8kvau1"
A @ 0ms
B @ 500ms
C @ 1700ms
```

At:

```text id="md07yy"
1x
```

replay approximately emits:

```text id="0b76yj"
A @ 0ms
B @ 500ms
C @ 1700ms
```

At:

```text id="shm8tr"
2x
```

approximately:

```text id="yn7fbk"
A @ 0ms
B @ 250ms
C @ 850ms
```

---

# 18. Monotonic Timing

Relative recording timing should preferably be derived from a monotonic clock.

Reason:

system wall clock can change because of:

- synchronization;
- manual clock changes;
- operating-system adjustments.

Conceptually:

```text id="ny3gd4"
monotonic clock
→ elapsedMs

wall clock
→ receivedAt
```

---

# 19. receivedAt

`receivedAt` is the wall-clock timestamp when Formula Delta received the event.

Preferred representation:

```text id="2nhhy9"
Unix milliseconds
```

Example:

```json id="vqavw6"
{
  "receivedAt": 1758210205123
}
```

This is useful for:

- diagnostics;
- correlation;
- human investigation.

Replay timing should primarily use `elapsedMs`.

---

# 20. Upstream Timestamp

If the upstream event provides a meaningful timestamp, preserve it separately.

Potential:

```json id="d73kzv"
{
  "sourceTimestamp": "2026-09-18T18:42:30.932Z"
}
```

Do not overwrite:

```text id="0ynr16"
receivedAt
```

with upstream time.

They represent different clocks.

---

# 21. topic

`topic` preserves the upstream Formula 1 topic.

Example:

```json id="3jvlnp"
{
  "topic": "TimingData"
}
```

Possible values:

```text id="99dsuy"
TimingData
TimingAppData
DriverList
RaceControlMessages
WeatherData
CarData.z
Position.z
```

Recordings intentionally preserve upstream topic names because they exist before normalization.

---

# 22. payload

`payload` should preserve the upstream topic payload as faithfully as practical.

Example:

```json id="un8zba"
{
  "type": "event",
  "sequence": 18422,
  "elapsedMs": 183420,
  "receivedAt": 1758210205123,
  "topic": "TimingData",
  "payload": {
    "Lines": {
      "16": {
        "Position": "3"
      }
    }
  }
}
```

Do not rename:

```text id="nob1br"
Position
```

to:

```text id="31e0om"
position
```

inside the raw recording.

That is normalization.

---

# 23. How Raw Is "Raw"?

The recording boundary is:

```text id="2k14ik"
decoded SignalR topic event
```

rather than necessarily:

```text id="z8uvui"
raw WebSocket bytes
```

This means Formula Delta may already have:

- processed SignalR framing;
- identified the topic;
- extracted the topic payload.

But it should not yet have applied F1 domain normalization.

This provides a practical balance between fidelity and replay usability.

---

# 24. Transport Capture

Raw WebSocket frames are not part of normal session recordings.

They may be captured separately during protocol discovery when required.

Example:

```text id="8c5b82"
tools/f1-probe/captures/
```

Normal replay should not need to emulate SignalR framing.

---

# 25. Compressed Topics

For `.z` topics, the recording strategy requires special care.

Preferred default:

```text id="28rnbg"
preserve the upstream encoded payload
```

before Formula Delta decompression.

Example:

```json id="1m3qeg"
{
  "topic": "CarData.z",
  "payload": "BASE64_OR_OTHER_RAW_VALUE"
}
```

Replay then exercises:

```text id="cdywqx"
recorded compressed payload
        │
        ▼
decompression
        │
        ▼
parser
```

This allows decompression bugs to be reproduced.

---

# 26. Optional Decoded Diagnostics

During discovery, decoded `.z` samples may also be stored separately for human inspection.

They are not authoritative recording data.

The raw encoded event remains the source of truth.

---

# 27. Recording Start

A recording may begin:

- before the Formula 1 session starts;
- during the session;
- after connecting mid-session.

The metadata must not imply that every recording contains the complete session.

Potential metadata:

```json id="o1ynwd"
{
  "recording": {
    "startedMidSession": true
  }
}
```

Only include this if it can be determined reliably.

---

# 28. Initial Snapshot Recording

If subscription produces an initial upstream snapshot, record it.

This is essential for replaying a recording that starts mid-session.

Conceptually:

```text id="vzrgvm"
Recording starts on Lap 37
        │
        ▼
Initial upstream snapshot recorded
        │
        ▼
Replay can reconstruct Lap 37 state
```

---

# 29. Recording Stop

Normal recording shutdown should:

1. stop accepting new events;
2. flush pending writes;
3. close the JSONL stream;
4. update metadata;
5. mark the recording completed.

---

# 30. Recording Status

Potential metadata status:

```text id="3nt7jv"
recording
completed
incomplete
failed
```

A recording that survives an application crash may remain:

```text id="07il4e"
incomplete
```

and still be useful.

---

# 31. Crash Resilience

JSONL naturally improves crash resilience.

Suppose:

```text id="i9ldpl"
Line 1 ✓
Line 2 ✓
Line 3 ✓
Line 4 partial
CRASH
```

Lines 1–3 remain usable.

Replay should detect and report the malformed final line rather than rejecting the entire recording automatically.

---

# 32. Partial Final Line

If the final JSONL line is incomplete:

```text id="h28wcf"
valid
valid
valid
{"type":"event","sequ
```

the loader may:

```text id="kl8x0p"
warn
+
ignore final incomplete line
```

if it is clearly the result of interrupted writing.

Malformed lines in the middle of a recording require stronger warnings.

---

# 33. Write Strategy

The Recorder should use streaming append writes.

Avoid:

```js id="1t4b7k"
const events = []

events.push(...)

fs.writeFile(
  JSON.stringify(events)
)
```

at session end.

A Formula 1 session can run for hours.

Use a write stream.

---

# 34. Backpressure

File writes may theoretically become slower than incoming data.

The Recorder must respect Node.js stream backpressure.

Conceptually:

```text id="6ivajg"
event
  │
  ▼
write()
  │
  ├── accepted → continue
  │
  └── backpressure → wait for drain
```

Recording reliability is more important than blindly writing without control.

---

# 35. Recorder Failure

If disk writing fails:

```text id="11ik3j"
ENOSPC
permission failure
I/O error
```

the live dashboard should preferably continue if possible.

Architecture:

```text id="2i6y0e"
Recorder failed
      │
      ├── report recording failure
      │
      └── live timing continues
```

Recording is core functionality, but it should not unnecessarily destroy the live session display.

---

# 36. Disk Space

Formula Delta should eventually expose recording size and/or disk failures clearly.

Do not attempt automatic deletion of old recordings without explicit user behavior.

Recordings are user data.

---

# 37. System Events

Some Formula Delta lifecycle events may be useful in recordings.

Potential example:

```json id="gr0z5a"
{
  "type": "system",
  "sequence": 18423,
  "elapsedMs": 183921,
  "event": "upstream-disconnected",
  "payload": {
    "reason": "..."
  }
}
```

Potential system events:

```text id="u8g4fd"
upstream-connected
upstream-disconnected
upstream-reconnecting
upstream-reconnected
subscription-complete
```

These should be minimal and clearly distinguishable from Formula 1 data.

---

# 38. Why Record System Events

They can explain gaps such as:

```text id="00i5bg"
TimingData
TimingData
      │
      │ 18 seconds missing
      │
TimingData
```

With lifecycle events:

```text id="gx17mi"
TimingData
upstream-disconnected
upstream-reconnected
TimingData
```

the recording becomes much easier to diagnose.

---

# 39. System Events and Replay

System events do not necessarily affect Formula Delta race state.

Replay may use them for:

- diagnostics;
- connection simulation;
- development testing.

Normal replay UI does not need to reproduce fake network failures unless specifically testing that behavior.

---

# 40. Markers

A future discovery tool may allow manual markers.

Example:

```json id="9un8qa"
{
  "type": "marker",
  "sequence": 19221,
  "elapsedMs": 245100,
  "label": "Safety Car deployed"
}
```

Markers are optional developer metadata.

They must not alter replay state.

---

# 41. Metadata Completion

Some session metadata may not be known when recording begins.

Therefore `metadata.json` may be created initially with partial information and updated as session information becomes available.

Example:

Start:

```json id="dylrzs"
{
  "session": {
    "eventName": null
  }
}
```

Later:

```json id="16d6un"
{
  "session": {
    "eventName": "Italian Grand Prix"
  }
}
```

---

# 42. Metadata Atomicity

Metadata updates should avoid leaving invalid JSON after a crash.

Potential strategy:

```text id="gj6o61"
write metadata.tmp
      │
      ▼
rename atomically
      │
      ▼
metadata.json
```

Exact implementation depends on platform behavior.

---

# 43. Recording Identity

Every recording should have a stable local identifier.

Potential:

```text id="p4v8br"
2026-09-18-italian-gp-race
```

or generated ID.

Human-readable directory names are useful.

Do not rely exclusively on event names because duplicate sessions or multiple recordings may exist.

---

# 44. Directory Naming

Potential convention:

```text id="bbbr25"
YYYY-MM-DD_event_session_HH-mm-ss
```

Example:

```text id="2gqmxj"
2026-09-06_italian-grand-prix_race_15-00-12
```

Exact convention should be implemented once session metadata behavior is known.

---

# 45. Filename Safety

Event names must be sanitized before becoming filesystem paths.

Do not allow upstream strings to create:

```text id="1c87pa"
../
/
\
:
```

or other unsafe filesystem behavior.

---

# 46. ReplaySource

ReplaySource reads:

```text id="it5wtf"
metadata.json
events.jsonl
```

and emits the same raw event abstraction expected from `LiveSource`.

Conceptually:

```text id="knpwnr"
events.jsonl
      │
      ▼
ReplaySource
      │
      ▼
RawEvent
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

---

# 47. Replay Must Not Bypass Parsing

Forbidden:

```text id="i5yxt8"
Recording
    │
    ▼
Frontend
```

Forbidden:

```text id="0hlr42"
Recording
    │
    ▼
Precomputed Zustand State
```

Required:

```text id="f2q9y4"
Recording
    │
    ▼
same parser
    │
    ▼
same normalization
    │
    ▼
same state reconstruction
```

This is what makes recordings valuable for regression testing.

---

# 48. Replay Scheduling

ReplaySource uses `elapsedMs`.

For two events:

```text id="2cf53g"
A elapsedMs = 1000
B elapsedMs = 1300
```

difference:

```text id="yap5im"
300ms
```

At `1x`:

```text id="o6xru5"
300ms
```

At `2x`:

```text id="s07i8l"
150ms
```

At `0.5x`:

```text id="y36szd"
600ms
```

---

# 49. Replay Speed

Initial target speeds:

```text id="p8p8ht"
0.5x
1x
2x
5x
10x
```

Replay scheduling should derive timing from original event timestamps rather than repeatedly modifying stored events.

---

# 50. Replay Drift

A naive implementation:

```text id="ojqdyj"
await sleep(delta)
emit()
await sleep(delta)
emit()
```

can accumulate timing drift.

Preferred scheduling should calculate against a replay clock/reference time.

Conceptually:

```text id="ypn6bg"
target emission time
-
current replay time
=
remaining delay
```

Exact implementation belongs to ReplaySource.

---

# 51. Pause

When replay pauses:

```text id="47z0ja"
no new recording events emitted
```

Resume must continue from the same logical replay position.

Pause duration must not alter recorded timing.

---

# 52. Restart

Restart should:

1. stop current scheduling;
2. reset replay position;
3. reset Formula Delta session state;
4. replay from the beginning.

Do not retain stale state from the previous replay run.

---

# 53. Replay Completion

When the final valid event is emitted:

```text id="ocqgc0"
REPLAY COMPLETED
```

Replay state should transition cleanly.

The final reconstructed session state may remain visible.

---

# 54. Seeking

Arbitrary seek is not required initially.

Why?

To seek correctly to:

```text id="9w92e2"
45:00
```

Formula Delta must reconstruct all relevant deltas before that time or maintain checkpoints.

Naively jumping directly to the event at 45 minutes would produce incomplete state.

---

# 55. Future Replay Checkpoints

If seek becomes important, Formula Delta may introduce periodic normalized state checkpoints.

Conceptually:

```text id="p86ovr"
Raw Events
0m ───────── 10m ───────── 20m ───────── 30m

     Snapshot     Snapshot     Snapshot
```

Seeking could then:

```text id="qu8n2r"
load nearest checkpoint
        │
        ▼
replay deltas until target
```

Checkpoints would be an optimization.

Raw events remain authoritative.

---

# 56. Determinism

Given:

```text id="cugf9f"
same recording
same parser version
same normalization logic
same state reducer
```

Formula Delta should reconstruct equivalent session state.

Wall-clock scheduling differences should not affect domain results.

---

# 57. TV Delay and Recording

TV delay must not alter recording timestamps.

Correct:

```text id="6mdvt3"
RawEvent
   │
   ├────► Recorder
   │
   ▼
Presentation Delay
```

Incorrect:

```text id="luep89"
RawEvent
   │
   ▼
12s delay
   │
   ▼
Recorder
```

---

# 58. Replay and TV Delay

Replay already controls presentation timing.

Applying TV delay during replay is normally unnecessary.

The architecture should either:

- disable TV synchronization controls during replay; or
- clearly define their interaction.

Preferred initial behavior:

```text id="56gmm8"
LIVE
→ TV delay available

REPLAY
→ replay timing controls available
→ TV delay disabled
```

This keeps timing semantics understandable.

---

# 59. Recording and Application Versions

Metadata should preserve Formula Delta version information where available.

Example:

```json id="l1thtv"
{
  "application": {
    "version": "0.3.0"
  }
}
```

Potential future:

```json id="h1ng5d"
{
  "gitCommit": "..."
}
```

Git commit metadata is useful for developer builds but not required.

---

# 60. Why Version Information Matters

A recording may expose a bug only in an older parser.

Knowing:

```text id="ft5m95"
recorded with Formula Delta 0.2
```

helps reproduce historical behavior.

The recording itself should still be replayable by newer versions when format compatibility allows.

---

# 61. Format Compatibility

ReplaySource must inspect:

```text id="z14n0h"
formatVersion
```

before replay.

If supported:

```text id="92vh2n"
load
```

If unsupported:

```text id="gg5gt7"
fail clearly
```

Do not silently interpret an incompatible format.

---

# 62. Format Migration

If a future recording format changes, options include:

```text id="4lpfm5"
read old versions directly
```

or:

```text id="2vkdh1"
explicit migration tool
```

Do not rewrite users' original recordings automatically.

---

# 63. Recording Integrity

Replay should perform basic integrity checks.

Potential checks:

- metadata exists;
- supported format version;
- events file exists;
- valid JSONL;
- valid sequence progression;
- non-decreasing `elapsedMs`;
- known entry type.

Warnings may be sufficient for recoverable issues.

---

# 64. elapsedMs Ordering

Expected:

```text id="4v1k2n"
0
103
103
281
942
```

Equal timestamps are valid.

Decreasing timestamps:

```text id="x5rrxe"
942
812
```

should produce a warning or validation failure depending on severity.

---

# 65. Sequence Validation

Expected:

```text id="tbzm4l"
1
2
3
4
```

A gap:

```text id="waw06j"
1
2
4
```

should be reported.

It may indicate:

- corrupted recording;
- dropped event;
- intentionally filtered capture.

The recording metadata may eventually distinguish full recordings from sampled captures.

---

# 66. Recording Type

Metadata may identify:

```text id="78yjcr"
full
sample
fixture
```

Example:

```json id="m8xj7j"
{
  "recording": {
    "type": "full"
  }
}
```

Replay intended for race reproduction should normally require:

```text id="rlij81"
full
```

---

# 67. Fixtures vs Recordings

They serve related but different purposes.

## Recording

Represents a sequence of events over time.

```text id="75l40v"
recordings/
```

## Fixture

Represents targeted test input.

```text id="8tuz3x"
fixtures/timing-data/
```

A fixture may be extracted from a recording.

---

# 68. Fixture Extraction

Preferred workflow:

```text id="7pgogz"
Live Session
    │
    ▼
Recording
    │
    ▼
Identify Interesting Event
    │
    ▼
Extract Fixture
    │
    ▼
Regression Test
```

Example:

```text id="4udocb"
Safety Car timing delta
→ fixture
→ state reconstruction test
```

---

# 69. Privacy

Formula Delta recordings contain motorsport timing information rather than personal user data under normal operation.

Nevertheless:

- do not record unnecessary request headers;
- do not record cookies;
- do not record authentication tokens;
- do not record local filesystem information inside events.

Protocol debugging captures require additional care.

---

# 70. Credentials

If upstream authentication is ever introduced for optional functionality:

```text id="6w21hn"
credentials
tokens
cookies
```

must never be stored in `events.jsonl`.

Recording format must remain safe to share for debugging where possible.

---

# 71. Recording Size

Actual recording size must be measured during Phase 0.

Important variables:

- session duration;
- TimingData frequency;
- CarData.z availability;
- Position.z availability;
- raw payload size.

Do not introduce compression until measurements justify it.

---

# 72. Future Compression

If recordings become large, possible future formats include:

```text id="d92o1s"
events.jsonl.gz
```

or similar streamable compression.

Compression must not be introduced at the cost of making debugging unnecessarily difficult before it is needed.

---

# 73. Recording Discovery

Backend should eventually be able to list local recordings by reading metadata.

Conceptually:

```text id="pbhd5i"
GET /recordings
```

may return:

```json id="9a91en"
[
  {
    "id": "...",
    "eventName": "Italian Grand Prix",
    "sessionName": "Race",
    "date": "2026-09-06",
    "durationMs": 5421000,
    "status": "completed"
  }
]
```

Exact API belongs to backend implementation documentation.

---

# 74. Recording Summary

When a recording completes, metadata may include useful summary information:

```json id="67n4bz"
{
  "recording": {
    "status": "completed",
    "eventCount": 184221,
    "durationMs": 5421000,
    "sizeBytes": 28492131
  }
}
```

These values can be calculated at completion.

---

# 75. Topic Summary

Metadata or an optional summary file may contain:

```json id="f0aix2"
{
  "topics": {
    "TimingData": 12481,
    "TimingAppData": 143,
    "WeatherData": 31,
    "RaceControlMessages": 28
  }
}
```

This is useful for:

- discovery;
- debugging;
- selecting recordings for tests.

It is not required to replay the session.

---

# 76. Recording Lifecycle

Conceptually:

```text id="7y31r6"
IDLE
 │
 ▼
STARTING
 │
 ▼
RECORDING
 │
 ├────► FAILED
 │
 ▼
STOPPING
 │
 ▼
COMPLETED
```

The exact state machine may remain internal.

---

# 77. Automatic Recording

Formula Delta should strongly consider recording live sessions automatically once the live source becomes operational.

Reason:

The most valuable protocol event is often the one that was not expected.

If recording must be manually enabled after something strange happens, the useful raw event has already been lost.

---

# 78. Automatic Recording Policy

Potential initial behavior:

```text id="vgcyp5"
Live session connection established
        │
        ▼
Recording automatically starts
```

with a user setting to disable recording if desired.

This should be finalized during implementation.

---

# 79. Failed Session Connection

Do not create endless empty recording directories for every failed connection attempt.

A recording should become persistent once meaningful session data begins arriving or once explicitly requested for protocol debugging.

---

# 80. Multiple Browser Clients

Recording belongs to the backend source, not the frontend.

Therefore:

```text id="7tq81w"
Browser A
Browser B
Browser C
     │
     ▼
one backend
     │
     ▼
one live recording
```

Opening another tab must not create another recording of the same upstream connection.

---

# 81. Recording Ownership

The Recorder consumes the source event stream.

It does not depend on:

- WebSocket clients;
- frontend presence;
- active dashboard route.

A race can continue recording even if the browser is closed.

---

# 82. Replay Ownership

Replay is also backend-owned.

The backend controls:

- event scheduling;
- speed;
- pause;
- restart;
- state reset.

The frontend sends commands and renders resulting state.

---

# 83. Example metadata.json

A more complete conceptual example:

```json id="dyj0ss"
{
  "formatVersion": 1,

  "id": "2026-09-06_italian-grand-prix_race_15-00-12",

  "createdAt": "2026-09-06T13:00:12.412Z",

  "application": {
    "name": "Formula Delta",
    "version": "0.1.0"
  },

  "source": {
    "type": "live",
    "access": "anonymous"
  },

  "session": {
    "year": 2026,
    "eventName": "Italian Grand Prix",
    "sessionName": "Race",
    "sessionType": "race",
    "location": "Monza",
    "country": "Italy"
  },

  "recording": {
    "type": "full",
    "status": "completed",
    "eventCount": 184221,
    "durationMs": 5421000,
    "sizeBytes": 28492131
  },

  "topics": {
    "SessionInfo": 1,
    "SessionStatus": 4,
    "DriverList": 1,
    "TimingData": 12481,
    "TimingAppData": 143,
    "LapCount": 53,
    "TrackStatus": 8,
    "RaceControlMessages": 28,
    "WeatherData": 31
  }
}
```

All values are illustrative.

---

# 84. Example events.jsonl

Conceptually:

```jsonl id="osj1z3"
{"type":"event","sequence":1,"elapsedMs":0,"receivedAt":1788709212412,"topic":"SessionInfo","payload":{"...":"..."}}
{"type":"event","sequence":2,"elapsedMs":4,"receivedAt":1788709212416,"topic":"DriverList","payload":{"...":"..."}}
{"type":"event","sequence":3,"elapsedMs":7,"receivedAt":1788709212419,"topic":"TimingData","payload":{"...":"..."}}
{"type":"event","sequence":4,"elapsedMs":132,"receivedAt":1788709212544,"topic":"TimingData","payload":{"...":"..."}}
```

The actual payload must remain valid JSON rather than placeholder strings.

---

# 85. Replay Example

```text id="q4pcdr"
metadata.json
events.jsonl
      │
      ▼
Validate Recording
      │
      ▼
ReplaySource
      │
      ▼
event #1
      │
      ▼
Parser → Normalizer → State
      │
      ▼
wait according to elapsedMs
      │
      ▼
event #2
      │
      ▼
Parser → Normalizer → State
      │
      ▼
...
```

---

# 86. Recording Tests

Test:

- directory creation;
- metadata creation;
- event serialization;
- sequence generation;
- elapsed timing;
- stream flush;
- normal close;
- incomplete recording recovery;
- malformed final line;
- disk write failure;
- topic counting;
- metadata completion.

---

# 87. Replay Tests

Test:

- metadata validation;
- unsupported format version;
- event ordering;
- `1x`;
- `2x`;
- `0.5x`;
- pause;
- resume;
- restart;
- completion;
- malformed event;
- incomplete final line;
- deterministic final state.

---

# 88. Integration Test

A critical test should eventually perform:

```text id="2h9ilb"
fixture recording
      │
      ▼
ReplaySource
      │
      ▼
real parser
      │
      ▼
real normalizer
      │
      ▼
real State Manager
      │
      ▼
expected final state
```

This exercises most of Formula Delta's backend pipeline without internet access.

---

# 89. Golden Recordings

A small number of carefully selected recordings may become long-term regression assets.

Examples:

```text id="n0z9em"
normal race segment
pit stop
Safety Car
red flag
qualifying
malformed/reconnect scenario
```

Full race recordings may be too large for the Git repository.

Small extracted recordings are preferable for automated tests.

---

# 90. Git Policy

Do not commit large full-session recordings by default.

Potential structure:

```text id="h2qgm5"
recordings/
→ ignored by Git

fixtures/
→ committed when small and useful
```

The exact `.gitignore` policy should reflect this.

---

# 91. Recording Portability

A recording directory should be portable.

Copying:

```text id="zph4kq"
2026-italian-gp-race/
```

to another Formula Delta installation should be sufficient for replay, assuming the recording format version is supported.

Avoid absolute filesystem references inside metadata.

---

# 92. Human Inspectability

A developer should be able to run:

```text id="v4uc44"
open events.jsonl
```

and understand approximately what happened.

This is a feature.

Avoid opaque binary formats until a concrete performance requirement outweighs this benefit.

---

# 93. Recording Format Checklist

Before adding a field to every recorded event, ask:

1. Is it required for replay?
2. Is it required for ordering?
3. Is it required for debugging?
4. Can it instead live in metadata?
5. Does it significantly increase recording size?
6. Can it contain sensitive information?
7. Can it be reconstructed later?

If the field has no strong reason to exist, do not add it.

---

# 94. Recording Success Criteria

The recording system is successful when:

- live events are persisted without blocking normal processing;
- parser bugs can be reproduced later;
- replay uses the same processing pipeline as live;
- recordings remain useful after parser improvements;
- TV delay does not contaminate source timing;
- interrupted recordings remain partially recoverable;
- full recordings can be processed without loading them entirely into memory;
- format compatibility is explicit;
- recordings contain no unnecessary credentials;
- small realistic fixtures can be extracted from them.

---

# 95. Central Recording Principle

> **Record what Formula Delta received, not what Formula Delta believed it meant.**

Interpretation can improve.

The original event cannot be recovered if it was never preserved.
