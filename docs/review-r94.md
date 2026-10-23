# R94 initial precinct integration

Six Sol6.1 work packets plus independent review integrated on main.

- Omotesando: mapped road/approach junction pedestrian crossing, gutters and interrupted low curbs. User feedback rotates white bands 90 degrees. Initial walking teleport now runs after route initialization, which otherwise re-enabled orbit controls.
- Romon: north Kairo stone drip apron, 18 tiles, 6.00 square metres, 147 triangles. No invented mirrored southern addition.
- Honden: source-frame rear open vermilion balustrade and gold collars; two batches, no collision or terrain changes.
- Upper access: two terrain-seated trees plus three undergrowth pockets. Existing tree ownership wins. 3944 triangles, two batches.
- Okusha: existing two mapped service buildings gain closed side gables, side boards, corner/eave framing and plinths. Supplied photos guide horizontal counter boards.
- Okusha rear bank: two additional broadleaf trees (ten canopy instances, two batches, 4000 leaf triangles). Other candidates rejected by existing trunks, paths or mapped buildings.

## Verification

392 tests passed, zero failures. Actual production assembly CPU harness sampled 24 existing connections and explicit paired Senbon lanes in both directions. Both Senbon corridors have zero blocked samples; max sampled vertical differences 0.165 m / 0.124 m. Tamayama-Okumiya required walking lanes on both sides of the documented central rail (+/-0.6 m) have zero blocked samples, max difference 0.092 m. Centreline diagnostics correctly retain collisions with the rail. This is sampled clearance evidence, not a native walking session.

Actual crossing teleport accepts [-157.407, 35.364626, 10.342] with zero collision correction. Regression tests retain rejection of unmapped and obstructed destinations. User confirmed the app loads; later reported wrong start and requested marking rotation, both addressed in this revision. Viewer/integration cache revision 94b.

Independent read-only final review found no actionable blockers. Native browser QA unavailable: browser tool rejected access; no alternate browser workaround used. Final start/orientation still needs user visual confirmation. No FPS claim.

## Fidelity limits

See packet reference documents for actual inspected photographs, mapped anchors and inferred dimensions. This does not establish a surveyed or identical precinct. Shinsenjo remains disabled due to terrain conflict; rear bridge dimensions remain unregistered. Do not replace these uncertainties with arbitrary raised architecture.
