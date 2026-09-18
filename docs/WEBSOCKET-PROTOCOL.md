# Formula Delta — WebSocket Protocol

## 1. Purpose

This document defines the WebSocket protocol used between the **Formula Delta backend** and **Formula Delta frontend**.

This protocol is completely independent from the Formula 1 Live Timing protocol.

The architectural boundary is:

```text
Formula 1
    │
    ▼
SignalR / F1 Protocol
    │
    ▼
Parser
    │
    ▼
Normalizer
    │
    ▼
State Manager
    │
    ▼
FORMULA DELTA WEBSOCKET PROTOCOL
    │
    ▼
Frontend
```

The frontend must never need to understand:

- SignalR;
- Formula 1 topic names;
- raw Formula 1 payloads;
- `.z` compression;
- upstream merge semantics.

---

# 2. Goals

The protocol should be:

### Stable

Upstream Formula 1 changes should not unnecessarily change this protocol.

### Small

Only useful application state should cross the connection.

### Incremental

Normal updates should not repeatedly send the entire session state.

### Recoverable

A newly connected or reconnected frontend must be able to reconstruct current state.

### Versioned

Breaking protocol changes must be detectable.

### Explicit

Messages should communicate intent through meaningful message types.

### Source Independent

The same protocol should work for:

```text
LIVE
REPLAY
```

and potentially future data sources.

---

# 3. Non-Goals

This protocol is not:

- a mirror of SignalR;
- a raw Formula 1 event stream;
- a database synchronization protocol;
- a public internet API;
- a permanent compatibility promise between arbitrary Formula Delta versions.

It is an internal application contract.

---

# 4. Transport

Formula Delta uses standard WebSocket communication between backend and frontend.

Conceptually:

```text
Browser
   │
   │ ws://localhost:...
   ▼
Formula Delta Backend
```

The exact port and path are configuration concerns.

Potential path:

```text
/ws
```

This should be finalized during implementation.

---

# 5. Encoding

Initial protocol encoding:

```text
JSON
```

Binary encoding is unnecessary for the MVP.

If future high-frequency telemetry creates a measurable performance problem, alternative encoding can be evaluated separately.

---

# 6. Protocol Version

Every connection must operate against a known Formula Delta protocol version.

Initial version:

```text
1
```

Messages may include:

```json
{
  "protocolVersion": 1
}
```

Whether every message needs the version or only handshake/snapshot messages should be decided during implementation.

Avoid redundant bytes without losing compatibility detection.

---

# 7. Message Envelope

Server messages should follow a predictable envelope.

Conceptually:

```json
{
  "type": "TIMING_UPDATE",
  "payload": {}
}
```

Potential metadata:

```json
{
  "type": "TIMING_UPDATE",
  "timestamp": 1758210205123,
  "payload": {}
}
```

Only metadata with concrete use should be included.

---

# 8. Message Naming

Message types use:

```text
UPPER_SNAKE_CASE
```

Examples:

```text
STATE_SNAPSHOT
TIMING_UPDATE
TRACK_STATUS_UPDATE
RACE_CONTROL_EVENT
WEATHER_UPDATE
CONNECTION_STATUS
CAPABILITIES_UPDATE
```

Message names describe Formula Delta domain behavior.

Avoid:

```text
TIMING_DATA
TIMING_APP_DATA
```

because those names mirror upstream topics.

---

# 9. Server → Client Message Categories

Initial categories:

```text
SYSTEM
SESSION
TIMING
STRATEGY
RACE CONTROL
WEATHER
CAPABILITIES
REPLAY
SYNC
```

---

# 10. STATE_SNAPSHOT

## Purpose

Initialize a newly connected frontend with current Formula Delta state.

Example:

```json
{
  "type": "STATE_SNAPSHOT",
  "protocolVersion": 1,
  "payload": {
    "source": {
      "mode": "live"
    },
    "session": {},
    "drivers": {},
    "timing": {},
    "stints": {},
    "track": {},
    "raceControl": [],
    "weather": {},
    "capabilities": {},
    "connection": {}
  }
}
```

The exact schema follows `DATA-MODEL.md`.

---

# 11. Snapshot Rule

A frontend must be able to become useful from:

```text
STATE_SNAPSHOT
```

without waiting for future timing updates.

This means:

```text
Browser opens on Lap 42
        │
        ▼
STATE_SNAPSHOT
        │
        ▼
Lap 42 state immediately visible
```

---

# 12. Snapshot vs Upstream Snapshot

These are different concepts.

```text
F1 Initial State
      │
      ▼
Parser + Normalizer
      │
      ▼
Formula Delta State
      │
      ▼
STATE_SNAPSHOT
```

Never forward the F1 subscription snapshot directly.

---

# 13. SESSION_UPDATE

Represents changes to session-level information.

Example:

```json
{
  "type": "SESSION_UPDATE",
  "payload": {
    "status": "live",
    "lap": {
      "current": 38,
      "total": 53
    }
  }
}
```

Only changed fields may be included.

---

# 14. Session Delta Semantics

For incremental messages:

```text
missing property
→ unchanged
```

Example:

Current:

```json
{
  "status": "live",
  "lap": {
    "current": 37,
    "total": 53
  }
}
```

Update:

```json
{
  "lap": {
    "current": 38
  }
}
```

Result:

```json
{
  "status": "live",
  "lap": {
    "current": 38,
    "total": 53
  }
}
```

Frontend merge behavior must be deterministic.

---

# 15. DRIVER_UPDATE

Used when driver metadata changes.

Example:

```json
{
  "type": "DRIVER_UPDATE",
  "payload": {
    "driverId": "16",
    "changes": {
      "abbreviation": "LEC",
      "fullName": "Charles Leclerc",
      "team": {
        "name": "Ferrari",
        "color": "E8002D"
      }
    }
  }
}
```

Driver metadata should update rarely.

---

# 16. TIMING_UPDATE

Represents timing changes for one or more drivers.

Single-driver conceptual example:

```json
{
  "type": "TIMING_UPDATE",
  "payload": {
    "driverId": "16",
    "changes": {
      "position": 3,
      "gapToLeader": {
        "type": "time",
        "milliseconds": 4821,
        "display": "+4.821"
      },
      "intervalToAhead": {
        "type": "time",
        "milliseconds": 721,
        "display": "+0.721"
      }
    }
  }
}
```

---

# 17. Timing Batching

Formula 1 may generate multiple related updates very quickly.

Formula Delta may batch timing updates.

Example:

```json
{
  "type": "TIMING_UPDATE",
  "payload": {
    "drivers": {
      "16": {
        "position": 3,
        "gapToLeader": {
          "type": "time",
          "milliseconds": 4821,
          "display": "+4.821"
        }
      },
      "44": {
        "position": 4
      }
    }
  }
}
```

The final choice between single-driver and batched updates should be based on measured event frequency.

The protocol should support efficient batching without forcing every upstream event into a separate browser message.

---

# 18. Why Timing Updates Are Incremental

Sending the entire timing tower every time one gap changes would create unnecessary:

- serialization;
- WebSocket traffic;
- Zustand updates;
- React work.

Preferred flow:

```text
VER gap changes
      │
      ▼
small TIMING_UPDATE
      │
      ▼
VER state changes
      │
      ▼
relevant UI rerenders
```

---

# 19. STINT_UPDATE

Represents tyre/stint changes.

Example:

```json
{
  "type": "STINT_UPDATE",
  "payload": {
    "driverId": "4",
    "stints": [
      {
        "number": 1,
        "compound": "MEDIUM",
        "startLap": 1,
        "endLap": 23,
        "newTyre": true
      },
      {
        "number": 2,
        "compound": "HARD",
        "startLap": 24,
        "endLap": null,
        "newTyre": true
      }
    ]
  }
}
```

Because stint collections are small, replacing one driver's complete stint collection may be simpler and safer than deeply merging individual stint fields.

This should be validated during implementation.

---

# 20. PIT_UPDATE

Pit information may either travel inside:

```text
TIMING_UPDATE
```

or use a dedicated:

```text
PIT_UPDATE
```

message.

Do not create a separate message type unless it improves:

- UX event handling;
- animation;
- state ownership;
- debugging.

For the initial protocol, pit state may remain part of timing.

---

# 21. TRACK_STATUS_UPDATE

Track status deserves an explicit message because of its high UX priority.

Example:

```json
{
  "type": "TRACK_STATUS_UPDATE",
  "payload": {
    "status": "safety-car"
  }
}
```

Potential statuses are defined in `DATA-MODEL.md`.

---

# 22. Track Status Events

A transition:

```text
green
  ↓
safety-car
```

may trigger stronger frontend attention than an ordinary timing change.

The backend provides semantic state.

The frontend determines presentation.

---

# 23. RACE_CONTROL_EVENT

Represents a new Race Control event.

Example:

```json
{
  "type": "RACE_CONTROL_EVENT",
  "payload": {
    "id": "rc-184",
    "timestamp": 1758210205123,
    "lap": 31,
    "category": "investigation",
    "driverId": "16",
    "message": "..."
  }
}
```

This message is append-oriented.

---

# 24. Race Control Deduplication

The backend owns upstream deduplication.

The frontend should not need to know whether Formula 1 resent an old message.

Therefore:

```text
F1 duplicate
    │
    ▼
Backend deduplication
    │
    ▼
no new RACE_CONTROL_EVENT
```

---

# 25. WEATHER_UPDATE

Example:

```json
{
  "type": "WEATHER_UPDATE",
  "payload": {
    "airTemperatureC": 24.8,
    "trackTemperatureC": 38.1,
    "humidityPercent": 61,
    "rainfall": false
  }
}
```

Incremental semantics may be used.

---

# 26. CAPABILITIES_UPDATE

Capabilities tell the frontend what is actually available.

Example:

```json
{
  "type": "CAPABILITIES_UPDATE",
  "payload": {
    "timing": true,
    "tyres": true,
    "raceControl": true,
    "weather": true,
    "teamRadio": false,
    "carTelemetry": false,
    "livePosition": false
  }
}
```

---

# 27. Capability Changes

Capabilities may change during a connection.

Example:

```text
Initial:
carTelemetry = unknown

Later:
carTelemetry = unavailable
```

or:

```text
Initial:
weather = false

First WeatherData received:
weather = true
```

The frontend must tolerate capability updates.

---

# 28. CONNECTION_STATUS

The backend should communicate upstream connectivity.

Example:

```json
{
  "type": "CONNECTION_STATUS",
  "payload": {
    "status": "reconnecting",
    "attempt": 2
  }
}
```

Potential statuses:

```text
connecting
live
reconnecting
disconnected
failed
```

---

# 29. Two Different Connections

The frontend must distinguish conceptually between:

```text
Browser ↔ Formula Delta Backend
```

and:

```text
Formula Delta Backend ↔ Formula 1
```

If the browser WebSocket itself disconnects, it obviously cannot receive `CONNECTION_STATUS`.

After reconnecting to Formula Delta, the snapshot should expose the current upstream status.

---

# 30. SOURCE_STATUS

Formula Delta may expose current source information.

Example:

```json
{
  "type": "SOURCE_STATUS",
  "payload": {
    "mode": "live"
  }
}
```

Replay:

```json
{
  "type": "SOURCE_STATUS",
  "payload": {
    "mode": "replay"
  }
}
```

This may alternatively be part of the snapshot and replay state.

Avoid unnecessary message types if no independent update is required.

---

# 31. Replay Protocol

Replay requires bidirectional communication.

The browser must be able to request:

```text
play
pause
resume
restart
speed change
```

Potential future:

```text
seek
```

Seeking is not required for the initial MVP unless implementation makes it straightforward.

---

# 32. REPLAY_STATE

Server → Client:

```json
{
  "type": "REPLAY_STATE",
  "payload": {
    "status": "playing",
    "speed": 2,
    "positionMs": 183420,
    "durationMs": 5421000
  }
}
```

Potential statuses:

```text
idle
loading
playing
paused
completed
failed
```

---

# 33. Replay Position Frequency

Do not send replay position updates at excessive frequency.

A UI progress indicator does not require hundreds of messages per second.

A reasonable frequency should be chosen during implementation.

---

# 34. Client Commands

Client → Server commands should use an explicit command envelope.

Conceptually:

```json
{
  "type": "COMMAND",
  "command": "REPLAY_PAUSE",
  "payload": {}
}
```

Alternative:

```json
{
  "type": "REPLAY_PAUSE",
  "payload": {}
}
```

The simpler design should be preferred unless command metadata becomes useful.

---

# 35. Initial Client Commands

Expected commands:

```text
REPLAY_PLAY
REPLAY_PAUSE
REPLAY_RESTART
REPLAY_SET_SPEED

SYNC_SET_DELAY
SYNC_ADJUST_DELAY
```

Potential recording/source commands will be evaluated separately.

---

# 36. REPLAY_SET_SPEED

Example:

```json
{
  "type": "REPLAY_SET_SPEED",
  "payload": {
    "speed": 5
  }
}
```

Supported initial speeds:

```text
0.5
1
2
5
10
```

The backend validates the value.

---

# 37. SYNC_STATE

Server → Client:

```json
{
  "type": "SYNC_STATE",
  "payload": {
    "delayMs": 12000
  }
}
```

This represents Formula Delta's current presentation delay.

---

# 38. SYNC_SET_DELAY

Client → Server:

```json
{
  "type": "SYNC_SET_DELAY",
  "payload": {
    "delayMs": 12000
  }
}
```

Backend validation is required.

Negative delay is not supported.

---

# 39. SYNC_ADJUST_DELAY

For convenient live adjustment:

```json
{
  "type": "SYNC_ADJUST_DELAY",
  "payload": {
    "deltaMs": 1000
  }
}
```

or:

```json
{
  "type": "SYNC_ADJUST_DELAY",
  "payload": {
    "deltaMs": -1000
  }
}
```

This enables UI controls such as:

```text
-1s
+1s
```

without requiring the frontend to calculate authoritative backend state.

---

# 40. Command Acknowledgement

Commands that materially change backend state may need acknowledgements.

Potential pattern:

Client:

```json
{
  "type": "SYNC_SET_DELAY",
  "requestId": "req-42",
  "payload": {
    "delayMs": 12000
  }
}
```

Server:

```json
{
  "type": "COMMAND_RESULT",
  "requestId": "req-42",
  "payload": {
    "success": true
  }
}
```

Do not introduce request IDs unless implementation demonstrates they are useful.

For many controls, broadcasting the resulting authoritative state may be enough.

Example:

```text
SYNC_SET_DELAY
      │
      ▼
backend changes delay
      │
      ▼
SYNC_STATE
```

This is likely simpler for the MVP.

---

# 41. ERROR

Server may send recoverable application errors.

Example:

```json
{
  "type": "ERROR",
  "payload": {
    "code": "INVALID_REPLAY_SPEED",
    "message": "Unsupported replay speed."
  }
}
```

Error codes should be machine-readable.

Messages are developer/user-facing descriptions.

---

# 42. Error Categories

Potential codes:

```text
INVALID_MESSAGE
INVALID_COMMAND
INVALID_SYNC_DELAY
INVALID_REPLAY_SPEED
REPLAY_NOT_LOADED
REPLAY_FAILED
SOURCE_UNAVAILABLE
INTERNAL_ERROR
```

Do not expose stack traces through WebSocket messages.

---

# 43. Client Message Validation

The backend must treat browser messages as untrusted input even though Formula Delta normally runs locally.

Validate:

- JSON syntax;
- message type;
- payload structure;
- numeric ranges;
- allowed replay speeds.

Invalid commands must not crash the backend.

---

# 44. Unknown Client Messages

Example:

```json
{
  "type": "DO_SOMETHING_FUTURE"
}
```

Current backend behavior should be:

```text
reject safely
      │
      ▼
ERROR / INVALID_MESSAGE
```

not terminate the connection.

---

# 45. Unknown Server Messages

The frontend should also tolerate unknown future message types.

Preferred behavior:

```text
unknown server message
       │
       ├── ignore safely
       └── log in development
```

This improves additive protocol compatibility.

---

# 46. Message Validation

Messages should be validated at the WebSocket boundary.

Conceptually:

```text
JSON
 │
 ▼
Envelope validation
 │
 ▼
Message-specific validation
 │
 ▼
Handler
```

Do not let arbitrary payloads directly mutate application state.

---

# 47. Snapshot Validation

`STATE_SNAPSHOT` deserves particularly strong validation because it initializes the complete frontend state.

If a critical snapshot is invalid:

```text
do not partially pretend initialization succeeded
```

The frontend should expose a clear connection/data error.

---

# 48. Event Ordering

WebSocket preserves message ordering over one connection.

Formula Delta should preserve meaningful backend event order when producing messages.

Especially important:

```text
TRACK_STATUS_UPDATE
RACE_CONTROL_EVENT
TIMING_UPDATE
```

around Safety Car, red flag and pit events.

---

# 49. Sequence Numbers

Formula Delta may introduce a monotonically increasing sequence number:

```json
{
  "sequence": 18422,
  "type": "TIMING_UPDATE",
  "payload": {}
}
```

Potential benefits:

- debugging;
- detecting missed messages;
- replay diagnostics;
- synchronization tests.

For a local WebSocket connection, it is not strictly required for delivery reliability.

Add it only if it provides enough diagnostic value.

---

# 50. State Revision

An alternative to sequence numbers is a state revision.

Example:

```json
{
  "revision": 4218,
  "type": "TIMING_UPDATE",
  "payload": {}
}
```

A snapshot could contain:

```json
{
  "revision": 4218
}
```

This could help detect stale updates after resynchronization.

The need should be evaluated when implementing reconnect behavior.

---

# 51. Frontend Reconnection

If browser WebSocket disconnects:

```text
Browser
   X
Backend
```

the frontend should reconnect.

After reconnection:

```text
WebSocket connected
      │
      ▼
STATE_SNAPSHOT
      │
      ▼
replace/reconcile frontend state
      │
      ▼
resume incremental updates
```

Do not attempt to reconstruct potentially missed backend events solely from old client state.

---

# 52. Snapshot Authority

After reconnect, the new snapshot is authoritative for current state.

For event histories included in the snapshot, it is also authoritative for the retained history.

This prevents duplicate Race Control messages after frontend reconnect.

---

# 53. Backend F1 Reconnection

When the backend loses Formula 1:

```text
F1 disconnected
      │
      ▼
CONNECTION_STATUS
reconnecting
```

The browser remains connected to Formula Delta.

Once upstream recovery succeeds:

```text
backend rebuilds/reconciles state
      │
      ▼
frontend must receive authoritative correction
```

This may use:

```text
STATE_SNAPSHOT
```

rather than attempting to emit every difference manually.

---

# 54. RESYNC

A dedicated:

```text
RESYNC
```

message is probably unnecessary.

The server can send a new:

```text
STATE_SNAPSHOT
```

whenever complete client resynchronization is required.

This keeps the protocol simpler.

---

# 55. Batching

The backend may batch high-frequency domain changes over a very short interval.

Example:

```text
F1 update
F1 update
F1 update
F1 update
      │
      ▼
short batch window
      │
      ▼
one TIMING_UPDATE
```

Batching must not create perceptible race timing lag.

Measure before choosing a window.

---

# 56. Coalescing

Repeated updates to the same field inside a batch may be coalesced.

Example:

```text
VER gap +2.821
VER gap +2.803
VER gap +2.781
```

could become:

```text
VER gap +2.781
```

for presentation.

However, this is only valid for **current-state presentation**.

Historical analytics may still require intermediate samples elsewhere.

---

# 57. Event Messages Must Not Be Coalesced Blindly

For event history:

```text
Race Control message A
Race Control message B
```

both must remain.

Do not apply current-state coalescing logic to append-only event streams.

---

# 58. Telemetry Messages

If `CarData.z` becomes available, introduce telemetry only after measuring actual needs.

Potential message:

```text
TELEMETRY_UPDATE
```

Example:

```json
{
  "type": "TELEMETRY_UPDATE",
  "payload": {
    "drivers": {
      "4": {
        "speedKph": 312,
        "rpm": 11842,
        "gear": 8,
        "throttlePercent": 100,
        "brake": false
      }
    }
  }
}
```

Do not add this message to the MVP protocol unless the capability is actually implemented.

---

# 59. Position Messages

Experimental future message:

```text
POSITION_UPDATE
```

Potentially:

```json
{
  "type": "POSITION_UPDATE",
  "payload": {
    "drivers": {
      "4": {
        "x": 1234,
        "y": 842,
        "z": 17
      }
    }
  }
}
```

Again, this is not part of required MVP behavior.

---

# 60. Analytics Messages

Post-MVP derived analytics may use:

```text
ANALYTICS_UPDATE
```

or feature-specific messages.

Do not create a generic analytics dumping ground prematurely.

For example, Battle Mode may eventually benefit from a dedicated contract if its calculations are backend-owned.

---

# 61. Source Independence

Frontend behavior should remain largely identical:

```text
LIVE
 │
 ▼
STATE_SNAPSHOT
TIMING_UPDATE
...

REPLAY
 │
 ▼
STATE_SNAPSHOT
TIMING_UPDATE
...
```

Only source-control information differs.

This is a major architectural property.

---

# 62. Live vs Replay Example

Live:

```json
{
  "type": "STATE_SNAPSHOT",
  "payload": {
    "source": {
      "mode": "live"
    }
  }
}
```

Replay:

```json
{
  "type": "STATE_SNAPSHOT",
  "payload": {
    "source": {
      "mode": "replay"
    }
  }
}
```

The timing components should not care.

---

# 63. No Raw F1 Topic Names

Forbidden client protocol:

```json
{
  "type": "TimingData",
  "payload": {
    "Lines": {}
  }
}
```

Forbidden:

```json
{
  "type": "TimingAppData",
  "payload": {}
}
```

Preferred:

```json
{
  "type": "TIMING_UPDATE",
  "payload": {}
}
```

and:

```json
{
  "type": "STINT_UPDATE",
  "payload": {}
}
```

---

# 64. No UI Instructions From Backend

The backend should not send:

```json
{
  "flashRow": true,
  "backgroundColor": "yellow"
}
```

It sends domain meaning:

```json
{
  "status": "safety-car"
}
```

The frontend design system determines presentation.

---

# 65. No Formatted HTML

Never send HTML through the protocol for application state.

Avoid:

```json
{
  "message": "<strong>SAFETY CAR</strong>"
}
```

Use structured/plain data.

---

# 66. Security

Although Formula Delta is local-first, basic defensive rules still apply.

The backend should:

- validate client messages;
- limit payload size;
- reject malformed JSON safely;
- avoid arbitrary filesystem paths from clients;
- avoid exposing stack traces;
- avoid executing client-provided code.

---

# 67. Origin / Network Exposure

Initial deployment should assume local usage.

If backend binding is configurable, documentation must distinguish:

```text
localhost-only
```

from:

```text
LAN/public binding
```

Do not accidentally expose control endpoints to external networks by default.

---

# 68. Heartbeat Between Frontend and Backend

Browser WebSocket heartbeat may not be necessary initially.

Native WebSocket lifecycle plus application updates may be sufficient.

If stale connections become a real issue, add explicit:

```text
PING
PONG
```

or transport-level handling later.

Do not confuse this with Formula 1's upstream `Heartbeat`.

---

# 69. Message Size

The initial snapshot may be significantly larger than incremental updates.

This is acceptable.

Normal timing traffic should remain small.

If telemetry or long event histories make snapshots large, evaluate:

- history limits;
- separate feature loading;
- compression;
- lazy requests.

Do not optimize before measurement.

---

# 70. Race Control History in Snapshot

The snapshot should include enough Race Control history to make a newly connected frontend useful.

Whether this means:

```text
all current-session messages
```

or:

```text
last N messages
```

should be determined after measuring actual session sizes.

Race Control history is expected to be small enough that full-session inclusion may be reasonable.

---

# 71. Team Radio History

If Team Radio is implemented, the same question applies.

Do not automatically include large media data.

Only metadata should travel through Formula Delta WebSocket.

Audio itself should use an appropriate media mechanism.

---

# 72. Recording Controls

The MVP may expose recording status.

Potential message:

```text
RECORDING_STATE
```

Example:

```json
{
  "type": "RECORDING_STATE",
  "payload": {
    "status": "recording",
    "durationMs": 183420
  }
}
```

Whether recording starts automatically or through UI control will be defined separately.

---

# 73. Recording Commands

Potential future commands:

```text
RECORDING_START
RECORDING_STOP
```

Do not include them merely because they are possible.

The recording workflow should first be defined in `RECORDING-FORMAT.md` and implementation planning.

---

# 74. Protocol Constants

Shared protocol constants belong in:

```text
packages/shared/
```

Potential structure:

```text
packages/shared/
└── websocket/
    ├── message-types.js
    ├── protocol-version.js
    └── validators.js
```

Exact organization can remain simple.

---

# 75. Protocol Tests

At minimum test:

### Server → Client

- valid snapshot;
- session update;
- timing update;
- stint update;
- track status;
- Race Control event;
- weather;
- capabilities;
- connection status;
- replay state;
- sync state.

### Client → Server

- replay pause;
- replay restart;
- speed validation;
- delay validation;
- malformed command;
- unknown command.

---

# 76. Reconnection Tests

Test:

```text
frontend disconnect
      ↓
race continues
      ↓
frontend reconnects
      ↓
snapshot received
      ↓
correct current state
```

Also test:

```text
F1 disconnect
      ↓
frontend remains connected
      ↓
reconnecting status
      ↓
F1 recovers
      ↓
authoritative resynchronization
```

---

# 77. Replay Contract Tests

A recording replay should produce the same application message semantics as live processing.

The test does not require identical wall-clock timing.

It requires equivalent domain behavior.

---

# 78. Protocol Compatibility

For protocol version `1`, additive changes should preferably remain backward compatible.

Examples:

Adding:

```json
{
  "windDirectionDegrees": 194
}
```

is generally additive.

Changing:

```json
{
  "position": 3
}
```

to:

```json
{
  "position": {
    "value": 3
  }
}
```

is breaking.

Breaking changes require protocol version consideration.

---

# 79. Version Mismatch

If frontend and backend protocol versions are incompatible, fail clearly.

Conceptually:

```text
Frontend protocol: 1
Backend protocol: 2

        ↓

INCOMPATIBLE_PROTOCOL
```

Do not allow subtle corrupted state.

---

# 80. Initial MVP Server Messages

The initial protocol target is:

```text
STATE_SNAPSHOT
SESSION_UPDATE
DRIVER_UPDATE
TIMING_UPDATE
STINT_UPDATE
TRACK_STATUS_UPDATE
RACE_CONTROL_EVENT
WEATHER_UPDATE
CAPABILITIES_UPDATE
CONNECTION_STATUS
REPLAY_STATE
SYNC_STATE
ERROR
```

This list may shrink if implementation demonstrates that some messages can be combined cleanly.

---

# 81. Initial MVP Client Messages

Target:

```text
REPLAY_PLAY
REPLAY_PAUSE
REPLAY_RESTART
REPLAY_SET_SPEED

SYNC_SET_DELAY
SYNC_ADJUST_DELAY
```

Do not add commands without a concrete frontend requirement.

---

# 82. Example Live Sequence

A browser opening Formula Delta during a race may observe:

```text
WebSocket Connected
        │
        ▼
STATE_SNAPSHOT
        │
        ▼
CONNECTION_STATUS: live
        │
        ▼
TIMING_UPDATE
        │
        ▼
TIMING_UPDATE
        │
        ▼
SESSION_UPDATE: lap 38
        │
        ▼
RACE_CONTROL_EVENT
        │
        ▼
TRACK_STATUS_UPDATE: vsc
        │
        ▼
TIMING_UPDATE
```

---

# 83. Example Upstream Reconnection

```text
TIMING_UPDATE
      │
      ▼
CONNECTION_STATUS
reconnecting
      │
      ▼
       ...
      │
      ▼
STATE_SNAPSHOT
      │
      ▼
CONNECTION_STATUS
live
      │
      ▼
TIMING_UPDATE
```

The new snapshot restores authoritative state.

---

# 84. Example Replay Sequence

```text
WebSocket Connected
        │
        ▼
STATE_SNAPSHOT
source = replay
        │
        ▼
REPLAY_STATE
playing / 1x
        │
        ▼
TIMING_UPDATE
        │
        ▼
TIMING_UPDATE
        │
        ▼
REPLAY_PAUSE
        │
        ▼
REPLAY_STATE
paused
```

---

# 85. Protocol Design Checklist

Before adding a new message type, ask:

1. Is this a Formula Delta concept or an F1 protocol concept?
2. Does the frontend actually need it?
3. Is it current state or an event?
4. Can it fit cleanly into an existing message?
5. Does it need ordering guarantees?
6. Can it be batched?
7. Can it be coalesced?
8. Does it exist in both live and replay?
9. What happens after reconnect?
10. Is it core, optional or experimental?

---

# 86. Protocol Success Criteria

The internal WebSocket protocol is successful when:

- the frontend never consumes raw F1 structures;
- live and replay use the same domain messages;
- new clients initialize immediately;
- reconnecting clients recover safely;
- high-frequency updates remain efficient;
- critical race events retain ordering;
- invalid client commands cannot destabilize the backend;
- protocol changes can be versioned;
- UI decisions remain in the frontend;
- upstream protocol changes are largely invisible to React.

---

# 87. Central Protocol Principle

> **The Formula Delta WebSocket protocol communicates the state of the race, not the shape of the upstream feed.**

The backend owns the complexity of Formula 1 data.

The frontend receives a stable, meaningful and intentionally small representation of the session.
