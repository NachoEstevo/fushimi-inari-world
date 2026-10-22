# Romon lateral corridors R70

## References inspected

The north/south corridor and north end photographs on
https://fushimiinari-guide.com/rohmon/ resolve the wall arrangement:

- `IMG_6484_20210317.jpg`: south corridor, including its closed outer bay.
- `IMG_6485_20210317.jpg`: north corridor viewed from the court; a single
  windowed exterior wall, open column arcade, white lower panels and one pale
  horizontal barrier rail carried on vermilion posts.
- `IMG_6491_20210317.jpg`: north end with a large green lattice aperture and
  white lower wall below its gabled roof.

The previous model had solid plaster wing volumes and a second opaque screen
wall at the court edge. That prevented the space from reading as a corridor.

## Reconstruction

The replacement removes only bounded wall, column and green-screen triangles
inside the two existing wings. It checks the production GLB signature before
mutation: 216 plaster, 2208 vermilion and 7560 green triangles. Unknown geometry
is left untouched rather than partially stripped.

New construction has one outer wall, nine side windows with actual gaps between
green bars, pale lower/upper panels, gold-toned frames, red posts and ties, a
ceiling, and the north end window. Court detailing keeps its hanging lanterns
but replaces the duplicate screens and double rail with the photographed single
rail on red posts. The central gate, roofs, bases and unrelated triangles remain.

The inherited wing extent is retained. This is not a measured dimensional
reconstruction; exact corridor length, detailed joinery and roof proportions
still need calibration. The full existing wing collision barriers remain:
the photographed rail protects the gallery, and this change does not invent
a public walking route through it. Public movement remains outside the rail
and through the central gateway.

## Verification

196 Node tests pass, including production-GLB preservation, real wall apertures,
central-passage clearance, idempotence and rejection of an unknown source mesh.
The new wing geometry uses five material batches and 7500 triangles. These are
component counts, not a measured full-scene FPS improvement.

Native review in the existing local browser confirmed R70 reconstruction,
the open court arcade, window gaps, north end window and retained suspended
lanterns. The reviewed view produced no warning/error console entries. Captures
are local under `fushimi_inari/outputs/r70/`; no external photographs were bundled.
Movement through the central gateway into the court was exercised; this is not
a full collision audit of the precinct.

Opening the gallery exposed eighteen legacy Komodaru barrels and eighteen blue
crest disks embedded in the former walls. These are absent from the reviewed
corridor photographs. Their exact source-component footprints are now removed,
with additional preflight signatures of 1080 triangles for each material.
Total removal is 12144 triangles; unrelated straw, blue and gold geometry is
preserved by the production-GLB regression tests.
