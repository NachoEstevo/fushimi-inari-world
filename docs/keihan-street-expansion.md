# Keihan street expansion · revision 2

Scope: fix the floating stone assembly reported beside Rōmon; enrich the Keihan street through the JR crossing and both Urasando and the right-turn Omotesando approach. Keihan remains the default train arrival. Existing independent user changes and pending R103 work are excluded.

## Canonical contract

- Existing metric frame: metres, X east, Y up, Z south, WGS84 origin 34.96714 / 135.77267. Preserve mapped footprints, track traces and existing floor owners. Support new objects on assembled walking surfaces, never a guessed global height.
- Existing `keihan-station-spec.mjs`, mapped feature IDs and storefront registration are authoritative. New decoration, NPC activity and machine products are interpretive; do not claim new businesses or prices are surveyed.
- Maintain the public centerline, station egress and Omotesando first-torii entrance. Static collision data stays available when distant render detail is hidden. Interactive objects retain their ancestor identity.
- Use Three.js 0.164.1 and existing assets/dependencies. Root owns integration, viewer, route selection and chunk lifecycle. Exclusive builders own only their assigned new modules/tests and evidence notes.
- Four review angles: Rōmon floating-stone location; commercial street/machine closeup; street pedestrian/vendor view; JR crossing and right-turn approach. Initial preview plus at most three corrections. Root checks all native views and coordinates specialist review.
- Performance acceptance: compare fixed cameras/viewport and renderer counts before/after; measure chunk activation and distant animation work. Do not infer FPS gains from unit tests or draw counts. Keep navigation and collisions independent of detail visibility.

## Work plan

1. Diagnose the Rōmon floating assembly and identify original owner geometry.
2. Extend food/shop detail and add realistic, usable vending machines; populate pedestrian routes and food counters with bounded animated NPCs.
3. Detail the mapped JR track crossing and passing train. Add a guided Keihan → Omotesando option through the right turn while retaining Urasando and JR routes.
4. Implement bounded spatial activation for eligible detail/animation owners after measuring current batching; retain architectural silhouettes and walking support.
5. Verify physical paths, interaction behavior, four native views, release tests and final diff. Record remaining limitations explicitly.

## Implementation and acceptance

- Fixed stale world matrices before static batching. The displaced R102 Okusha temizuya stone geometry returns to its existing mapped owner; no stone geometry was deleted.
- Added four usable drink machines, three detailed food counters, eleven pedestrian patrols and three attendants. Drinks support selection, dispensing and collection with a visible tray item. Anonymous shop details and activity are interpretations, not surveyed business interiors.
- Added mapped curved JR tracks, sleepers, ballast, catenary, a two-car interpreted local train and live crossing barriers. Manual and guided movement use the same crossing guard; occupied crossings delay train passage.
- Added the Keihan → Hommachi right turn → first Omotesando torii itinerary while retaining Keihan/Urasando and JR.
- Spatial activation uses 128 m cells, 220/260 m render hysteresis, separate nearby commerce and NPC animation limits. Static geometry and collision/floor data remain resident; this is render activation, not disk chunk streaming. Three NPC assets load on proximity.

Final assembled physical audit: 66,468 samples across both directions and lateral lanes of Keihan/Urasando (25,566), JR (12,204), Keihan/Omotesando (28,452) and automatic platform egress (246). Zero blocked samples, unsupported samples, body intersections or duplicate top surfaces. All eleven patrols and three vendor placements admitted after commerce/context integration.

Performance observation at the same platform camera (-306.13,32.74,-181.95), 1467 × 852, DPR 1: previous build 2,272 draw calls / 3,733,059 triangles; expanded build with nearby detail 1,617 / 2,923,327 (28.8% fewer calls, 21.7% fewer triangles). Instantaneous FPS was 107 versus 159; these are observations, not a controlled hardware benchmark. In the expanded build, Entire world raises these to 3,390 / 17,816,099. This mode deliberately expands farther than the former forest radius and is not the baseline comparison. Snapshot files preserve the exact measurements; the final facade correction adds about 11k context triangles in six existing batches.

Native review confirmed the Rōmon fix, complete machine dispense/collect flow, moving pedestrians and improved Hommachi fronts. Remaining stylization: existing low-poly people, inferred storefront dressing, train appearance/timing and no visitable shop interiors. No new dependency, remote service or payment flow.

Final release checks: 753/753 tests passed (20.72 s), excluding only unrelated, unintegrated R103. Final native revision `viewer.mjs?v=keihan-street-4` reviewed. Omotesando guided route reached Rōmon; vending selection/dispense/collection passed. Crossing test held W for 4 s: camera stopped at X=-212.41 while phase=passing, front=41.78945, barrier=1. Waiting and passing train captures saved. All four specialist views approved, including waiting/passing train and Hommachi continuity. Browser logs retained older asynchronous message-channel listener errors without application stack; no new rendering/asset error was observed in the final inspection. Public deployment is not verified.
