# Formula Delta — Known Limitations

## 1. Purpose

This document records known technical, product and data limitations of **Formula Delta**.

The purpose is not merely to list problems.

It exists to prevent the project from:

- treating assumptions as guarantees;
- hiding unavailable data;
- building required features on unreliable sources;
- introducing unnecessary infrastructure to solve hypothetical problems;
- presenting derived information as official Formula 1 data.

Limitations should be updated whenever new evidence is discovered.

---

# 2. Status Labels

Limitations may use the following status:

```text id="6c09mq"
CURRENT
EXPECTED
EXPERIMENTAL
RESOLVED
```

### CURRENT

Known to affect Formula Delta.

### EXPECTED

Strongly anticipated but still requires direct verification.

### EXPERIMENTAL

Related to functionality that is intentionally non-core.

### RESOLVED

Previously relevant but retained for historical context.

---

# 3. Unofficial Upstream Protocol

## Status

```text id="n2i66k"
CURRENT
```

Formula Delta relies on Formula 1 Live Timing infrastructure through an unofficial integration.

Formula Delta does not control:

- endpoints;
- authentication;
- topic availability;
- message schemas;
- update frequency;
- SignalR behavior;
- compression formats.

Formula 1 may change any of these.

---

## Impact

A Formula 1 protocol change may temporarily break:

- connection;
- individual topics;
- parsers;
- optional telemetry;
- the entire live data source.

---

## Mitigation

Formula Delta isolates upstream behavior behind:

```text id="20pbnl"
LiveSource
    ↓
Protocol
    ↓
Parser
    ↓
Normalizer
```

Captured recordings and fixtures allow regressions to be reproduced.

---

# 4. No Official API Contract

## Status

```text id="62r8bi"
CURRENT
```

Formula Delta does not have an official schema contract guaranteeing fields such as:

```text id="0vb4de"
TimingData.Lines
TimingAppData.Stints
```

remain unchanged.

---

## Impact

Fields may:

- disappear;
- move;
- change type;
- become nullable;
- gain new values.

---

## Mitigation

Parsers must be defensive.

Unknown or missing fields should not crash unrelated functionality.

---

# 5. Anonymous Access May Change

## Status

```text id="bhmklq"
CURRENT
```

Formula Delta's zero-cost architecture depends on data that can be accessed without a paid service.

Current availability must never be assumed permanent.

---

## Impact

A previously accessible topic could become:

```text id="2n0wjq"
authenticated
restricted
removed
```

---

## Product Rule

Formula Delta will not bypass access controls to preserve a feature.

If optional data becomes restricted:

```text id="gy11db"
capability unavailable
```

is the correct behavior.

---

# 6. Live Availability Must Be Verified

## Status

```text id="z1n4du"
CURRENT
```

Historical examples or third-party implementations do not prove current live availability.

Therefore:

```text id="fb9w2e"
historically observed
≠
currently guaranteed
```

Phase 0 exists specifically to verify this.

---

# 7. CarData.z Availability

## Status

```text id="a5n8lq"
EXPERIMENTAL
```

`CarData.z` may provide high-frequency vehicle telemetry.

Potential data includes:

- speed;
- RPM;
- gear;
- throttle;
- brake;
- aerodynamic state.

Anonymous live availability is not considered guaranteed.

---

## Impact

Features such as:

```text id="64nox5"
live speed
live RPM
live throttle
live brake
live gear
```

cannot be MVP dependencies.

---

## Fallback

```text id="bhn9dn"
carTelemetry = unavailable
```

The main timing dashboard continues normally.

---

# 8. Position.z Availability

## Status

```text id="s8a1pi"
EXPERIMENTAL
```

`Position.z` may provide relative car coordinates.

Anonymous live availability is not considered guaranteed.

---

## Impact

A real-time circuit map based on upstream coordinates cannot be required for MVP.

---

## Fallback

Formula Delta may later investigate approximate circuit progress using:

- timing loops;
- sectors;
- mini-sectors.

Estimated progress must remain distinguishable from actual upstream position data.

---

# 9. Telemetry Frequency Is Unknown

## Status

```text id="6bdb32"
EXPECTED
```

The exact frequency and volume of high-frequency telemetry must be measured.

---

## Impact

Until measured, Formula Delta cannot make reliable assumptions about:

- CPU requirements;
- recording size;
- WebSocket bandwidth;
- frontend update rate;
- necessary downsampling.

---

## Rule

Do not optimize telemetry infrastructure before measuring real traffic.

---

# 10. Formula Delta May Be Ahead of Television

## Status

```text id="5fvt4u"
CURRENT
```

Live timing data and television broadcasts do not necessarily arrive at the viewer at the same time.

Depending on broadcast path, Formula Delta may reveal race events before they appear on television.

---

## Example

```text id="3ww8f4"
Formula Delta:
SAFETY CAR

        ↓ several seconds later

TV:
incident occurs
```

This creates spoilers.

---

# 11. TV Synchronization Is Manual

## Status

```text id="d0q2eh"
CURRENT
```

Formula Delta cannot automatically know the exact delay of every television provider or stream.

Broadcast delay may differ based on:

- broadcaster;
- streaming platform;
- device;
- internet connection;
- geographic distribution;
- buffering.

---

## Mitigation

Formula Delta provides configurable presentation delay.

Example:

```text id="d00i45"
0s
5s
10s
15s
custom
```

with fine adjustments such as:

```text id="th0a2k"
-1s
+1s
```

---

# 12. TV Delay Can Drift

## Status

```text id="7mydb8"
EXPECTED
```

Streaming services may change their delay during a session because of buffering or reconnects.

A delay calibrated on lap 5 may not remain exact on lap 45.

---

## Mitigation

The user can adjust synchronization during the session.

Formula Delta should make this quick and non-disruptive.

---

# 13. Formula Delta Cannot Guarantee Spoiler-Free Synchronization

## Status

```text id="s3rnv5"
CURRENT
```

Manual delay reduces spoilers but cannot guarantee perfect synchronization.

Reasons include:

- network jitter;
- broadcast buffering;
- upstream timing differences;
- local processing;
- manual calibration error.

---

# 14. Recording Does Not Capture Raw Network Frames

## Status

```text id="dsm8o2"
CURRENT
```

Normal Formula Delta recordings begin after SignalR-level topic extraction.

They preserve:

```text id="hy1s72"
topic
payload
timing
```

but not necessarily:

```text id="e7sct3"
raw WebSocket bytes
SignalR framing bytes
HTTP negotiation traffic
```

---

## Impact

Normal recordings can reproduce:

- parser bugs;
- normalization bugs;
- state reconstruction bugs;
- `.z` decoding issues if encoded payload is preserved.

They may not reproduce:

- handshake bugs;
- WebSocket framing problems;
- negotiation failures.

---

## Mitigation

The Phase 0 probe may create specialized transport-level captures when necessary.

---

# 15. Recordings May Be Incomplete

## Status

```text id="qvr4c7"
CURRENT
```

A recording may start after a session has already begun.

Example:

```text id="4ow03p"
Race starts
      │
      │ 20 laps
      │
Formula Delta connects
      │
      ▼
Recording begins
```

---

## Mitigation

If the upstream subscription provides a current snapshot, Formula Delta records it.

This can make a mid-session recording replayable from its own start.

It does not make it a complete recording of the entire race.

---

# 16. Application Crashes Can Truncate Recordings

## Status

```text id="kkq12h"
CURRENT
```

A crash or power loss may leave:

```text id="sk1vfa"
events.jsonl
```

with an incomplete final line.

---

## Mitigation

Replay should recover all valid preceding lines where possible.

The recording may be marked:

```text id="f6nm05"
incomplete
```

---

# 17. Full Recordings May Become Large

## Status

```text id="50x13e"
EXPECTED
```

Recording size depends heavily on:

- session duration;
- topic frequency;
- telemetry availability;
- position data availability.

---

## Impact

High-frequency topics could significantly increase storage usage.

---

## Initial Policy

Use readable JSONL first.

Measure actual recording sizes.

Only introduce compression when justified.

---

# 18. Replay Is Not Initially Seekable

## Status

```text id="x5ayga"
CURRENT
```

Initial replay supports:

```text id="nv53w1"
play
pause
resume
restart
speed control
```

Arbitrary seeking is not required for MVP.

---

## Why

Formula Delta state depends on previous deltas.

Jumping directly to:

```text id="0bprmo"
45:00
```

without reconstructing previous state may produce incorrect data.

---

## Future Option

Periodic checkpoints may later enable efficient seeking.

---

# 19. Replay Timing Is Approximate

## Status

```text id="efkwg8"
EXPECTED
```

Replay attempts to preserve relative event timing.

It cannot guarantee hard real-time scheduling precision.

Operating-system scheduling and Node.js event-loop load may introduce small differences.

---

## Product Impact

This is acceptable for:

- race replay;
- development;
- debugging.

Replay should preserve ordering and approximate timing rather than claim deterministic nanosecond scheduling.

---

# 20. Historical Data May Behave Differently From Live Data

## Status

```text id="j0eqw3"
CURRENT
```

Completed sessions may expose data differently from active live sessions.

Therefore:

```text id="k5f7vp"
historical access
≠
live access
```

---

## Rule

A feature cannot become a live MVP requirement solely because its data exists historically.

---

# 21. Session Types May Differ

## Status

```text id="q7e6od"
CURRENT
```

Formula 1 sessions may expose different data depending on whether the session is:

- practice;
- qualifying;
- sprint qualifying;
- sprint;
- race.

---

## Impact

A parser tested only against race data may fail or behave incorrectly during qualifying.

---

## Mitigation

Collect recordings and fixtures from multiple session types over time.

---

# 22. Early Development Will Have Limited Session Coverage

## Status

```text id="om0i3l"
CURRENT
```

Phase 0 cannot immediately test every combination of:

```text id="rpkhzz"
session type
weather
red flags
Safety Cars
retirements
pit scenarios
qualifying eliminations
```

---

## Rule

Do not claim a scenario is supported merely because the parser compiles.

Support should be backed by:

- observed data;
- fixtures;
- tests.

---

# 23. Rare Events Are Hard to Capture

## Status

```text id="z9ey23"
CURRENT
```

Some valuable states occur infrequently.

Examples:

- red flag;
- race suspension;
- restart;
- unusual penalties;
- multiple Safety Cars;
- session abandonment.

---

## Mitigation

Preserve recordings whenever these events occur.

Extract regression fixtures.

Over time the fixture library should become increasingly representative.

---

# 24. Driver Metadata May Arrive Separately

## Status

```text id="i72xsg"
EXPECTED
```

Timing information may theoretically arrive before complete driver metadata is available.

---

## UI Behavior

Formula Delta should tolerate temporary states such as:

```text id="02ggo3"
16
```

instead of:

```text id="u2c3zg"
LEC
```

until driver metadata arrives.

Do not block timing processing solely because presentation metadata is incomplete.

---

# 25. Gaps Are Not Always Simple Time Values

## Status

```text id="d08f6r"
CURRENT
```

Gap representations may include concepts such as:

```text id="s9un3h"
LEADER
+4.821
+1 LAP
```

and potentially other session-specific values.

---

## Impact

Gap values cannot safely be modeled as a simple floating-point number.

Formula Delta uses semantic timing values as documented in `DATA-MODEL.md`.

---

# 26. Timing Values May Temporarily Be Missing

## Status

```text id="mmn8n3"
CURRENT
```

During:

- pit stops;
- session transitions;
- red flags;
- first laps;
- incomplete sectors;

some timing values may be unavailable.

---

## Rule

Missing timing information is valid application state.

Do not replace it with:

```text id="s29u6p"
0.000
```

---

# 27. Tyre Age Semantics Require Verification

## Status

```text id="dqayqm"
CURRENT
```

Tyre-related upstream values may not directly mean:

```text id="9g90bx"
laps since this pit stop
```

especially when used tyres are fitted.

---

## Impact

Incorrect interpretation could produce misleading strategy information.

---

## Rule

Do not finalize tyre-age calculations until verified with observed stint transitions.

---

# 28. Tyre Information May Be Delayed

## Status

```text id="j6q8de"
EXPECTED
```

Tyre compound/stint information may not update at exactly the same instant as pit state.

Potential temporary state:

```text id="n6yg64"
driver leaves pits
      │
      ▼
new tyre not yet confirmed
```

---

## UI Rule

Prefer temporarily showing unknown/stale-marked information rather than guessing the new compound.

---

# 29. Race Control Messages May Contain Free Text

## Status

```text id="dbzmwo"
CURRENT
```

Race Control information may include human-readable messages that are not perfectly structured.

---

## Impact

Formula Delta cannot guarantee accurate extraction of:

- driver;
- penalty type;
- incident;
- lap;
- reason;

from every message.

---

## Rule

Preserve original Race Control text.

Structured parsing supplements the original message rather than replacing it.

---

# 30. Race Control Interpretation Is Limited

## Status

```text id="vop8mf"
CURRENT
```

Formula Delta may classify a message as:

```text id="qlypm4"
penalty
investigation
flag
information
```

when reliable.

It should not attempt to infer intent or meaning beyond the available data.

---

# 31. Weather Is Circuit-Level Data

## Status

```text id="q5vkwe"
CURRENT
```

Weather information represents available session/circuit measurements.

It does not provide hyper-local conditions for every point on the circuit.

---

## Impact

Formula Delta should not imply:

```text id="om5ywm"
rain at Turn 3
```

unless a source explicitly supports that precision.

---

# 32. Weather Updates Are Not Continuous Sensor Telemetry

## Status

```text id="f91f10"
EXPECTED
```

Weather may update relatively slowly.

Values can remain unchanged for periods of time.

This is not necessarily a connection problem.

---

# 33. Derived Analytics Are Estimates

## Status

```text id="9lfm85"
CURRENT
```

Post-MVP features such as:

- recent pace;
- tyre degradation;
- gap trend;
- strategy comparison;

are calculated by Formula Delta.

They are not official Formula 1 metrics.

---

# 34. Small Samples Can Mislead

## Status

```text id="t4l71v"
CURRENT
```

For example:

```text id="m3bz7g"
average of last 2 laps
```

may be strongly affected by:

- traffic;
- yellow flags;
- pit entry;
- pit exit;
- tyre warm-up;
- driver mistakes.

---

## Rule

Analytics should expose sample size/context where useful.

Do not imply more confidence than the data supports.

---

# 35. Tyre Degradation Is Not Purely Tyre Degradation

## Status

```text id="4scmdr"
CURRENT
```

Observed lap-time evolution can be affected by:

- fuel load;
- traffic;
- track evolution;
- weather;
- driver management;
- Safety Car;
- tyre wear.

---

## Impact

A Formula Delta degradation estimate is an analytical approximation.

It must not be presented as direct measured tyre wear.

---

# 36. Strategy Predictions Are Not MVP

## Status

```text id="0hywxk"
CURRENT
```

Formula Delta initially analyzes available strategy information.

It does not attempt to guarantee predictions such as:

```text id="wmyhh9"
optimal pit lap
future finishing position
race winner
```

These require substantially more modeling and assumptions.

---

# 37. Track Map Accuracy May Be Limited

## Status

```text id="e7m7o3"
EXPERIMENTAL
```

If `Position.z` is available, coordinates may still require:

- scaling;
- rotation;
- circuit transformation;
- smoothing.

If mini-sector estimation is used instead, accuracy is inherently lower.

---

## Rule

Never present estimated circuit progress as precise GPS location.

---

# 38. Formula Delta Is Local-First

## Status

```text id="v65myk"
CURRENT
```

The initial architecture is designed for:

```text id="omoyw4"
one local machine
one upstream Formula 1 connection
one or a few browser clients
```

It is not designed as a large hosted service.

---

# 39. No Cloud Deployment Initially

## Status

```text id="fwf48g"
CURRENT
```

Formula Delta does not initially include:

- cloud infrastructure;
- production hosting;
- CDN;
- managed services;
- cloud databases.

This is intentional.

---

# 40. No User Accounts

## Status

```text id="cy2od9"
CURRENT
```

Initial Formula Delta has no:

- login;
- registration;
- user profiles;
- permissions;
- cloud synchronization.

Local settings are sufficient.

---

# 41. No Database Initially

## Status

```text id="6gjjsh"
CURRENT
```

Formula Delta initially uses:

```text id="udqh7e"
RAM
+
filesystem recordings
```

rather than:

```text id="oww36j"
PostgreSQL
MongoDB
Redis
```

---

## Impact

Formula Delta does not initially provide sophisticated queries across hundreds of historical sessions.

---

## Rule

Introduce a database only when a concrete feature requires one.

---

# 42. Recordings Are Local Files

## Status

```text id="w47mq3"
CURRENT
```

Recordings are not automatically:

- backed up;
- synchronized;
- uploaded;
- shared.

If the disk fails or the user deletes them, Formula Delta cannot restore them.

---

# 43. Docker Is Not Mandatory for Development

## Status

```text id="x83k68"
CURRENT
```

Formula Delta supports Docker for reproducible local startup.

Direct development using:

```text id="99ed6d"
pnpm
```

should remain possible.

Docker should not make protocol debugging unnecessarily difficult.

---

# 44. Docker Does Not Eliminate Host Networking Differences

## Status

```text id="iwm6mw"
CURRENT
```

Network behavior may differ between:

- Windows;
- Linux;
- macOS;
- Docker Desktop;
- native Node.js.

Phase 0 protocol investigation should preferably remain easy to run directly on the host.

---

# 45. Browser Support Is Initially Limited to Modern Browsers

## Status

```text id="kmg1d0"
CURRENT
```

Formula Delta targets modern browsers with support for:

- WebSocket;
- modern JavaScript;
- modern CSS.

Legacy browser support is not a goal.

---

# 46. Desktop Is the Primary UX

## Status

```text id="zxwjef"
CURRENT
```

Primary target:

```text id="q9mhfl"
desktop / laptop second screen
```

Secondary:

```text id="fb3pqa"
tablet
```

Mobile should remain responsive but is not the primary MVP experience.

---

# 47. Small Screens Limit Information Density

## Status

```text id="ky3j9d"
CURRENT
```

The main timing dashboard contains dense information.

On narrow screens, Formula Delta may need to:

- hide secondary columns;
- prioritize position/gap/tyre;
- use horizontal detail views;
- move advanced information behind interaction.

Do not shrink every column until the data becomes unreadable.

---

# 48. No Native Mobile Application

## Status

```text id="6t8edb"
CURRENT
```

Formula Delta is a web application.

Native iOS and Android applications are outside initial scope.

---

# 49. Local Network Access Is Not Guaranteed

## Status

```text id="h2smqy"
CURRENT
```

Formula Delta may eventually support opening the dashboard from another device on the same LAN.

This depends on:

- backend binding;
- firewall;
- Docker networking;
- operating system;
- local network configuration.

It is not required for the first MVP.

---

# 50. No Multi-User Synchronization

## Status

```text id="m4e2h8"
CURRENT
```

Formula Delta does not initially solve conflicting commands from multiple clients.

Example:

```text id="x7t0c3"
Browser A → replay 2x
Browser B → replay pause
```

The backend's latest accepted command becomes authoritative.

Sophisticated session ownership is unnecessary for local use.

---

# 51. JavaScript Without TypeScript

## Status

```text id="u9g02b"
CURRENT
```

Formula Delta initially uses JavaScript rather than TypeScript.

---

## Impact

Compile-time type guarantees are reduced.

---

## Mitigation

The project compensates through:

- clear domain contracts;
- runtime validation at important boundaries;
- fixtures;
- tests;
- disciplined module ownership;
- documentation.

Do not recreate a full type system manually through excessive complexity.

---

# 52. Runtime Validation Has a Cost

## Status

```text id="7g3v85"
CURRENT
```

Validating every deeply nested high-frequency telemetry value repeatedly could become expensive.

---

## Rule

Validation should be strongest at unstable boundaries.

Measure before introducing heavy validation on every internal transition.

---

# 53. React Rendering Has Practical Limits

## Status

```text id="7f1p5s"
EXPECTED
```

If high-frequency telemetry becomes available, rendering every upstream event directly is unnecessary and potentially expensive.

---

## Mitigation

Formula Delta may use:

- granular Zustand selectors;
- batching;
- coalescing;
- presentation-rate limits.

These should be introduced based on measured performance.

---

# 54. WebSocket Messages Are Not Historical Storage

## Status

```text id="72hq6g"
CURRENT
```

The internal Backend → Frontend WebSocket communicates current application state and relevant events.

It is not the authoritative recording.

If a browser disconnects, it may miss incremental messages.

---

## Recovery

After reconnect:

```text id="ok0s7x"
STATE_SNAPSHOT
```

restores authoritative current state.

---

# 55. Upstream Reconnection Can Lose Intermediate Events

## Status

```text id="x8px2m"
CURRENT
```

If Formula Delta loses its upstream connection:

```text id="hwcq5s"
F1
 X
Formula Delta
```

events occurring during the outage may never be received.

---

## Mitigation

After reconnect, a fresh upstream snapshot may restore current state.

However, historical events that occurred entirely during the outage may remain missing.

Example:

A Race Control message could theoretically be missed unless the upstream snapshot/history resends it.

This behavior must be investigated.

---

# 56. Current State Recovery Is Easier Than History Recovery

## Status

```text id="xx8tm0"
CURRENT
```

After reconnect, Formula Delta may recover:

```text id="1h7epk"
current position
current gaps
current tyres
```

from a snapshot.

It may not necessarily recover every intermediate:

```text id="rvp1d8"
gap sample
radio message
event
```

that occurred while disconnected.

This distinction is important for analytics and recordings.

---

# 57. Connection Status Does Not Guarantee Data Freshness

## Status

```text id="n76f1s"
EXPECTED
```

A WebSocket may remain technically connected while an expected topic stops updating.

---

## Future Mitigation

Capability diagnostics may track:

```text id="21vd4q"
lastMessageAt
```

per important topic.

Do not immediately classify low-frequency topics as stale using timing thresholds designed for `TimingData`.

---

# 58. Formula Delta Cannot Correct Wrong Upstream Data

## Status

```text id="2a5vlr"
CURRENT
```

If Formula 1 temporarily publishes incorrect timing information, Formula Delta may display it.

Formula Delta should not silently rewrite official upstream values based on assumptions.

---

# 59. Corrections May Arrive Later

## Status

```text id="lvxbfs"
CURRENT
```

Official timing or Race Control information may be corrected after initial publication.

Formula Delta should accept valid later updates.

Historical analytics may therefore evolve during a live session.

---

# 60. Derived Values Can Change Retroactively

## Status

```text id="2a5d6f"
CURRENT
```

If:

- a lap becomes invalid;
- timing is corrected;
- stint data changes;

Formula Delta analytics may need recalculation.

Derived data should not be treated as immutable truth.

---

# 61. Formula Delta Is Not an Official Timing Product

## Status

```text id="4gq4pr"
CURRENT
```

Formula Delta is an independent companion application.

It is not affiliated with or endorsed by:

- Formula 1;
- FIA;
- Formula One Management.

Official classifications and decisions remain authoritative through official Formula 1/FIA channels.

---

# 62. Naming and Trademarks

## Status

```text id="pax1ge"
CURRENT
```

Formula Delta may refer descriptively to Formula 1 sessions, drivers, teams and circuits.

Official trademarks and branding remain property of their respective owners.

The project should avoid implying official affiliation.

---

# 63. External Media Assets

## Status

```text id="tq8qnh"
CURRENT
```

Driver headshots, logos, team graphics, circuit artwork and other media may have licensing restrictions.

---

## Initial Rule

The core UI must not depend on unverified copyrighted media assets.

Textual timing information and internally created visual elements should be sufficient.

---

# 64. Team Colours May Be Upstream Metadata

## Status

```text id="rx7a1x"
EXPECTED
```

If team colours are provided by the feed, they may be used as data-driven visual metadata where appropriate.

The design system should still maintain accessible contrast and not depend solely on colour for meaning.

---

# 65. Accessibility and Motorsport Colour Semantics Can Conflict

## Status

```text id="zlg7nv"
CURRENT
```

Motorsport commonly relies on colours such as:

```text id="j76q8x"
green
yellow
red
purple
```

for timing meaning.

Colour alone is insufficient for accessibility.

---

## Mitigation

Use combinations of:

- text;
- icons;
- labels;
- shape;
- colour.

---

# 66. High Information Density Is Intentional

## Status

```text id="q35m0x"
CURRENT
```

Formula Delta is a timing dashboard.

It intentionally presents more simultaneous information than a typical consumer web application.

---

## UX Constraint

Do not "solve" density by converting every value into oversized cards.

The design challenge is:

```text id="md7zmy"
dense
+
stable
+
readable
```

not simply minimal.

---

# 67. Layout Stability Is More Important Than Animation

## Status

```text id="t58lpg"
CURRENT
```

Positions and timing values change frequently.

Excessive animation can make the dashboard harder to follow.

---

## Rule

Animation should emphasize meaningful transitions, not every numerical update.

---

# 68. Position Changes Can Cause Visual Movement

## Status

```text id="bihgzr"
CURRENT
```

The leaderboard naturally reorders when positions change.

This movement cannot be eliminated entirely.

---

## Mitigation

Use stable row dimensions and restrained transition behavior.

Avoid additional layout shifts from changing numeric widths.

---

# 69. Exact Performance Targets Are Not Yet Known

## Status

```text id="81dukp"
CURRENT
```

Before real recordings exist, Formula Delta cannot responsibly define precise targets for:

- maximum messages per second;
- memory usage;
- recording throughput;
- telemetry retention.

---

## Rule

Phase 0 measurements should inform performance targets.

---

# 70. Phase 0 Is Not Production Validation

## Status

```text id="gnlkra"
CURRENT
```

One successful live session proves:

```text id="5fngld"
it worked in that session
```

not:

```text id="ltdxqd"
it will always work
```

Evidence must accumulate across events and session types.

---

# 71. Documentation Can Become Stale

## Status

```text id="s7ypga"
CURRENT
```

Because the upstream system can change, protocol documentation can become outdated.

---

## Mitigation

Important observations should include:

- date;
- event;
- session;
- access method.

Example:

```text id="1df0a4"
Observed:
2026-09-XX

Session:
Race

Access:
Anonymous
```

---

# 72. Fixtures Represent Historical Behavior

## Status

```text id="b7x3ev"
CURRENT
```

A fixture proves that a payload shape existed.

It does not prove the current upstream still uses that exact shape.

---

## Value

Fixtures remain valuable because they prevent Formula Delta from accidentally breaking support for known valid structures.

---

# 73. Tests Cannot Detect Every Upstream Change

## Status

```text id="z77x7j"
CURRENT
```

Offline tests verify behavior against known data.

They cannot detect a Formula 1 protocol change that has never been observed.

---

## Mitigation

Live discovery diagnostics complement fixture-based tests.

---

# 74. Error Recovery Is Best-Effort

## Status

```text id="o8krd1"
CURRENT
```

Formula Delta aims to recover from:

- malformed optional payloads;
- upstream disconnects;
- browser reconnects;
- unavailable topics.

Some failures may still require restarting the backend.

This should become less common as real failure cases are captured.

---

# 75. No Guarantee of Continuous Availability

## Status

```text id="jlv9em"
CURRENT
```

Formula Delta depends on:

```text id="77e5hq"
internet connection
Formula 1 upstream availability
local machine
```

for live operation.

A local-first architecture removes cloud dependencies introduced by Formula Delta itself.

It does not remove the upstream live-data dependency.

---

# 76. Offline Mode Means Replay, Not Live Data

## Status

```text id="s58v57"
CURRENT
```

Without internet:

```text id="mzgqrp"
LIVE
→ unavailable
```

but:

```text id="bl1ov0"
REPLAY
→ available
```

for previously stored recordings.

---

# 77. No Paid Fallback

## Status

```text id="o2l6p3"
CURRENT
```

If the free live source becomes unavailable, Formula Delta does not automatically switch to a paid API.

The project requirement remains:

```text id="whc68u"
€0 core operation
```

---

# 78. OpenF1 Is Not the Core Live Fallback

## Status

```text id="12alpb"
CURRENT
```

External services may be useful for research or historical validation.

They must not silently become mandatory paid dependencies for the live dashboard.

---

# 79. FastF1 Is Not a Runtime Requirement

## Status

```text id="g3y51s"
CURRENT
```

FastF1 may be useful for:

- research;
- historical analysis;
- schema comparison;
- future optional analytics.

The initial Formula Delta runtime does not require Python or FastF1.

---

# 80. Python Is Not Part of the Core Architecture

## Status

```text id="rdv09f"
CURRENT
```

The initial backend uses Node.js.

A future Python service is acceptable only if a concrete analytics workload benefits materially from the Python ecosystem.

Do not introduce Python merely to make the architecture appear more sophisticated.

---

# 81. Architecture Is Intentionally Small

## Status

```text id="x01p7s"
CURRENT
```

Formula Delta initially does not use:

```text id="6jqim5"
Kafka
Redis
Kubernetes
microservices
message brokers
distributed caches
```

This is intentional.

---

# 82. Scalability Is Not the Initial Optimization Target

## Status

```text id="pry8u9"
CURRENT
```

Formula Delta is optimized first for:

```text id="ix0n72"
one local machine
+
one F1 session
+
reliable race information
```

not thousands of simultaneous users.

---

# 83. Known Limitations Must Not Become Permanent Excuses

A limitation should remain documented only while relevant.

When a limitation is solved:

```text id="ppap9p"
CURRENT
    ↓
RESOLVED
```

Document:

- what changed;
- when;
- which version resolved it;
- whether older recordings/versions remain affected.

---

# 84. Limitation Review

Review this document:

- after Phase 0;
- after major protocol discoveries;
- before MVP release;
- after Formula 1 protocol changes;
- after adding experimental telemetry;
- after introducing major analytics.

---

# 85. Phase 0 Expected Updates

Phase 0 should specifically clarify:

```text id="4a10re"
anonymous topic availability
initial snapshot behavior
TimingData delta semantics
TimingAppData tyre semantics
Race Control history behavior
weather update frequency
CarData.z availability
Position.z availability
.z compression
reconnection behavior
recording volume
```

Several entries in this document should become more precise after that work.

---

# 86. Product Honesty Principle

Formula Delta should never hide uncertainty by fabricating precision.

Prefer:

```text id="v28ywo"
Unavailable
Unknown
Estimated
Experimental
```

when those descriptions are accurate.

---

# 87. Central Limitations Principle

> **A known limitation is part of the system design, not an inconvenience to hide.**

Formula Delta should remain useful when data is incomplete, explicit when information is uncertain, and simple enough to adapt when the upstream system changes.
