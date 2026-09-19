# Frontend Agent Instructions

Frontend work owns React, Vite, Zustand, the Formula Delta WebSocket client,
selectors, rendering, reconnect UX, and frontend performance.

The project owner implements the frontend presentation layer. The owner will
write and maintain React `.jsx` files and CSS Modules (`.module.css`). Agents
must not implement or overwrite those presentation files unless explicitly
asked. Agents may still implement and maintain frontend-adjacent infrastructure
such as WebSocket contracts, stores, selectors, configuration, utilities,
tests, and documentation.

Consume the stable Formula Delta domain and WebSocket protocol. Do not depend
on raw Formula 1 topic names or payload shapes.
