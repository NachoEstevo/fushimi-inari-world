# R66 — Western Tamayama access and Okumiya connections

## Reference inspected

User-opened Google Street View panorama `MvihcVb0f466FBJebqyECg`, June 2012,
near 34.9674832,135.7737795. Root inspected western descent, shrine-row frontage
and the opposite connection. The earlier Okumiya panorama
`kAc53tN99cWBDPjBcTYZcg` establishes the separate upper terrace. These are
distinct flights; their dimensions must not be copied indiscriminately.

## Changes

- Four connected western access ways use a photo-estimated 4.8 m width instead
  of the mapped 2 m placeholder: 105449693,1133055112,1133055111,649175020.
  The raw features file, route nodes and elevations remain unchanged. The
  derived path network owns both the wider rendering and walking surface.
- Main flight 105449693 receives a continuous dividing handrail, assembled
  from resolved tread joints with post and rail collisions. Generic side rails
  on that flight are suppressed to avoid duplication.
- Eight mapped access ways receive terrain support beneath their full rendered
  width and curb, while building/water interiors and unrelated stairs are protected.
- A large vermilion torii stands at the main flight's lower endpoint. Its
  5.6 m pillar span and 5.8 m height are estimates. The individual gate is not
  mapped in OSM. Existing nearby generic gates are detected narrowly before
  replacement; native inventory found none at this station. Feet use the
  rendered terrain height across their footprints, not an unrelated path level.
- Short upper approach 649175020 receives bounded one-metre gravel margins.
  Path branches, building and water polygons are clipped out. One merged mesh
  and matching triangle walking heights preserve paving ownership.

## Verification

151 Node tests pass. Root inspected the gate and descended beside the dividing
rail in the native scene; an initially suspended gate foot was corrected before
final verification. Scoped diff and syntax checks pass. Screenshots remain local
under ignored `fushimi_inari/outputs/r66/`; Google reference pixels are not
redistributed in source or used as textures.

## Still incomplete

This is a connected-access pass, not completion of the entire compound. The full
mineral courtyard, shrine-row architecture, stone fences, pedestal lanterns,
drainage and detailed retaining walls still need reconstruction. Local graded
terrain determines stair rise/count; the coarse raw DEM alone cannot establish
them. Width and gate size need further photographic calibration. No surveyed
accuracy or quantified GPU performance claim is made.
