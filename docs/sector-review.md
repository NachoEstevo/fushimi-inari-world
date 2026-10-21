# Sector review and reconstruction queue

Updated 21 October 2026 · R35. This is the working inventory for the next stages,
not a claim that the whole precinct has been reproduced.

## Acceptance order

1. Account for sectors, route alternatives, entrances and exits. Fix physical access.
2. Match each sector's proportions, floors, steps, walls, roofs, vegetation and furnishings to references.
3. Improve people, movement and interactions after circulation is stable.
4. Refine lighting and the city panorama. Keep distance-based rendering throughout.

A mapped footprint is not a completed building. A connected graph is not a walkable
scene. A clear sampled centreline is not a complete courtyard or doorway inspection.
No sector has passed a dimensional survey.

## References inspected in this revision

The [official site map](https://inari.jp/trip/map01/) was checked against the
22 architectural anchors and the extra outlook checkpoints. The following paused
frames of the user's low-crowd tour were visually inspected; video screenshots
are not redistributed as project assets.

| Reference | Observation | Use / remaining question |
| --- | --- | --- |
| [02:05](https://www.youtube.com/watch?v=zFKeYi0AK0M&t=125s) | Central slab strip, broad gravel margins, stone lanterns and lateral buildings on approach | Omotesando needs a site-specific lateral inventory, not generic empty ground |
| [03:10](https://www.youtube.com/watch?v=zFKeYi0AK0M&t=190s) | Broad Rōmon stairs, planted retaining tiers, lanterns and fox plinths | Preserve open stair width; compare building and garden proportions |
| [05:30](https://www.youtube.com/watch?v=zFKeYi0AK0M&t=330s) | Fenced worship pavilion; paved circulation is outside the pavilion | Do not create a walking shortcut through Gehaiden; inspect both sides |
| [10:00](https://www.youtube.com/watch?v=zFKeYi0AK0M&t=600s) | Broad upper approach staircase with a central handrail and landings | Match its location to the map before changing step counts or assigning it to a particular hall |
| [12:00](https://www.youtube.com/watch?v=zFKeYi0AK0M&t=720s) | Narrow torii passage, paved centre and leaf/gravel edges | Fine paving scale, dirt margins and torii variation still need work |
| [13:00](https://www.youtube.com/watch?v=zFKeYi0AK0M&t=780s) | Torii passage opens directly toward the court and worship building | Retain the continuous Okusha arrival rather than a terrain bank |
| [13:30](https://www.youtube.com/watch?v=zFKeYi0AK0M&t=810s) | Basin, bamboo ladle support, stone retaining wall and small adjacent steps | Add to the Okusha-area inventory; precise placement still needs cross-checking |
| Google Maps, user-supplied Ninomine panorama, shin kane, February 2020 | Stone flight with sloping stone side edge; vermilion lanterns, banner and dense stone monuments | Existing Ninomine is still too generic; the panorama is a dated photo sphere, not a surveyed elevation profile |

The [other user-supplied tour](https://www.youtube.com/watch?v=FmRyJ-RtBPg&t=84s)
and the user's visit photographs remain references. Its earlier observations are
in the R18–R27 notes; it was not rewatched in full in R35. No two-hour tour or
entire Street View route was reviewed continuously in this revision.

## Sector inventory

| Sector | Present implementation | Next acceptance work |
| --- | --- | --- |
| Omotesando / approach | Mapped streets, original approach architecture | Lanterns, lateral plots, gravel boundaries, entrances and reference alignment |
| Rōmon / Temizuya | Original gate, tiered planting, basin, frontage and side access | True proportions, both lateral routes, walls and garden limits |
| Gehaiden / reception | Pavilion, reception and lower courtyard | Remove artificial side banks; verify clearance around the pavilion rather than through it |
| Naihaiden / Honden | Buildings, stairs, upper platforms and mapped side paths | **Priority:** southern mapped approach has collision conflicts; distinguish public approach from fenced sanctuary |
| Gonden / Tamayama | Separate anchors and adapted shrines | **Priority:** last few metres to Tamayama still collide; exact stairs and compound boundaries remain unverified |
| Okumiya / Byakko-sha | Existing compounds and mapped connections | Broad approach stair, handrail, landing and lateral access correspondence |
| Senbon Torii | Two distinct corridors and shared arrival | Both full manual walks, entrance elevations, fine paving and edge treatment |
| Okusha | Shared terrace, hall, counters, ema and Omokaru elements | **Priority:** departure pinch point; reference basin, stone steps and north exit details |
| Kumataka / pond | Mapped pond, shrine and route | Shore retaining stonework, access terraces and branching inventory |
| Mitsu-tsuji | Mapped junction and ascent | Inventory each branch and destination; no inferred shortcuts |
| Yotsutsuji / two tea houses | Terrace, outlook, buildings and furniture | Platform outlines, building entrances and side stair correspondence |
| Kojingamine / western outlook | Extra mapped outlook checkpoints and city view | Dedicated connection audits and full manual arrival/departure walks still missing |
| Sannomine | Anchored compound, torii and stairs | Reference-led enclosure, stone monuments and connections toward Ainomine |
| Ninomine | Anchored compound and ascent | Replace generic layout with the panorama's stone flight, margins and monument arrangement |
| Ichinomine | Summit compound and bell interaction | Approach platforms, subsidiary shrines and full summit enclosure inventory |
| Mitsurugi | Existing compound and return route | Off-centre camera clearance and lateral access; sampled main route is not enough |
| Gozendani | Existing compound and mapped return | Branch access, retaining walls and correspondence of individual structures |

### Official-map coverage gaps

These named places must be tracked separately before calling the model a complete
precinct. They are not implied complete by the surrounding terrain or OSM buildings.

| Place | Current evidence / gap |
| --- | --- |
| Ainomine / Kada-sha (間ノ峰・荷田社) | Official map identifies a separate sanctuary between the peaks. Local OSM `way/626313742` at `[939.488, 196.93, 0.456]` is a candidate geographic anchor. No dedicated architectural anchor currently exists. Do not confuse it with the other Kada-named shrines at the entrance. |
| Kiyotaki (清瀧) | Official-map sector; no dedicated architectural anchor. Verify mapped access and compound before building. |
| Miyuki worship place (御幸奉拝所) | Official-map sector; no dedicated architectural anchor. Location and access cross-check pending. |
| Teicho-an (啼鳥菴) | Official-map building; no dedicated architectural anchor. Footprint identification and visual inventory pending. |
| Ochaya / Komu headquarters | Official map lists these separately from mountain tea houses; generic mapped volumes do not certify a faithful reconstruction. Verify footprint attribution and exterior-only access. |
| Subsidiary stone shrines, water sites and minor branches | Inventory incomplete. Do not equate the 22 anchors with every shrine in the precinct. |

## Repeatable access audit

Open `integrated-world/index.html?audit=1` on the existing server. The opt-in
`data-sector-audit` attribute on the document body reports 24 connections covering
all 22 architectural anchors. It samples the existing OSM routes every 0.25 m in
both directions using the actual runtime walk height and collision solver.
This adds no per-frame audit work in normal exploration.

[Recorded R35 results](audits/sector-audit-r35.json): **24/24 graph-connected;
20/24 sampled centrelines clear; 4/24 need physical inspection.** The latter
represent three distinct problem areas because the return repeats Okusha.

| Connection | Remaining physical finding |
| --- | --- |
| Naihaiden → Honden | 50 obstructed samples per direction; examples near `(45.23, 13.12)` and `(66.40, 11.50)` in X/Z metres. Do not remove building collision without identifying the true public side corridor. |
| Gonden → Tamayama | 3 obstructed samples per direction near `(101.81, -33.93)`. Ground discontinuity reduced from 0.5555 to 0.2300 m per sample after the datum correction; final entrance still needs inspection. |
| Okusha → Kumataka | 1 obstructed sample per direction at `(255.78, 58.76)`, 0.359 m correction. Isolate the prop/collider before moving the exit. |
| Mitsu-tsuji → Okusha | Same Okusha pinch point in the return itinerary. |

The graph snaps buildings to nearby exterior nodes: reported gaps reach about
12 m. Those last metres, stair widths, off-centre passage, building interiors,
bridges, all unnamed branches and all source access restrictions need separate
review. Route lengths/ascent in the JSON use the mapped DEM route, not a new
measurement of the adjusted architectural floors. Both Senbon graph alternatives
also retain their existing independent connectivity regression tests.

## Corrections and manual checks in R35

- **Mountain torii:** omit an inferred gate when a post overlaps a mapped walking
  centreline at a junction or tight bend. The same decision controls visible
  geometry and physical pillars. 23 candidate gates omitted, 1,290 retained;
  no new textures, dependencies or per-frame check. Historical source counts are unchanged.
- **Tamayama:** removed the incorrect shared Naihaiden datum. Its original GSI
  elevation is retained instead of excavating an approximately 6 m depression.
  This fixes an artificial transition, not the still-unsurveyed physical stairs.
- Walked through Rōmon to the front of Gehaiden and around its southern side;
  stopped/redirected at the pavilion's physical boundary. Reached `(29.81,44.08,9.97)`.
  Visible side banks and ramp-like paving remain unacceptable and are priority work.
- Walked from Naihaiden toward the reception-side margin to `(39.57,44.08,-12.73)`;
  confirmed the artificial bank is still visible. This is not a passed full lateral route.
- Entered Senbon and walked to `(198.48,62.52,30.16)`. The full twin corridor manual
  comparison is pending; it was not replaced by a teleport claim.
- Inspected Tamayama after the elevation change and walked to `(98.64,51.67,-29.60)`.
  Nearby paving borders and sparse compound context still require reconstruction.

Camera coordinates above include eye height. Local review capture:
`fushimi_inari/outputs/r35/tamayama-access.png` (ignored evidence, not a finished beauty shot).

## Next work package

1. Resolve the three physical conflict areas and the lower-court banks against
   mapped paths and the paused references. Capture before/after from fixed poses.
2. Walk both Senbon branches end-to-end and the Okusha north departure, including
   a sideways clearance pass. Align the court basin and small stone steps.
3. Establish Ainomine's dedicated sector and verify the official-map omissions.
4. Work outward through Kumataka, Mitsu-tsuji and the summit circuit, retaining
   per-sector reference times and explicit unverified dimensions.

People, lighting and expanded city detail remain later stages. A successful unit
test or this inventory does not close these outstanding reconstruction tasks.

## R38 · Okumiya facade pass

Revisited the user's Rec Lab tour at the 10:00 approach
(https://www.youtube.com/watch?v=zFKeYi0AK0M&t=600s). The frame shows three
recessed dark front bays, hanging brass fittings, layered vermilion eaves and a
pitched bark roof. Replaced the generic front appearance with bay carpentry,
beam brackets, rafter ends and suspended lantern assemblies. The existing
building, veranda, collision and interaction remain. Roof silhouette and all
new dimensions are inferred, not measured. Geometry joins existing static batches;
no new textures, dependencies, point lights or per-frame updates.

Reopened the existing February 2020 Ninomine panorama in Google Maps: stone
stair cheeks, tall vermilion lanterns and dense stone monuments remain an
independent next work item, not evidence for Okumiya's dimensions.

The front now faces the mapped western stair, inferred from the video.
Still open at Okumiya: surveyed orientation,
platform outline and side grades, lower lattice pattern, roof ornament and
adjacent lantern pedestals. This is a facade improvement, not sector completion.

## R39 · parallel sector work, integrated and reviewed

Three Sol 6.1 agents produced bounded changes; root reviewed and integrated them.
- Okumiya: local terrain support for five mapped access ways, bounded evaluation
  outside the sector, and curb clipping across the existing short landing. Four
  regressions cover surface preservation, shoulder continuity, scope and actual
  OSM connectivity. Visual review still finds a raised side strip at the upper
  landing; this is NOT marked resolved by the terrain/curb changes.
- Ninomine: existing mini offerings are open torii with black caps; existing stone
  monuments have rounded crowns, restrained mineral variation; stair cheeks slope
  toward the foot. Placements and walking width retained. Root inspected the front
  staircase in the live scene. Full compound fidelity remains pending.
- Ainomine: see [reference and incorporation specification](ainomine-reference.md).
  Geographic identity and graph access are documented; architecture is not built.

Validation: 91 Node tests pass, diff whitespace check passes, no browser console
errors in local review. No full-route manual certification or FPS benchmark.
Evidence: ignored local outputs/r39 directory under fushimi_inari.

## R40 — Entry mineral ground and purification basin

- Three Sol 6.1 agents researched entry references, implemented the localized mineral ground shader, and refined the existing temizuya. Root integrated and performed two visual passes.
- User photos 1/2 establish grey slab/cobble paving and confined dark gravel; photo 7 establishes a rectangular granite basin with ladles and damp growth, not a central ornamental fountain. Root also inspected Attractions Atlas video FmRyJ-RtBPg, paused at 4:17: reception forecourt has slab strips and dark gravel. Bench placement and a central fountain remain unconfirmed.
- Side aprons use the existing gravel map on the existing terrain, with mapped paths/buildings/water and authored planting exclusions. Extents are inferred, not surveyed. No extra terrain draw calls or colliders.
- Basin detail preserves water and ladle roots, adds drain channel and metal lips. Render review rejected large dark moss blobs and inherited uniform green band; second pass uses subtle lower wet growth (58 instances) and removes band. Shared gravel color removes courtyard overlap tint seam.
- Validation: 95 Node tests pass, diff whitespace check, browser loaded without console errors; short walking approach and lateral movement at Temizuya. No full-site walking audit or FPS benchmark in this pass. Existing Okumiya landing height strip remains outstanding from R39.
- Local captures: fushimi_inari/outputs/r40/temizuya.png. No push.

## R41 — Azumamaro side approach
- Inspected user-open Google Street View panorama ALTClVF04s972933Dg4p2g, June 2012, in two directions: Azumamaro marker/torii and roofed timber gate, plaster/timber tile-capped wall; rear of Romon with gravel and stone routes. No central fountain visible in these views.
- Added mapped marker node/10964871774 and visually inferred torii station on path way/105449706. Dimensions remain estimates. Existing mapped buildings retained. Added side entrance checkpoint.
- Visual QA exposed an inherited illustrative Kagura-den carried with Gehaiden onto the mapped approach. Excluded that source group and its collider from the integrated scene; original source and main Gehaiden retained. Walked from checkpoint through torii (camera reached x16.67 z19.22), no console errors. Second visual correction extends torii footings to the lower terrain shoulders.
- 95 tests passed before final footing adjustment; syntax and diff checks pass. Roofed timber gate, plaster wall, residence facade, planting and exact historical/current proportions remain incomplete. Local screenshot r41 shows the intermediate entrance; not a claim of complete replica or surveyed geometry.

## R42 — Azumamaro whole entrance pass
- User screenshot codex-clipboard-17926ce1-8ffd-4c0e-a513-81cc3976e7b1.png and a second rotated June 2012 Street View angle guide the ensemble. Three Sol 6.1 agents separately authored gate/wall, mapped houses, and trained pine/hedge/support poles.
- Added timber boarded gate with tiled gable, plaster/timber boundary, glazed enclosure on existing way/305214616, red rear worship hall on way/305214824. Replaced prior generic courtyard shop representation; mapped polygons retained and duplicate extrusion excluded. Heights/facades remain inferred.
- Added pine, hedge, three props and short red fence. Second render pass reduced large smooth foliage clumps to irregular small tufts and corrected house height from highest rear corner to median front access elevation.
- Existing static merge/chunking retained; roof ribs and foliage instanced. No FPS benchmark; 95 tests passed, syntax and diff checks passed. Full dimensional identity is not established: roof proportions, signage, other adjacent buildings and vegetation still need comparison. No push.

## R43 — Azumamaro signage and timber finish
- Added white prayer reception board with wording read from supplied reference, metal support and low marker stones. Torii plaque reads shrine identity but is explicitly marked inferred because reference lettering is unreadable.
- Simplified wall coping ridges (removed oversized stacked crowns on every short wall segment); added shared 128x256 subtle timber grain/bump to existing doors and boards, no extra geometry.
- 95 Node tests passed. Syntax/diff checked. Browser console clear; walked through approach to x16.70,z19.24 with new banner present. Visual capture outputs/r43/azumamaro.png. Remaining fidelity gaps include general vegetation, facade/roof proportions and exact unmeasured offsets. No FPS benchmark or push.

## R44-R45 — Azumamaro proportions and Gehaiden balustrade
- Compared the supplied Azumamaro entrance photograph and previously inspected June 2012 Street View. Lowered tiled gate/house eaves, added curved gable infills and roof surfaces, retained mapped footprints. Dimensions remain visually inferred.
- Replaced solid pine clumps with instanced needle sprays and fine hedge leaves. Fixed black hedge shading: its plane has no vertex color attribute, so its cloned material disables vertexColors while keeping instance colors. Reduced cards to 795 pine / 600 hedge and retained shared geometry/materials.
- Repaired three exact connected slab components in the actual Gehaiden GLB that filled its verandah. Replaced them with eight open perimeter rails and sixteen discrete gold clasps; source roofs, columns, pickets and materials retained. Browser fixture tests actual tracked GLB, preservation and idempotence; PASS.
- Added bounded Azumamaro court grading before path construction so terrain, paths, houses and walking share the same surface; mapped stair corridors excluded. The lateral shoulder is inferred, not a surveyed height map. Distant apron transitions still need reference-based reconstruction.
- Removed exactly two observed legacy sugi and their paired crowns/blockers within the entrance envelope. Adjacent maple and farther woodland retained. Browser reports 2 cleared, 3 Gehaiden slab repairs; console errors empty. Walked through torii to camera x16.68,z19.49.
- 99 live geography/integrated-world Node tests pass; syntax and whitespace checks pass. A broad recursive test discovery also picked up old ignored output snapshots, whose missing relative imports fail; those are not the live test suite. Browser Gehaiden fixture uses the production pinned CDN runtime and needs network access.
- User confirmed native navigation remains fluid. Automated browser reports ~1 FPS with low CPU submit times; no trustworthy FPS benchmark inferred from it. No additional WebGL tab opened. Capture: outputs/r44/azumamaro.png; earlier open-balustrade view outputs/r44/gehaiden.png.
- Remaining: exact historic/current facade dimensions, lateral perimeter landscaping/grade transitions, broader courtyard proportions and full walking coverage. This pass is not a claim of an identical or complete surveyed replica. No push.

## R46 — Lateral court transitions and persistent nearby buildings
- Expanded the Azumamaro graded apron to the mapped east building edge (way/952815193) and rear hall extent (way/305214824). The prior release crossed the open gravel yard; the new smooth transition falls under/beyond the enclosing footprints. Heights remain inferred from the connected court datum, not surveyed. Mapped stairs and distant terrain remain unchanged.
- Extended the front plaster/timber/tile wall toward mapped former-residence building way/305214609. The new section follows local ground; exact alignment and its junction remain inferred from the supplied entrance photograph.
- Identified a visibility cause of empty surroundings: generic city chunks are deliberately hidden at walking distance. Added permanent nearby context for mapped buildings305214608,305214609,952815193, excluding their generic duplicate extrusions. Footprint polygons and concave notches retained; roof decomposition, heights and restrained facade finishes are explicitly approximate. No duplicate of existing custom gate305214597.
- The new context uses static batching and existing materials/runtime. No new dependencies. It still needs close photographic facade refinement; do not mistake these simplified walls for a complete detailed replica.
- 100 live Node tests pass, including transition endpoint slope continuity and preservation of stairs/distant terrain. Syntax and diff whitespace checks pass. Browser loaded R46; walked through torii to x16.39,z23.44 and across court to x26.54,z15.59. East building collision stopped x at37.97..38.01 while sliding along its wall fromz22.16 to24.44. No new errors after reload; one old failed-fetch log was from the stopped server before recovery.
- Restarted absent local Python server bound127.0.0.1:8420 (PID44728, HTTP200); reused the one existing WebGL tab. Capture outputs/r46/east-court.png. No FPS benchmark or push.
- Additional discovery sources (not surveyed geometry): https://inari.jp/trip/map02/ and https://www2.city.kyoto.lg.jp/somu/rekishi/fm/ishibumi/html/hu123.html. Image search surfaced more Azumamaro entrances; one direct image fetch timed out and was not treated as inspected evidence.


## R47 — closer Street View inspection of the Azumamaro lateral court

Inspected June 2012 panoramas `ALTClVF04s972933Dg4p2g`, `Hdl-ibkcKhfZHayKv9g9Bg` and `28Lu_LMTCVcZAAidEdCHuA` by walking forward and rotating in Google Maps. Local review captures: `fushimi_inari/outputs/r47/street-front.png`, `street-passage.png`, `street-house-side.png`. These are historical appearance references, not a current survey.

The closer passage view corrected the initial distant interpretation: the tall structure is a three-tier donor-name board, not reed fencing. Added its open supports, subdued plaque texture (no invented donor names), grass behind its base, a rectangular drain and circular utility cover. Geometry is instanced and fitted between mapped paths and buildings; dimensions and exact placement remain inferred.

Added the separate low woven screens beside the timber gate, tan notice with unresolved lettering omitted, and a perforated threshold drain. Glazed enclosure now has white upper and side panels, stronger timber sills and eave rafters. The entrance torii has a shallow upward-curving cap instead of a perfectly straight beam. Existing source buildings and route network retained.

Visual review identified remaining gaps: service-lane crest beyond the near court, missing enclosing vegetation and distant boundary detail, overly uniform foliage, and unresolved exact placement of the votive rack. These are not claimed as complete. No claim of an identical replica or surveyed dimensions.

R47 validation: 102 Node tests pass, including two new low-approach regressions; module syntax and git diff checks pass. Browser reload and walking review completed with no console errors. Only ways 105449706 and 952687108 use the low paving policy (8 cm paving / 9 cm curb above rendered terrain); stairs retain existing profiles. Final screenshot: fushimi_inari/outputs/r47/world-final.png. No new dependency or additional WebGL tab. Performance was not benchmarked across hardware.


## R48 — central court laterals and service passage

Inspected the east and west views of June 2012 panorama Hdl-ibkcKhfZHayKv9g9Bg and moved back toward ALTClVF04s972933Dg4p2g. The court-facing Romon wings show green lattice bays, pale double rails and suspended bronze lanterns. Added these to the existing authored wings, batched into six material meshes; the central passage stays open. The Gehaiden replacement rails now use vermilion lacquer with small gold fastener heads, preserving prior source mesh repairs.

The service lane223276650 now transitions monotonically from the graded court to its unchanged DEM endpoint within a narrow corridor. This removes an artificial grade-release crest; it is an inferred support profile, not surveyed topography. Building, water and stair exclusions remain.

Validation:103 Node tests pass, syntax/diff checks pass, actual-GLB Gehaiden fixture checked by delegated reviewer. Root inspected the running central court and wings and traversed the adjacent court with no console errors. Full service-lane traversal and hardware performance benchmark remain unverified. Source images and review captures stay local under outputs/r48. Remaining work includes peripheral buildings/planting and finer geometric correspondence; no exact-replica claim.


## R49 — observed northern court frontage

Walked June 2012 Google Street View from IKgCmUJ1Zb3Emb-Rrz7ohQ through 6HyaCe_dTq2qRogjCsr5ZA and yxp8DtVtQ4139x267uNKCQ to nzE3S9y0zB2Rus4DtW7YRA. Local north-close.png confirms a two-storey timber frontage with pale/muted glazing, occasional shutters, slatted upper sill, pale awning, tiled roof and a lower western neighbour.

Mapped footprints305214375+305214356 form the likely continuous two-storey row;305214355 the lower western neighbour. The exact split between the two row polygons is not resolved by the photograph. New source-based facades preserve those polygons and replace generic render ownership. Heights and bay dimensions remain visual estimates, not surveyed measurements. Unseen rear faces remain restrained; no named businesses or invented signs.

The curved planter, tree and stone lantern at the right of the reference are confirmed visually but have no independent mapped anchor in the available data. They were deliberately not added at a guessed location. Existing unrelated project-cover.png and root outputs remain untouched.

R49 validation:104 Node tests pass; syntax/diff checks pass; root walked from Gehaiden to the north frontage and reviewed the updated surface and facade with no console errors. Localized apron grading uses mapped south shop fronts and crossing105449672; it preserves stairs and rear terrain. Ceramic roof map is generated appearance texture, not a photographic or dimensional source. Remaining: precise planter anchoring, finer shop-bay detail and roof junction fidelity. No performance benchmark this pass.
