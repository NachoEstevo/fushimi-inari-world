# JR crossing detail and passing local

Owner: `keihan-jr-crossing-detail.mjs`. Units and axes match the existing world: metres, X east, Y up, Z south, origin 34.96714 / 135.77267. Root owns shared integration, movement gating, quality/chunk activation and native visual acceptance.

## Registration and ownership

The [west track OSM way 24590286](https://www.openstreetmap.org/way/24590286) and [east track way 801938138](https://www.openstreetmap.org/way/801938138) were fetched through the OSM API `/api/0.6/way/<id>/full` on 2026-10-24. The source tags identify JR Nara Line, 1,067 mm gauge and 1,500 V overhead contact wiring. Frozen plan nodes in the module preserve their curvature. Crossing nodes are 717498925 at X −207.744854 / Z −85.760536 and 3338256050 at X −203.648887 / Z −85.382049. The retained road `way/79699849` must still contain both crossings within 2 mm of the rounded imported values or the new owner refuses to build.

The existing station had a 240 m straight rail tangent extending north toward the crossing. Its north end did not meet the independently mapped curved tracks. When this owner is available, root shortens that rail owner to local v = −40. The new curved track detail ends exactly on the retained station's `track.local(trackU, -40)` coordinates and rail datum. The final short source-node-to-station connection and all vertical railway grades are inferred; this is not a surveyed alignment. Train positions use the same curve and continue on the retained station tangent after the join.

The earlier four 10 m embedded asphalt rails remain owned by `keihan-approach`. New rail heads connect to their existing endpoints/tangent; raised sleepers and ballast stop outside the full protected road/sidewalk rectangle. Root omits only the former inert crossing-device loop when this builder succeeds. The new two mechanisms provide the same static cylinder collision footprints, hinged striped barriers, crossbucks, alternating red lenses and metal cabinet details. No device, floor, road or terrain owner is duplicated.

## Visible additions

- Two curved track approaches with ballast shoulders, concrete sleepers, rail webs, fastening pads and 1,067 mm rail spacing.
- Catenary masts, crossbeams, ceramic insulators, contact wires and suspension droppers.
- A two-car interpreted stainless/green JR local: framed windows, paired doors/handles, side ribs, destination panels, cab glazing/wipers, headlights, bogies/wheels, underbody equipment, roof cooling fins and pantograph. This is a 205-family visual interpretation consistent with the earlier station train, not an exact current numbered train, formation or service assignment.
- Working barriers and alternating emissive signal lenses. These are material emission only: zero added light objects or shadow/reflection capture passes.

Source appearance references remain the user's October 2024 station/bridge/crossing Street View observations documented in `inari-followup-route-research.md`. Device sizes, train dimensions, materials and operational timing are interpretive. No timetable simulation is claimed.

## Runtime contract

`createKeihanJrCrossingSpec(features, surfaces, inariSpec)` validates the frozen plan and returns a canonical layout or null. `buildKeihanJrCrossingDetail(root, features, surfaces, colliders, {spec})` is idempotent and returns `group`, `trainGroup`, `detailGroups`, `update(camera, timeSeconds)`, `canMove(from, to)`, `status`, `blockedMessage`, `stats` and `controller`.

The entire root group is marked dynamic and must be excluded from global geometry baking. Track material batches are separated into 40 m groups for the root detail activation system. There are no changing world colliders and no terrain sampler override. The static device collision cylinders remain present even when render detail is hidden.

The train approaches from the north and stops 19 m before the crossing. It waits until the existing occupant has left, warns for four seconds, lowers the barriers, passes on the west/P1 track and reopens after the entire train clears the crossing plus ten metres. The root **must call `canMove` before both manual and guided movement**. The guard checks the whole proposed segment, including fast steps whose endpoints both lie outside the rectangle. It blocks new entry during warning/passage but lets an occupant retreat; flight above the train remains available. A teleport into the protected zone pauses an already committed train until the person leaves.

Animation uses bounded 0.1 s steps, with no background catch-up. Distant pre-arrival animation freezes beyond 190 m. A completed train remains down the line for a 30-second dwell before another pass can start while the visitor stays at the bridge. The reset still requires more than 100 m clearance from both entire old and reset formations, including their tails; it does not suddenly disappear next to the viewer. Leaving the neighborhood beyond 190 m allows an earlier reset only with the same formation-clearance checks. These are explicit simulation safeguards, not railway operating rules.

## Verification

Ten focused Node tests pass: sourced crossing and exact station seam; fail-before-mutation source guards; finite bounded batched geometry, idempotence and no added lights; clear public floor; waiting for occupants; swept movement protection and retreat; full train-clearance lifecycle; bounded background steps and no nearby reset; repeated passes for a viewer remaining 16 m west of the crossing; and reset prevention beside the tail or future spawn formation.

```powershell
node --test fushimi_inari/integrated-world/keihan-jr-crossing-detail.test.mjs
```

Initial CPU geometry inventory: about 51k track-detail triangles split across 40 material batches in 40 m groups, 730 sleepers, about 4.8k train triangles / 22 material/sign batches, two static mechanism cylinders and zero added lights. Root's native tests must validate final visible counts, animation, collision gating and the bridge/crossing camera view. CPU construction and tests alone do not establish visual quality, FPS improvement or current historical accuracy.

The right-turn walking alternative uses `way/79699850` south from Hommachi's junction X −157.252 / Z −85.95 to X −157.407 / Z 10.342, then `way/105449722` east through the first Omotesando torii. Route implementation remains root-owned.
