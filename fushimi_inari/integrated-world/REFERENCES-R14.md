# Revision 14 — navigation, English UI and higher-resolution profile evidence

## Implemented

Four keyboard-accessible tabs: Movement, Checkpoints, Routes and Environment.
Tab arrow keys/Home/End work; one panel is visible at a time. Scrolling is inside
the panel so navigation remains accessible. English controls, status messages
and concise interaction summaries preserve original source text and callbacks.
Title contrast now survives bright skies; minimap labels avoid overlapping each
other. Attribution and minimap occupy separate areas.

Free flight is distinct from walking and orbiting: pitch-relative WASD, vertical
R/Space and F/Ctrl, independent speed and Shift boost. No terrain snap or walking
collision is applied in flight. Esc freezes movement. Returning to Walk resumes
terrain-following movement. No extra render loops or dependencies were added.

Mitsurugi checkpoint now selects the existing mapped return route and faces
along it, avoiding the previous arrival facing the altar compound.

## Evidence for all 52 profiles

`profile-evidence-r14.json` records all 52 unresolved profiles, source tile hashes,
2.5 m sampling along OSM alignments, DEM5A elevations, existing scene rise and
local-grading status. Sampling does not turn a 5 m model into a step survey.
Current PNG tiles were used: GSI says text tiles stopped being updated in 2024.

- Tile specification: https://maps.gsi.go.jp/development/demtile.html
- Official layer catalogue: https://maps.gsi.go.jp/help/use.html
- Official Mitsurugi context: https://inari.jp/en/map/spot_14/
- Street View: Mitsurugi Shrine, Luke Hall, April 2018,
  panorama CIHM0ogKEICAgICk9Jv8wgE, 34.9685908, 135.7859655.
  Rotated downward and to the side; visible stone stair flights, narrow landings,
  stone retaining walls and compact roofed structures among votive altars.
  The blurred/occluded foreground prevents reliable complete step counts.

50 profiles have complete DEM5A samples. `way/790920592` and `way/790920593`
have missing samples. Ichinomine `way/1271062689` has a DEM5A endpoint rise of
2.069 m versus almost zero in the graded scene, with 14 steps recorded in OSM.
Mitsurugi `way/1270763270` has a negative DEM5A endpoint rise while its OSM
incline tag says up. These contradictions require resolving exact alignment,
landing elevations and original compound geometry together.

**No new measured stair geometry is claimed. All 52 remain dimensionally
unverified.** The higher-resolution evidence is not automatically applied to
terrain because that could bury preserved platforms or create discontinuities.
The original terrain and all authored architecture are unchanged.

## Walking validation

`?audit=1` enables an opt-in check of every unresolved centerline in both
directions at intervals no larger than 25 cm, using the real walking surface
and collision resolver. Normal startup does not run this additional audit.
`profile-walk-audit-r14.json` records 4,708 samples across 52 profiles.
51 pass the centerline check. Mitsurugi `way/1270763270` has 30 blocked samples
across both directions: the broad `peak_sanctuary` collider overlaps the lateral
access. This is an open defect, not a pass. The collision box cannot simply be
removed without reconciling visible shrine geometry. No stair heights changed.

## Verification

49 Node tests pass, including new flight vertical movement, pitched diagonal
normalization, boost, frame bounds and invalid-input handling. Syntax and diff
checks pass. Original HTML SHA256 hashes match revision 13.
Browser checks: four tabs, English labels, flight ascent/descent/forward,
menu pause without displacement, checkpoint switching and walking from the
revised Mitsurugi arrival. Mobile physical-device validation remains unperformed.
No extra browser instances were created. The 52-profile audit is not a claim
that the full precinct or all access paths are complete.
