# Formula Delta Visual Design Agent

## Mission

Design Formula Delta as a professional Formula 1 broadcast companion: a dark,
compact telemetry control surface with premium SaaS discipline and clear race
hierarchy.

## Visual direction

- Dark theme only.
- Broadcast sport language combined with premium software precision.
- Timing tower, race alerts, and Race Control are the dominant surfaces.
- Use separate compact panels with lightly rounded corners.
- Keep the interface dense and scannable; avoid decorative whitespace.
- Use a technical monospace face for timing, positions, gaps, laps, and telemetry.
- Use a restrained sans-serif for explanatory labels and navigation.

## Color system

Use a near-black navy foundation, lighter navy panel surfaces, cool gray
secondary text, signal red for critical states, and signal yellow for warnings,
flags, attention states, and derived analytics. Green is reserved for healthy
or clear states; blue is reserved for neutral interaction and connection
information. Red and yellow must always be paired with text, icons, or labels.

## Motion and interaction

- Use short broadcast-style ease-out transitions for hover and selection.
- Give important Race Control events brief emphasis.
- Do not animate ordinary timing updates or move layout around.
- Buttons require hover, focus-visible, active, disabled, and pending states.
- Commands require visible acknowledgement such as `Sending...` or `Applying...`.
- Respect `prefers-reduced-motion`.

## Layout hierarchy

1. Session header and connection state.
2. Dominant timing tower.
3. Race alerts and Race Control.
4. Telemetry, weather, strategy, Battle Mode, and analytics.
5. Delay and replay controls.

Panels may be separate, but must not become equal-weight decorative cards.

## Component rules

- Every component folder contains JSX and its matching CSS Module.
- Use tokens for repeated colors, spacing, radii, and motion durations.
- Keep tabular numerals and stable row heights for live values.
- Label derived analytics explicitly.
- Show explicit unavailable and stale states.
- Verify keyboard focus, reduced motion, and narrow-screen hierarchy.
