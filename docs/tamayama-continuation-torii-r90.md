# R90 — Tamayama right-turn gate and connected route

The large vermilion gate visible when turning right from the top of Tamayama's
western ascent was missing. The existing lower western gate remains at
`[75.725,-33.708]`; it was not moved, resized or duplicated.

## Source and registration

Read [the R90 stair reference](tamayama-stair-reference-r90.md) and inspected the
root's actual June 2012 Google StreetView panorama captures, including
`streetview-south-180.png` and `streetview-west-270.png` in
`fushimi_inari/outputs/r90-tamayama/`. The south view shows a distinct tall gate
along the continuation beyond the right turn, with the shrine row at left and
the treed bank/large stone lantern at right. This is historical photographic
evidence, not a survey or proof of present-day maintenance state.

The existing mapped chain is retained in full:

`1133055117 → 297888105 → 1133055118 → 1133055119 → 626313768 → 1392716577`.

These ways connect the upper western junction at `[97.199,-33.841]` southwards,
then turn east up the broad Okumiya flight. Tamayama's separate prayer approach
`way/1133053715` and opposite north branch are unchanged.

The new gate station is **`[97.437,-22.676]`**, the mapped short-step/landing
junction. The photograph supports the separate gate and route relationship;
this exact station remains an explicit scene inference. No individually mapped
gate centre, measured original post span or surveyed height is available.
Estimated post span/height are **5.6/5.8 m**. It uses the existing torii template,
whose actual post centres are ±1.24 m and maximum template height is 3.450712 m.
Vertical scaling consumes that actual bound, so model height includes the cap.

Before implementation, an actual assembled-scene audit found **zero** active
vermilion torii stations and zero vermilion gate colliders in X 88–126,
Z −43–0. The separate Senbon stone gate around X 124 was retained. The new
builder also refuses a duplicate if a future active instance or dedicated torii
collider already owns this station.

## Owner and integration

`tamayama-continuation-torii.mjs` owns the gate and exports:

```js
buildTamayamaContinuationTorii(root, legacy, features, surfaces, colliders,
  {terrainPositions: renderedTerrainPositions});
```

The root integrates it beside the existing lower-gate call. The module adds one
gate with two post colliders. Its observed front 奉/納 uses the existing shared
curved inscription helper with `frontOnly:true`; no donor/date is invented on
the reverse. The optional helper flag defaults to the previous full behaviour.
The new import uses `?v=90-front` so an older cached helper cannot ignore it.

## Feet seat to the rendered mesh

Initial native inspection exposed a foot-seating defect: height-function samples
did not reproduce the viewer's actual adaptive terrain triangles. That draft was
rejected. `terrain-triangles.mjs` now exports a shared
`integratedTerrainTriangles(terrain, anchors, pathDistance, terrainHeight)` that
owns the original viewer detail predicate and −0.06 m terrain offset. Root builds
the positions once and shares them with viewer, gate and mineral-court extension.
No alternative terrain heights or blanket terrain lowering are introduced.

The gate filters triangles under its two foot disks and raycasts each centre
plus 32 circumference samples. Each toe extends 0.04 m below the lowest actual
mesh hit. It disposes the temporary raycast geometry/material afterwards.
The actual scene toe levels are **49.816526/50.231930 m**, with beam datum
**50.295018 m**. These are rendered-scene datums, not site measurements.

Using the shared cached positions, this filtering/raycast/build stage took
approximately **16.3 ms in the Node audit** on this machine. An earlier repeated
full-terrain generation took 3.74 s; the final integration shares the original
viewer work once. These numbers are startup diagnostics, not browser GPU timings.

The physical post centres are `[94.643583,-22.484114]` and
`[100.230417,-22.867886]`, radius 0.325161 m. The entire actual gate template,
including projecting cap tips, spans X **92.655620–102.218380** and
Z **−23.327310–−22.024690**. All retained opaque scene triangles were tested
against the full upper-beam envelope: zero triangle-AABB overlaps and zero
solid-box overlaps. The bank lantern at `[94.1,-28.9]` and tree stems remain
separate from both physical posts. Foliage contact and fine joinery are not a
surveyed reconstruction.

## Evidence and limits

Actual production geometry, actual viewer path meshes and the same shared terrain
positions were exported to Blender 5.2.0 LTS, Cycles, 24 samples, 960 × 720.
The before assembly disables **only the new gate call**, retaining the same
current landscape/court context. An earlier candidate comparison that already
contained the newly integrated gate was detected and discarded.

| Fixed view | Before | After |
| --- | --- | --- |
| South continuation | [before](review-r90-gate/before-south.png) | [after](review-r90-gate/after-south.png) |
| Reverse from upper approach | [before](review-r90-gate/before-upper.png) | [after](review-r90-gate/after-upper.png) |
| West oblique | [before](review-r90-gate/before-west.png) | [after](review-r90-gate/after-west.png) |

These offline renders omit alpha-textured foliage and inscription patches and use
approximate diffuse colours. White/flat-looking paving and clipped distant context
are export limitations, not claims about native material appearance. Actual native
captures `native-south-seated.jpg` and `native-feet-close.jpg` were independently
inspected here: the corrected black feet meet the mineral court and the front
writing is visible. Browser captures and manual passage evidence remain owned by
root/reviewer; this owner did not drive the live Maps or viewer tab.

New authored gate geometry totals **480 triangles**, including both foot
extensions and front glyph patches; three material types and two post colliders.
No light, animation, external texture request or dependency is added.

Eight focused/adjacent tests pass across `tamayama-continuation-torii.test.mjs`,
`gonden-access-torii.test.mjs` and `terrain-triangles.test.mjs`. They cover the real
route chain, unchanged lower gate, centre passage, physical post collision,
deduplication, full template bounds, supported front glyph UVs, unchanged default
inscription behaviour and a nonlinear-terrain regression proving sampling of the
actual rendered face rather than its source function. Syntax/diff checks pass.

The actual full-assembly route audit sampled **747** positions on three tracks
across the six-way chain: the gate introduces zero collision corrections.
The first three southbound ways are clear of all assembled obstacles. On the
broad main Okumiya flight the exact centre correctly meets the existing dividing
handrail; separate probes at ±0.65 and ±1.2 m have zero corrections over 101
samples each. A centreline-only report must not hide that intentional rail.
Root/reviewer also confirmed native passage through the gate.

Exact source dimensions, precise historical gate station, roof profile/joinery,
full contemporary photographic matching and whole-precinct acceptance remain
unverified. This packet restores the missing right-turn connection landmark;
it does not establish a complete replica of Fushimi Inari.
