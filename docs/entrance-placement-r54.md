# R54 — Entrance placement and paved surroundings

The aerial review exposed a compressed legacy station crossing Omotesando and
large mapped parking areas still using forest soil. This pass preserves the
authored architecture while replacing its illustrative placement with source
geometry. See `entrance-surfaces-r54-research.md` for surface provenance.

## First torii

Raw OpenStreetMap way 359847609 has TWO endpoints. The processed POI contained
the first endpoint only; it must not be interpreted as the gate midpoint.
The compact source module retains both projected coordinates and node IDs.
The gate center is X -138.295876 / Z 10.764595 and the transverse mapped span
is 11.5102 m. The existing mesh is fitted in local X to this span. Its height,
beam profiles and ornamental detail remain authored estimates, not surveyed.
Both post collisions follow the same placement.

## Station

Building way 952687107 supplies the footprint center X -166.7805 / Z 37.370
and the long-axis orientation, with the frontage facing east. The original
17-component station and sign interaction are retained. Its collision moves
with it; the generic footprint volume is excluded only if relocation succeeds.
The station dimensions and frontage floor elevation remain approximate.

## Paving and limits

Only the two selected parking polygons receive asphalt. The northern NPC lot
has an explicit asphalt tag; the southern lot's asphalt is inferred from four
tagged asphalt aisles. Building footprints and existing paths are cut out.
The 2 m tessellation follows existing ground and adds one draw, without new
lights or shadow casters. Brownfield and unverified parcels retain their
current treatment; this pass does not certify the entire entrance landscape.

The old illustrative entrance slabs and crosswalk must not remain suspended
across the mapped approach after the station moves. Their exact legacy
signatures are removed while the mapped street/path system keeps ownership.

## Validation

122 geography/integration Node tests pass. Native browser reported aligned=true, station placed=true with17 retained components, and12 obsolete floor pieces removed. Walking from the Omotesando checkpoint west through the relocated first torii completed twice. Final walking/aerial captures are in fushimi_inari/outputs/r54. No captured console warnings/errors. The northern unverified parcels, precise parking markings, inherited shop placement and remaining landscape transitions are not completed. No measured FPS benchmark; new parking geometry is one draw and5,227 triangles.
