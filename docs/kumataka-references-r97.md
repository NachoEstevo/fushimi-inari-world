# R97 Kumataka-sha / Shin-ike source packet

Research-only packet. Architectural production skill and actual R67/R88/R89
builders/reference documents were read. No production geometry edit, 3D
instance, GPU/native renderer or local browser was used. Sources below were
fetched and actual pixels inspected; none of the user videos was newly watched
in this pass.

## Named structures and reliable orientation

- **Takeya / 竹屋**, mapped `way/301527736`, is the substantial concave timber
  shop/cafe WEST of the onward passage. Its existing ten-point footprint and
  lane-facing edge4→5 `[534.802,-131.435] → [540.923,-141.643]` are already
  registered. Do not rotate the entire shop from a screenshot impression.
- **Kumataka-sha / 熊鷹社**, mapped `building=roof way/301527741`, is the smaller
  worship pavilion EAST of the passage, at the pond's west edge. Its worship
  frontage faces NORTHWEST ACROSS THE PASSAGE toward Takeya. This is directly
  established by `P3600691_20190219.jpg`, photographed from INSIDE Takeya looking
  through the open shop front directly at worshippers, candle altar, rope and
  shrine curtains. The timber small gable at the SOUTH entrance in P3600730 is
  the temizuya/water-basin shelter, not proof of a southwest-facing worship
  front. An earlier working hypothesis confusing those two was rejected before
  this packet was finalized.
- **Shin-ike / 新池**, also Kodama-ga-ike, mapped water `way/105449705`, lies
  EAST/SOUTHEAST of the shrine. It is a forest-reflecting pond below a stone
  projection carrying the shrine and its red tamagaki. It is not an elevated
  blue decorative pool.
- The small pale utility/shrine-like box visible on the far bank through the
  rail in P3600707 has no name independently established here. Do not identify
  it as Takeya, Kumataka pavilion or an additional named rest house.

Guide text explicitly identifies Takeya across the path from Kumataka, then
places left Takeya/right shrine on arrival. [Official Kumataka page](https://inari.jp/sp/map/spot_09/)
and [official map](https://inari.jp/trip/map01/) independently describe the red
fence, mountain reflections and shrine on stonework projecting into the pond.

## Actual pixels and source files

Every file in this table is saved under `outputs/r97-kumataka-references/`.
Filename dates are source naming, not verified EXIF dates or proof of today's
restoration. The guide notes some pond photographs date from April2017 and
2018 typhoon effects were later cleared; avoid mixing temporary fallen trees
into a timeless reconstruction.

| File / direct URL suffix | Observed facts | Limits |
| --- | --- | --- |
| [P3600730_20190210.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg) | Narrow continuous paved lane between Takeya timber/glass facade on left and pavilion/temizuya on right; torii beyond; no repeated stone posts down lane center | Perspective cannot supply exact width/roof azimuth |
| [P3600691_20190219.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600691_20190219.jpg) | From Takeya interior directly across lane into Kumataka worship front; stone lantern beside front, open shop bay and counter | Decisive front-versus-back semantics, not dimensions |
| [P3600705_20190210.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600705_20190210.jpg) | Confined passage between dark pavilion side and red lake fence; pointed black slat heads, two horizontal red rails, dark continuous hood/cover; perpendicular fence return at far end | Return length and exact end coordinates not measured |
| [P3600706_20190210.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600706_20190210.jpg) | Rear close view corroborates pointed dark heads, continuous cover, red framing, worn timber and narrow clear passage | Do not interpret view as full shoreline survey |
| [P3600707_20190210.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600707_20190210.jpg) | Pond visible BELOW between fence rails, muted green-gray water, dense reflected forest and opposite bank | Color varies with sky/season; no numerical water elevation |
| [DSC_0009_20190202.jpg](https://fushimiinari-guide.com/wp-content/uploads/DSC_0009_20190202.jpg) | Wide pond: shrine at upper left on substantial rough/mortared stone curved projection; red fence follows lake side and return; water clearly below stone top; grassy/sloped bank, olive-gray reflections | Not saturated blue; no surveyed pier radius or measured grade difference |
| [P3600669_20190210.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600669_20190210.jpg) | Arrival narrow stone stair, brown handrail to left, torii flanking rather than blocking stair; memorial stones off to right | Stone memorial rows belong outside stair/path, not generic centerline scatter |
| [P3600710_20190210.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600710_20190210.jpg) | Shrine altar/candles/foxes/curtain, confirms worship-space category | No bearing by itself |
| [P3600734_20190210.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600734_20190210.jpg) | Narrow subsidiary memorial corridor, red fence/torii and memorial stones on BOTH sides; middle paving clear | Cardinal endpoints not georeferenced |
| [P3600744_20190210.jpg](https://fushimiinari-guide.com/wp-content/uploads/P3600744_20190210.jpg) | Separate uphill memorial stair, side stones/curbs and small shrine above | Do not substitute for main arrival stair |

The parent page is [Kumataka guide](https://fushimiinari-guide.com/kumatakasha/).
Saved older identical reference pixels re-inspected as corroboration:
`fushimi_inari/outputs/r88-kumataka/{junction,side,rear}.jpg`.
R89's `entrance.jpg`/`counter.jpg` remain additional Takeya evidence but were not
newly inspected in this pass. No live Street View panorama was accessed here.

## Mapped registration contract

Axes are X east, Z south. Roof741 ring in order:

`[542.629,-138.815] → [539.098,-132.492] → [543.267,-130.166] → [546.807,-136.489]`.

The WEST/NORTHWEST lane-facing long edge is
`[539.098,-132.492] → [542.629,-138.815]`, length7.242119m. Its northeast unit
tangent is `[+.487564,-.873087]`; outward worship-front normal toward Takeya is
`[-.873087,-.487564]`, compass bearing299.180627°. Perpendicular roof span is
4.773975m. For a builder whose local+X is the worship front, Three rotationY is
150.819373° because local+X transforms to `[cos(yaw),-sin(yaw)]`. LocalZ facade
width should follow the long mapped edge. Do not orient its front from the pond
centroid, and do not assume roof ridge must follow the footprint's longest axis.
R67 source front geometry lies at localX≈-3.2 versus back≈-7.8, so its positiveX
is indeed the worship-front direction.

Main arrival `way/626313754`: `[520.562,-129.565] → [525.333,-130.555] →
J[534.683,-128.129]`, tagged2m steps. Onward `way/301527750`: J→
K`[545.229,-145.584]`, tagged2m footway. `way/439990443` continues K→
`[543.286,-167.458]`, tagged2m steps. Source P3600730 resolves Takeya left/west,
shrine right/east across J–K. Whole footprints, collider halfwidth and player
clearance must protect the actual resolved route/junction envelope.

Mapped pond WEST edge `[542.674,-127.706] → [553.348,-148.745]` runs parallel to
and east/southeast of the roof's lake-side edge. This is a reasonable source
shoreline tangent for a bounded rail proposal, combined with photographed rear
passage and return. It is not the roof edge, not the public path, and not proof
of exact rail offset. The photos show the shrine BODY inset beneath its roof,
so eave proximity alone does not establish passage width. Preserve a clear
side/rear passage and use source water polygon as separate authority.

## Water and stone-post findings for implementation

OSM water vertex Y values here range65.85–69.52m because the feature exporter
samples terrain. Those values DO NOT describe a tilted water surface or a valid
horizontal pond level. Source pixels establish relative lower water/pier top,
not an absolute datum. Use actual final terrain/path interface evidence to
choose one horizontal water elevation and expose the supporting stone slope;
do not set elevation from mean polygon terrain values without reviewing the
shore contact. Muted olive/gray-green and forest reflection are source-backed;
a precise RGB and optical settings are inferred.

Current `integration.mjs` explicitly derives the whole Kumataka legacy group's
yaw from the pond centroid, which does not encode the mapped shrine front.
R88 rail inherits that transform and its approximate straight17m envelope.
Thus a rail can exist in code yet be incorrectly placed or absent from the
user's intended shoreline view. Register pavilion/rail separately against the
roof and water semantics before judging only material/detail.

P3600730,0669 and0734 give positive evidence that walking centers remain clear
while memorial stones occupy margins/terraces. Existing repeated legacy stone
formulas are illustrative; remove only exact recognized owners with positive
actual route overlap, while preserving real off-route memorials and the named
stone lantern. The photographs do not justify deleting every stone near the
pond or constructing an arbitrary memorial terrace perimeter.

No additional unnamed rest house can be confidently identified from the user's
wording alone. The obvious small roof east of the lane is named Kumataka-sha;
the larger timber establishment west is Takeya. The tiny separate south-entry
gabled shelter is temizuya. These three identities must remain distinct.
