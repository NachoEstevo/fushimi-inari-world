# R99 Nankiri Fudo gray parapet registration

## Result and decision

The low gray parapet is independently confirmed in a second public photograph.
Its appearance and relationship to the Nankiri Fudo worship path are now clear.
**Its numeric endpoints remain pending:** neither inspected photograph exposes
both ends or shares enough known mapped control points to register them against
the accepted Kumataka roof and pond polygon. No implementable X/Z line is
invented in this packet. This is a specific registration gap, not uncertainty
about whether the wall exists.

Only `docs/shinike-parapet-registration-r99.md` and files under
`outputs/r99-parapet/` were written. No production, integration, browser-local,
3D instance, renderer or GPU was used. No video was newly watched or claimed.

## New independent photographic evidence

[Public koiWide field account](https://koiwide.com/fushimi-inari_otaki-3) was read
and its source photographs downloaded and actual pixels inspected:

| File under outputs/r99-parapet | Direct source | Finding |
| --- | --- | --- |
| `koiwide-y35.jpg` | [fushimi-inari_y35.jpg](https://koiwide.com/wp-content/uploads/2017/02/fushimi-inari_y35.jpg) | Wide pond view shows projecting Kumataka stone pier at right, red open tamagaki continuing along grass-covered dam toward adjoining memorials at left. This is stronger evidence for localized red bank enclosure than the cropped R98 wide source. It does NOT expose the gray parapet in the same unbroken view. |
| `koiwide-y36.jpg` | [fushimi-inari_y36.jpg](https://koiwide.com/wp-content/uploads/2017/02/fushimi-inari_y36.jpg) | The author captions Nankiri Fudo. Actual photo shows identical Fudo shelter/altar category to P3600740. Continuous opaque gray wall lies behind/left of the altar, along the narrow human path, with vegetation/pond beyond. Flat narrow cap and a vertical section joint are visible. Both wall ends extend beyond frame/occlusion, so visible image width is NOT its total length. |
| `koiwide-y31.jpg`, `koiwide-y32.jpg`, `koiwide-y34.jpg` | [y31](https://koiwide.com/wp-content/uploads/2017/02/fushimi-inari_y31.jpg), [y32](https://koiwide.com/wp-content/uploads/2017/02/fushimi-inari_y32.jpg), [y34](https://koiwide.com/wp-content/uploads/2017/02/fushimi-inari_y34.jpg) | Additional neighboring arrival/shrine references downloaded for source continuity; no claim that these establish missing gray-wall endpoints. |

EXIF inspection found image DateTime values around3March2017 and no GPS tags
on these downloaded images. EXIF clock/processing timestamps are not independently
verified capture dates. Source article directory dates and article publication
alone likewise do not establish current restoration state. The source's wide
image confirms distinct boundary types; it does not justify merging red slats
and gray concrete into one continuous perimeter system.

Saved `koiwide.html` preserves the page used to discover image links and the
linked public waterfall map. The author describes the small route beside Fudo
continuing to the junction near Kobo-ga-taki. That supplies local route topology,
not a measured wall azimuth or endpoint.

## Existing source corroboration

Actual previously saved
`outputs/r98-shinike-boundaries/shore-view-P3600740.jpg` is
[P3600740_20190210](https://fushimiinari-guide.com/wp-content/uploads/P3600740_20190210.jpg),
explicitly captioned Nankiri Fudo in the
[guide](https://fushimiinari-guide.com/kumatakasha/). Together with the independent
y36 photo it establishes:

- An opaque low gray parapet, not a red open slat fence or stone-post rail.
- A flat cap and weathered vertical inner face beside the narrow worship route.
- Position on the pond-facing side of the Nankiri Fudo sector, behind/left in
  the matching altar view; clear worship access remains in front of the altar.
- A separate local enclosure from the photographed main Kumataka pier.

Material is visually concrete/plaster-like; exact wall section, core material,
height, thickness and both terminations remain inferred/unmeasured. The altar
and camera positions themselves are not registered source control points, so
using their apparent pixel distances to prescribe meters would be false precision.

## Map and positional checks performed

The existing source feature collection has no Nankiri Fudo POI. The nearby
known roof is `way/301527741` (Kumataka), shop `301527736` (Takeya), water
`105449705`, main arrival `626313754`, northeast continuation `301527750` and
`439990443`, plus west bypass `301554314`. None identifies the fine memorial
footpaths or Nankiri altar. R98's raw OSM barrier audit also found no tagged
barrier line in this sector. Missing OSM linework cannot be replaced by using
the pond ring or roof ring as if either were a measured wall.

The field account's actual public map link was discovered and its standard
public KML export fetched to `outputs/r99-parapet/otaki-public-map.kml`:
[waterfall map](https://www.google.com/maps/d/embed?mid=1aCsFvW3UsrnHFhk0ZUdWlyUnLOw&hl=en_US).
The KML includes named waterfall points such as Kobo-ga-taki and Kumataka-hontaki,
but no Nankiri Fudo, Shin-ike shoreline wall, or Kumataka worship-pavilion control
point. It therefore does not close wall endpoint registration. Its waterfall
coordinates must not be reassigned to Nankiri Fudo.

Freshly reviewed field-study articles
[part1](https://plaza.rakuten.co.jp/saaikuzo/diary/202608180000/),
[part2](https://plaza.rakuten.co.jp/saaikuzo/diary/202608190000/) and
[part3](https://plaza.rakuten.co.jp/saaikuzo/diary/202608210000/) discuss the local
memorial inventory, typical memorial construction and Fudo identity. The available
text/page image descriptions do not provide a metric parapet plan. They were
not treated as surveyed geometry. Other searches primarily returned similarly
named Fudo sites elsewhere, which were rejected as unrelated.

The gozusan page failed DNS resolution locally and the travel Rakuten page
returned503 via web; no image from either failed page is claimed as inspected.
No browser or alternate local UI access was attempted.

## Implementation proposal and required gate

The ready implementation CONTRACT, once location is established, is a short
local gray parapet owner adjoining Nankiri Fudo's pond-facing worship path, with
flat narrow cap, opaque weathered face and visible construction joints. It must
retain the path opening and Fudo approach; it must remain distinct from the red
Kumataka pier slats and natural opposite banks. Use final terrain support at
all wall footprint corners, actual resolved path/junction exclusion and prior
solid ownership as in existing architectural builders.

**Numeric plan:** `start=null`, `end=null`, `status=awaiting_registered_control`.
Do not instantiate a guessed line. No justified bound on total length or height
is available from these cropped photos. The smallest useful missing evidence is
one georeferenced view showing a parapet endpoint AND Nankiri altar AND a mapped
pond bend/registered pavilion, or a genuine site plan with both wall ends. That
would allow a bounded line to be constructed and visually checked without
inventing a full shore perimeter.

The existing R98 approximately1.70m southwest red return remains a DIFFERENT,
already source-relative proposal; this R99 packet does not relocate it or claim
it solves the gray parapet.
