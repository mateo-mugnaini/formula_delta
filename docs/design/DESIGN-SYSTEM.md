# Formula Delta Design System

## Purpose

Formula Delta is a second-screen motorsport interface. Its design system
prioritizes fast scanning, information density, stable live layouts, and clear
semantic emphasis over decorative presentation.

## Visual Direction

The product should feel technical, precise, restrained, and race-oriented.
Avoid generic dashboard patterns such as excessive cards, large empty areas,
decorative gradients, and persistent animation.

## Foundations

### Color

Use a dark-first neutral foundation with high-contrast text and restrained
semantic colors for track state, timing status, and tyre compounds. Semantic
color must never be the only indication of meaning; pair it with text, icons,
or state labels.

The domain model must not contain presentation colors. The design system maps
normalized meanings to visual tokens.

### Typography

Use a legible sans-serif interface typeface. Timing values should use tabular
numerals and consistent alignment. Headings should establish hierarchy without
using oversized display text that reduces available race information.

### Spacing

Prefer a compact, regular spacing scale. Dense areas such as the timing tower
may use tighter spacing than explanatory or configuration views, but controls
must remain comfortably targetable and readable.

### Shape and Elevation

Use restrained corner radii and minimal elevation. Grouping should primarily
come from alignment, borders, spacing, and headings rather than a collection of
floating cards.

## Components

Initial reusable components should include:

- application shell and session header;
- timing tower and timing row;
- status badge;
- tyre compound indicator;
- stint marker;
- race-control event row;
- weather summary;
- synchronization controls;
- connection and capability indicators.

Components must handle missing data without changing the surrounding layout
unexpectedly.

## Live Data Rules

- Reserve predictable column widths for timing values.
- Keep row heights stable during ordinary updates.
- Do not flash or animate every gap change.
- Use stronger treatment for Safety Car, VSC, red flag, and important Race
  Control events.
- Show unavailable values explicitly with an em dash or an appropriate
  unavailable label.
- Preserve the user's visual position when data updates.

## Accessibility

Support keyboard navigation, visible focus, readable contrast, text labels for
important states, and reduced-motion preferences. Colour semantics must remain
understandable for users with colour-vision differences.

## Responsive Intent

Desktop and laptop second-screen use is the primary target. Smaller screens may
reduce secondary information, but must preserve the session state and core
classification rather than forcing a horizontally unstable layout.
