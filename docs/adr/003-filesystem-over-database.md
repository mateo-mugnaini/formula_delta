# ADR 003: Use the Filesystem for Initial Persistence

Status: Accepted

## Context

Formula Delta records sequential upstream events for replay, debugging, and
regression testing. The initial product is local-first, targets one machine
and a small number of browser clients, and does not require complex
cross-session queries.

## Decision

Store recordings on the local filesystem using the documented recording
directory format, including `metadata.json` and JSONL event data. Do not add a
database to the initial architecture.

## Rationale

Filesystem recordings are portable, inspectable, inexpensive, and naturally
match an append-oriented event stream. They preserve the zero-cost and
offline-replay goals without adding infrastructure or operational setup.

## Alternatives Considered

- SQLite: a reasonable future local index, but unnecessary before query needs
  are demonstrated.
- PostgreSQL or another server database: adds infrastructure that the local
  MVP does not require.
- Redis or an event broker: solves different scaling and coordination problems
  that are out of scope.

## Consequences

Recordings are easy to copy and inspect, but large-scale querying and indexing
are limited. The recorder must handle partial writes, disk errors, safe paths,
and retention deliberately.

## When To Revisit

Revisit when cross-session analytics, indexing, concurrent writers, or data
volume create a concrete filesystem limitation.

## Related Documents

- [Recording format](../RECORDING-FORMAT.md)
- [Project scope](../../PROJECT-SCOPE.md)
