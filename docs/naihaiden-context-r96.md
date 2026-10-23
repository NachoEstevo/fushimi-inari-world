# Naihaiden front architectural systems R96

API: `refineNaihaidenContextR96(scene, materials)`, in the original Naihaiden GLB frame **after** R75 and both R95 architecture/prayer-front operations, before material remapping and geographic placement. No integration/shared files edited.

Actual source pixels inspected again: `.tmp/r95-sanctuary/front.jpg` ([DSC_0712_20190331](https://fushimiinari-guide.com/wp-content/uploads/DSC_0712_20190331.jpg)) and the oblique `.tmp/r95-sanctuary/side.jpg`. The frontal image clearly shows two suspended rectangular red lanterns with pale gridded faces and small pitched roofs, dark mesh across the green transoms, and a pale rolled/header band immediately beneath. The oblique photograph shows mostly Honden and does not justify inventing Naihaiden sidewall openings or a surrounding service compound.

Code comparison: original `build_fushimi_inari_scene.py` creates standing stair lanterns at Blender X19.8; no suspended Naihaiden lantern pair is authored. R75's note about preserving existing lanterns refers to that existing source geometry. R95 adds five green rear transom panels with vertical bars only, and retains a dark closed core. It does not add the photographed pale blind/header band. Existing offering grilles, bell cords, broad rope/paper, ornaments and widened R95 karahafu remain independent owners.

This packet adds three observed systems:

- Two framed box lanterns, pale faces, fine dark grids, red four-pitch hoods, gold finials and dark suspension rods/arms reaching the existing front lintel. No emissive lights or invented emblems.
- Five horizontal transom mesh infills, supplementing rather than duplicating R95's existing upright bars and green backing.
- Five pale rolled shade/header bands with shallow vertically divided valances directly under the existing transoms, on the closed core plane.

All exact dimensions, counts, lattice pitch and inherited recessed-plane registration are inferred from the frontal photograph. Lantern body .43m square, approximately .75m high; hoods .20m rise, grid and pale paper/glass appearance simplified. Their X +/-2.4 placement follows inherited column stations rather than claiming a measured source position. Five 1.68m headers follow R95's existing five bays. Precise materials and historic construction remain unverified.

The packet has four reused material batches, 246 merged primitives and 3,052 triangles. All new vertices have box/cylinder/cone UVs; original geometry and UV arrays are unchanged, including the broadened R95 roof. No textures, dependencies, terrain, floors, public colliders or per-frame processing are added. The hanging lamps have minimum underside Y5.8825 over podium Y3.92: approximately 1.96m vertical clearance. The lower header/valance geometry remains at the solid recessed core, outside the accessible colonnade depth, and cannot establish new access. Existing collision ownership remains authoritative; actual player collision is unverified.

Three actual-GLB tests cover exact preservation of every existing mesh's position/UV arrays and geometry/parent identity, compatibility with R75/R95, idempotence, material batching, finite bounded geometry, dependency/source-frame rejection, head clearance of the lanterns and header depth. Focused and adjacent tests pass. Final source/diff reviewed. No Blender, GPU, browser or alternate renderer was used under the parent's restriction. Assembled material/texture appearance, silhouette and visual acceptance remain pending root review.

Shinsenjo's grade evidence remains unresolved separately; no Shinsenjo geometry or activation decision is part of this Naihaiden packet.
