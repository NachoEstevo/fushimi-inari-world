# R101 independent source/code review

## Kumataka entry fittings

The inspected source `outputs/r97-kumataka-references/P3600730_20190210.jpg` supports timber gable fittings, a sagging rope, pale folded paper and straw bundles on the small entry pavilion. `kumataka-details-r101.mjs` adds those details under the existing source-relative entry group without changing its transform, basin, roof or colliders. Front-local-X placement matches the existing accepted bay registration; no new outer boundary is inferred.

The initial 1 cm kingpost/tie separation was corrected by the owner. Current geometry uses the .36 m kingpost centered at Y2.42, meeting the tie top at2.25 with positive overlap; the test extracts the actual merged triangle bounds and verifies contact in XYZ. No remaining actionable component finding.

Final budget is680 triangles,75 primitives and three static material batches. No texture, light or per-frame work is added. The return contains a Group reference; integration must omit that field when serializing metadata. Existing focused tests check callback identity, failed-contract isolation, local bounds and actual world public-paving plus0.28 m player clearance. Tests were inspected rather than redundantly rerun here; the owning agent reports three passing tests.

Combined actual assembly/integration and native appearance remain pending parent acceptance. No production changes, browser or renderer were used in this review.

## Okusha fittings

Inspected `outputs/r101-okusha/court-2019.jpg` and `counter-2019.jpg` directly, and compared the new code with the existing actual hall/reception roof builders. The photographed gable pendant, three-scroll crest and two counter lanterns support these fitting types. New lattice treatment retains the existing opaque sanctuary-wall owner; it creates no new accessible interior.

New gable geometry overlaps the original kingpost in Z; the ridge pedestal intersects the existing ridge. Reception hanger height evaluates the same sloping-sheet equation as the original counter roof. Hall/reception position and rotation are copied once into sibling detail groups. The minimum geometry elevation stays above local2.1 m. Existing owners, materials and colliders are preserved; no new light or per-frame work is added.

The owning agent reports1,896 triangles in five batches and eight passing tests including the six original architecture tests. Those source-preservation, roof-contact, boundedness and fail-closed tests were inspected without redundant execution here. No actionable component finding. Root integration omits Group when serializing metadata; JSON naturally omits the plan's function property.

## Entrance equipment

Directly inspected the2016 approach photograph and2021 Romon photographs (`outputs/r96-references/approach-2016.jpg`, `outputs/r96-romon/source-6485.jpg`, `source-6487.jpg`). They support the visible south apartment equipment, upper-eave dark rails/rings and one red bottle behind the north gallery barrier. The code uses the existing south facade and Romon source frame; it does not add exterior obstacles or the separate red pail.

Two review observations were resolved by the owner: the roof-signature rejection now uses OR, rejecting either an unbuilt roof or wrong pediment count; the bottle foot now uses D.floor2.05, matching the actual source Granite support at2.0500001907 rather than floating25 mm above it. The corresponding malformed-contract fixtures are present. Source geometry/materials, public paths and existing collider ownership remain intact. Final budget:2,002 triangles in five batches using three shared plain materials. No remaining actionable component finding.

## Actual combined evidence

`actual-combined-prebatch.json` captures current integrated Kumataka and Okusha groups and adds entrance once at the final prebatch boundary. The first two builder calls are already present in root integration; their duplicate guards return null, so group inspection is the acceptance evidence for those calls. The geometry-identity snapshot specifically surrounds the entrance addition.

Actual groups total4,578 triangles in13 meshes before normal global batching:680/3 Kumataka,1,896/5 Okusha and2,002/5 entrance (split over the two established owners). All7,320 preexisting mesh geometry/attribute hashes, material identities and world matrices remain unchanged through entrance addition. All59 interaction-object identities, live colliders, features and walking/terrain height callback identities remain unchanged. No per-frame update, dynamic light or texture request is introduced.

Final root wiring was inspected afterward: all three imports use101-release; builders run after their required existing owners and before global static batching. Group fields are excluded from Kumataka/Okusha report serialization; entrance returns plain metadata. Index loads viewer101-release, which loads integration101-release and the R100 path builder. The live R100 report is still republished after path construction. No further wiring finding. Native renders and the full release suite remain root-owned. Source owners' focused tests were inspected and their reported passing results retained; no redundant suite was launched. No production edits were made.
