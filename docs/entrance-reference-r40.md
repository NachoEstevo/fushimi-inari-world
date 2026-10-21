# Entrance reference review — r40

Reviewed 2026-10-21. Scope: Omotesando, Rōmon, Gehaiden; water, seating and ground treatment. This document records evidence and recommendations; it does not certify surveyed dimensions or a rendered implementation.

## Direct photographic evidence

User originals inspected at `C:/Users/nacho/Desktop/Fujimi/` (all share suffix `_2026-10-20_17-41-36.jpg`):

| Image | Confirmed observation | Limit |
| --- | --- | --- |
| `photo_1` | Continuous gray hardscape, large rectangular slabs alongside small stone setts; mature broadleaf trees and dense shrubs behind a stone retaining edge and vermilion railing. | Does not establish every entrance bed boundary or tree location. |
| `photo_2` | Broad granite Rōmon stair, stone cheek walls and fox plinth; dark fine gravel confined beside the stair and lantern base; paved foreground with setts and larger slabs. | The visible dark bed is not evidence for bare brown earth across the precinct. |
| `photo_3` | Architectural roof and gable detailing. | No useful ground, water or seating location evidence. |
| `photo_7` | Rectangular stone purification basin, flowing water entering from the right, metallic ladles with wooden handles, moss at the lower lip and a narrow drainage channel in front. | Tight crop gives no location relative to Rōmon; no canopy visible. It does not establish an ornamental fountain in the middle of the plaza. |

No bench is established by these four photographs. Do not mistake a stone retaining edge, stair cheek or fox pedestal for a surveyed bench.

## External reference checks

- [Official precinct map and building descriptions](https://inari.jp/trip/map01/) and [English map](https://inari.jp/en/map/) were retrieved. They establish shrine identity and named architecture; the retrieved text does not establish a central ornamental fountain or bench layout. Official text is not a fine-scale surface survey.
- [Kyoto Goat entrance walkthrough](https://kyotokankoyagi.com/to-fushimiinari-en) describes purification at Chozu before passing through Rōmon. This supports entrance-side purification as a function, not precise metre coordinates or identity of the user's close-up basin.
- User videos [zFKeYi0AK0M](https://www.youtube.com/watch?v=zFKeYi0AK0M) and [FmRyJ-RtBPg](https://www.youtube.com/watch?v=FmRyJ-RtBPg) could not be retrieved through the web tool (fetch error / throttling). They were not visually inspected in this review. Existing code comments citing video times are inherited evidence, not a new verification.
- `docs/images/temizuya.png` is a screenshot of the current digital scene. It was inspected only as implementation context and is not independent real-world evidence.

## Existing geography and ownership

Coordinates below are local feature coordinates `[x, elevation, z]` from `fushimi_inari/geography/features.json`, not proposed replacement model dimensions:

| Feature | OSM identity | POI position |
| --- | --- | --- |
| Rōmon | `way/105449733` | `[-1.878,42.39,0.995]` |
| Gehaiden | `way/105449674` | `[17.618,44.14,-0.526]` |
| Temizuya | `node/10564318622` | `[-6.951,41.97,-14.338]` |

Temizuya tags are `covered=yes`, `man_made=water_tap`, `drinking_water=no`, name `手水舎`. This is a purification feature, not drinking water or evidence of a decorative plaza fountain. `integrated-world/anchors.json` already owns its architectural anchor. `integration.mjs` retains the geographic value as `mappedTarget` before using `separatedTemizuya()` from `entrance-layout.mjs`; that helper explicitly describes its separation as video-inferred and not surveyed. Preserve that distinction if adjusting it.

The raw `geography/sources/named-nodes.json` snapshot contains three explicit `amenity=bench` nodes: `12161177351` (34.9619741,135.7710949), `12161392402` (34.9592824,135.7707244), and `12281368614` (34.966118,135.7693521). None establishes a bench in the Rōmon–Gehaiden courtyard. The processed `features.pois` contains no `amenity=bench` entries. Absence in this dataset does not prove absence on site, but it cannot justify adding central benches as mapped facts.

## Concrete next pass

1. Keep the central entrance circulation predominantly paved: distinguish the long slab bands, small gray setts and restrained edge joints visible in the user's images. Brown terrain should not read through this hardscape.
2. Restrict dark gravel to bounded side beds, including the Rōmon stair flank; use stone edging and retaining faces to explain grade transitions.
3. Concentrate shrubs and mature trees behind the vermilion perimeter railing and retaining edges demonstrated in `photo_1`; do not scatter garden islands across the walking axis merely to hide empty terrain.
4. Refine the existing temizuya rather than add a second water feature: stone basin rim, water surface/flow, moss at damp edges, ladles and narrow drainage channel. Basin appearance is directly supported; exact dimensions, canopy identification and the photo's location remain unverified.
5. If adding seating before stronger location evidence is available, label its placement interpretive, put it at perimeter rest areas, and preserve the entrance–Rōmon–Gehaiden circulation. Do not represent the raw distant OSM benches as courtyard fixtures.
6. Verify fixed entrance, stair-flank, temizuya and courtyard views after implementation. Check pavement coverage, collision and visibility of any water/seating separately from historical location accuracy.
