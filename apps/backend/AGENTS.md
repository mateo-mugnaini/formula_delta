# Backend Agent Instructions

Backend work owns the local Formula Delta service, WebSocket server, recording,
replay, delay buffer, lifecycle, and HTTP diagnostics.

Keep Formula 1 protocol-specific behavior inside `src/f1/`. Preserve raw event
recording, share the live/replay pipeline, and avoid infrastructure without a
concrete requirement.
