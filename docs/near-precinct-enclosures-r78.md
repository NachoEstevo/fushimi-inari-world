# Near precinct enclosures — R78

Reference pixels inspected: `fushimi_inari/outputs/r77/streetview-landing.png`
(June 2012), showing the white screen behind the adjacent shrine row, and
`video-0625.png`, showing red paling beside Okumiya and the large upper torii.
These references establish visible material and screen type, not dimensions.

The supplied `geography/sources/entrance-barriers.json` contains no barrier
linework at these near-precinct coordinates. No continuous surveyed enclosure
or unseen return loop is claimed. Two short open runs derive from actual mapped
roof bounds:

- White rear screen behind shrine roofs 305214367, 305214360, 305214365 and
  305214364. Ends stop at the outer roof X extents; its line sits 0.42 m behind
  the furthest rear edge. Height 1.8 m is inferred.
- Red paling along the north side of Okumiya 301527733. Ends stop at its roof X
  extents, 0.45 m outside the north edge; height 1.45 m is inferred. This is the
  visible short screen toward the upper torii, not a fence enclosing its route.

Sections follow terrain and extend below their sampled ground corners. All
mapped route strips receive 0.30 m clearance, including access-junction triangles;
whole sections touching these openings are omitted. Solid colliders match the
remaining screen sections. Existing Tamayama fences retain their owner.

`buildNearPrecinctEnclosures(root, features, network, materials, colliders)`
reuses the existing stone, plaster, vermilion and roof materials in at most four
batches. It preserves walking heights, source footprints, route grades and
counts. No imported assets, dependencies or per-frame work are added.

Focused tests cover source-bound extents, route openings, terrain seating,
finite geometry, material reuse, blockers, idempotence and unchanged walking.
Native screenshot comparison and physical visual clearance remain integration
review tasks; the photo-inferred height and placement are not survey accuracy.
