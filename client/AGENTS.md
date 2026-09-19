# Frontend Agent Instructions

Frontend work owns React, Vite, Zustand, the Formula Delta WebSocket client,
selectors, rendering, reconnect UX, and frontend performance.

Agents may implement the complete frontend presentation layer, including React
`.jsx` files and CSS Modules (`.module.css`). Presentation must consume only
the stable Formula Delta domain model and WebSocket protocol. It must not read
raw Formula 1 topic names or payloads.

Consume the stable Formula Delta domain and WebSocket protocol. Do not depend
on raw Formula 1 topic names or payload shapes.
