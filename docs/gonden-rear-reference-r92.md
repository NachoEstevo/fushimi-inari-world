# R92 — Empty rear paths and green ground behind Honden / Gonden

22 October 2026. Reference and current-source audit only. No production edits and no use of root's Maps tab. User screenshot inspected: `C:/Users/nacho/AppData/Local/Temp/codex-clipboard-005754ec-de0e-4fb7-b064-7dd5253b4630.png`.

## Finding

The screenshot's broad open green surfaces and apparently unfinished pale path strips must not be accepted as a faithful rear precinct. Actual sources show **distinct mineral worship/service courts, shrine/compound boundaries, subsidiary buildings and wooded edges**. Some pictured paths are valid mapped approaches; at least one nearby source connection is a bridge that the present ground-surface builder deliberately omits. Filling everything with trees or inventing more shrines would conceal rather than resolve these gaps.

The screenshot has no geographic camera readout. Its exact individual strips therefore remain **candidates**, not pixel-perfect ID assignments. Match screenshot camera/world coordinates before calling any particular stub the bridge or a specific building approach.

## New real pixels inspected

Images fetched into ignored `.tmp/r92-refs/`, opened with `view_image`:

| Source | Observed facts | Implication / limit |
| --- | --- | --- |
| [Gonden rear IMG_6572](https://fushimiinari-guide.com/wp-content/uploads/IMG_6572_20210311.jpg) | White/red five-bay rear wall and raised veranda; narrow gravel/service gap; low simple wood boundary in foreground; small adjoining roof at right; higher rough-stone retaining edge and stone fence, trees above | Rear is constrained, mineral and bounded. It is not a broad public grass court. Exact wall/fence endpoints not measured |
| [Gonden side IMG_6571](https://fushimiinari-guide.com/wp-content/uploads/IMG_6571_20210311.jpg) | Mineral court, side facade, roofed wooden cabinet, low timber guard, black lantern and red roofed/enclosed fittings; trees/canopy immediately behind | Some details already exist in `gonden-surroundings`; first audit ownership/visibility before duplicating them |
| [Office-side approach IMG_6999](https://fushimiinari-guide.com/wp-content/uploads/IMG_6999_20210312.jpg) | Stepped paved approach toward western gate; reception/office edge left, Gonden right; gravel sides and densely treed upper backdrop | Confirms paved/mineral circulation and vertical enclosure, not lawn extending uniformly between all volumes |
| [Honden rear P3600508](https://fushimiinari-guide.com/wp-content/uploads/P3600508_20190331.jpg) | Broad rear white/red wall, raised veranda, continuous vermilion fence with black caps/base, slab walking strip outside and gravel foreground; neighboring roof/wall at far side | Real rear worship happens outside the fence. Preserve solid sanctuary boundary; do not open an interior shortcut |
| [Honden rear P3600501](https://fushimiinari-guide.com/wp-content/uploads/P3600501_20190331.jpg) | Closer confirmation of rear wall rhythm, rail/fence and roof rather than grass | No surveyed court width, planting plan or map coordinates extracted |

Sources: [Gonden guide](https://fushimiinari-guide.com/gonden/), [rear worship visitor guide](https://fushimiinari-guide.com/how-to-worship-main-shrine/), and [official precinct map/index](https://inari.jp/trip/map01/) were read. The latter establishes named context, not exact rear service routes or lawn polygons. Official map image pixels were not inspected this pass; do not claim a measured aerial match. Reference file dates are not independently verified EXIF survey dates.

## Geographic anchor and route ledger

Metres, X east / Z south; heights below are omitted because coarse GSI/map elevations do not establish actual stair/platform levels. Current named footprints: Honden `899425893` bounds X55.373–69.540 / Z−12.156…4.809; Gonden `305214371` X68.601–78.371 / Z−27.618…−16.520. This avoids interpreting screen-up as geographic north.

| Mapped route / exact X,Z points | Destination / present evidence |
| --- | --- |
| `105449689`: `[61.430,-50.506]` → `[62.078,-33.351]` → `[62.662,-20.694]` → `[62.972,-14.115]` → `[63.018,-13.036]` | Office-to-sanctuary/Gonden-side circulation. It joins cross approach `105449728`; no standalone forest trail |
| `105449728`: `[44.253,-15.151]` → `[43.769,-18.991]` → `[62.662,-20.694]` → `[68.920,-21.051]` | Gonden front/side approach, terminating at its mapped western side. Existing sanctuary landing/support owners already include this ID |
| `751194637`: `[71.228,4.842]` → `[71.045,1.759]` → `[70.078,-14.538]` → `[62.972,-14.115]` | Wraps east/back edge of Honden toward Gonden-side route. Source rear-worship photos justify exterior route context, not the exact inferred widths |
| `751194635`: `[57.699,5.822]` → `[65.088,13.314]` → `[71.228,4.842]` | Southern Honden perimeter branch linking to the east/back route; existing sanctuary apron set contains it |
| `105449677`: `[37.283,-1.481]` → `[38.132,7.525]` → `[41.471,12.167]` → `[47.345,13.659]` → `[65.088,13.314]` | Connects lower/Naihaiden exterior to the southern perimeter junction |
| `751194636`: `[65.088,13.314]` → `[65.326,20.483]` | Short southward terminal approach near Shinsenjo's northern footprint; exact intended doorway/function remains unregistered. Do not extend it as invented through-route |
| `1297255919`: `[71.045,1.759]` → `[81.609,1.714]` → `[84.537,1.703]` → `[84.838,15.518]` | East-side paved, wheelchair-tagged approach beside mapped Mikoshiko. At terminal point it connects to an explicitly mapped bridge |
| `1385037575`: `[84.838,15.518]` → `[93.769,15.284]`, `bridge=yes`, `layer=1` | **Concrete missing-link candidate:** ground-surface builder and geographic walk graph deliberately skip bridges, so it needs a separate elevated structure/ownership and visual source before implementation. No ground ramp across it is justified |
| `1385037577`: `[93.769,15.284]` → `[101.095,11.065]` | Connects bridge's eastern end to the south loop `1385037576` |
| `1385037576`: `[97.801,-17.377]` → `[98.686,-1.091]` → `[101.095,11.065]` → `[116.174,24.602]` → `[125.105,2.405]` (intermediate vertices retained in source) | Existing eastern/southern loop from the Tamayama/Okumiya lower approach toward the large-torii/Senbon connection; it is not proof that every adjacent green area is publicly walkable |

The upper continuation `105449724` leads from `[117.168,-18.201]` to `[123.636,-2.282]`, then `260121354` toward `[186.271,15.451]` (large-torii route). The alternate `626313773` shares those endpoints but follows a much wider southern loop. Do not visually collapse these as one arbitrary straight path.

## Missing/oversimplified architectural context to audit

- **Mikoshiko `way/1287564336`, 神輿庫:** exact ring `[82.074,19.815]`, `[73.946,20.015]`, `[73.545,3.974]`, `[81.673,3.763]`, closure. Named mapped structure beside the eastern approach. No dedicated module was found by exact-ID search. It may render only as generic viewer context or be radius-suppressed; inspect actual `excludesBuilding` and layer state before calling it absent. Exterior reference registration is still needed before a detailed replacement.
- **Shinsenjo `way/305214596`, 神饌所:** irregular named footprint, X61.394–91.133 / Z21.674–42.557, immediately south of the short approach and Mikoshiko. Exact ID search likewise found no dedicated architectural owner. A generic volume does not certify the correct roof/facade; no new public entrance is established.
- **Unnamed ancillary `way/305214843`:** X71.319–77.313 / Z44.984–49.070. Preserve unnamed identity; do not assign a religious use by proximity.
- **Southern Shinme `way/305214599`:** X91.927–97.218 / Z−8.950…−3.952. A dedicated `tamayama-south-shinmesha.mjs` now exists. Audit integration and visibility; do not add another horse pavilion because an older screenshot looks empty.
- **Bridge and two end approaches:** source IDs explicitly support a structure/connection, but no inspected photograph here identifies its exact deck, rails, support or access restriction. This is a structural source gap, not permission to build a generic bridge.

## Prioritized correction packets, with boundaries

1. **Rear worship perimeter:** match Honden exterior rear fence/strip/gravel against the source photographs and source-bound camera. Inspect current enclosure ownership first; preserve sanctuary solidity and the mapped perimeter. A full grass replacement without bounded evidence is not justified.
2. **Named buildings and route terminations:** evaluate actual assembled inclusion of Mikoshiko/Shinsenjo and screenshot camera. Register their facade/roof and terminal approach before replacing generic shells. This has more completeness value than scattered extra props.
3. **Bridge continuity:** identify exact source structure and obtain one registered side/approach photograph. Then assign separate elevated geometry/physical route ownership; do not weaken the correct generic rule excluding bridges from ground surfaces.
4. **Gonden rear confinement:** close the documented narrow gravel service gap, low wood boundary, retaining/stone fence relationship and tree backdrop using existing owners. Do not create a broad public lawn or move Gonden/upper paths to fit an uncalibrated photograph.
5. **Vegetation:** real photos justify dense overlapping background crowns and some trunks, with mineral circulation at ground. Exact tree positions and planting extents remain inferred. Do not blanket-fill the area with grass/forest to conceal missing architectural context.

Acceptance is a registered overhead ID plan plus rear/front/side ground views, actual inclusion audit, bidirectional exterior approach check and explicit treatment of bridge continuity. Screenshot diagnosis alone cannot prove every strip is mislocated or every building absent. Current map geometry is placement evidence, photographs are appearance evidence, and unsourced dimensions/closures stay visibly marked as unresolved.

## Priority follow-up — Mikoshiko and actual wooded rear boundary

New source found and actually inspected after the first ledger: [8 October 2016 firsthand precinct account](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/). HTML fetched successfully with `Invoke-WebRequest` despite the web text fetch timing out. Three linked image pixels were downloaded and opened with `view_image`:

| Actual photo | Observation / source attribution | Registered implication |
| --- | --- | --- |
| [Mikoshiko photo](https://image.space.rakuten.co.jp/d/strg/ctrl/9/8510ca7752a74472051e7d4b360d3e1c586296e7.77.2.9.2.jpeg), `.tmp/r92-refs/mikoshiko.jpg` | White plaster gable-end storehouse, long row of dark doors with hardware under shallow eave, close timber picket perimeter and mineral gravel court; dense trees beyond. Caption explicitly identifies 神輿庫 southeast of Honden and east of well | High building identity confidence with matching `1287564336` name/relative map location; exact photographed facade to ring edge still needs registration. Existing generic shrine box/roof cannot represent it faithfully |
| [Rear votive boundary](https://image.space.rakuten.co.jp/d/strg/ctrl/9/6c4ae49b941d5ba1da931f3d4adfe61ba71e40c0.77.2.9.2.jpeg), `.tmp/r92-refs/rear-boundary.jpg` | Continuous shallow green roof over vermilion fenced/racked votive torii enclosure; central curtain/plaque area and offering box; narrow slab apron, gravel foreground, stone/soil bank and dense vegetation directly behind | Caption locates it behind Honden and **north of Mikoshiko**, at precinct/hillside boundary. This is concrete architectural/wooded closure, not just unspecified trees. No exact roof run/endpoints or sacred function assigned: author explicitly says no explanatory sign was found |
| [Well and neighboring buildings](https://image.space.rakuten.co.jp/d/strg/ctrl/9/840a4aa2c48d5b2604c1dfb2afc41287e5a1c751.77.2.9.2.jpeg), `.tmp/r92-refs/well-context.jpg` | Separate small roofed fenced well structure, dark timber and pale low pickets, gravel/slab surface, adjacent larger white/plaster buildings | Caption identifies 神供水 and Shinsenjo behind/left. Supports short building/service approach context; exact well point/roof bounds are not yet mapped to a source ID |

This closes the **architectural type and neighborhood identity** gap for Mikoshiko and identifies a substantial roofed votive boundary north of it. It does not establish metre dimensions or authorize replacing a specific unregistered map edge. Next source-matched packet should inventory current scene objects in this zone and register the enclosure against Honden east boundary, Mikoshiko north edge and approach `1297255919` before editing. Its exact roof run must not be fabricated from the entire strip length.

### Bridge versus service stub — keep distinct

**Bridge candidate `1385037575` remains photographically unresolved.** Its two endpoints have separate connected mapped approaches: `1297255919` to the west and `1385037577` to the east. Since `geo-core.isWalkable` and `path-surfaces.mjs` skip `bridge=yes`, this is a deliberate graph/ground omission requiring dedicated above-ground ownership, not an isolated service stub. Whether it corresponds to the particular visible screenshot termination still requires matched camera/coordinates.

**Service/building stub `751194636` is different:** endpoint `[65.326,20.483]` lies just north of Shinsenjo, with no continuation recorded in this extracted path. The source well/Shinsenjo photograph makes a bounded building/service destination plausible, but does not prove that this exact endpoint is a door. Do not invent continuation or build a bridge there.

**Rejected false match:** the 2016 article mentions 橋がかり while discussing the Kaguraden/Noh stage and its connected building. That is a performance-stage connector in a different context, **not evidence for `1385037575`**. Likewise the famous 十石橋 toward the garden/Yashima route is geographically distinct. Neither can supply this bridge's design by keyword match.

No confirmed bridge deck/rail photo was found in this bounded search. Delivering that unknown explicitly is more accurate than calling one of the unrelated bridges a match. The user-visible missing destination can nevertheless be improved first through the now-confirmed Mikoshiko/votive-boundary reference packet, with bridge construction deferred until properly registered.
