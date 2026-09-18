# Contributing to Formula Delta

## Before Starting

Read `AGENTS.md`, `PROJECT-SCOPE.md`, `ROADMAP.md`, and the relevant
documentation for the area being changed. Preserve the local-first, zero-cost,
JavaScript, replayable architecture.

## Development Principles

- Inspect existing behavior before editing.
- Prefer small, focused changes.
- Do not introduce paid services or unnecessary infrastructure.
- Do not treat undocumented Formula 1 behavior as fact.
- Preserve raw events where the change concerns ingestion or recording.
- Keep Formula 1 schemas behind the parser and normalization boundary.
- Maintain live/replay parity.
- Update documentation when architecture or protocol behavior changes.

## Data and Privacy

Never commit credentials, cookies, tokens, private keys, or unrelated personal
data. Treat captured upstream data as potentially sensitive and use the
repository recording policy before committing fixtures or recordings.

## Documentation Changes

Architectural decisions belong in `docs/adr/`. Protocol and data-model changes
must update their corresponding documents. Design changes should update the
relevant files under `docs/design/`.

## Testing Expectations

Add deterministic tests for parser, normalization, merge, replay, or protocol
changes where applicable. Do not make tests depend on a live Formula 1 session.
Use fixtures and recordings to reproduce upstream behavior.

## Pull Requests and Reviews

Explain the user or engineering problem, the affected architectural boundary,
and how the change was verified. Call out unknown upstream behavior and known
limitations explicitly.
