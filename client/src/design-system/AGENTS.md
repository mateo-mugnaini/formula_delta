# UX/UI Agent Instructions

This area owns the complete Formula Delta visual language: design tokens,
typography, spacing, density, accessibility, semantic race states, stable live
layouts, responsive behavior, and interaction consistency. These rules apply to
every React component and CSS Module in `client/src`.

## Visual Direction

Formula Delta is a second-screen race companion, not a conventional business
dashboard. Interfaces must be minimalist, restrained, technical, and highly
scannable. The visual goal is a calm dark control surface with a clear data
hierarchy, similar to a well-designed broadcast timing page: dense where live
data matters, quiet where it does not, and free of decorative UI that competes
with the race.

Prefer:

- dark neutral backgrounds with one restrained accent color;
- compact sections and clear alignment;
- thin borders and subtle separators instead of heavy cards;
- tabular numerals for timing values;
- one strong page hierarchy rather than many competing panels;
- semantic color used sparingly and paired with text or icons;
- fixed row heights and predictable columns for live timing;
- short, purposeful transitions only for meaningful state changes.

Avoid:

- gradients, glassmorphism, excessive shadows, and ornamental decoration;
- oversized hero sections or large empty areas;
- excessive rounded cards and nested containers;
- badges for every piece of information;
- animated movement on ordinary timing updates;
- layout shifts caused by changing values;
- color-only status communication;
- dense text blocks that require sustained reading during a race.

## Layout Principles

- The primary live view must be useful at a glance within one or two seconds.
- The timing tower is the visual anchor and should receive the greatest stable
  area of the screen.
- Session status, lap, track status, and connection state remain visible without
  scrolling on the main desktop layout.
- Secondary information such as weather, Race Control, and pit context should
  support the timing tower rather than compete with it.
- Use a compact header, a dominant main data region, and small supporting rails
  or sections. Do not create a grid of equal-weight cards.
- At narrow widths, preserve order and hierarchy: session status, timing tower,
  track status, then supporting information.
- Prefer CSS grid for stable columns and flexbox for small control groups.
- Define minimum and maximum widths for timing columns so numbers do not resize
  surrounding content.

## Typography

- Use a highly legible system sans-serif for labels and descriptive text.
- Use tabular numerals for positions, laps, gaps, intervals, lap times, and tyre
  age. Values in the same column must align vertically.
- Use uppercase sparingly for compact labels, status markers, and section names.
- Establish hierarchy with size, weight, and contrast rather than many colors.
- Avoid ultra-light text on dark backgrounds and avoid long italic treatments.
- Timing values should be visually stronger than their labels, while metadata
  remains quiet but readable.

## Color and Semantics

- Start from near-black/navy neutrals, not pure black for every surface.
- Use a restrained light text scale with muted secondary text.
- Reserve accent colors for active focus, selected controls, and important state.
- Safety Car, VSC, red flag, yellow flag, pit, penalty, and green-track states
  must have distinct semantics, but never rely on color alone.
- Tyre compounds may use compound accents, but the compound name or symbol must
  remain visible.
- Connection loss and stale data require explicit text and an accessible status
  indicator.
- Do not place presentation colors into domain entities or normalized state.

## Live Data Behavior

- Do not animate every incoming update.
- Keep row heights stable when values change.
- Align changing numeric values to the right or to a fixed numeric column.
- Highlight meaningful position changes briefly and unobtrusively.
- Make stale, unavailable, and experimental capabilities explicit.
- Preserve the last valid value when an optional update is missing; show an
  availability state instead of an empty visual hole.
- Race Control events may receive stronger emphasis than ordinary updates, but
  must not cause the entire layout to jump.

## Components and CSS Modules

- Components should represent user-facing meaning, not upstream topic names.
- Keep components small enough to reason about but avoid splitting every label
  into a separate component.
- Use CSS Modules for component-local styles and shared design tokens for
  repeated values.
- Avoid inline style objects for repeated visual rules.
- Keep selectors shallow and names semantic.
- Prefer state classes such as `.isActive`, `.isStale`, or `.isCritical` over
  selectors coupled to DOM structure.
- Do not use arbitrary magic colors or spacing when an existing token applies.

## Accessibility

- Maintain WCAG-conscious contrast for all text and status indicators.
- Support keyboard navigation for controls and visible focus states.
- Use semantic HTML before ARIA attributes.
- Announce critical track-status changes where appropriate, without making
  high-frequency timing updates noisy for assistive technology.
- Never communicate meaning through color, motion, or position alone.
- Respect reduced-motion preferences.

## Responsive and Display Assumptions

- Optimize first for a desktop or laptop second screen used beside a broadcast.
- Support tablet and narrow layouts without horizontal scrolling of the whole
  application.
- On small screens, allow the timing table to scroll within its own region only
  when necessary, preserving the page header and track status.
- The interface must remain useful at common 100% and 125% browser zoom levels.

## Design Decision Boundary

Presentation decisions must remain separate from the normalized domain model.
The backend sends race meaning and state; the frontend maps that meaning to
visual treatment. Do not encode UI colors, animation flags, or layout commands
in WebSocket messages.
