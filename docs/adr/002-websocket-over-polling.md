# ADR 002: Use WebSocket Between Backend and Frontend

Status: Accepted

## Context

The dashboard presents event-driven timing updates, replay state, connection
status, and synchronization changes. The browser needs server-to-client
updates without repeatedly requesting the same state.

## Decision

Use WebSocket as the primary transport between the Formula Delta backend and
frontend. Keep HTTP endpoints for health checks, diagnostics, and other
operations where request/response semantics are appropriate.

## Rationale

WebSocket naturally supports server push, avoids polling overhead, preserves
message order on a connection, and can carry both live and replay updates
through the same application protocol.

## Alternatives Considered

- HTTP polling: simpler to bootstrap, but introduces avoidable latency and
  repeated requests for a real-time dashboard.
- Server-Sent Events: useful for one-way server push, but less suitable for
  the planned replay and synchronization commands from the browser.

## Consequences

The project must define and validate a stable Formula Delta WebSocket
protocol, handle reconnects, and send authoritative snapshots. HTTP remains
available where it is simpler rather than being excluded categorically.

## When To Revisit

Revisit if measured browser or deployment constraints make WebSocket
unreliable, or if the product no longer needs interactive real-time state.

## Related Documents

- [WebSocket protocol](../WEBSOCKET-PROTOCOL.md)
- [Architecture](../ARCHITECTURE.md)
