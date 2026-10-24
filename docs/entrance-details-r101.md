# Entrance architectural equipment R101

## Source observations and omissions

The actual2016 Townphoto approach/reverse views and2021 guide Romon views were inspected again as pixels. Existing owners R53/R59/R62/R63/R87/R94/R95/R96 already provide mapped walls, hedges, entrance court, apartment shell, roofed notice, street grates, utility pole, gallery joinery, pale rails and hanging lanterns. R101 adds no new house, enclosure, court, tree or terrain fill.

Three visible equipment families had no existing geometry owner:

1. **Apartment south-wall units and their immediate mounting hardware.** [Townphoto k01111](https://townphoto.net/kyoto/k01/k01111.jpg), local `outputs/r96-references/approach-2016.jpg`, shows several pale rectangular units below the tan south-facing balcony fascia, above/behind the hedge (roughly imageX200..350/Y500..590). The reverse [k01112](https://townphoto.net/kyoto/k01/k01112.jpg), local `approach-sun-2016.jpg`, corroborates that building's relation to the north side of the first torii. Three observed units are represented with casing, recessed dark vent/louvres, two wall brackets and short local conduit per unit. They belong to the already registered apartment `way/305214938`; no tenant, brand, interior service or hidden northern/eastern equipment is supplied.
2. **Upper Romon eave rails with small suspension rings.** [IMG6487](https://fushimiinari-guide.com/wp-content/uploads/IMG_6487_20210317.jpg) shows the dark horizontal rail below the court-facing upper eave; [IMG6491](https://fushimiinari-guide.com/wp-content/uploads/IMG_6491_20210317.jpg) resolves matching projections beneath both long eaves. Local originals are in `outputs/r96-romon/`. These are distinct from the existing gallery's pale bamboo barrier and lantern hangers. Two narrow dark rails and their brackets/rings are added; no banner, wire span, legend or supported future display is invented.
3. **One red fire-extinguisher bottle inside the north gallery.** [IMG6485](https://fushimiinari-guide.com/wp-content/uploads/IMG_6485_20210317.jpg) shows a red vertical bottle beside the outer gallery post, behind the pale rail. It is distinct from the small red pail seen outside the short end in IMG6491. R101 models only the bottle, small black handle/hose, foot and an uninscribed pale label patch. The pail is omitted because its exterior placement would require a separate circulation/ground ownership contract. No mirrored south-gallery bottle, logo or text is added.

Building-side registration follows the existing accepted R96 south facade and R71 north-gallery interpretation. Equipment categories and their visible sides are observed; **stations, counts of rings, dimensions, connection details and material colors remain inferred**. These photographs date2016/2021 and do not establish present operating condition or surveyed placement.

## API and source ownership

```js
import {buildEntranceDetailsR101} from './entrance-details-r101.mjs';
// After apartment R96 and Romon R71/R95/R96 are built, BEFORE static batching:
const entranceDetails = buildEntranceDetailsR101(root, features);
```

Both actual owners must be present before any geometry is attached. The apartment is matched by exact named group, sourceID305214938, four mapped corners,9m/three-storey envelope and its accepted six-bay/.64m recessed south facade. Romon must be the unique reconstructed R71 owner with R96 built report, existing Kairo group and successful R95 two-pediment roof report. Missing, ambiguous or changed owner signatures return `built:false` without partial insertion.

The apartment equipment is attached to its existing R96 group in that owner's current coordinate system. Romon equipment attaches in the actual GLB/source frame under the transformed Romon scene, inheriting its mapped rotation/translation. No new generic-building exclusion is returned: `builtIds:[]`. Successful repeated calls reuse the report and add nothing twice. No original mesh, attribute, material, footprint, source transform, height function or collider is replaced.

## Geometry, contact and circulation

Apartment units occupy estimated stations18%,39%,57% along the existing south edge (about3.358/7.275/10.633m from its west end). Casings are.76×.55×.31m, centred2.45m above the retained apartment floor, reaching no farther than.391m outside its facade. Only short conduit descends to1.75m; the existing hedge buffer separates it from circulation. Tests check every equipment vertex against the mapped street and Omotesando widths with40cm clearance. No support stands or objects are inserted on their walking surfaces.

Romon's two14.8m rails follow the inherited upper-eave envelope at sourceY9.49/Z±5.00, with eight small rings each and four short supports per rail. The rail/bracket top remains below9.87m and inside the retained roof envelope; it is far above pedestrian height. Width and ring counts are visual estimates. The single bottle centre is sourceX−18.05/Z−1.55, inside the existing north Kairo collider X−18.9..−6.1/Z±2.1. Its foot starts at the existing D.floor2.05. A CPU downward ray into the actual production GLB at that location hits the retained Granite upper face at2.0500001907m; no25mm floating offset is retained. No new collider or public obstruction is introduced.

Budget: **5 material meshes across two source-owner groups,2,002 triangles,3 shared plain materials**, no texture, external request, light, animation or runtime capture. Box/cylinder/torus UVs and normals are retained. The material palette is pale equipment casing, muted dark painted metal and restrained red bottle; the tiny rings use8 longitudinal/4 tube segments. Root may merge compatible materials in its existing static batching.

## Verification and boundaries

Five focused tests pass: three-family budget/idempotence/source preservation; actual apartment south-facade registration and mapped-route clearance; transformed Romon ownership with bottle inside the existing gallery; fail-closed missing/ambiguous/changed facade, footprint and roof signatures (including unbuilt roof with retained pediment count), plus malformed source-polygon/facade records. Original source geometry arrays, material identities, feature data and collider records remain unchanged.

Eight adjacent R96 frontage/Romon tests also pass:13 total. Independent source/code review found no remaining actionable component issue. Its actual prebatch probe confirms2,002 triangles/five batches, all7,320 preexisting meshes retaining geometry/attribute hashes, material identities and world matrices, and all59 interaction objects retaining identity. Live feature/collider and walking/terrain callback identities are unchanged. Evidence: `outputs/r101-review/actual-combined-prebatch.json` and `independent-review.md` (reviewer-owned). Root owns integration and serialized native visual review. This packet does not claim complete entrance reconstruction or current photographic equivalence. No integration/viewer/path-mesh file, renderer, browser or commit was used by this agent for R101.
