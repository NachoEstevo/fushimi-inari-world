# R95 precinct integration review — 23 October 2026

This is a substantial reference-informed geometry pass, not certification of an identical replica. Work resumed after a machine shutdown; the local viewer was restarted on port8420 and returned HTTP200. Scope and source packets are in [the production log](precinct-production-r95.md).

## Implemented

- **Omotesando:** keep the mapped8m corridor, divide it into4.8m central slabs and1.6m side bands; add inferred source-visible avenue planting, soil wells and tree supports. Wells follow actual terrain vertices. Existing authentic statue pinch point retained.
- **Romon / Gehaiden:** correct roof/gable/rafter junctions, open balcony/screen geometry and timber divisions; replace Gehaiden lanterns with12 square framed lanterns. Original textured roof materials retained with metric UVs.
- **Naihaiden / Honden / Gonden:** broaden curved entrance roof, attach bell cords, add offering grilles, replace solid outer enclosure with open pickets, fill a verified short rear boundary. Add mapped Choja and remove three exact misplaced legacy shrine/horse proxies only after their real mapped owners exist.
- **Tamayama / Okumiya:** source-backed coping, stone balustrade and wooded flank; two roofed lanterns replace inappropriate generic building blocks. Remove a generic duplicate covering the actual Okumiya front.
- **Senbon / Okusha:** preserve both connected lanes; improve reception frontage, eaves and pavilion tassels. Court uses the actual resolved path triangles. Remove duplicate coplanar path/curb surfaces and seat service plinth undersides beneath the court.
- **Yotsutsuji:** turn the main frontage west into its L-shaped courtyard; add striped awnings, annex canopy and noren. Close existing platform/tread undersides without altering walking heights.

## Validation

- Full Node suite: **447 passed, zero failures**, following the final production-bucket correction. Command: `node --test fushimi_inari/integrated-world/*.test.mjs fushimi_inari/geography/*.test.mjs`.
- Independent source/diff review found no remaining concrete defects in the scoped changes. Final scoped diff checked before commit; no dependencies added.
- Actual CPU integration route audit: Naihaiden→Honden changed from50 blocked samples per direction to **zero** after misplaced proxies were replaced. Other24-route audit results remained unchanged. Central stair-rail centreline diagnostics are not walkable-lane tests; explicit side lanes and both Senbon lanes have zero blocked/invalid samples in both directions. See [route records — archived](repository-archive.md#historical-review-evidence) (`review-r95/routes.json`) and [explicit lanes — archived](repository-archive.md#historical-review-evidence) (`review-r95/explicit-lanes.json`).
- Okusha actual exported floor coverage:12,160 samples, zero uncovered samples; plateau checks report zero coplanar overlaps after service-plinth underside correction. Sloping Senbon approaches retain their original grades.
- Several actual geometry render/inspect/correct rounds completed, one Blender CPU renderer at a time. Final fixed views confirm roof attachments, restored Okumiya front, closed Yotsutsuji platform slots, continuous Okusha court and removed sanctuary path rectangle. The last rectangle exposed an integration gap: local paving uses the precinct material bucket; the new actual-renderer regression covers it.

## Diagnostic images

These are actual geometry renders with a simplified palette. White surfaces and opaque foliage are diagnostic substitutions, not the game's final materials.

[Romon before and after — archived](repository-archive.md#historical-review-evidence) (`review-r95/romon-comparison.jpg`)
[Gehaiden before and after — archived](repository-archive.md#historical-review-evidence) (`review-r95/gehaiden-comparison.jpg`)
[Okusha continuous court — archived](repository-archive.md#historical-review-evidence) (`review-r95/okusha-arrival.png`)
[Mapped Choja, Tamayama and repaired junction — archived](repository-archive.md#historical-review-evidence) (`review-r95/tamayama-choja-overlap.png`)
[Yotsutsuji courtyard frontage — archived](repository-archive.md#historical-review-evidence) (`review-r95/yotsutsuji-arrival.png`)

## Remaining limits

Native textured WebGL appearance, interaction and measured FPS were not verified in this run: the local browser automation was blocked earlier, and no alternate browser was used to bypass it. HTTP and CPU checks do not prove that acceptance. Exact heights, unseen facades, some plant positions and small ornamental details remain inferred from photos. Shinsenjo remains disabled until its conflicting terrain grade owners are resolved. Do not interpret passing geometry tests or these images as full historical accuracy.

Code hashes for this review are stored in [source-hashes.json — archived](repository-archive.md#historical-review-evidence) (`review-r95/source-hashes.json`). Heavy local exports and Blender files remain outside the commit. Prior unrelated README/social-preview work remains untouched.
