# ADR 004: Record Extracted Raw Events Before Parsing

Status: Accepted

## Context

Formula 1 timing data comes from an unofficial and changing upstream
protocol. Payloads may be partial, compressed, malformed, or extended with
unknown fields. Parser and normalization behavior will evolve as real feed
evidence is collected.

## Decision

Record each extracted upstream event before parser and normalizer processing.
The normal recording boundary is after SignalR has identified the topic and
payload, not at raw WebSocket-frame level. Preserve encoded payloads for
compressed `.z` topics whenever practical.

## Rationale

Raw event recording makes parser regressions reproducible, allows improved
parsers to process old sessions, preserves information that a normalizer might
discard, and lets replay exercise the same ingestion logic. It also keeps the
normal recording format independent of SignalR framing details.

## Alternatives Considered

- Record only normalized domain state: smaller and simpler, but loses evidence
  needed to repair parsers and verify upstream behavior.
- Record raw WebSocket frames for every session: useful for transport
  debugging, but unnecessarily coupled to SignalR framing and larger than the
  normal replay boundary.
- Record only selected topics: reduces disk usage, but risks losing context
  and makes future parser work impossible for omitted data.

## Consequences

Recordings may contain upstream-specific structures and require careful
privacy, disk-space, and retention handling. Replay must pass recorded events
through the real parser and normalizer instead of bypassing them. Specialized
transport captures may still be created by Phase 0 discovery tooling.

## When To Revisit

Revisit the boundary if measured storage, privacy, or transport-debugging
requirements demand a second format. Do not replace raw event recordings with
normalized-only data without preserving equivalent diagnostic evidence.

## Related Documents

- [Recording format](../RECORDING-FORMAT.md)
- [Data sources](../DATA-SOURCES.md)
- [Architecture](../ARCHITECTURE.md)
