# R60 — Gishikiden massing and facade evidence

Research date: 2026-10-21. Initial read-only audit followed by the bounded implementation documented below.

## References actually inspected

Both photographs were opened and visually inspected in one temporary **static-image** Brave tab, then the tab was closed. No WebGL scene/tab was opened.

- [Three-shrine context, IMG_6470_20210313.jpg](https://fushimiinari-guide.com/wp-content/uploads/IMG_6470_20210313.jpg): the three small shrines, stone terrace and red enclosure are in front of a much taller modern concrete building. Its faces have repeated pale horizontal bands over dark recessed strips; projecting vertical concrete members interrupt the bands. The upper silhouette steps as differently oriented faces overlap.
- [Closer Gishikiden view, IMG_7524_20210405.jpg](https://fushimiinari-guide.com/wp-content/uploads/IMG_7524_20210405.jpg): shows the ground-level glazed entrance and shallow canopy, a tall banded upper mass, projecting corner/vertical elements, and several open horizontal rails above the enclosed upper facade. This establishes that the visible horizontal strips are architectural screening, not a reliable floor count.
- [Guide article](https://fushimiinari-guide.com/omotesando/): describes the concrete building between Omotesando and Urassando as two combined squares with an eight-pointed outline. It does not supply height or storeys.
- [Kyoto City's Fukakusa archive, item104-009](https://fukakusa-archives.city.kyoto.lg.jp/archive/104-009/): the shrine-supplied historical aerial caption identifies Gishikiden as completed in1968. This supports a long-established building identity, while not proving its current operating state or dimensions.

The photos are dated2021 by filenames/page context; present-day facade persistence is not verified.

## Exact local footprint and present code

`geography/features.json` contains `way/223276575`, name `儀式殿`:

- Bounds X **-87.676…-58.767 m**, Z **-60.602…-31.147 m**.
- Closed22-edge footprint; plan area approximately **517.6921 m²**.
- The outline includes alternating square/diagonal faces and smaller local offsets. Preserve the actual polygon rather than replacing it with a generic octagon, two bounding rectangles, or an invented symmetrical star.
- Tags conflict: `building=construction`, `construction=hotel`, `name=儀式殿`, `source=Bing`; no `height` or `building:levels`.

`entrance-neighborhood-layout.mjs` therefore currently assigns its fallback **4.5m**. `entrance-neighborhood.mjs` constructs neutral perimeter wall strips, a flat polygon cap, and a thin eave band. This is placeholder massing, not the photographed elevation.

The modern building is behind the shrine roots `node/10236496678`, `node/10236503541`, `node/10236503542` (Z approximately-16.8). Its nearest/front footprint vertices are around Z-31…-36, leaving the mapped shrine terrace and planting between building and approach. Increasing height must not move that frontage south or grow a new podium through the shrine enclosures.

## Height and storey assessment

**4.5m is visibly too low for the photographed building.** The upper banded mass rises several entrance-canopy heights above its ground frontage and dominates the trees and small shrines in the contextual view.

The photos show roughly twenty closely spaced horizontal screen/band levels, including open upper rails. **These must not be translated into twenty storeys.** Internal slab levels are obscured by the screening; an actual storey count was not established by this research. No authoritative height specification was found.

For a first visual blockout only, a **14–18m overall-height range**, with **16m as a review candidate**, is reasonable from the entrance-height and footprint-width comparisons. This is an estimate with substantial perspective uncertainty, not a measured or source-stated height. Compare at least two fixed views before accepting a number. Do not derive height from present-day zoning limits or claim a hotel conversion from the contradictory OSM construction tags.

## Bounded implementation plan

1. **Single owner for this exact ID.** Replace only the existing `223276575` placeholder within the neighborhood builder, or exclude it from that builder only after a dedicated replacement succeeds. Retain its complete footprint, current geographic position, terrain-seated footings and existing circulation. Do not change the other neighborhood buildings.
2. **Massing and visible envelope.** First render the exact polygon at the explicit estimated height, with a low glazed entry zone, dark recessed upper surface and thin pale horizontal fins. Match the repeating intervals visually rather than labeling each as a floor. Use the longer original polygon faces to orient the fin strips and projecting concrete uprights; keep minor footprint offsets from becoming dozens of invented structural piers. The photograph supports a few open rails above the main enclosure, not a tall solid white roof box. Infer their dimensions explicitly.
3. **Conservative finishing.** Keep windows as a recessed dark band unless individual openings are resolved. Add the observed shallow entrance canopy only on the matched southeast-facing approach edge after checking its position against the closer photograph. Do not add room interiors, signs, vending machines, gardens or alternative rear elevations merely because they appear partly in a frame. Batch fins/uprights by material.

## Acceptance and unresolved points

Review from the three-shrine foreground and from the closer east/southeast access, with the same source-relative framing. Confirm that the shrine roofs remain foreground objects, the new building keeps its original footprint, and mapped access is clear. Verify ground intrusion/footing heights independently from the taller facade.

Still unresolved: surveyed total height, internal storey count, exact fin count/spacing, setbacks between the two interlocking volumes at different heights, entrance-edge correspondence, present-day construction/tenancy state, and unseen rear facade. These are reasons to label the first elevation a photo-informed reconstruction; they do not justify keeping an obviously undersized4.5m block as a faithful final result.


## Implemented candidate — R60

Only `way/223276575` now uses the explicit **16m overall-height review estimate**. The neighborhood layout labels it photo-based and states that facade bands are not storeys. Its exact polygon, median ground datum and terrain-following foundation positions remain unchanged. Collider tops derive the same overall height.

The builder gives this ID a recessed dark envelope,20 thin pale horizontal screen fins over its upper mass,3 genuinely open upper rails, and restrained concrete uprights at substantial polygon turns. The closed mass ends1.65m below the overall height so the upper rails are not backed by an invented solid parapet. Repeated parts merge by material. All other building height rules and facade/roof ownership remain intact; no additional generic extrusion should be shown for this already-built ID.

This candidate does not claim20 floors, exact fin spacing, independently measured height or a verified entrance/rear elevation. Detailed glazing, entrance canopy position and differences in upper setback levels remain unresolved. Root must compare both photographed viewpoints before accepting the silhouette.

Validation: four neighborhood layout tests pass, including the single-ID height exception and preservation of every other building's prior height rules. The complete suite passes 130 tests. Root inspected the rendered court approach and an elevated oblique view: the taller envelope, fins and open upper rails load without console errors and retain the original footprint. The 16 m value remains an estimate, not a measured match; exact stepped upper volumes and entry glazing remain unresolved. Captures: local `fushimi_inari/outputs/r60/`.
