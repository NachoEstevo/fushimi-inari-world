# R87 — Precinct evidence register

Research pass: 22 October 2026. This register records access and provenance, not a claim that every reference has been visually inspected. Companion execution plan: [precinct-program-r87.md](precinct-program-r87.md).

## Evidence states

- **T87**: webpage text inspected live in this pass. Image labels are not inspected image pixels.
- **H**: observations reported by an earlier repository document, read here but not independently re-observed.
- **U**: supplied or discovered source; visual content not inspected in this pass.
- **M**: current checked-in map/geometry record; geographic placement evidence, not an architectural survey.
- **I**: explicit inference in authored geometry. No inference becomes measured by surviving a test.

| ID | Source URL / local evidence | State and useful scope | Limits / next acquisition |
| --- | --- | --- | --- |
| OFF-MAP | https://inari.jp/en/map/ | T87; official named-sector index | Index and links verified; no image-scale measurement. Official imagery must not be repackaged as project textures |
| OFF-JP | https://inari.jp/trip/map01/ | T87; official precinct descriptions and named branches | Text supports identity, relative relationships and access restrictions; plan image pixels not inspected here |
| OFF-VR | https://inari.jp/vr/ | T87; identifies Honden, Romon and Gehaiden and links interactive references | Interactive 360 and 3D experience not visited here; text is not a dimensional source |
| VR-360 | https://my.matterport.com/show/?m=SL81CVbVWww | U; known linked official-tour destination, also in R73 | Acquire registered frontal and lateral views of lower precinct. No downloaded mesh or reuse rights assumed |
| VR-3D | https://hacosco.com/fushimiinari/ | U; earlier register identifies official-linked 3D context | Inspect actual camera views before using architectural offsets; no exactness claim from splats |
| VID-A | https://youtu.be/iqK2tg-TxbY?t=325 | U in R87; exact user starting link retained (05:25 is a requested position, not an observation) | Live text fetch throttled. No new playback, frame extraction or continuous route review succeeded |
| VID-B | https://www.youtube.com/watch?v=zFKeYi0AK0M | U in R87; whole user video retained | Live fetch failed. Earlier selected-frame observations listed below are H, not new watching |
| VID-C | https://youtu.be/FmRyJ-RtBPg?t=84 | U in R87; requested start at 01:24 | Live fetch throttled. Earlier R18–R27 evidence is outside this pass; do not infer scenes from its title |
| MAP-PANO | https://www.google.com/maps/@?api=1&map_action=pano&pano=MvihcVb0f466FBJebqyECg&viewpoint=34.9674832,135.7737795 | U; exact user pano ID and supplied viewpoint retained | Text tool could not access. Heading, creator, capture date, actual scene and correspondence remain unverified. Viewpoint is not a building coordinate |
| OKUMIYA | https://fushimiinari-guide.com/okumiya/ | T87; page and image captions inspected; H photo detail in R65/R69 | Need matching arrival, front, lateral opening and departure pixel captures with documented heading |
| BYAKKO | https://fushimiinari-guide.com/byakkosha/ | T87; identity and image captions inspected; R74 reports inspected fox-case pixels | R74 accessory dimensions remain I. Side opening and heritage board still need registration |
| NOSATSU | https://fushimiinari-guide.com/nosatsusho/ | T87; text confirms separate leftward pond-side branch after Tamayama | Need frontage/orientation of mapped candidate way/305214607; do not replace from name alone |
| OFFICE-A | https://www.obayashi.co.jp/works/detail/work_1443.html | H; R83/R84 inspected local source pixels | R87 fetch timed out. Confirmed earlier appearance attribution does not measure bays |
| OFFICE-B | https://www.kyoto-ga.jp/greenery/kyononiwa/2015/09/post_12.html | H in R84; garden-facing office context | Not fetched again; obtain broad bank views and opposite-facing shoreline images |
| OFFICE-C | https://www.mokuei.co.jp/down/public017.pdf | H in R84; timber-work sheet | Not re-opened here; no exact construction dimensions extracted |
| GEO | ../fushimi_inari/geography/features.json and ../fushimi_inari/geography/terrain.json | M; current geographic records consumed by integration | Mapping age/completeness and coarse terrain prevent unqualified metric accuracy |

## Historical observations retained with their original limits

These timestamps identify **previously documented selected-frame observations**; none was newly played during R87. See [sector-review.md](sector-review.md), [mountain-trails-bamboo-r66.md](mountain-trails-bamboo-r66.md), and [initial-precinct-reference-register-r73.md](initial-precinct-reference-register-r73.md) for the original context.

| Video and documented time | Earlier observation / use | Registration still needed |
| --- | --- | --- |
| VID-A 00:28, 00:43 | Modern narrow approach fixtures; R73 | Full lateral inventory and placement; arbitrary inferred station distances are not measured |
| VID-B 02:05 | Slab centre, gravel edges, lanterns and approach lateral buildings; R35 | Match facade sides and junctions in current map |
| VID-B 03:10 | Broad Romon stairs, planting tiers, lanterns and fox plinths; R35 | Check full stair width and both lateral routes |
| VID-B 05:30 | Circulation outside fenced pavilion; R35 | Both courtyard sides, no through-pavilion shortcut |
| VID-B 10:00 | Upper stair/handrail; R35 | Exact structure identity unresolved; never relabel solely by elapsed time |
| VID-B 12:00, 13:00, 13:30 | Torii paving/edges, court arrival, basin and small adjacent steps; R35 | Register basin and court feature against Okusha footprint |
| VID-A 11:15 | Landing/grates/borders near Neagari-matsu sign; R66 | Associate exact node and stair before local duplication |
| VID-A 21:30 | Shin-ike rails, stones, lanterns and offering torii; R66 | Pond shoreline, worship terrace and branch entrances |
| VID-A 26:53 | Ascending torii, stone footings and steps; R66 | No universal tread count or copied corridor geometry |

The older R35 Ninomine panorama observation is H. It must not automatically be attributed to the supplied MAP-PANO ID without actually opening and matching that panorama.

## Geometry provenance and unresolved dimensions

Source-backed identity/relationships: the official index distinguishes the three peaks and Ainomine; official descriptions distinguish Okusha beyond Senbon from the earlier Okumiya. The Nōsatsusho guide distinguishes Tamayama's left branch from the Senbon direction. These constrain topology, not metre coordinates.

Mapped authority: retain existing geographic object IDs, origin, path graph and footprints unless a registered source demonstrates a contradiction. The existing scene uses metre X/Z plan coordinates and Y height; photograph camera centres and map embed centres must never replace footprint anchors.

Authored inference: roof/eave profiles, bay counts, shrine case sizes, foliage placement, stair counts, local grades, pond levels/depths and monument distributions require individual I labels unless independently measured. R84 office bays are inferred. R85 pond liners expose roughly 0.79 m and 1.16 m against coarse terrain; these are model artifacts requiring bank review, not sourced retaining-wall heights.

Missing survey: current site survey, calibrated elevations/sections, exact roof outlines, complete minor-shrine inventory, measured stair rises/runs and width, water levels, and dated restoration state. The working period is contemporary mixed-date visitor appearance; dated sources must remain dated. No historically synchronized restoration state is established.

## Next reference packet, in priority order

1. Open VID-A at the user's requested start and MAP-PANO through a permitted visual surface; record actual observed scene, timestamp/pano ID, heading, date if visible and matching map feature. Record failures without pretending frames were seen.
2. Lower precinct: front and both obliques at entrance/Romon; Gehaiden east/west circulation; Naihaiden public threshold; Gonden stair and Tamayama split; Okumiya/Byakko side view; Nōsatsusho pond frontage; office/garden banks.
3. Mountain: both Senbon traversals; Okusha arrival and north exit; Shin-ike shore junction; each Mitsutsuji/Yotsutsuji branch; each peak approach, worship frontage and exit; Mitsurugi/Gozendani return; separate Kiyotaki/Miyuki/Kojingamine/Teichoan spur packets.
4. Each packet carries source URL, actual inspected frame or pano heading, local evidence path, target object IDs, observed constraints, inferred values and unresolved questions. Keep third-party reference imagery local for review; do not ship it as artwork without permission.

## R87 verification boundary

Live official/guide text and current integration imports/calls were inspected. No new source photographs, native scene renders, Street View pixels or video playback were inspected in this research pass. This file adds no geometry or runtime behavior. Existing historical screenshots and passing test counts are revision-bound evidence; they are not current integrated visual acceptance.

Subsequent current-round evidence supplied by `review_and_water_qa`: the dedicated water page passed on Three.js r164 / WebGL2 with no errors, 1,196 changed pixels and all-light-disabled/night maximum channel 0. This is reviewer-reported native GPU evidence for the isolated test, superseding the historical R86 inability to run that test. It does not establish full-scene visual acceptance, surveyed pond banks, material parity elsewhere or measured FPS. Root should retain the reviewer's actual evidence paths with the final integrated ledger.

The immediate next source packet is the Nōsatsusho–Yashima pond branch: broad frontal and reverse views registered to `way/305214607`, pond and Tamayama split. The critical unresolved question is existing generic-volume identity versus an actually missing pavilion. Resolve it before adding architecture or microprops. Exact executing agents and the branch's concrete acceptance packet are recorded in Phase A of the companion program.

## Subsequent R87 visual evidence updates

The follow-up [Nōsatsusho registration](nosatsusho-registration-r87.md) now records five actual source photographs inspected by this reference agent. It resolves the existing mapped pavilion identity and supplies its candidate facade registration; earlier text-only/U status above describes the initial pass, not the latest state.

Root subsequently inspected fresh Street View pixels through CUA. The supplied older panorama redirected to a map; root selected blue coverage near Tamayama and opened [daisuke ogawa, May 2022 panorama](https://www.google.com/maps/@34.9674459,135.7737385,3a,75y,244.03h,90t/data=!3m8!1e1!3m6!1sCIHM0ogKEICAgID28KCWrQE!2e10!3e11!7i5376!8i2688). Actual observed panorama ID: `CIHM0ogKEICAgID28KCWrQE`, viewpoint `34.9674459,135.7737385`, initial heading `244.03°`, pitch `90°` in the supplied Maps URL. This is distinct from the user's older `MvihcVb0f466FBJebqyECg` ID; do not merge their provenance.

Root-reported pixel observations: initial view shows a vermilion torii at left with black foot and circular stone base, a short granite stair flight, a large square tiered stone lantern at the junction, dense planting behind and a square metal drain grate in the foreground. After two clockwise UI rotation clicks, a descending stone flight is visible at right beside a white plaster wall with dark cap and red lantern. The landing is continuously mineral surfaced rather than grass. Crowd blur substantially obscures the lower/middle ground.

These observations establish newly inspected Street View source availability and specific local appearance constraints. They do not establish measured dimensions, a calibrated compass registration for the rotated view, new object coordinates or a completed route walk. Root owns this visual observation; the reference agent records its supplied evidence without claiming to have separately visited the panorama. Video playback, whole precinct Street View coverage and full-scene acceptance remain separate open gates.
