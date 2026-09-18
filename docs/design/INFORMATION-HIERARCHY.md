# Formula Delta Information Hierarchy

## Priority 1: Immediate Race State

This information should be visible in the primary viewport:

- track status;
- session name and status;
- current lap and total laps;
- running order;
- driver identity;
- gap to leader;
- interval to the car ahead;
- last lap;
- tyre compound and age.

## Priority 2: Tactical Context

This information should be available in the primary layout or an adjacent
panel:

- pit status and stop count;
- best lap;
- sectors;
- current and completed stints;
- recent Race Control messages;
- connection status;
- capability availability.

## Priority 3: Environmental Context

Weather and session details should be visible without competing with the
timing tower:

- air and track temperature;
- humidity and rainfall;
- wind information;
- session clock;
- relevant session metadata.

## Priority 4: Controls and Diagnostics

Replay controls, broadcast delay, source selection, and diagnostic details may
occupy a header, toolbar, or secondary area. They should not obscure the race
classification during ordinary use.

## Priority 5: Experimental Capabilities

Telemetry, live position, track maps, and derived analytics are optional. They
must be visually subordinate and must disappear or show an explicit unavailable
state when the upstream capability is absent.

## Layout Guidance

The primary screen should establish hierarchy in this order:

1. session and track status;
2. timing tower;
3. important event context;
4. tactical and environmental summaries;
5. controls and diagnostics.

Exact arrangement belongs to the screen specifications and may evolve after
real payload availability is known.
