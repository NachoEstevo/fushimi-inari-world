# R96 investigation of the two retained inspect routes

Historical local exports cited below are now in the verified private archive; see [recovery and original paths](repository-archive.md#historical-local-exports).

CPU audit of the actual integrated assembly, final colliders and walking-floor
raycasts. Evidence: `outputs/r96-integrated/inspect-route-owners.json` and
`.tmp/r96-inspect-final-evidence.mjs`. No graph, collider or geometry was changed.

## Exact blocker attribution

|Sector shortest-route centerline|Blocked samples/direction|Actual owners|
|---|---:|---|
|Gonden→Tamayama|24|Only `tamayama_dividing_rail`|
|Honden→Okumiya|75|Same24 Tamayama samples plus51 `okumiya_dividing_rail` samples|

Every blocked sample was tested against each real collider independently.
There are no building, planting, enclosure or new context blockers among these
inspect samples. Tamayama examples span X76.7075–85.304375, Z−33.7124…−33.7509;
Okumiya examples span X102.354019–114.704981, Z−17.618923…−18.015077.

At[76.7075,44.918281,−33.7124], adjacent Tamayama rail segments individually
correct the centerline by about0.28m. The sequential collision solver can push
along neighboring rail-box seams, producing larger aggregate corrections
(3.4587m at[80.6375,45.444697,−33.73]). This does not identify a3.46m-wide
obstruction. The retained physical divider deliberately occupies the source
centerline: Tamayama way105449693 is photo-supported; Okumiya way626313768 has
`handrail:center=yes` plus the recorded video reference. Rail dimensions and
exact central stations remain inferred.

## Complete connected walking alternatives

This review did not extrapolate full connectivity from the R94 upper-flight
test. It sampled both COMPLETE shortest-route polylines using the actual final
walking heights and collision world, at nominal0.25m spacing. The samples
follow the centerline on clear connectors and transition smoothly over2m onto
either±0.6m side of each divider, returning to centerline afterward. Mitered
joint normals keep those transitions connected; no independent lane teleport
or invented source edge was inserted.

Gonden uses source ways105449728→105449689→1213198209→105449693→1133055112→
1133055111→649175020→1133053715. Honden joins105449689, follows the same west
stair, then649175020→1133055117→297888105→1133055118→1133055119→626313768→
1392716577. The latter sequence matches and extends the existing R94 upper
access chain; shared mapped graph vertices connect the west flight, Tamayama
landing, turning approach and upper flight.

There is a separate small endpoint issue at Gonden: the nearest graph node
[68.92,−21.051] lies0.185581m inside the PLAYER-RADIUS clearance around the real
Gonden box (center[72.572,−21.868], half-size[2.8,3.6], yaw−1.510796).
The collider's resolved exterior position is[68.734752911,−21.039871818].
That endpoint alone requires a small correction; it does not account for any
of the24 inspect samples. Use a clear exterior snap/teleport point if formalizing
this itinerary; removing the legitimate building collider is not warranted.

The final lane audit starts at that measured resolved exterior position for
Gonden and preserves the existing Honden start. Both directions and both
divider sides are checked. The249 samples per Gonden lane/direction and392
per Honden lane/direction each
report zero collision correction, zero blocked/invalid samples, and maximum
vertical step0.156201m. Maximum horizontal sampling step is0.276866m because
the offset transition adds lateral travel to the nominal0.25m source spacing.
These are sampled CPU corridors for a0.28m player,
not a native walking session or full-width accessibility certification.
Original24 centerline audit records remain unchanged and honestly marked
inspect; no threshold was relaxed to relabel them as clear.
