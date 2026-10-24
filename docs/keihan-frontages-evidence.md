# Keihan approach food storefronts

Scope: the named Hogyokudo and Kyozuan buildings on the south side of Inari-shinmichi, an observed unnamed food counter before the canal bridge, and two anonymous facade treatments beyond the JR crossing. Root owns integration, native walkthrough and final visual acceptance.

## Sources and registration

| Store | Existing source footprint | Street edge | Inspected reference |
| --- | --- | --- | --- |
| Sohonke Hogyokudo / 宝玉堂 | `way/305213552`, X −295.402…−287.137, Z −109.895…−97.761 | Edge 0, 4.335061 m long | [Merchant association page](https://inari-kyoto.com/hogyokudo), [storefront photograph](https://inari-kyoto.com/wp/wp-content/uploads/2021/12/hogyokudo_main.jpg) |
| Kyozuan / 京豆庵 | `way/305213538`, X −256.778…−251.779, Z −94.844…−90.725 | Edge 1, 4.313889 m long | [Merchant association page](https://inari-kyoto.com/kyozuan), [storefront photograph](https://inari-kyoto.com/wp/wp-content/uploads/2021/12/kyozuan_main.jpg) |
| Unnamed observed food counter | `way/305213554`, X −251.542…−247.245, Z −119.657…−101.802 | Edge 4, 3.430565 m; photo-inferred parcel | `outputs/keihan-arrival-review/streetview-02-bridge-approach.png`, panorama `jdt_0bBLBQcMoedhCMDVJA`, October 2024, 34.9680312 / 135.7698683, heading 90° |
| Anonymous north row near Hommachi | `way/305213533`, X −192.967…−183.114, Z −92.028…−87.787 | Edge 1, 9.807628 m; photo-inferred facade class | `outputs/keihan-arrival-review/streetview-06-east-street.png`, panorama `6ki716lGb157sL6O6f-Gqw`, **November 2020**, 34.9678929 / 135.7705127, heading 90° |
| Anonymous south row near Hommachi | `way/305213560`, X −186.216…−176.409, Z −79.905…−67.304 | Edge 0, 9.533000 m; photo-inferred facade class | Same November 2020 frame; green awning, shutters and timber upper grid |

Both photos were visually inspected during this implementation. Their `/2021/12/` upload paths do not establish the exact photography date. Named OSM footprints establish the parcel registration independently of the photographs. The merchant pages corroborate the business names and food categories. No Google embedded-map viewport center was treated as a shop coordinate.

The Hogyokudo photograph shows white jambs, a dark rolled awning, a short tiled eave, a gray name board, two timber/glass display cases with a central entrance, packaged senbei and red boxes. The authored display follows those categories and proportions; it does not reproduce the inventory, prices, staff, advertisements or hidden workshop.

The Kyozuan photograph shows a black canopy, long illustrated menu strip, pale cold cases, an inset entrance, a large soft-serve model at the left, dark upper lattice windows and a name plaque. The modeled product shapes interpret the observed soft-serve and sweets. The single text atlas contains only the two confirmed business names in Japanese and Latin lettering; photographs and advertisements are not redistributed as textures.

The north-side counter is ahead/left of the October 2024 camera. Parcel 554 is the best matched footprint given that perspective; nearby parcel 539 is behind the camera. This is an explicit inference, not cadastral identification of the photographed business. The model uses the observed dark timber, cream/gold awning, red lanterns, bulb shapes, metal grill, skewer silhouettes and food-panel categories. It supplies no invented business name, menu text or price.

The November 2020 frame shows a north row with red awnings and a south row with green awnings, closed shutters, shallow eaves and upper timber grids. Two mapped front edges receive bounded examples of those visible facade classes. Bay count and exact bay allocation are inferred; they are not assertions about individual tenants. The image date changed automatically while navigating Street View, so these rows must not be described as a single exact October 2024 reconstruction.

The northwest bridge chestnut frontage was inspected in `streetview-03-bridge-west.png` (October 2024 panorama `mVT8dPF3mdWEKySYwkIvHQ`) and `streetview-04-bridge-center.png`. Its slat fascia and circular 栗 sign are visible, but its exact bay/parcel registration between nearby footprints 550/531 remains ambiguous. That named/sign treatment is deliberately withheld. Other unseen buildings and air-conditioning equipment receive no new facade detail in this packet.

## Geometry and ownership

`buildKeihanFrontages(root, features, surfaces, materials, colliders)` returns the five successful `builtIds`, `group`, `storefronts`, `surfaceHeight`, material/triangle counts and added-collider count. A repeated call returns the same group without appending colliders. Missing confirmed names, altered footprint counts, displaced registrations or unavailable road grades withhold the entire replacement before scene mutation. Generic building generation must exclude only successful `builtIds`.

All units are metres in the existing X-east/Y-up/Z-south world. Each building preserves its original footprint and the existing generic 6 m height interpretation. That height is inferred, as are the unseen rear/roof treatment, display depths and exact equipment dimensions. Front floors come from existing paved road segments, not the off-road DEM fallback: `way/946510942` supplies Hogyokudo 30.48342996 m, Kyozuan 31.49007019 m and counter 554 at 31.51548758 m; `way/79699849` supplies north row 533 at 33.55996222 m and south row 560 at 33.78619189 m. A single extruded floor closes each foundation. Only the two named shops expose a shallow 1.35 m public recess sampler; the closed counter and shuttered rows do not advertise walkable interiors.

Display cases, products and the ice-cream model are inside the source footprint. The soft-serve model has a physical plinth reaching the shop floor. Overhead canopies project toward the street above 2.5 m; their exact projections are photo estimates. Cases, jambs, backings, closed shutter fronts and mapped side walls have physical colliders. No new collider is placed across the public road.

The current packet uses **9,828 triangles, eight material batches and 38 colliders** for all five buildings together, below the agreed 12,000 triangle cap. A vertex tint supplies the green awning without a ninth material. Labels use one static local canvas atlas, with a color-only fallback when CPU construction has no DOM. No additional lights, remote assets, renderer, update loop or dependencies are added. Transparent counter glass is one shared batch and does not cast shadows. Real frame time remains a root integration measurement, not an inference from triangle count.

## Verification

`node --test fushimi_inari/integrated-world/keihan-frontages.test.mjs` passes **8/8**. The checks cover source preservation/idempotency, finite geometry and budget, road-derived heights independent of off-road fallback, actual downward rays against the one physical entry floor and soft-serve plinth, bounded sampling, physical counter/shutter fronts, dated/inferred registration, failure preflight and more than 2,000 center/±1 m samples across both streets with no correction against these new colliders.

These checks establish only this owner's geometry and collision contract. Whole-scene generic exclusion, retained prior owners, actual UI navigation, native lettering/glass/material appearance, frame time and current 2026 commercial conditions still require root's integration and visual review. Detailed shop inventories and historical exactness are not claimed.
