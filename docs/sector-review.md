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
