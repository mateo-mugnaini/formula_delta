# Formula Delta Architecture Decision Records

This directory records architectural decisions that affect the long-term
shape of Formula Delta. ADRs preserve context and trade-offs so later work
can distinguish an intentional constraint from an unfinished implementation.

## Index

| ADR                                      | Decision                                                    | Status   |
| ---------------------------------------- | ----------------------------------------------------------- | -------- |
| [001](./001-node-over-python.md)         | Node.js is the core backend runtime                         | Accepted |
| [002](./002-websocket-over-polling.md)   | WebSocket connects the backend and frontend                 | Accepted |
| [003](./003-filesystem-over-database.md) | Filesystem recordings are the initial persistence mechanism | Accepted |
| [004](./004-raw-event-recording.md)      | Record extracted raw upstream events before parsing         | Accepted |

These decisions apply to the initial local-first MVP and may be revisited when
concrete requirements change.
