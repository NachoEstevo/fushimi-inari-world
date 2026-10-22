# Initial precinct visitors — R80

Replaced the five unchecked reception-local spawn coordinates with up to six short public-route candidates near reception, Omotesando, Temizuya, Romon, Gehaiden and Naihaiden. Actual integrated geometry accepts five distinct routes; no valid isolated Naihaiden route is forced. Reception's nearest accepted route is beside Gehaiden rather than at the counter rail.

Every route is sampled at <=20 cm and validated against existing scene colliders using a 48 cm visitor radius. Stairs, restricted/narrow routes, abrupt walking-height changes and overlapping routes are rejected. This removes the old spawn crossing a torso-height bar; unmapped/noncollidable geometry remains outside this collision guarantee.

Visitors follow bounded routes, pause at endpoints, turn smoothly, yield within 1.05 m of the player/other visitors, and resume. Three existing Quaternius models are shared and skeleton-cloned. Imported idle animation is retained; distance-driven additive leg/arm motion fades in/out without accumulating bone rotations. No new downloads/dependencies, large crowd or general-purpose AI/pathfinding system. Update/animation is suspended beyond 65 m; initial planning measured about 0.9 s in the offline harness, not a browser benchmark.

Validation: 242 Node tests pass. Full actual integration yields five valid routes; a two-minute simulation of all five records zero scene-collider incursions. Focused tests cover torso rails, cylinder centres, blocked/stepped paths, yielding/resuming, route reversal and timestep limits. Actual skinned geometry inspected in a simplified Blender pose render. Browser animation smoothness, real-device FPS and live walking remain unverified. Ignored evidence: fushimi_inari/outputs/r80.
