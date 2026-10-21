# R60 — Omotesando side shrine court

## Reference and scope

Compared the scene against the [three-shrine photograph](https://fushimiinari-guide.com/wp-content/uploads/IMG_6470_20210313.jpg) and [Gishikiden close view](https://fushimiinari-guide.com/wp-content/uploads/IMG_7524_20210405.jpg), linked by the [Omotesando guide](https://fushimiinari-guide.com/omotesando/). These photographs document 2021 appearance, not a surveyed or verified current condition.

The mapped Kumano, Fujio and Reikon positions and enclosures remain the spatial anchors. Accessory positions, tree roots, botanical forms and architectural dimensions are photo estimates. No additional lawns, shops or historical sign prose were invented.

## Changes

- Two small stone lanterns and three timber-framed cream boards. Labels use only the mapped shrine names.
- Two blue-green outer lamps based on the visible photograph; no additional dynamic lights.
- Fujio roof orientation corrected independently of its body, doors and collision volume.
- Three pine-like crowns and one broadleaf crown behind the shrines. Native review caught overly sparse initial crowns; overlapping angled foliage and lower branches replace that first pass. Four roots retain footprint/path exclusions and trunk colliders.
- Only Gishikiden's mapped building receives the explicitly estimated 16 m envelope, dark recesses, pale horizontal fins and open upper rails. The bands are not claimed to be storeys. See [research and limitations](entrance-gishikiden-r60-research.md).
- Court boundary cells refine from 40 cm to 10 cm near excluded footprints and paths. Whole-cell clearance remains conservative; ground elevations and walking routes are unchanged.

## Performance and verification

Tree geometry uses two instanced draw batches: 88 foliage instances and 100 wood instances, approximately 15,472 triangles. Foliage casts no shadows. Court accessories and facade parts merge by material; no new dependency or runtime data fetch is required. This is a geometry budget, not an FPS benchmark.

The full existing geography/integrated-world suite passes 130 tests. Native browser review covers the court approach and an elevated oblique view of Gishikiden. Final screenshots are stored locally under `fushimi_inari/outputs/r60/` and are not repository assets.

Remaining limitations: precise tree species/roots, accessory dimensions, Gishikiden height and upper setbacks, entrance glazing/canopy correspondence, and unseen facade details need stronger references. Night lighting and hardware FPS were not benchmarked. This pass is a closer reference-based reconstruction, not a claim of an identical replica.
