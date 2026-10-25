# R95 — Yotsutsuji tea-house frontage and sitting canopy

Historical local exports cited below are now in the verified private archive; see [recovery and original paths](repository-archive.md#historical-local-exports).

23 October 2026. Uses the architectural-environment-production skill's structural-source and ownership gates, preserving the existing canonical mapped scene. This specialist opened no GPU browser and changed no integration, viewer, terrain or source geography. Root owns integration and rendered acceptance. No whole-Yotsutsuji completion is claimed.

## Sources and actual observed pixels

Downloaded reference images into local ignored `.tmp/r95-yotsu/` and opened their pixels with `view_image`. They are review references, never runtime textures.

| Source | Actual observation | Use and limit |
| --- | --- | --- |
| [Photographer page](https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji11.html), dated **17 February 2013**; [courtyard photo](https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji13.jpg) | Two-storey Nishimura frontage has alternating green awning stripes at ground floor and above upper windows. Adjacent low sitting frontage has a pale framed canopy. | Existing main/annex footprint attribution corroborates R89. Stripe widths, colors, canopy dimensions and attachment registration are inferred from existing shells. |
| Same photographer's [sitting-frontage photo](https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji14.jpg) | Thin metal canopy grid with light translucent panels; dark burgundy split noren along eave; timber seating, low tables and yellow pole visible. | Adds overhead canopy/frame and unlettered cloth. Pole, tables and seats are not separately placed because their exact floor/route registration is unresolved and public seating already has an owner. |
| [Downhill photograph](https://cdn.japan-travel-note.com/images/00523/26.jpg), linked by [article dated February/March 2025](https://www.japan-travel-note.com/posts/523) | Annex glazing at left over rough stone/vegetated bank; torii descent remains open; city framed by trees and exposed rock. | Confirms R89 bank/stair relationship. Does not establish a new terrace, skyline, exact plants or photo capture date. Existing bank/vegetation/view owners retained. |

The 2013 photographs satisfy the user's acceptance of older appearance references. They do not establish the current restoration state or a synchronized 2012 reconstruction. Source lettering is not transcribed into invented shop signs.

## Frozen structural contract

`yotsutsujiContextPlanR95(features)` resolves only these source-correspondent ring edges:

- Main Nishimura `way/301527779`, edge **0→1**: `[804.023,-212.186] → [804.014,-202.290]`, length 9.896004m. Existing owner floor remains **164.35m**.
- Nishimura annex `way/626313775`, edge **7→8**: `[795.156,-209.470] → [800.958,-209.459]`, length 5.802010m. Existing owner floor remains **163.45m**.

XZ values are mapped coordinates, not surveyed facade/canopy measurements. World geometry derives from these actual edge tangents and perpendicular normals facing west for the main frontage and north for the annex. Ring mismatch beyond 0.02m fails closed instead of moving an attachment to an unknown wall. Existing `teaHouses` owns the floor constants; this module imports them rather than duplicating independent floors.

Main attachments: one lower striped canopy, projection 1.12m, front at floor+3.03m, cloth valance ending at +2.83m; two smaller upper-window shades project 0.42m and end above +4.91m. The skins stand above the inherited plain horizontal +2.8m eave rather than cutting its facade. Exact stripe counts and the two upper spans are appearance estimates.

Annex: light roof panels project 1.25m, sloping from +3.20 to +3.07m; thin perimeter members and eight inferred rafter bays; end braces attach to the existing wall. Eight split burgundy cloth panels end at +2.18m. No new low poles, floors, lights, colliders, stairs, benches, utility cables or terrain modifications. Pale **opaque** panels approximate photographed translucent cover without adding transparent-layer sorting or transmission passes; optical accuracy remains unverified.

## API and runtime cost

`buildYotsutsujiContextR95(root, features, materials)` must run **after `buildYotsutsuji`**. It requires the existing named tea-house group and both recognized rings. Root integration should retain its returned stats in a dataset if useful. Calls are idempotent by group identity. The optional materials argument follows the surrounding builder convention; this patch creates its own untextured cloth/panel/metal palette.

Actual source-feature result: **800 triangles, 158 primitive submissions merged into five static material batches**. No textures, lights, runtime callbacks, dependencies or per-frame work added. These counts do not establish measured full-scene draw calls or FPS.

## Validation and remaining acceptance

Seven focused/adjacent tests pass across `yotsutsuji-context-r95.test.mjs` and `yotsutsuji-retaining.test.mjs`. Checks cover actual mapped endpoints, west/north facade frames, existing floor ownership, bounded above-head geometry, finite meshes, no source/owner mutation, idempotence, no transparent materials, safe rejection of changed rings, preservation of the existing retaining/stair/forecourt owner and source geography. New-file whitespace checks pass; final added-file contents reviewed.

No integrated render, source-matched camera or native walk was run by this specialist. Root should review (1) main lower/upper awnings from the court, (2) annex panel roof and cloth at eye level, and (3) downhill view to confirm additions do not visually obstruct torii/city framing. Existing plain shells and inferred bay layout remain imperfect; the patch closes recognizable frontage omissions and does not certify complete surroundings, all utility details, exact contemporary appearance or measured dimensions. Skill rendered-acceptance gate stays open until root inspects the assembly.

## Integrated review correction: L-shaped facade registration

Root supplied `outputs/r95-integrated/yotsutsuji-arrival.png` and `yotsutsuji-aerial.png`; both actual render pixels were inspected here. They showed the new main awnings facing straight into the ascending torii stair. Comparing the 2013 courtyard photograph to mapped footprints resolves a source-registration error: the open sitting court is **L-shaped**, with two-storey main frontage east/left of the viewer and the low annex south/right. The main display frontage therefore faces **west on ring edge0→1**, while the annex faces north. The initial R95 registration to main north edge14→0 was wrong and is superseded by the contract above.

The existing `yotsutsuji.mjs` main spec's `front:'north'` was the underlying facade owner mistake. Changed that one property to `front:'west'`, so the owner's wood/glazing, existing eave and new striped attachments agree on the photographed court side. No building footprint, floor, height, route, torii, stair or collider location changed. The north wall returns to the existing plain side-wall treatment beside `way/1052553392`, exactly where the mapped branch runs. New context is now 800 triangles in five batches. Revised seven focused/adjacent tests pass; exact WEST main/NORTH annex directions are now explicit assertions.

The visible black stair-end slots in the initial integrated render are a separate question. The path owner emits real riser quads and retaining sides; the offline export omits maps/shaders and cannot alone distinguish backface visibility, terrain-cut exposure or a true missing end closure. No unrelated stair patch is made here. Root/path owner must diagnose that geometry separately. The skyline and current annex height remain inherited limitations, not dimensions derived by this correction.

## Third pass: real underside closure at the court and annex join

The subsequent corrected-court arrival render was inspected. Its pale platform edge and dark open underside at the main/annex join are not canopy pixels. The map has public stair `way/1372826379` between these buildings; its accepted paving/treads sit above the ground. Actual assembled CPU probe `fushimi_inari/outputs/r90/r95-yotsu-interface.json` confirms around 0.14–0.27m separation in the inspected segment. The forecourt itself is a triangle-only polygon at ground+0.10m. Generic `supportTerraces` only recognizes original large `BoxGeometry` slabs and therefore never closes this polygon perimeter.

Added `yotsutsuji-support-r95.mjs`, called by `buildYotsutsuji`, to close the **existing** forecourt perimeter and underside side/end faces of existing stair skins on `1372826379` and `1052553392` inside X800–814/Z−216…−202. Exact segment positions, width and top heights come from the production `surfaces.segments`; the toe samples existing ground and reaches 0.22m below it for court edges and 0.28m below it for treads. The tread body lies 0.018m inside the curb and its upper rim 0.002m under the current top. This avoids replacing the accepted tread or imposing a flat terrace. Profiles represent inferred structural support, not new surveyed masonry.

One static stone batch, no new top faces, walking surfaces, collider or terrain changes. Failure on invalid source heights leaves no partial mesh. Nine focused/adjacent tests now pass, including side-ray proof of solid tread underside, no downward-ray top hit, vertical-only normals and source immutability. Root must refresh the actual integrated render to confirm the previously visible black slots are closed; no Blender process was launched by this specialist.
