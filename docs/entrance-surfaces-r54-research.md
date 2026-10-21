# Entrance surface evidence — R54

Checked 21 October 2026. Research only; no scene changes. Local coordinates are
X east / Z south in metres, origin 34.96714,135.77267, radius 6378137 m using the
existing `build_geography.py` projection.

## Source and reproducible data

Retrieved the public [OSM map API](https://api.openstreetmap.org/api/0.6/map?bbox=135.7708,34.9666,135.7732,34.968)
and extracted selected entrance surface/route ways to
`fushimi_inari/geography/sources/entrance-surfaces-r54.json`. Each record has
the OSM way ID, source tags, local X/Z points, bounds and closure flag. Full
referenced nodes were available even where polygons extend beyond the requested
box. OSM attribution and ODbL apply. No editor account, UID, changeset or raw
XML was saved. The shrine-wide `landuse=religious` polygon was excluded because
it provides no evidence about pavement, gravel, vegetation or dirt.

## Concrete surface ownership

| Feature | Source ID and bounds X / Z | Material certainty |
| --- | --- | --- |
| Large shrine parking south of approach | `way/626313864`; X −142.219…−6.121, Z 7.514…103.672 | Closed `amenity=parking`, `parking=surface`, `access=customers`. **No surface tag**: parking use and polygon supported; uniform asphalt fill is an inference supported by mapped asphalt aisles, not a surface survey |
| Parking aisles within/at its access | `way/626313861`, `way/626313863`, `way/1158580995`, `way/1158580997` | All explicitly `surface=asphalt`, `highway=service`, `service=parking_aisle`; these are lines, not permission to fill their bounding rectangles |
| NPC parking north-west of approach | `way/1325613474`; X −153.640…−122.551, Z −14.149…−5.911 | Closed polygon explicitly `surface=asphalt`, `amenity=parking`; high confidence for mapped asphalt surface |
| Bicycle parking south side behind white wall | `way/264074614`; X −78.562…−65.554, Z 22.932…26.728 | Closed `amenity=bicycle_parking`, `covered=no`; no material tag. Do not assume lawn or precise bicycle rack count |
| North-west redevelopment plot | `way/1543934980`; X −154.552…−122.888, Z −42.669…−29.455 | Closed `landuse=brownfield`, `check_date=2026-06-15`; dated evidence for redevelopment, **not** an asphalt or lawn polygon. Bare ground can be correct here; detailed current surface unresolved |
| Omotesando | `way/105449722`; X −157.407…−18.300, Z 1.959…10.742 | `surface=paving_stones`, width 8 m; centreline with width, not a surveyed entire plaza boundary |
| Temizuya-side lateral access | `way/899428253`; X −19.905…−18.300, Z −20.561…1.959 | `surface=paving_stones`, width 3 m; preserve continuity with `way/1057050891` and `way/1133053713` |
| Rōmon stair approach connection | `way/899428254`; X −18.300…−12.881, Z 1.570…1.959 | `surface=paving_stones`, width 3 m |
| Western street | `way/79699850`, `way/944841272` | Explicit asphalt. Preserve street geometry and approach intersection; no rectangle spanning neighbouring parcels |

## Recommended next surface implementation

1. Use the **exact NPC polygon** as the strongest immediate hardscape addition.
   Use the large shrine-parking polygon for parking ownership, with an explicit
   inferred-asphalt label if applying one uniform material. Keep source vertices
   and boundary notches; do not substitute an axis-aligned rectangle.
2. Separate the parking surface from the already mapped pedestrian approach.
   Keep source wall/hedge gaps from `entrance-barriers.json`, building footprints,
   stair transitions and higher-priority paved walking ribbons. Source polygon
   overlap does not justify asphalt over a building or an entrance stair.
3. Restrict new paving-stone fills to supported routes/photographed hardscape.
   No broad generic grass blanket, forest fill or arbitrary gravel plaza is
   established by this source. The brownfield is a distinct dated exception to
   the assumption that all visible dirt is an error.

## Photographic checks and limits

User `photo_2_2026-10-20_17-41-36.jpg` confirms gray setts, larger granite slab
bands, Rōmon steps and **confined dark gravel beside the stair/lantern**. It does
not establish a single material across every adjacent parcel.
User `photo_1_2026-10-20_17-41-36.jpg` is the lateral Azumamaro gate approach,
not a survey of Omotesando's full perimeter. Do not relocate its planted railing
to fill an unrelated empty lateral plot.

The supplied latest aerial screenshot's building across the entrance is being
investigated separately by the root agent as potential legacy geometry; no new
building attribution or scene removal is proposed in this surface research.
Temizuya's nearby shop is also unresolved: the named guardhouse footprint
`way/260121327` must not automatically be relabelled as that shop.

Remaining gaps: present-day photographic coverage of the parking surfaces,
precise untagged plaza limits, parking markings and fixtures, driveway kerbs,
accessible pedestrian boundaries, terrain datum and collision verification.
