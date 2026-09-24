# Live Timing — UX/UI iteration

## UI changes

- The desktop shell gives the timing tower more horizontal space while keeping a compact secondary rail.
- Timing rows are keyboard-accessible selectable controls with a restrained selected state.
- A Driver Focus panel exposes the selected driver's available position, gap, last lap and tyre data.
- The existing Formula Delta tokens, dark surface hierarchy and compact broadcast-oriented density remain in use.

## Performance changes

- No new dependency or high-frequency animation was introduced.
- Position-change feedback remains local to the timing tower and is cleared after a short timeout.
- Track-map animation was intentionally not added because the current domain model does not provide normalized car positions.

## Data availability

The current UI can present normalized timing, driver, tyre/stint, weather, Race Control and team-radio data when those capabilities are supplied by the source. Speed, telemetry and live track positions remain optional/unavailable until the ingestion layer provides verified data.

## Architecture impact

Driver selection is presentation state held by the dashboard and passed to the timing tower and contextual rail. It does not alter the WebSocket protocol or the normalized backend model.

## Future improvements

- Add a normalized position capability and build a low-frequency track-map layer with position-only updates.
- Split high-frequency timing subscriptions from low-frequency session and weather subscriptions when profiling shows a measurable benefit.
- Add configurable timing columns once the domain model exposes the corresponding values consistently.
