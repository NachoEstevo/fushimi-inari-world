# R65 Okumiya reference and implementation

## Sources consulted

- Official shrine VR overview: https://inari.jp/vr/ — identifies Okumiya among the maintained sanctuary buildings; establishes identity, not dimensions.
- https://fushimiinari-guide.com/okumiya/ — photo index and description of the long-front nagare roof.
- https://fushimiinari-guide.com/wp-content/uploads/IMG_6628_20210309.jpg — actually viewed in browser: front/right oblique roof, layered dark fascia, lifted corners, pale rafter ends, three dark bays, green header inserts, round gold fittings and stepped red bracket joinery.
- https://fushimiinari-guide.com/wp-content/uploads/IMG_6627_20210309.jpg — actually viewed: red/pale underside and white carved animal bracket. Its sculptural form is not approximated by an invented animal.
- Earlier scene reference remains Rec Lab walking video https://www.youtube.com/watch?v=zFKeYi0AK0M around 10:00. This pass did not independently re-view that video.

## Changes in okumiya-facade.mjs

The existing 7.8 by 6.2 metre roof envelope is retained. Its ridge shifts toward the rear within that envelope to give the observed longer front slope. Dimensions, slope and offset are visual estimates. Side infill follows the same roof function. Dark edge fascia follows the curved roof instead of using floating straight strips.

Pale rafter ends replace the earlier gold-colored tips. Parallel underside members, restrained green inserts, plain circular gold fittings, and additional stepped bracket blocks follow the visible architectural vocabulary. Plain fittings do not reproduce specific crests. The three front bays and existing suspended lantern reconstruction remain.

All facade parts created by this module, including its previously separate meshes, now merge by material. The retained original roof and base geometry stay under their previous owners. Replaced roof geometry and removed old spheres are disposed. Runtime metadata records material batches and source URLs.

## Boundaries and validation

No terrain, collision, access route, roof footprint, base, veranda level, interaction or neighboring building changed. The original compressed base/facade dimensions are still estimates and are not a measured reconstruction. Painted sculpture, white animal carving, inscriptions and additional objects are deliberately absent. This pass does not claim surveyed dimensions or historical exactness.

Syntax validation and roof-profile/Okumiya-grade tests run locally. Root owns native visual QA; oblique side infill, fascia contact, fascia corner lift and roof-ridge placement require checking in the integrated scene.
