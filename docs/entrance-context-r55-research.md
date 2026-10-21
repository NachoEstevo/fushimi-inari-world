# R55: mapped entrance buildings and greenery

Research snapshot 21 October 2026; no scene edits. Source: the direct OSM map
response already saved locally as `fushimi_inari/outputs/r53/entrance-context.osm`
from [this bounded API request](https://api.openstreetmap.org/api/0.6/map?bbox=135.7708,34.9666,135.7732,34.968).
The compact derived `geography/sources/entrance-context-r55.json` preserves
actual mapped IDs/tags and local X/Z points only, plus bounds and existing-data
membership. No editor usernames, UIDs, changesets or raw XML were copied.

## Main finding

All **50 building footprints** intersecting X −160…−18, Z −100…65 already
exist in `geography/features.json`. A missing-looking neighbourhood is not
explained by missing building geometry in that snapshot. Check runtime generic
building visibility, exclusions, materials and terrain overlap before making
additional duplicate buildings. New buildings are not justified by this pass.

The direct response supplies **nine mapped trees and five hedge lines** in
this region. Their positions are real source coordinates; tree height, crown
radius, trunk girth and untagged species are not measured. No mapped grass,
forest, scrub, tree-row or garden polygon was found in this bounded region.
This does not prove vegetation absent; it does rule out claiming an invented
broad lawn polygon is OSM-backed.

## Closest supported entrance greenery

| Source ID | Local X / Z m | Supported appearance / limitation |
| --- | --- | --- |
| `node/10564299665` | −58.621 / −5.354 | Tree, species and dimensions untagged |
| `node/10564299671` | −26.236 / −9.406 | Tree, species and dimensions untagged |
| `node/10564299672` | −29.091 / −12.089 | Tree, species and dimensions untagged |
| `node/10564299673` | −33.552 / −11.711 | Tree, species and dimensions untagged |
| `node/10564299677` | −46.041 / 12.423 | Camphor, evergreen broadleaf, urban tree; dimensions untagged |
| `node/9661280976` | −51.259 / −70.120 | Evergreen broadleaf; dimensions/species untagged |
| `node/9661280977` | −53.768 / −70.243 | Cherry, deciduous broadleaf; dimensions untagged |
| `node/10564313415` | −55.017 / −61.682 | Tree, species and dimensions untagged |
| `node/9661280983` | −152.864 / −84.792 | Pine, evergreen needleleaf; dimensions untagged |

Near-side mapped hedge lines:

- `way/1133052411`: [−127.422,5.009] → [−135.851,5.210].
- `way/1133052412`: [−122.797,4.898] → [−80.861,2.327].
- `way/1133052439`: [−53.822,−11.655] → [−48.805,−3.184].
- `way/1133053711`: [−32.074,9.139] → [−22.396,8.683].
- Further north `way/1051333119`: [−45.630,−54.090] → [−40.248,−47.545].

These lines overlap the prior R53 barrier inventory where already implemented;
match by source ID before adding geometry. Hedge height/thickness are inferred.
Do not connect gaps or scatter trees across mapped walking paths.

## Building identity and bounds worth retaining

| Source ID | Bounds X / Z m | Source-supported identity |
| --- | --- | --- |
| `way/260121327` | −43.961…−26.145 / −24.045…−13.626 | Named shrine guardhouse; not automatically the unidentified Temizuya shop |
| `way/260121332` | −51.578…−29.028 / −41.121…−21.418 | Retail, gift shop, 南神具株式会社 |
| `way/305213644` | −56.769…−46.533 / −82.933…−72.246 | Gift shop, 株式会社名産館 神祭具 稲荷 |
| `way/305214379` | −154.890…−123.600 / −66.435…−58.253 | Retail, one level, chemist; source name ドラッグ ユタカ |
| `way/305215313` | −132.722…−118.537 / −5.221…2.293 | Dentist, two levels, check date 2023-10-05 |
| `way/305214938` | −152.518…−133.844 / −3.651…2.104 | Apartments, three levels |
| `way/223276575` | −87.676…−58.767 / −60.602…−31.147 | Conflicting/dated context: name 儀式殿 but `building=construction`, `construction=hotel`; do not portray a verified operating hall/hotel from these tags alone |

Names establish source attribution, not current tenancy or exact photographed
facades. Reconstruct visible facade details only against a matched photograph;
do not add invented retail signs or claim every unnamed building is a shop.

## Surface boundary exception

`way/1543934980`, X −154.552…−122.888, Z −42.669…−29.455,
is a mapped **brownfield**, check date 2026-06-15. It is retained separately
under `landuse`, not greenery. Do not plant or pave it by default. R54's
parking and paved-route evidence remains separate surface ownership.

## Safe implementation sequence

1. Audit whether the fifty existing generic footprints are rendered and seated
   correctly; replace ownership only once per building when adding details.
2. Add only the nine independently mapped trees, preserving species where
   tagged, ground each trunk individually and label dimensions inferred.
3. Match the five hedge IDs against R53 ownership and add only absent lines.
   Use existing white-wall source IDs, not arbitrary boundary extensions.
4. Compare fixed north/south approach views. Reject obvious route interference
   rather than moving source tree coordinates silently; report any mismatch.

No new photographic review was performed for this research pass. Prior user
photo 1 establishes Azumamaro's lateral garden, not a blanket vegetation plan
for the north neighbourhood. Current dates and building condition need visual
verification before detailed architectural claims.

## Implemented R55 and validation

The runtime aerial-only building rule hid nearby footprints. R55 gives 45 bounded
footprints permanent merged geometry and excludes their old generic duplicates.
The five authored shops remain; overlapping way/305215314 is skipped. Neutral
roof caps and untagged heights are explicitly estimated, not surveyed replicas.

The public northeast facade of Minami Shingu (way/260121332) uses timber battens,
upper screens and a restrained tan awning from the visually inspected 2016
photo https://townphoto.net/kyoto/k01/k01202.jpg on
https://townphoto.net/kyoto/fushimiinari2.html . Bay spacing and dimensions remain
estimates. Unknown facades receive no invented signage.

Nine mapped tree roots were added in two instanced batches, with eight colliders.
The pine's mapped root falls inside the approximate path corridor, so it has no
blocking collider; this source/path-width mismatch still needs field-image review.
Two previously absent hedge IDs complete the five-line inventory.

After the PC restart: server HTTP 200; 125 Node tests passed; diff whitespace
check passed. The reopened browser loaded all 45 footprints and nine trees with
no captured warnings/errors. Walked west from Omotesando through the first torii,
then inspected the entrance in free flight. Capture:
`fushimi_inari/outputs/r55/entrance-context.png` (local, ignored).

Remaining: close-up validation of every frontage, real roof forms, small surface
connections and sparse crowns. No exhaustive collision audit or FPS benchmark
was performed; this pass does not establish an identical replica.
