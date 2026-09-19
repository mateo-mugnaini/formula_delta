# Formula Delta — F1 Live Timing Protocol

## 1. Purpose

This document describes how Formula Delta communicates with the Formula 1 Live Timing infrastructure.

It covers:

* connection discovery;
* SignalR negotiation;
* WebSocket transport;
* hub protocol;
* topic subscription;
* initial state;
* incremental updates;
* timestamps;
* compressed `.z` topics;
* heartbeat;
* disconnects;
* reconnection;
* protocol discovery;
* raw event capture.

Formula 1 Live Timing is treated as an unofficial and unstable upstream dependency.

This document must evolve from **research assumptions** into **observed protocol documentation** during Phase 0.

## Phase 0 Implementation Status

An independent discovery probe is available at `tools/f1-probe/`. It tests
negotiation, WebSocket framing, the SignalR handshake, subscription attempts,
and raw message capture. Its default subscription shape is experimental.
Until a live run produces evidence, endpoint behavior in this document remains
a working assumption rather than an implementation contract.

### Observed — 2026-09-19

`POST /signalrcore/negotiate?negotiateVersion=1` responded with HTTP 200 and a
JSON object containing `negotiateVersion`, `connectionId`, `connectionToken`,
and `availableTransports`. The advertised transports included WebSockets,
Server-Sent Events, and Long Polling. The response does not by itself verify
the WebSocket handshake or hub subscription behavior.

A successful probe run then observed this sequence:

1. WebSocket connection accepted;
2. JSON SignalR handshake acknowledgement represented by `{}`;
3. `Subscribe` invocation accepted;
4. a completion message with `type: 3` and `result` containing a complete
   multi-topic snapshot.

The snapshot included `SessionInfo`, `SessionStatus`, `SessionData`,
`DriverList`, `TimingData`, `TimingAppData`, `TimingStats`, `LapCount`,
`TrackStatus`, `RaceControlMessages`, `WeatherData`, `TeamRadio`, `TopThree`,
`ExtrapolatedClock`, and `Heartbeat`. This confirms availability for that
captured completed Spanish Grand Prix session, but does not yet establish
continuous live-session availability or the semantics of every topic.

A subsequent probe attempt was rejected before WebSocket establishment with a
network error. Connection behavior therefore still requires repeated-session
testing and reconnect investigation. The probe now performs bounded reconnect
attempts with exponential backoff, but no successful recovery sequence has yet
been observed and this behavior is not a production protocol decision.

---

# 2. Evidence Levels

Every significant protocol statement should eventually be classified as one of:

```text id="96knc1"
OBSERVED
RESEARCHED
INFERRED
EXPERIMENTAL
UNKNOWN
```

## OBSERVED

Directly observed using Formula Delta tooling.

Example:

```text id="z7pnyf"
OBSERVED

TimingData was received anonymously during the
2026 Italian Grand Prix race.
```

---

## RESEARCHED

Behavior documented by existing implementations or technical research but not yet reproduced by Formula Delta.

---

## INFERRED

Behavior inferred from payloads or protocol structure.

Must not be treated as guaranteed.

---

## EXPERIMENTAL

Behavior under active investigation.

---

## UNKNOWN

Insufficient evidence exists.

---

# 3. Upstream Endpoint

The currently expected Formula 1 Live Timing SignalR Core endpoint is conceptually:

```text id="7rsftw"
https://livetiming.formula1.com/signalrcore
```

with WebSocket communication using:

```text id="kk8vx9"
wss://livetiming.formula1.com/signalrcore
```

This must be verified during Phase 0.

Endpoints must not be scattered throughout the codebase.

Use centralized configuration.

---

# 4. Expected Connection Flow

The expected connection lifecycle is:

```text id="61quzp"
Formula Delta
     │
     ▼
HTTP Negotiate
     │
     ▼
Connection Metadata
     │
     ▼
WebSocket Connection
     │
     ▼
SignalR Handshake
     │
     ▼
Subscribe
     │
     ▼
Initial State
     │
     ▼
Incremental Updates
```

Each step must be observable independently during discovery.

---

# 5. Negotiation

Before establishing the WebSocket connection, SignalR Core may require an HTTP negotiation request.

Conceptually:

```text id="evz8ve"
POST /signalrcore/negotiate
```

The response may contain information such as:

```text id="z8p76h"
connectionId
connectionToken
availableTransports
```

Exact structure must be verified.

---

# 6. Negotiation Questions

Phase 0 must determine:

* HTTP method;
* query parameters;
* SignalR negotiation version;
* required headers;
* response structure;
* connection token behavior;
* token lifetime;
* supported transports;
* authentication behavior;
* failure responses.

Capture the negotiation response with sensitive values redacted if necessary.

---

# 7. WebSocket Connection

After negotiation, Formula Delta should establish a WebSocket connection using the negotiated connection information.

Conceptually:

```text id="wn7r5i"
NEGOTIATE
    │
    ▼
connectionToken
    │
    ▼
wss://.../signalrcore?id=<token>
```

Exact URL construction must be verified.

Do not manually duplicate behavior already correctly handled by a suitable maintained library unless direct protocol access provides a concrete advantage.

---

# 8. SignalR

Formula Delta is expected to communicate using ASP.NET Core SignalR semantics.

SignalR sits above WebSocket.

Conceptually:

```text id="hj0zvp"
Formula Delta
      │
      │ SignalR messages
      ▼
WebSocket
      │
      ▼
Formula 1
```

WebSocket is the transport.

SignalR defines higher-level communication behavior.

---

# 9. SignalR Handshake

After WebSocket establishment, a SignalR protocol handshake may be required.

Typical conceptual handshake:

```json id="txm8kq"
{
  "protocol": "json",
  "version": 1
}
```

The actual handshake and framing must be verified against the Formula 1 endpoint.

Do not assume generic SignalR examples exactly match Formula 1 behavior.

---

# 10. Message Framing

SignalR JSON messages may use a record separator character between protocol messages.

This is commonly represented as:

```text id="g6m2vx"
0x1E
```

Phase 0 must verify:

* whether Formula 1 uses standard SignalR framing;
* whether multiple messages can arrive in one WebSocket frame;
* whether partial protocol messages are possible at the transport level.

The parser must operate on SignalR messages, not assume one WebSocket frame equals one application event.

---

# 11. Hub

Formula 1 Live Timing historically exposes a hub responsible for streaming timing data.

The exact hub method names and invocation structure must be observed before being treated as stable.

Likely operations include concepts equivalent to:

```text id="nqu6om"
Subscribe
```

with a collection of requested topics.

---

# 12. Subscription

Formula Delta should explicitly subscribe only to topics it needs or is actively investigating.

Conceptual subscription:

```js id="4qxg43"
[
  'SessionInfo',
  'SessionStatus',
  'DriverList',
  'TimingData',
  'TimingAppData',
  'LapCount',
  'TrackStatus',
  'RaceControlMessages',
  'WeatherData'
]
```

Experimental subscriptions may include:

```js id="b3fka2"
[
  'TeamRadio',
  'CarData.z',
  'Position.z'
]
```

The exact invocation format must be captured during Phase 0.

---

# 13. Subscription Strategy

Do not blindly subscribe to every possible topic in production.

Reasons include:

* unnecessary traffic;
* recording size;
* processing overhead;
* unknown future topics;
* potentially restricted channels.

The Phase 0 probe may use broader subscriptions for discovery.

The production backend should use an intentional topic set.

---

# 14. Subscription Groups

It may be useful to define topic groups.

Conceptually:

```js id="xpxz4u"
const CORE_TOPICS = [
  'SessionInfo',
  'SessionStatus',
  'DriverList',
  'TimingData',
  'TimingAppData',
  'LapCount',
  'TrackStatus',
  'RaceControlMessages'
]
```

```js id="pvipym"
const SUPPORTING_TOPICS = [
  'SessionData',
  'TimingStats',
  'WeatherData',
  'ExtrapolatedClock',
  'TopThree',
  'Heartbeat'
]
```

```js id="qz42yp"
const EXPERIMENTAL_TOPICS = [
  'TeamRadio',
  'CarData.z',
  'Position.z'
]
```

Actual constants should be introduced only once implementation begins.

---

# 15. Initial State

After subscription, the server may provide an initial snapshot representing current session state.

This is critical.

If Formula Delta connects on lap 37, it should not have to wait until every driver's values change before reconstructing the race.

Conceptually:

```text id="95ts3d"
Subscribe
    │
    ▼
Initial Snapshot
    │
    ▼
Current State
    │
    ▼
Incremental Updates
```

Phase 0 must identify exactly how initial state is delivered.

---

# 16. Initial State Questions

Determine:

* whether all subscribed topics appear;
* whether initial state arrives in one response;
* whether it arrives through normal streaming events;
* whether topics can be missing;
* whether initial state is complete;
* whether it has different structure from later updates;
* whether compressed topics behave differently.

This is a high-priority discovery item.

---

# 17. Incremental Updates

After initialization, Formula 1 is expected to send partial updates.

Conceptually:

```text id="48kx9f"
Initial State

Driver 1
position = 2
gap      = +3.2
tyre     = M

        ↓

Delta

gap = +2.9

        ↓

Current State

position = 2
gap      = +2.9
tyre     = M
```

Formula Delta must reconstruct state rather than replace it blindly.

---

# 18. Protocol Layer vs State Layer

The protocol layer should identify:

```text id="51lmxb"
topic
payload
timestamp
message metadata
```

It should not perform all domain merging itself.

Conceptually:

```text id="utj9br"
SignalR
   ↓
Protocol Decoder
   ↓
RawEvent
   ↓
Topic Parser
   ↓
Normalizer
   ↓
State Manager
```

This separation allows protocol transport changes without rewriting state logic.

---

# 19. Raw Event Contract

The target raw-event representation is conceptually:

```js id="6zrwzm"
{
  receivedAt: 1758210205123,
  source: 'live',
  topic: 'TimingData',
  payload: {}
}
```

Additional metadata may be required after discovery.

Possible additions:

```text id="b0kwb7"
sequence
serverTimestamp
connectionId
rawMessageType
```

Only add metadata with a concrete use.

---

# 20. Reception Timestamp

`receivedAt` represents when Formula Delta received the event.

Prefer a consistent clock.

For persisted timestamps, wall-clock Unix milliseconds are useful.

For accurate relative replay timing, a monotonic timer may also be useful during recording.

Potential design:

```js id="bktvef"
{
  receivedAt: 1758210205123,
  elapsedMs: 18342
}
```

The recording specification will define this formally.

---

# 21. Server Timestamps

Some Formula 1 messages may include server/session timestamps.

Do not confuse:

```text id="egv1n8"
server event time
Formula Delta reception time
recording elapsed time
presentation time
```

They serve different purposes.

---

# 22. Time Model

Conceptually:

```text id="wz0u18"
F1 Event Time
      │
      ▼
Formula Delta Reception Time
      │
      ▼
Recording Relative Time
      │
      ▼
Presentation Release Time
```

TV synchronization affects the final presentation stage.

It must not rewrite the original event timestamp.

---

# 23. Topic Extraction

Formula Delta must convert SignalR hub messages into topic events.

Conceptually:

```text id="4dw27p"
SignalR Hub Message

[
  "TimingData",
  { ...payload... },
  "timestamp"
]

        ↓

RawEvent

{
  topic: "TimingData",
  payload: {...}
}
```

The actual structure must be verified.

---

# 24. Unknown Message Types

The protocol decoder must tolerate unknown SignalR message types.

During discovery:

```text id="4f7hqk"
Unknown SignalR message
        │
        ├── log metadata
        └── optionally preserve raw message
```

Do not crash the connection solely because a new non-critical message type appears.

---

# 25. Unknown Topics

Likewise:

```text id="gvgcqp"
Known SignalR event
      │
      ▼
Unknown F1 topic
      │
      ├── count
      ├── report
      └── capture sample
```

Unknown topic does not equal malformed protocol.

---

# 26. `.z` Topics

Some high-frequency topics use names ending in:

```text id="43t9u2"
.z
```

Important candidates:

```text id="d98ry5"
CarData.z
Position.z
```

These require a specialized decoding pipeline.

---

# 27. Expected `.z` Pipeline

Historical implementations suggest a process conceptually similar to:

```text id="9zsw0k"
SignalR Payload
      │
      ▼
Base64 Decode
      │
      ▼
Compressed Bytes
      │
      ▼
Decompression
      │
      ▼
JSON / Structured Payload
```

The exact compression format and encoding must be verified.

Do not hardcode a decompression algorithm solely from historical assumptions.

---

# 28. `.z` Isolation

Compressed-topic handling should live in a dedicated module.

Conceptually:

```text id="op1apc"
f1/
├── protocol/
├── topics/
└── compression/
```

Do not mix decompression logic into generic timing parsers.

---

# 29. Decompression Failure

If:

```text id="x5z9zk"
CarData.z
```

fails to decode:

```text id="j5o3mi"
log diagnostic
      ↓
mark telemetry degraded/unavailable
      ↓
continue core timing
```

A telemetry decoding failure must not terminate the race dashboard.

---

# 30. High-Frequency Topics

High-frequency topics may require different handling from ordinary timing events.

Potential concerns:

* CPU;
* decompression;
* memory;
* recording size;
* frontend bandwidth;
* render frequency.

Formula Delta should separate:

```text id="ygnz6a"
ingestion frequency
```

from:

```text id="sjnk9r"
presentation frequency
```

For example, telemetry could theoretically be ingested at several updates per second while the UI receives a reduced frequency.

Do not implement downsampling until actual frequency is measured.

---

# 31. Heartbeat

The upstream service may send heartbeat information.

Phase 0 must determine whether heartbeat is:

* a subscribed topic;
* a SignalR-level event;
* required to keep the connection alive;
* merely informational.

Do not implement fake keepalive traffic unless protocol evidence requires it.

---

# 32. Connection Health

Formula Delta should maintain its own connection status independent of F1 topic data.

Possible states:

```text id="pxi8k6"
IDLE
NEGOTIATING
CONNECTING
CONNECTED
SUBSCRIBING
LIVE
RECONNECTING
DISCONNECTED
FAILED
```

The final state model may simplify these.

---

# 33. Disconnect Detection

Disconnects may be detected through:

* WebSocket close;
* transport error;
* failed heartbeat;
* timeout;
* SignalR close message.

Phase 0 should identify actual behavior.

---

# 34. Reconnection

Reconnection must be expected.

Conceptual lifecycle:

```text id="fd68ku"
LIVE
 │
 ▼
DISCONNECTED
 │
 ▼
WAIT
 │
 ▼
NEGOTIATE
 │
 ▼
CONNECT
 │
 ▼
SUBSCRIBE
 │
 ▼
REBUILD STATE
 │
 ▼
LIVE
```

Do not assume an old connection token remains valid.

---

# 35. Backoff

Reconnect attempts should use controlled backoff.

Conceptual example:

```text id="i9ozml"
1s
2s
5s
10s
20s
```

with a reasonable upper bound.

Exact values are implementation decisions.

Avoid both:

* immediate infinite retry loops;
* excessively long recovery delays.

---

# 36. Jitter

Randomized jitter is often useful for large distributed systems.

Formula Delta normally has one local client.

Therefore elaborate jitter strategies are probably unnecessary.

Do not introduce complexity without need.

---

# 37. Reconnection State Recovery

After reconnecting, Formula Delta must determine whether the server provides a new current snapshot.

Preferred behavior:

```text id="5yt4ne"
Reconnect
    │
    ▼
Subscribe
    │
    ▼
Fresh Snapshot
    │
    ▼
Replace/reconcile upstream state
```

This must be tested.

Do not assume missed deltas can simply be ignored.

---

# 38. State Epoch

If reconnection produces a fresh snapshot, Formula Delta may need a concept similar to a state epoch.

Example:

```text id="ntw7xr"
Connection 1
    │
    X
Connection 2
    │
    ▼
Fresh Snapshot
```

Old queued deltas must not corrupt the new state.

The exact mechanism should be designed after observing reconnect behavior.

---

# 39. Recording Across Reconnects

A recording should preserve reconnect information when useful.

Potential diagnostic event:

```json id="w2c4um"
{
  "type": "system",
  "event": "reconnected",
  "elapsedMs": 412312
}
```

Whether lifecycle events belong in the recording format will be decided in `RECORDING-FORMAT.md`.

Raw Formula 1 events remain the priority.

---

# 40. Subscription Failure

A topic subscription may fail because of:

* authentication;
* permissions;
* protocol changes;
* removed topic;
* server behavior.

Optional topic failure should result in capability degradation.

Example:

```text id="d8bz56"
Position.z → rejected
        │
        ▼
livePosition = false
```

Core-topic failure requires stronger visibility.

---

# 41. Authentication

Formula Delta's core architecture assumes no paid or private authentication requirement.

If Formula 1 requires authentication for optional topics:

```text id="5ncf0a"
Optional topic unavailable
```

is acceptable.

Formula Delta must not require users to bypass authentication restrictions.

---

# 42. HTTP 401 / 403

Authentication or authorization failures should be treated explicitly.

Example:

```text id="q81nyu"
403
 │
 ▼
classify failure
 │
 ├── optional capability → disable
 │
 └── core connection → surface clear error
```

Do not hammer the endpoint repeatedly after a deterministic authorization failure.

---

# 43. Rate Limits

Formula 1 may impose undocumented rate limits.

The application should minimize unnecessary:

* negotiations;
* reconnects;
* subscriptions;
* HTTP requests.

Formula Delta should maintain one upstream connection where practical.

Multiple browser tabs should normally share the backend connection rather than each opening a Formula 1 connection.

---

# 44. One Upstream, Multiple Local Clients

Preferred architecture:

```text id="e9esqp"
                Formula 1
                    │
                    │ one connection
                    ▼
            Formula Delta Backend
                │       │
                │       │
                ▼       ▼
             Browser  Browser
```

Avoid:

```text id="3g0v6x"
Browser → F1
Browser → F1
Browser → F1
```

This centralizes protocol handling and reduces upstream load.

---

# 45. Protocol Probe

Phase 0 uses a dedicated probe.

Location:

```text id="w0rjip"
tools/f1-probe/
```

Its responsibilities differ from production ingestion.

The probe may:

* print raw messages;
* subscribe broadly;
* collect statistics;
* inspect unknown topics;
* dump representative payloads;
* measure update frequency.

Production code should be quieter and stricter.

---

# 46. Probe Output

The probe should eventually report:

```text id="2x9jq7"
Connection

Negotiation        OK
WebSocket          OK
SignalR Handshake  OK
Subscription       OK

Topics

TimingData              12,481
TimingAppData              143
WeatherData                 31
RaceControlMessages         28
CarData.z                    0
Position.z                   0

Unknown Topics               1

Disconnects                  1
Reconnects                   1
```

---

# 47. Topic Metrics

For each topic, the probe should attempt to measure:

```text id="1u3l4m"
first seen
last seen
message count
average frequency
peak frequency
approximate payload size
```

This information will help later performance decisions.

---

# 48. Sample Capture

The probe should allow representative samples to be captured without recording millions of redundant messages.

Potential strategy:

```text id="4l3ehp"
first N messages
+
periodic samples
+
schema changes
+
manual capture
```

Full raw session recording is a separate capability.

---

# 49. Schema Discovery

During Phase 0, the probe may recursively inspect object paths.

Example output:

```text id="66u1nq"
TimingData.Lines.*.Position
TimingData.Lines.*.GapToLeader
TimingData.Lines.*.IntervalToPositionAhead
TimingData.Lines.*.LastLapTime
TimingData.Lines.*.Sectors
```

This can help identify real schemas.

Do not generate production models directly from one observed payload.

---

# 50. Schema Change Detection

A useful future diagnostic capability is detecting previously unseen field paths.

Example:

```text id="90vt44"
NEW FIELD DETECTED

Topic:
TimingData

Path:
Lines.*.SomeNewField
```

This is valuable because the upstream protocol is undocumented.

It is not required for the first probe implementation but should remain a design consideration.

---

# 51. Partial/Malformed Messages

The decoder should distinguish:

```text id="0vlvq6"
invalid SignalR framing
invalid JSON
unknown SignalR message
known topic with unexpected payload
valid partial delta
```

These are different failure categories.

A sparse delta is not malformed merely because expected fields are absent.

---

# 52. Defensive JSON Handling

Never assume:

```js id="uy5qun"
message.arguments[0][1].Lines
```

always exists.

Protocol extraction should validate intermediate structures.

Prefer explicit extraction and failure classification.

---

# 53. Ordering

Formula Delta initially assumes transport ordering is meaningful.

Phase 0 should verify whether additional sequence information exists.

If events include server timestamps or sequence identifiers, preserve them.

Do not reorder events based solely on wall-clock timestamps without evidence.

---

# 54. Duplicate Events

Reconnects or server behavior may produce duplicate information.

The system should tolerate repeated state updates.

Event histories such as Race Control may require explicit deduplication.

Deduplication rules must be topic-aware.

---

# 55. Protocol Logging

Normal logs should include lifecycle events.

Example:

```text id="j7xur8"
[f1] negotiating
[f1] websocket connected
[f1] signalr handshake complete
[f1] subscribed: 14 topics
[f1] live
```

Failures:

```text id="9u9g73"
[f1] websocket closed code=...
[f1] reconnecting attempt=2 delay=5000ms
```

Do not print every TimingData event by default.

---

# 56. Debug Logging

A debug mode may allow topic-specific logging.

Conceptually:

```text id="0v78om"
DEBUG_F1_TOPICS=TimingData,RaceControlMessages
```

The exact configuration is not yet defined.

Debug tooling must avoid accidentally producing enormous logs for high-frequency topics.

---

# 57. Raw Payload Preservation

When a parser fails, Formula Delta should preserve enough information to reproduce the problem.

Possible mechanisms:

* existing session recording;
* bounded error sample;
* fixture capture.

Avoid dumping unlimited malformed payloads to disk.

---

# 58. Protocol Tests

Protocol tests should cover:

* SignalR framing;
* multiple messages in one frame;
* handshake parsing;
* hub event extraction;
* topic extraction;
* unknown message types;
* malformed JSON;
* compressed payload decoding;
* reconnect state handling where practical.

Tests should primarily use fixtures.

---

# 59. Network Tests

A small set of tests/tools may require live network access.

They must not be the primary automated test suite.

Core tests should remain deterministic and offline.

---

# 60. Dependency Strategy

Before implementing SignalR manually, evaluate existing maintained JavaScript libraries.

A library is preferable when it:

* supports the required SignalR Core protocol;
* exposes enough lifecycle control;
* allows required headers/configuration;
* does not hide necessary topic payloads;
* behaves correctly with Formula 1's implementation.

Manual protocol implementation is justified only if existing libraries cannot satisfy Formula Delta's requirements or significantly obstruct discovery.

---

# 61. Protocol Boundary

The rest of Formula Delta should receive:

```text id="igjs8i"
RawEvent
```

not:

```text id="ud4x2z"
SignalR InvocationMessage
```

SignalR must stop at the F1 protocol boundary.

---

# 62. Protocol Version Drift

Formula 1 may change:

* endpoint;
* negotiation;
* authentication;
* hub method;
* topic names;
* message shape;
* compression;
* availability.

When this occurs:

```text id="rj7vg4"
Observe failure
     ↓
Capture evidence
     ↓
Compare with fixtures
     ↓
Update protocol layer
     ↓
Update tests
     ↓
Update documentation
```

Avoid patching frontend behavior around protocol failures.

---

# 63. Discovery Session Record

Every significant live investigation should record metadata.

Example:

```text id="c38vzs"
Date:
2026-09-XX

Event:
TBD

Session:
Race

Access:
Anonymous

Probe:
v0.1

Endpoint:
...

Result:
...
```

This belongs in either discovery notes or the relevant data-source documentation.

---

# 64. Phase 0 Protocol Checklist

The initial probe must answer:

### Connection

* Does negotiation succeed anonymously?
* Does WebSocket connection succeed?
* What headers are required?
* What SignalR protocol/version is used?

### Subscription

* What method subscribes to topics?
* Does one request subscribe to multiple topics?
* Which topics are accepted?

### Initial State

* How is the initial state delivered?
* Is it complete?
* Does it differ structurally from later deltas?

### Updates

* What is the hub update format?
* How are topics identified?
* Are timestamps included?

### Compression

* Are `.z` topics accessible?
* How are they encoded?
* How are they decompressed?

### Reliability

* What happens on disconnect?
* Can the client reconnect?
* Is a new negotiation required?
* Is a fresh snapshot received?

### Authentication

* Which topics work anonymously?
* Which return authorization failures?

### Timing

* What event frequencies are observed?
* Which timestamps are available?

---

# 65. Protocol Success Criteria

The Formula Delta protocol layer is successful when:

* upstream SignalR behavior is isolated;
* connection lifecycle is observable;
* subscription behavior is documented;
* raw topic events can be extracted reliably;
* reconnects do not require restarting Formula Delta;
* optional authorization failures degrade gracefully;
* compressed topics are isolated;
* protocol changes can be reproduced through captured fixtures;
* no React code understands SignalR.

---

# 66. Central Protocol Principle

> **Formula Delta should understand enough of the Formula 1 protocol to consume it reliably, but the rest of Formula Delta should not need to know that protocol exists.**

The protocol boundary protects the application from the most unstable dependency in the system.
