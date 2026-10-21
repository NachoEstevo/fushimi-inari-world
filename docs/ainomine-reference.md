# Ainomine / Kada-sha: geographic incorporation specification

Verified 21 October 2026 against the checked-in geographic data and the official
Fushimi Inari site. This is an implementation brief, not a reconstructed sector.
No architecture, collider, terrain or route was changed by this investigation.

## Identity and sources

- Official name: 間ノ峰（荷田社神蹟）, Ainomine / Kada-sha sacred site.
  The official description identifies Ise Ōkami and locates Ainomine between
  Sannomine and Ninomine. It is a separate site, not either entrance-area
  shrine bearing the Kada name.
- [Official map and description](https://inari.jp/trip/map01/), sections 稲荷山
  and 間ノ峰. High confidence for identity and relative ordering.
- [Official dedicated page](https://inari.jp/sp/map/spot_12/).
  The distinguishing entrance is a **stone nune torii** (奴祢鳥居), with paired
  inclined sasutsuka members forming a clasped-hands shape beside the central
  plaque strut. High confidence for this feature; no dimensions supplied.
- Official documentary photographs:
  [desktop photograph](https://inari.jp/wp/wp-content/themes/inari/images/trip/map01/ainomine.jpg)
  and [mobile photograph](https://inari.jp/sp/wp-content/uploads/2016/09/ainomine.jpg).
  The links were resolved from the official pages. Their pixels were **not**
  successfully inspected in this research pass: do not derive dimensions,
  roof type, ornament, stone counts or orientation from this document.
  The official site prohibits unauthorized reuse; reference links are retained,
  not copied as project textures or assets.
- Additional documented photo leads, not accepted visual evidence yet:
  [dated March 20, 2020 visitor gallery](https://minkara.carview.co.jp/userid/127038/car/2788227/4939109/photo.aspx),
  [2015 visitor photograph](https://photozou.jp/photo/show/2994695/231773182).
- User tours remain cross-check sources:
  [Rec Lab](https://www.youtube.com/watch?v=zFKeYi0AK0M),
  [second tour](https://www.youtube.com/watch?v=FmRyJ-RtBPg).
  No Ainomine timestamp or continuous approach has been confirmed in this pass.

## Geographic contract

Coordinates below are geography X / elevation Y / Z in metres, **not** the
original architectural source coordinate system.

| Item | Checked-in evidence | Confidence / limitation |
| --- | --- | --- |
| Identity | `features.json` building and POI `way/626313742`, `name=荷田社`, `building=shrine`, `historic=wayside_shrine` | Strong name match plus official relative ordering; OSM attribution is not a survey |
| Anchor candidate | POI `[939.488,196.93,0.456]`, lat `34.9671359`, lon `135.782968675` | Use this exact POI datum if adding an OSM-based anchor |
| Footprint centroid | `[939.48825,196.8825,0.4565]` from four distinct polygon vertices | Average vertex Y differs from POI Y by 0.0475 m; neither establishes a floor survey |
| Footprint | `[940.065,196.76,-1.269]`, `[941.233,197.01,-0.078]`, `[938.907,196.95,2.182]`, `[937.748,196.81,0.991]`, closed to first point | Approximately 1.67 × 3.24 m **mapped building**, not entire compound |
| Route attachment | node `2656062961` at X/Z `[935.696,-2.315]` | 4.697 m horizontal centroid gap. Last metres to facade/torii remain unproven |
| Nearby corroboration | `node/11803953649` at `[946.734,196.57,-3.93]`, stone memorial with inscription `中之社へ一丁 下之社へ半丁` | Consistent with route between middle and lower peak; no automatic conversion of historical distance unit |
| Lower-route sign | `node/11823834310` at `[874.156,190.34,-80.573]`, `荷田社へ半丁 四ツ辻へ一丁` | Supports destination identity independently within the OSM dataset |

The building long axis lies southwest/northeast in X/Z. That does not prove
which end is the public facade. Do not rotate a borrowed shrine by this axis
alone or use the small footprint to flatten a 12 m radius terrace.

## Existing real mapped route connections

Reproduced using `buildGraph`, `nearestNode` and `shortestRoute` from
`geography/geo-core.mjs`, current `features.json` and `terrain.json`.
Lengths use the graph's DEM heights and include only node-to-node travel;
they exclude the building-to-node gaps. Both routes exist without new edges.

| Connection | Existing path IDs in order from Ainomine | Graph result |
| --- | --- | --- |
| Ainomine → Sannomine | `way/1372826374`, `way/1372826375`, `way/1372826376`, `way/1372826377`, `way/1273249160` | 99.417 m to node `11823834321`; Sannomine centroid gap 4.510 m |
| Ainomine → Ninomine | `way/1372826374`, `way/1372826373`, `way/1271063748` | 122.011 m to node `11803952608`; Ninomine centroid gap 11.911 m |

Important route shape: the trail passes **north of the mapped small building**
and continues eastward; the sanctuary is not a mandatory through-building link.
From Ainomine toward Sannomine the route passes nodes `12712096321`,
`12712108036`, `749327457`, `5912934073`, `5912934074`, `1214631158`,
`11823834322`, `11823834321`. Toward Ninomine it passes `5912934072`,
`5912934071`, `1214631080`, `749327466`, `12712153172`, `11803952609`,
`11803952608`.

Adjacent main paths have `foot=yes`, `width=2`, `surface=paving_stones`,
`handrail=no`, `ramp=no`; the short southwest segment is `highway=path`,
with `highway=steps` on either side. These are OSM tags, not observed step
counts. The Sannomine entry `way/1273249160` separately has `step_count=10`;
do not copy that count onto Ainomine.

## Smallest justified next implementation

1. Add an explicit sector inventory/navigation entry keyed `ainomine`, using
   `way/626313742` and the existing mapped position. Preserve the original
   source-to-target anchor transform contract: choose a new unoccupied source
   coordinate only when there is actual source geometry to relocate. A mapped
   POI alone should not manufacture a generic architectural compound.
2. Extend geographic route coverage with Sannomine → Ainomine → Ninomine
   using the existing graph. Keep a separate last-metres clearance result;
   graph connectivity cannot certify torii approach or accessible paving.
3. Inspect the official photographs and locate the sector in a user tour.
   Record a front view and an approach view with timestamps. Establish torii
   plane, public landing edge, sanctuary enclosure and building facade before
   constructing detailed geometry.
4. Build the distinct stone nune torii only after its placement is justified.
   Its paired inclined struts must remain visibly different from the routine
   vermilion mountain torii. Keep visible pillars and collision in agreement.
5. Add a footprint-derived small sanctuary only once its exterior can be
   documented. The currently mapped shell is preferable to an invented large
   copied compound. No surrounding stair count, monument layout, retaining wall,
   roof profile, fox pair or lantern arrangement is established by these data.
6. Verify both directions of the existing bypass and the side approach, with
   off-centre camera clearance. Capture fixed-pose evidence and verify that
   source geometry and inferred torii posts do not obstruct the 2 m mapped trail.

Acceptance remains open for photographic inspection, facade orientation, torii
placement/dimensions, sanctuary boundary, actual floor levels and steps,
stone-monument inventory and manual walkability. No new architecture is claimed
complete by this reference specification.
