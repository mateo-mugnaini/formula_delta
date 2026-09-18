# Formula Delta Screen Specifications

## Scope

These are product-level specifications for the first usable frontend. They do
not prescribe a component library or final pixel values.

## Main Live Dashboard

### Purpose

Provide a useful race overview that can be understood at a glance.

### Required Regions

- session header with event, session type, lap, and session status;
- prominent track-status treatment;
- timing tower with position, driver, gap, interval, last lap, tyre, age,
  and pit count;
- recent Race Control area;
- compact weather summary when available;
- connection and capability state;
- broadcast delay controls.

### Timing Tower Behavior

Rows have stable heights and predictable columns. Position changes update the
ordering without decorative transitions that obscure reading. Missing optional
values use stable placeholders.

## Replay Dashboard

The replay dashboard uses the same race presentation as the live dashboard.
It adds replay status, current position, duration, speed, play, pause, and
restart controls. Replay state must not require a separate timing model.

## Race Control View

The initial product may use a panel within the main dashboard. Each event
should show time when available, category or severity when normalized, affected
driver or group when available, and the original message text.

## Strategy View

Strategy is a later screen. It may show stint sequences, compounds, pit laps,
and tyre-age context, but must not be implemented before the underlying timing
and stint semantics are confirmed.

## Narrow Viewports

On narrow screens, retain session status and the most important timing columns.
Secondary panels may stack, collapse, or become scrollable. The design must
not silently hide track status or turn a timing value into ambiguous text.

## Loading, Empty, and Error States

- Loading: explain that the session state is being received.
- No session: provide a clear idle state without fake timing data.
- Partial data: render available core information and identify unavailable
  capabilities.
- Connection loss: preserve the last known state while clearly marking its
  freshness or connection status.
- Fatal initialization failure: show an actionable error instead of a blank
  dashboard.
