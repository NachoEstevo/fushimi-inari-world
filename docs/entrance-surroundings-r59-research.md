# R59 — Sourced next steps outside Omotesando

Research checked 2026-10-21. Initial research below records evidence and holds; see entrance-surroundings-r59.md for subsequent implementation and visual review. The existing scene already has mapped neighborhood massing, Minami Shingu's photographed facade/roof, the main cobble shoulders, white boundary walls, approach hedges and mapped trees.

## Evidence and limits

- [Fushimi Inari Guide: Omotesando](https://fushimiinari-guide.com/omotesando/) identifies the three small shrines on the left, bicycle parking opposite, and an unused stone basin with a nearby stone lantern before the second torii. Its page links individual photographs. The page is an independent visitor guide, not a surveyed plan. Several image fetches timed out in this pass; the contextual captions were retrieved. Do not claim that all photograph pixels were newly inspected.
- [Townphoto: JR station and Omotesando](https://townphoto.net/kyoto/fushimiinari.html) distinguishes the station frontage, approach and second torii. The approach sequence is from 2016; later sanctuary images switch to 2005. Temporary festival flags in those photographs do not establish permanent fixtures.
- [Townphoto: Urassando](https://townphoto.net/kyoto/fushimiinari2.html) documents the northwest view from near Romon and shops along Urassando. Its early company/shop view supports the previously matched Minami facade; it does not justify copying retail facades onto neighboring buildings.
- Geographic checks used `geography/features.json`, `geography/sources/entrance-barriers.json`, the existing R54 surface inventory and R55 context inventory. No source file or scene module was modified.

## 1. Complete the mapped three-shrine enclosure, not an invented garden

The guide's three-shrine photograph is [IMG_6470_20210313.jpg](https://fushimiinari-guide.com/wp-content/uploads/IMG_6470_20210313.jpg). Its identity/order agrees with these actual POIs:

| Shrine | Exact source ID | Local X / Z m |
| --- | --- | --- |
| Kumano-sha | `node/10236496678` | -81.190 / -16.820 |
| Fujio-sha | `node/10236503541` | -77.139 / -16.676 |
| Reikon-sha | `node/10236503542` | -72.487 / -16.587 |

The compact barrier source also contains directly usable small enclosures: `way/1263631065` and `way/1263631066` are red wooden post-and-rail fences tagged 0.5 m; `way/1263631067` is gray wooden rail fencing tagged 0.7 m. `way/1263631068` is masonry retaining wall tagged 0.5 m. The larger enclosing red rail is `way/1119273331`; adjoining retaining wall is `way/1119779132`.

**Bounded next change:** implement those exact rail/retaining lines, their original openings and tagged heights. Retain mapped shrine-node roots. These IDs do not occur in current scene-builder code, so they are a concrete missing layer rather than duplicated approach hedges. Do not extrude a new building footprint around a point POI: shrine body dimensions/roof form still need direct photographic inspection. Keep the three front openings and access clear.

The nearby stone name pillar is separately mapped as `node/10236493859` at X -70.288 / Z -5.944, material stone, with a recorded inscription. Its identity is source-backed; do not relocate the legacy first-gate pillar to this node, because they are different monuments.

## 2. Resolve the actual bicycle-parking recess opposite the shrines

The guide links [IMG_7698_20210405.jpg](https://fushimiinari-guide.com/wp-content/uploads/IMG_7698_20210405.jpg). The previously recovered closed source polygon is `way/264074614`, X -78.562…-65.554 / Z 22.932…26.728, tagged `amenity=bicycle_parking`, `covered=no`.

`entrance-area-surfaces.mjs` currently builds only parking IDs `1325613474` and `626313864`; it does not explicitly construct this bicycle footprint. **Bounded next change:** derive a terrain-following mineral surface/recess from the actual polygon and its mapped access, preserving the white-wall openings. First inspect the photograph to choose its surface material. Rack counts, bicycle placement and signs remain unverified; add none merely to communicate its function. Do not fill a broad south-side rectangle or close the access gap.

## 3. Unused basin and adjacent lantern: supported objects, placement still on hold

Direct image references: [basin IMG_7702_20210405.jpg](https://fushimiinari-guide.com/wp-content/uploads/IMG_7702_20210405.jpg) and [lantern IMG_7705_20210405.jpg](https://fushimiinari-guide.com/wp-content/uploads/IMG_7705_20210405.jpg).

The guide locates these on the left immediately before the second torii. It identifies the basin as unused; no flowing water, bamboo rack or new pavilion follows from that evidence. Its historical dates are attribution, not dimensional authority.

**Duplicate audit:** the existing `legacy-builders.mjs` basin near lines 1138–1151 is a 2.2 x 0.86 x 1.25 m active Temizuya basin inside the canopy ensemble; it must not be treated as this unused roadside basin. The old approach also has a regular array of stone lanterns, whose compressed placement is not proof that one is the pictured partner. `features.pois` supplies no basin/lantern object in the immediate second-torii search box X -70…-15 / Z -25…20. The second torii itself is raw two-node `way/359847610`; its processed POI is the first endpoint, not its center.

**Next action before geometry:** inspect both photographs together and match the guardhouse edge `way/260121327`, nearby wall/hedge returns and second-torii node pair. Record an estimated station only after at least two relationships agree, then audit any existing lantern at that location. Until then, do not place another basin or lantern at an arbitrary north-side offset.

## Acceptance for the next build

Use exact source IDs in metadata; separate tagged dimensions from visual estimates. Preserve source gaps and mapped walking corridors. Render the approach toward Romon and back toward the first torii, then walk the affected recess/front openings. Neither these photographs nor the OSM snapshot certify present-day tenancy, historical exactness or surveyed dimensions.
