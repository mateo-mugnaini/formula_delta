# ADR 001: Use Node.js for the Core Backend

Status: Accepted

## Context

Formula Delta needs a local backend for WebSocket communication, Formula 1
ingestion, recording, replay, and filesystem operations. The project already
uses JavaScript for the planned React frontend and has no current workload
that requires Python-specific scientific or analytics libraries.

## Decision

Use Node.js with ECMAScript Modules and JavaScript for the core backend.

## Rationale

Node.js keeps the primary runtime and language consistent across the project,
fits the event-driven ingestion and WebSocket workload, and reduces local
tooling complexity. This is a contextual project decision, not a claim that
Node.js is generally superior to Python.

## Alternatives Considered

- Python/FastAPI: viable for HTTP and WebSocket services, but adds a second
  core runtime without a current requirement.
- A Python analytics service alongside Node.js: deferred until a concrete
  analytics workload justifies the operational cost.

## Consequences

The core application has one primary runtime and shared JavaScript concepts
between frontend and backend. Python remains available for a later isolated
analytics component if evidence supports it. The project accepts Node.js
ecosystem constraints for the core service.

## When To Revisit

Revisit if a required workload depends materially on Python-only libraries,
or if Node.js becomes a demonstrated bottleneck for a core capability.

## Related Documents

- [Project scope](../../PROJECT-SCOPE.md)
- [Architecture](../ARCHITECTURE.md)
- [Roadmap](../../ROADMAP.md)
