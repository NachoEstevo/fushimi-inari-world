# Kumataka lakeside rail R88

## Registration outcome and unbuilt terraces

The requested memorial terraces were investigated before authoring geometry. Actual pixels were inspected from the [2019 tiered approach view](https://livingkyo.com/wp-content/uploads/2019/07/200_33.png), [main arrival stair P3600669](https://fushimiinari-guide.com/wp-content/uploads/P3600669_20190210.jpg), [Takeya/pavilion passage P3600730](https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg), [pavilion side P3600705](https://fushimiinari-guide.com/wp-content/uploads/P3600705_20190210.jpg) and [rear P3600706](https://fushimiinari-guide.com/wp-content/uploads/P3600706_20190210.jpg). These are external review references, not runtime assets. Filenames do not establish verified EXIF dates or current restoration appearance.

Arrival `way/626313754` runs eastward to junction J `[534.683,-128.129]`. The onward route `way/301527750` turns northeast toward `[545.229,-145.584]`. The passage image registers Takeya to the west/left and existing pavilion roof `way/301527741` to the east/right of the onward route. Arrival and tier views place memorial structures on the south/right of the east-going arrival, separate from that pavilion roof polygon. This closes the main-route identity; it **does not close the memorial terrace perimeter, tier levels or subsidiary stair endpoints**. See [mountain-reference-register-r88.md](mountain-reference-register-r88.md).

No complete terrace polygon, new retaining tier, subsidiary steps, footings, broad grading or legacy stele removal was justified. Those remain unbuilt. The next missing evidence is a georeferenced wide view showing J, the main arrival handrail and the memorial stair mouths together. A `building=roof` ring cannot supply a compound boundary.

An actual assembly audit also rejected an imagined foundation repair: the existing pavilion-base bottom is 65.89652 m, while nine terrain samples beneath it are 66.23287–66.31287 m. Its bottom is buried by approximately 0.34–0.42 m, so it is supported. The old deck top is approximately 66.19152 m and is partly buried by the current terrain. Neither its height nor terrain was changed; exposing it would require a separately justified grade/interface decision.

## Implemented existing owner

The accepted bounded correction is `kumataka-lakeside-rail.mjs`, exporting **`buildKumatakaLakesideRail(root, materials = {})`**. Call before global material batching. It accepts either pre-relocation or post-relocation source groups, because all new geometry inherits the exact existing Kumataka group transform.

It requires the original rail, cap and shore-wall signatures together. Only the opaque rail and old cap meshes are replaced. The original stone shore, pond, pavilion/R67 refinement, interaction object/callback, deck, steles/foxes, all routes, walking heights and colliders retain their owners. No additional geographic feature or duplicate shoreline is created.

P3600705/0706 visibly establish vermilion vertical slats, dark upper ends and a continuous dark cover beside the confined pavilion passage. The replacement uses 88 slats with simple pointed black heads, five posts, two horizontal rails and a shallow closed cap. Counts, spacing and cap section are **inferred within the legacy envelope**. Its long straight placement remains an inherited approximation, not a surveyed match of the photographed confined passage or shoreline.

All replacement vertices remain within the original combined envelope:

| Local axis | Minimum | Maximum |
| --- | ---: | ---: |
| X | 2.44 m | 2.66 m |
| Y | 0.59 m | 1.59 m |
| Z | −8.50 m | 8.50 m |

Original vermilion and black materials/maps are reused. There are **2,564 replacement triangles in two static material batches**. No new texture, dependency, light, animation or per-frame work is introduced. The builder is idempotent and returns `terracesBuilt: false`, with the unresolved boundary recorded explicitly.

## Verification and visual review

Four focused tests pass: exact source-owner replacement/idempotence; unchanged pavilion callback, stone shore, steles and inherited transform; finite/nondegenerate geometry inside the exact original envelope; actual ray-tested gaps and slat visibility; and no construction when the original signatures differ. Global route/collider behavior is unchanged because neither collection nor sampler is accepted or edited by this builder.

The actual legacy builder plus existing R67 pavilion refiner and this new rail were executed for export. The exported group uses the exact rigid matrix captured from current full `integrate()` assembly; a separate full integration audit exports the current terrain sampler at the viewer's −0.06 m render offset. Blender 5.2 EEVEE close, context and reverse views were inspected under `fushimi_inari/outputs/r88-kumataka/`. The final geometry has visible open slat gaps and a continuous cap, while retaining the existing stone support and pavilion.

Offline materials are simplified; the existing vermilion material's unavailable image map is represented by an explicitly approximate red diffuse color. Plaque/calligraphy canvas drawing is stubbed. The old illustrative pond plane was omitted from the component render; no new mapped water, bank or source grade is implied. These images verify source geometry and inherited placement, not native WebGL textures, exact site proportions, a completed terraced compound or hardware FPS.

The complete Kumataka approach reconstruction remains incomplete. This delivery corrects a verified existing architectural finish while preserving the evidence gate for the much larger missing terrace structure. No shared integration/viewer edit or commit was made by this component owner.
