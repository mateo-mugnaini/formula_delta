# Formula Delta Testing Strategy

## Purpose

Testing must allow Formula Delta to evolve without waiting for a live Formula
1 session. The most important behavior should be deterministic and exercised
with small fixtures and recordings.

## Test Layers

### Unit Tests

Test pure parsers, normalizers, timing conversion, gap conversion, capability
detection, domain merge rules, and validation functions.

### Integration Tests

Test the path from extracted raw events through parsing, normalization, state
reconstruction, and Formula Delta WebSocket messages.

### Replay Tests

Use recordings to verify play, pause, resume, restart, speed changes, event
ordering, and deterministic state reconstruction. Replay must use the same
parser, normalizer, and state manager as live processing.

### Protocol Tests

Validate snapshots, incremental updates, reconnection recovery, commands,
invalid payloads, unknown message types, and protocol version behavior.

## Required Failure Cases

Tests should cover:

- missing and null fields;
- unexpected primitive types;
- unknown fields and topics;
- malformed optional payloads;
- partial timing deltas;
- explicit null clearing;
- duplicate Race Control events;
- out-of-order or invalid recording timestamps;
- upstream disconnect and recovery;
- unavailable optional capabilities;
- invalid browser commands;
- corrupted or incomplete recordings.

## Fixtures

Fixtures should remain small and representative. Organize them by topic and
failure mode under `fixtures/`, including timing data, drivers, session,
weather, Race Control, malformed payloads, and recordings.

Real captured payloads are preferred for protocol behavior. Synthetic fixtures
are appropriate for isolated edge cases and deterministic failure tests.

## Determinism

Parser and normalization tests must not depend on wall-clock time or network
availability. Replay scheduling may use clocks internally, but domain outputs
must be comparable for equivalent event sequences.

## Live Probe Testing

The Phase 0 probe is an observation tool, not the primary regression suite. It
should report connection and topic behavior and preserve representative raw
events without making the test suite dependent on the upstream being online.

## Performance Checks

Measure messages per second, payload sizes, recording write behavior, memory
growth, and frontend update frequency before adding batching or coalescing.
Performance tests should use captured traffic rather than an unrepeatable live
session whenever possible.

## Definition of Test Completion

A feature is test-ready when its normal behavior, malformed input behavior,
replay behavior, and relevant protocol effects are covered. Tests must verify
that optional data failure does not break core timing presentation.
