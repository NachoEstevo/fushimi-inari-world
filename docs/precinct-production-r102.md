# R102 mapped rest-area surroundings

After the R101 architectural fittings, the user-requested surroundings work found actual omitted map objects. This packet implements two rest benches beside Shin-ike and one confirmed open hand-washing shelter near the paired Senbon tunnel arrival at Okusha. It does not fill empty areas with invented buildings.

## Registration and implementation

Kumataka benches use primary OSM node9667109065/66/67 positions, capacities, materials and backrest tags: one blue metal backrest bench and two wooden backless seats. Azimuth and dimensions are inferred parallel to the adjacent shoreline. The full footprints avoid mapped water, roofs, buffered public paths and existing solids; two are accepted without shifting their source centers; the third is withheld because it intersects an existing colliderless stone stele. A fourth stone bench is withheld for path conflict. Vending machine/sign positions are documented but appearance unverified, so not constructed.

Okusha shelter uses mapped roof1267862163 and independently registered water tap11775043282, corroborated by actual 2016/2020 photographs. Its four-post open frame, shallow green roof, basin/catchment and paper fittings occupy the existing footprint. The old scene excluded this roof but had no replacement; the initial guess that it was a visible generic box was disproved by actual assembly. Other roof candidates remain pending.

## Review and corrections

Independent review caught a4cm bench-leg gap caused by raw terrain height versus rendered triangles. The corrected builder requires triangle support and embeds each foot2cm beneath it. All12feet were independently ray-checked against the viewer's final clipped terrain. Root supplies the integration triangle array, which has identical support at these accepted dry sites. No magic offset or fallback grade remains.

The shelter seats on the final paved walk-height contract; individual post feet embed3cm below support. Existing geometry, materials, transforms and59interaction callbacks are preserved. The additions total1,468triangles,8static prebatch meshes and7colliders. Across7nearby routes,2,928center/side samples show no increased collision correction.

602 release-scope tests passed, zero failures (unintegrated R103 tests excluded). Root inspected two corrected CPU views at the original camera positions; admitted benches no longer cross the stele and the basin meets its base. Native materials, exact historical dimensions, inferred bench orientation and FPS remain unverified. Evidence is packaged in review-r102.

## Remaining registered work

The surroundings registers identify north/southeast Okusha fences, southern stone terrace, further shelter candidates, Kumataka outflow/approach details and a map/photo discrepancy in the existing inferred water-pavilion position. These require their own source/owner reconciliation. Do not silently move old structures, merge present construction with2016–2020 references or invent missing wall endpoints. R100's35mm apron seam and the full Shinsenjo grade remain open.

Visual review additionally caught an existing stone crossing one wooden bench and a5cm gap beneath the bowl. Exact transformed stone-hull guards now withhold that bench without moving either owner, and the bowl underside now meets its catchment deck. Independent actual assembly verifies both corrections; the final matched render pair confirms the scoped correction.
