# R90 — Tamayama western stair, south bank and right-turn continuation

22 October 2026. Reference registration only. Root owns live Maps tab `2106042479`; this agent did not touch it. Root's current live observations are recorded separately from the local/source pixels independently inspected below. No geometry edited, measured dimensions invented or old/upper torii identities merged.

## Observed evidence

Root inspected June 2012 Google panorama `MvihcVb0f466FBJebqyECg`, viewpoint approximately `34.9674832,135.7737795`, looking about 264° down the western descent. Root reports shrine row on right, big torii left, treed bank with low wood/bamboo stake fence and rocks on left of descending main stairs, stone lantern left at landing and continuous mineral court. User identifies turning **right after climbing to the top**, toward the large torii continuation.

This reference agent independently inspected existing `fushimi_inari/outputs/r66/tamayama-west-reference.png`: actual Google June 2012 label is visible; the westward stair, low pale vertical boundary along treed side at image left, tiered stone lantern, shrine row at image right, paved strips and gravel/mineral landing are visible. This is an earlier paused capture, not a new live panorama visit. It corroborates root's current interpretation but establishes no metric height, fence material specification or contemporary maintenance state.

New photographic pixels fetched from [Okumiya guide](https://fushimiinari-guide.com/okumiya/) into ignored `.tmp/r90-refs/` and inspected with `view_image`:

| URL | Actual appearance / registration | Limits |
| --- | --- | --- |
| [IMG_6890_20210308](https://fushimiinari-guide.com/wp-content/uploads/IMG_6890_20210308.jpg) | Lower western gate viewed uphill: broad stair with twin fox pedestals outside gate; Tamayama visible ahead; Gonden at right, mineral paving/gravel and planted sides | Confirms lower gate/stair relationship. Does not isolate top south-bank fence well enough to derive its entire outline |
| [IMG_6891_20210308](https://fushimiinari-guide.com/wp-content/uploads/IMG_6891_20210308.jpg) | **Separate upper Okumiya approach:** broad granite flight, centre handrail, stone fence rising at image right with trees beyond; red lantern on stone pedestal and large torii at upper right beside Okumiya | Confirms that upper continuation has its own geometry and torii. Stone balustrade here must not be copied as the low wooden/bamboo boundary of the lower western bank |
| [IMG_7393_20210326](https://fushimiinari-guide.com/wp-content/uploads/IMG_7393_20210326.jpg) | Night reverse/uphill view of same lower gate, foxes and stair split, Tamayama ahead | Useful cross-check only; shadow hides planting/boundary details, no new height measurement |

These are March 2021 named files/page context, not EXIF-surveyed captures. Guide text independently describes climbing beside Gonden, Tamayama ahead, then turning right toward further steps/Okumiya, with the opposite left branch toward other destinations. No video timestamp was newly inspected.

## Exact mapped path registration

World coordinates: metres, X east, Y GSI-derived elevation, Z south. The provided geographic path Y values below are **raw map/terrain samples**, not the actual final authored tread heights and not a survey. R66 derived rendering widens the four western ways to 4.8 m; raw tags remain 2 m. Preserve existing resolved width/height ownership instead of rebuilding from raw Y.

| Function / ID | Exact source points X,Y,Z |
| --- | --- |
| Lower main western stair `way/105449693` | A `[75.725,48.46,-33.708]` → B `[85.550,49.03,-33.752]` |
| Intermediate western landing `way/1133055112` | B → `[86.955,49.11,-33.763]` → C `[88.487,49.20,-33.763]` |
| Short upper western stair `way/1133055111` | C → D `[92.492,49.43,-33.774]` |
| Upper western approach `way/649175020` | Dataset order J `[97.199,49.70,-33.841]` → `[93.459,49.48,-33.785]` → D; ascent traversal is reverse |
| Tamayama's actual prayer approach `way/1133053715` | J → `[101.806,50.02,-33.930]` |
| Right-turn branch from western ascent `way/1133055117` | J → `[97.300,49.89,-29.288]` |
| Short branch steps `way/297888105` | `[97.300,49.89,-29.288]` → `[97.391,50.07,-24.724]` → `[97.437,50.15,-22.676]` |
| Continuation `way/1133055118` | `[97.437,50.15,-22.676]` → T `[97.801,50.39,-17.377]` |
| Broad upper approach `way/1133055119` | T → U `[102.107,50.78,-17.611]`; mapped width 6 m |
| Main Okumiya flight `way/626313768` | U → V `[114.952,52.09,-18.023]`; mapped width 6 m and centre handrail |
| Okumiya upper landing `way/1392716577` | V → `[117.168,52.36,-18.201]`; mapped width 6 m |
| Opposite left/north branch `way/1392894128` | J → `[101.259,49.55,-42.179]` → `[103.193,49.43,-46.164]` → `[103.357,49.19,-50.595]` → `[103.293,49.01,-53.812]` in traversal reverse to dataset order |

From the bottom, ascent is roughly east/+X. Therefore user **right at the top** is south/+Z along `1133055117`, then bends east along the broad upper approach to Okumiya. Looking back down west, **left of the western stair is south/+Z**. These two viewpoint descriptions agree; they are not evidence of separate contradictory stairs.

The shrine `way/305214602` is Tamayama; the upper Okumiya anchor is `node/11017955705`. Keep the Tamayama prayer approach, right-turn public continuation and Okumiya shrine body separate. The Nōsatsusho/pond branch is the north/left route, not the right-turn ascent.

## Bank/fence boundary and existing ownership

The low stake boundary belongs to the **south side of the western access corridor**, visually adjacent to trees/rocks and the lower approach landing. Its authoritative alignment is relative to the resolved south edge of `105449693` and its existing landings, not a newly invented straight line through mapped path centres. With the eastbound main-flight direction, south is the positive-Z side (the exact perpendicular has a negligible east component).

R77 `tamayama-stair-borders.mjs` already owns clipped rough-stone border pieces on both sides of the main `105449693` flight: estimated thickness 0.48 m and exposed height 0.55 m, outside the resolved curb. These are authored guesses, not source dimensions. `tamayama-access-shoulders.mjs` owns bounded gravel shoulders on upper `649175020`; R68 junction triangles resolve transitions; `tamayama-stair-rail.mjs` owns dividing rail. New fence/rock/tree work must audit those existing pieces rather than duplicate a wall/rail or cover the full-width walk surface.

**Sufficiently registered:** correct south side, correct main western flight and connected landing, presence/type of low boundary and planting/rocks, contrast with mineral court, and topology of right-turn continuation. **Unresolved:** surveyed fence height, exact material species, count/spacing of stakes, tree roots, rock inventory and precise terminal fence endpoints. Derive a bounded candidate from real resolved edge, subtract other path/junction/building footprints, label dimensions/placement as inferred and inspect the full assembly before acceptance. Do not turn an uncertain endpoint into a new access barrier or grassy plaza.

The older lower-gate owner `gonden-access-torii-layout.mjs` places one photo-inferred gate at A `[75.725,-33.708]`; 5.6 m span and 5.8 m height are estimates. It is already an explicit dedicated assembly. The user's large torii in the **right-turn upper continuation** must be checked against actual upper-route/Okumiya existing torii ownership. Do not move the lower A gate to satisfy that upper view or add another at A. Source IMG_6891 proves separate upper torii appearance, but this register supplies no independently measured upper torii centre.

## Implementation handoff and acceptance

Sent exact mapped route/endpoints to `approach_implementation`. Root retains shared integration and live Maps control. Suggested bounded packet is the source-correspondent south tree/stake/rock edge and correct continuous mineral landing, followed by an explicit audit of the existing upper gate and right-turn chain. This does not authorize wholesale terrain changes, duplicate torii or guessed tree groves.

Acceptance requires source-matched westward descent and reverse eastward ascent views, a view through the right turn toward upper flight, visible low fence/rocks supported by actual terrain, no collision blocking main width or branch, preserved Tamayama final approach and unchanged Okumiya shrine/upper stair ownership. Report candidate dimensions and unverified endpoints; route graph checks alone do not establish their visual correctness.
