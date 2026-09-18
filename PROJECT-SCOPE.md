# Formula Delta — Project Scope

## 1. Project Vision

**Formula Delta** is a free, local-first Formula 1 companion dashboard designed to run alongside a live Formula 1 broadcast.

Its primary purpose is to provide race information that television broadcasts do not display continuously, particularly:

- race classification;
- gaps;
- intervals;
- tyre information;
- stint information;
- lap and sector times;
- pit information;
- Race Control events;
- session status;
- weather;
- strategy context.

Formula Delta does not attempt to replace the Formula 1 broadcast.

It acts as a **second screen for understanding the race**.

---

# 2. Primary Use Case

The primary scenario is:

```text
TV / Streaming
      │
      │ Formula 1 broadcast
      ▼
    Race

User
 │
 ├──────── watches race
 │
 └──────── occasionally checks
              │
              ▼
        Formula Delta
```

Formula Delta should allow the user to answer questions such as:

- What is the gap between two drivers?
- Is a driver catching the car ahead?
- What tyre is each driver using?
- How old are those tyres?
- What strategy has each driver followed?
- Who recently stopped?
- What was the last lap?
- Who has the strongest recent pace?
- What happened under Race Control?
- Is the race under yellow, VSC or Safety Car?
- Is rain being detected?
- How is a battle evolving?

The interface should prioritize information that can be understood quickly.

---

# 3. Core Constraints

Formula Delta has four fundamental constraints.

## 3.1 Zero Cost

The application must be usable for:

```text
€0
```

No paid service may be required for normal operation.

---

## 3.2 Local First

Formula Delta runs on the user's machine.

No cloud deployment is required.

---

## 3.3 Live Data

The application should consume Formula 1 live timing information when technically available without requiring paid Formula Delta infrastructure.

---

## 3.4 Offline Development

Development and testing must not depend on a live Formula 1 session.

Recorded sessions and fixtures must allow development at any time.

---

# 4. Scope Classification

Features are classified into four categories:

```text
MVP
Post-MVP
Experimental
Out of Scope
```

These classifications should be respected when planning development.

---

# 5. MVP

The MVP establishes a reliable end-to-end Formula Delta experience.

The MVP is considered successful when the application can receive or replay Formula 1 timing data and present a useful second-screen dashboard.

---

## 5.1 Live Timing Connection

Formula Delta should be capable of connecting to the available Formula 1 timing infrastructure.

Required capabilities include:

- connection lifecycle;
- subscription handling;
- heartbeat handling where applicable;
- connection status;
- disconnection detection;
- reconnection;
- defensive protocol handling.

The application must not assume all topics are available.

---

## 5.2 Session Information

Display:

- event name;
- session type;
- session status;
- session clock when available;
- lap count;
- total laps when available.

Example:

```text
ITALIAN GRAND PRIX

RACE
LAP 37 / 53

GREEN
```

---

## 5.3 Driver Information

Maintain normalized information for all participating drivers.

Relevant information may include:

- racing number;
- abbreviation;
- full name;
- team;
- team colour where available.

---

## 5.4 Live Classification

The main dashboard must show the current running order.

At minimum:

```text
Position
Driver
Gap to Leader
Interval
Last Lap
Tyre
Tyre Age
Pit Stops
```

Example:

```text
P   DRIVER   GAP       INT       LAST       TYRE   AGE   PIT

1   NOR      LEADER    ---       1:23.281    M     14     1
2   VER      +2.817    +2.817    1:23.194    H     21     1
3   PIA      +6.291    +3.474    1:23.391    M     13     1
```

Missing optional information must not break the table.

---

# 6. Timing

The MVP should support available timing information including:

- last lap;
- best lap;
- sectors;
- personal best indication;
- session best indication;
- pit status;
- retired/stopped state where available.

Mini-sector support should be implemented if confirmed sufficiently stable during discovery.

---

# 7. Tyres and Stints

Tyre information is a core Formula Delta feature.

Support:

- compound;
- tyre age;
- new/used indication where available;
- stint number;
- stint history;
- current stint;
- completed stints.

Supported compounds should account for:

```text
SOFT
MEDIUM
HARD
INTERMEDIATE
WET
UNKNOWN
```

Unknown compounds must not crash rendering.

---

# 8. Pit Information

Formula Delta should display:

- driver in pit;
- pit exit when detectable;
- number of stops;
- stint transition.

Pit events should be visually noticeable without disrupting the entire interface.

---

# 9. Track Status

The application must represent major track states.

Including:

- green;
- yellow;
- double yellow where available;
- Virtual Safety Car;
- VSC ending;
- Safety Car;
- red flag;
- chequered/session completion where appropriate.

Major race-state changes should have higher visual priority than ordinary timing updates.

---

# 10. Race Control

The MVP should expose recent Race Control messages.

Examples include:

- yellow flags;
- investigations;
- incidents noted;
- track limits;
- penalties;
- Safety Car deployment;
- VSC deployment;
- red flags;
- DRS state messages where provided.

Formula Delta should preserve the original message text when useful while also normalizing structured information when practical.

---

# 11. Weather

When available, display:

- air temperature;
- track temperature;
- humidity;
- rainfall;
- wind speed;
- wind direction;
- atmospheric pressure where useful.

Weather is secondary to race timing and should not dominate the primary interface.

---

# 12. TV Broadcast Synchronization

Broadcast synchronization is part of the MVP.

The user must be able to configure a delay between incoming live timing events and dashboard presentation.

The objective is to synchronize Formula Delta with the user's television or streaming feed and avoid timing spoilers.

Expected controls eventually include:

```text
-1 second
+1 second

preset delays

0s
5s
10s
15s
20s
```

Exact UX may change during design work.

The architecture must support changing delay without restarting Formula Delta.

---

# 13. Recording

Formula Delta must be capable of recording incoming raw events.

Recordings should include sufficient information to reconstruct:

- ordering;
- relative timing;
- topic;
- payload.

The recorder should preserve raw upstream data whenever practical.

Recording must not significantly interfere with live timing performance.

---

# 14. Replay

Recorded sessions must be replayable.

Replay is part of the MVP.

Required:

- load recording;
- start;
- pause;
- resume;
- restart;
- normal playback.

Target speed controls:

```text
0.5x
1x
2x
5x
10x
```

Replay must use the same processing pipeline as live data.

---

# 15. Connection and Capability Status

Formula Delta should expose useful system state.

Examples:

```text
LIVE
REPLAY
CONNECTING
CONNECTED
RECONNECTING
DISCONNECTED
```

It should also internally determine optional capabilities.

Example:

```json
{
  "timing": true,
  "tyres": true,
  "weather": true,
  "teamRadio": true,
  "carTelemetry": false,
  "livePosition": false
}
```

The frontend should adapt without failing.

---

# 16. Docker

The MVP should eventually support:

```bash
docker compose up
```

as a simple way to start the complete application.

Initial expected services:

```text
frontend
backend
```

Additional containers require an actual technical need.

---

# 17. Testing

The MVP must have tests for critical data-processing behavior.

Priority areas:

- parsing;
- normalization;
- delta merging;
- malformed payloads;
- replay;
- event ordering;
- WebSocket contracts;
- broadcast delay;
- capability detection.

Tests should use captured fixtures where appropriate.

---

# 18. Post-MVP

Post-MVP features expand race analysis after the primary dashboard is stable.

They should not block MVP completion.

---

## 18.1 Battle Mode

Allow selection of two drivers.

Example:

```text
VER vs PIA
```

Compare:

- position;
- interval;
- tyre;
- tyre age;
- last lap;
- best lap;
- sectors;
- recent pace;
- gap evolution.

---

## 18.2 Gap History

Store gap snapshots over time.

Display trends such as:

```text
4.8
4.3
3.9
3.5
3.1
2.8
```

This can help identify whether a driver is catching another car.

---

## 18.3 Strategy Visualization

Graphically represent tyre strategies.

Example:

```text
NOR   M━━━━━━━━━━ H━━━━━━━━━━━━━━━━
VER   S━━━━ M━━━━━━━━ H━━━━━━━━━━━━
PIA   M━━━━━━━━━━━━ H━━━━━━━━━━━━━━
```

---

## 18.4 Recent Pace

Calculate local metrics such as:

- average last 3 laps;
- average last 5 laps;
- median recent pace;
- pace difference between selected drivers.

Care must be taken around:

- pit laps;
- Safety Car;
- VSC;
- yellow flags;
- traffic;
- invalid laps.

Derived metrics must not pretend to be more precise than their underlying data.

---

## 18.5 Tyre Degradation

Estimate tyre degradation using available lap history.

Potential approaches include simple regression over representative laps.

Results must clearly be presented as calculated estimates rather than official Formula 1 values.

---

## 18.6 Pit Strategy Context

Potential derived information:

- previous stint lengths;
- likely pit windows based on observed strategy;
- approximate pit-loss reference;
- undercut/overcut comparison.

Predictive strategy features are not MVP requirements.

---

# 19. Team Radio

Team Radio support is considered Post-MVP unless discovery indicates implementation is trivial and stable.

Potential features:

- radio event list;
- driver identification;
- timestamp;
- audio playback where legally and technically accessible from the source.

Automatic transcription is not required.

No paid transcription service should be introduced.

---

# 20. Experimental Features

Experimental features depend on upstream capabilities that may not be available anonymously during live sessions.

They must not become dependencies of the core dashboard.

---

## 20.1 Car Telemetry

Potential data:

- speed;
- RPM;
- gear;
- throttle;
- brake;
- active aero.

Primary candidate source:

```text
CarData.z
```

Formula Delta should only enable this feature when the capability is detected.

---

## 20.2 Accurate Live Track Position

Potential source:

```text
Position.z
```

When available, Formula Delta may render cars on a circuit map.

The feature must disappear or degrade gracefully when unavailable.

---

## 20.3 Approximate Track Map

If accurate position data is unavailable, Formula Delta may investigate estimating driver progress using:

- mini-sectors;
- lap progression;
- timing information;
- circuit geometry.

Approximate positions must not be represented as exact GPS positions.

---

# 21. Future Exploration

These ideas are intentionally not committed roadmap items.

They may be investigated after Formula Delta becomes stable.

Examples:

- qualifying-specific dashboard;
- practice-session dashboard;
- historical session comparison;
- driver pace reports;
- race summary generation;
- strategy comparison tools;
- circuit-specific views;
- multi-monitor layouts;
- customizable dashboard layouts;
- keyboard shortcuts;
- local historical database;
- telemetry analytics using Python;
- FastF1 integration for offline analysis.

These require separate scope decisions.

---

# 22. Out of Scope

The following are explicitly outside the initial project scope.

---

## User Accounts

No:

- registration;
- login;
- profiles;
- password management;
- OAuth.

Formula Delta is initially a local application.

---

## Cloud Infrastructure

No mandatory:

- hosted backend;
- hosted frontend;
- managed database;
- cloud storage.

---

## Commercial Product Features

No:

- subscriptions;
- payments;
- premium accounts;
- advertising;
- analytics tracking;
- customer management.

---

## Mobile Native Applications

No native:

- Android application;
- iOS application.

Responsive web support may still be implemented.

---

## Distributed Architecture

Do not introduce:

- Kafka;
- RabbitMQ;
- Kubernetes;
- distributed event buses;
- service meshes.

Formula Delta does not currently have the scale that would justify them.

---

## Mandatory Database

A database is not required initially.

Session recordings should use the filesystem.

A database may be reconsidered if future functionality genuinely requires structured historical querying.

---

## Artificial Intelligence

AI is not required for Formula Delta's core functionality.

Do not introduce an LLM simply to claim AI functionality.

Race analysis should initially use deterministic calculations.

---

# 23. UX Scope

Formula Delta should prioritize desktop/laptop usage as a second screen.

Primary target:

```text
Desktop / Laptop
```

Secondary target:

```text
Tablet
```

Mobile browsers may receive responsive support but are not the primary design target during the MVP.

The interface should favor:

- dark environments;
- information density;
- fast scanning;
- stable geometry;
- large enough timing information;
- clear status changes.

---

# 24. Discovery Scope

Before implementation of the main application, Formula Delta must complete a discovery phase.

The discovery probe should investigate the real Formula 1 feed.

The probe must attempt to identify:

- connection process;
- anonymous access behavior;
- available topics;
- payload structures;
- event frequencies;
- snapshot behavior;
- delta behavior;
- compressed topics;
- reconnect behavior;
- Team Radio behavior;
- `CarData.z`;
- `Position.z`.

Representative events should be recorded for fixtures.

---

# 25. MVP Success Criteria

The MVP can be considered complete when all of the following are true:

1. Formula Delta can start locally.
2. Formula Delta can process a supported Formula 1 live session or equivalent captured input.
3. Formula Delta can replay recorded sessions offline.
4. The frontend receives normalized data rather than raw Formula 1 payloads.
5. Current classification is visible.
6. Gaps and intervals are visible when supplied by the source.
7. Tyre and stint information is visible when supplied.
8. Timing information is visible.
9. Pit information is visible.
10. Track status is visible.
11. Race Control messages are visible.
12. Weather information is available when supplied.
13. Broadcast delay can be configured.
14. Missing optional capabilities do not break the dashboard.
15. Critical parsing/state behavior has automated tests.
16. The application can be launched through the documented local workflow.
17. No paid infrastructure or API is required.

---

# 26. Product Test

When considering a new feature, ask:

> Does this make Formula Delta more useful while watching or analysing a Formula 1 session?

If not, the feature requires strong justification.

When considering a new technology, ask:

> What concrete current problem does this solve?

If the answer is primarily architectural sophistication, do not add it.

---

# 27. Scope Principle

Formula Delta should first become an excellent **live timing companion**.

Only after that foundation is reliable should it become a deeper race-analysis platform.
