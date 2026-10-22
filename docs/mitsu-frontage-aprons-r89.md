# R89 Mitsutsuji north paving seam

Native R88 review located coarse brown wedges along the left/north approach
edge around X561…564 / Z−333…−330, in front of the registered gift frontage.
The mapped stair tops themselves remained clear. The inspected
[2021 lane photograph](https://fushimiinari-guide.com/wp-content/uploads/IMG_6659_20210328.jpg)
shows mineral public margins, rather than bare earth zigzags through the curb.

## Bounded correction

`buildMitsuFrontageAprons(root,features,surfaces,materials)` in
`mitsu-frontage-aprons.mjs` consumes only the actual emitted segments of
`1372838160` and`1372838161`. It adds a .42m mineral collar on the north side,
starting beyond the existing2m path and .13m curb. Each stair/segment's original
ya/yb plane anchors the inner edge; the outer edge meets existing terrain.
Exact polygon subtraction preserves buildings, water and other route widths.
The actual emitted triangle planes are registered with walking.

The first geometry review exposed the underlying ownership problem: merely
adding the collar leaves it buried beneath coarse DEM faces, and the old
procedural brown mountain shoulders also remain above it. The accepted design
therefore transfers only those surfaces' ownership:

- `.clipTerrain(flatPositions)` subtracts terrain triangles **under the existing emitted path/curb polygons and the exact new clipped collar triangles**. It preserves original DEM planes everywhere outside those polygons. Its overall bounds are only a performance prefilter, never the cut geometry.
- `surfaces.omitEarthShoulder(segment,side)` suppresses the prior procedural earth shoulder only for these two path IDs on north side−1. Existing callbacks are composed. `buildPathMeshes` must consult this hook before emitting its earth shoulder; curbs, treads, risers and their geometry remain owned by their original builder.

Root owns the integration/terrain clip chain and the small path-builder hook.
There is no source DEM elevation edit, broad flattening, new stair count,
altered central walking height, new collider, Kyoya floor claim or extra tree.
The .42m collar width/material are inferred, not a surveyed perimeter.

## Verification

Six focused tests pass: source/tread immutability, exact walking triangle
registration and upward winding, building/water/cross-route exclusions,
idempotence, bounded earth-shoulder ownership, and preservation of original DEM
planes outside terrain cuts. A real full-scene Three.js harness built15 emitted
sections: **982 new triangles, one static draw**, no dependencies or new texture
request. Existing stone material is cloned for the mineral finish.

The shared path builder is exercised directly: selected north earth triangles
are removed, south/unrelated shoulders stay byte-for-byte identical, and every
non-earth mesh position remains identical. Prior shoulder callbacks also remain
composed.

Actual source terrain/path geometry and new triangles were exported for fixed
Blender5.2 before/after ground and close seam views under
`outputs/r89-mitsu/`. Early reviews exposed the buried-patch and duplicate-earth
defects. The final third review includes both terrain clipping and the actual
shared path-builder hook: the north mineral seam is continuous, brown intrusions
are removed and central tread/curb geometry remains legible. Browser walking
and hardware FPS remain root acceptance work, not proven by isolated renders.
