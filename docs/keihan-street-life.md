# Keihan street pedestrians and food attendants

Owner: `keihan-street-life.mjs`. This supplements the existing shrine visitors without changing their routes, assets, rig or lifecycle. Activity is interpretive, not a claim about actual shop staff or crowd density.

## Placement and movement

Eleven eight-metre patrols use existing mapped public surfaces: three on western Inari-shinmichi, one east of the railway, three on Hommachi toward the right turn, three along Omotesando, and one on Urasando. Each candidate is sampled at no more than 20 cm, must be publicly walkable, supported by the final `assembly.walkHeight`, and clear of the assembled collision capsules. Abrupt height changes, gaps, restricted surfaces and stairs are rejected. Offsets favor the street edge while leaving the center available. The canal/railway band is excluded, so these NPCs cannot enter a train closure.

The existing visitor state machine supplies pauses, walking, turning at endpoints and yielding to the player or another person. Hidden actors pause in place; they never catch up with a large time step after returning. NPCs yield to the player rather than adding hard capsule obstacles to the player's walking route.

Three attendants use the registered senbei, soft-serve and grill storefront frames. Each stands at local `u=width/2, v=-1.12`, behind the counter on the shop owner's exact floor, faces the street and uses a 20 cm placement radius. This staff recess is reserved with the commerce owner. Back-wall/counter collision changes fail closed by omitting the affected attendant. Subtle head turns and serving arm motion are additive over the existing rig's idle animation; no translation or walking is applied to attendants.

## Integration

Install after the final walking-height correction and after commerce colliders have been registered:

```js
const streetLife = installKeihanStreetLife(assembly, {
  onStats: stats => document.body.dataset.streetLife = JSON.stringify(stats),
});
// In the existing frame loop, time is in seconds:
streetLife.update(camera, time / 1000);
```

The return value exposes `group`, `groups`, `people`, `plan`, `stats`, `ready`, `update` and `dispose`. `ready` waits only for a load already triggered by proximity; reading it while distant does not defeat lazy loading. The root scene remains the sole owner of the frame loop and browser review.

## Bounded runtime cost

- No asset request until the camera is within 72 m horizontally and 26 m vertically of a person.
- Three existing GLBs are requested once for this owner (about 1.18 MB combined); geometry/materials are shared between skeleton clones. No new textures, dependency or point light.
- Visibility hysteresis: enter at 54 m, leave at 64 m; high aerial cameras also hide the actors. Hidden actors execute no movement, mixer or gait updates.
- Visible movement uses bounded frame delta. Skeletal animation updates at 30 Hz within 20 m and 15 Hz farther away.
- The three existing models contain 6,492 / 6,624 / 9,236 triangles and 6 / 6 / 5 material groups. Fourteen simultaneously visible actors would add at most 80 main-pass material draws, but placement and visibility restrict the actual active subset. This is a geometry budget, not a measured FPS claim.
- Collision/path planning occurs once. Actual-assembly layout validation measured 151.5 ms on this host after bounding candidate scans; the initial unbounded prototype took 7.76 s and was corrected before delivery.

## Verification

Eight focused tests pass: continuous public floor/capsule clearance; unsupported/steep/private/disconnected/railway rejection; staff recess collision; distance/height hysteresis; actual skinned-asset loading, player yield, stationary staff, distant animation suspension and disposal; and three real-asset serving-pose regressions in a rotated storefront. `node --test fushimi_inari/integrated-world/keihan-street-life.test.mjs`.

An actual CPU assembly plus the final emitted-path height correction produced all eleven patrols and three attendants with zero omissions. The sampled route coordinates and staff positions are in `outputs/keihan-street-life/layout.json`. This CPU evidence predates final commerce integration; root must retain the post-commerce planning order and inspect the native pedestrian/vendor view. Visual appearance and final browser performance remain root-owned acceptance checks.

Native specialist review saw two unobstructed pedestrians on the Hommachi lateral route and a correctly centered food attendant. The first serving gesture was hidden because the asset's shoulder axes are oblique: local-X rotation moved the hand behind the body. The corrected gesture rotates around the character's lateral axis expressed in each shoulder-parent frame. Actual skinned forearm/hand vertices are tested across all three assets and 36 animation samples: forward over the 1.02 m counter top, within the clear central 1 m gap, and within 62 cm of the staff position, with unchanged grounded feet. Root will verify the corrected pose in the next native capture.
