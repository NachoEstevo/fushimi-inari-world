# R56 — video-led Omotesando appearance correction

Reference: https://www.youtube.com/watch?v=iqK2tg-TxbY&t=28s . Inspected paused
frames at 00:28 and 00:43 through the browser. Local reference captures live in
`fushimi_inari/outputs/r56/` (ignored, not redistributed).

Observed: long grey paving slabs aligned along the approach; small mineral/cobble
margins; white boundary panels over dark timber wainscot and rails; shallow tiled
coping; low rough-stone edges under clipped hedges; broad, pruned leafy crowns.
Dimensions and colors are visual estimates, not surveyed measurements.

Changes preserve mapped wall/hedge lines, gaps, tree roots and walking heights.
Only path way/105449722 gets the directional slab material (estimated 0.8 by
1.6m slabs); other routes and stair faces retain their prior materials. Nine tree
crowns use denser cutout sprays in two instanced batches, under 37k triangles,
without adding canopy shadow draws. Three existing approach hedges gain low
stone bases; interior hedge lines do not. Finer dark leaves replace coarse bright
triangles. Wall construction is instanced by material.

Google Street View panorama ALTClVF04s972933Dg4p2g was also inspected, looking
around Gehaiden. It is dated June 2012 and does not establish current shop tenants
or complete modern entrance geometry. The new video is the primary appearance
reference for this pass; no invented facade designs are claimed as exact.

Known remaining differences: five retained legacy shop bodies are interpretive,
most neighborhood roofs/facades remain massing, some older tall entrance trees
still need individual source matching, and the exact garden widths/light fixture
positions need a dedicated registration pass. This is not a complete replica.

Removed only the unsupported illustrative entrance row (14 stone lanterns, six
point lights and matching colliders) by original zone/coordinate/geometry
signatures, plus five invented Welcome labels. Other shrine and mountain
lanterns are preserved. Regression checks cover positive and neighboring/wrong
zone cases. Full Node suite: 126 passed. No FPS benchmark claimed.
Final browser check: Omotesando teleport and 25m westward walk succeeded; both
reviewed views rendered with no captured console warnings/errors. Verified
Welcome labels and repeated stone row absent. Final local capture:
`fushimi_inari/outputs/r56/omotesando-reviewed.png`.
