# R63: near Omotesando lateral details

## Source-led changes

- Minami facade: vertical timber on the avenue-facing gable, reed blinds,
  striped sloping awning and roof edge trim, from the inspected photograph
  https://townphoto.net/kyoto/k01/k01202.jpg . Existing footprint, height,
  colliders and material batches are retained; details are dimensional estimates.
- Bicycle entry: two timber posts, grey ceramic gate roof and Parking arrow,
  from https://fushimiinari-guide.com/wp-content/uploads/IMG_7698_20210405.jpg .
  Registered to the shared endpoint of footway626313859 and steps1133052416,
  within the mapped wall gap. Gate dimensions are estimates; existing walls
  and steps are retained. Off-path feet use the lower paved terrain seat.
- Gishikiden access: fine grey hard finish along the existing 5m mapped
  corridor626313860. Material interpretation follows
  https://www.goriluckey.com/wp-content/uploads/DSC_0516-1.jpg ; it is not an
  OSM asphalt tag. Existing route profile remains authoritative.
- Omotesando shoulders: exact polygon clipping replaces whole-cell rejection
  at other paths, buildings and water. Original height and UV planes remain,
  including exact rendered-triangle registration for walking.
- Bicycle step sides: a bounded .72m asphalt collar supports the existing
  tread edges and terminal edge, using the parking material. It does not create
  a route beyond the mapped endpoint or flatten the wider terrain.
- Existing mapped trees: separate needle foliage for the tagged Pinus, textured
  bark and modest broadleaf asymmetry. No new tree roots or colliders.

## Validation and limits

135 existing tests pass. Changed modules pass syntax and diff checks. Real
Three.js harnesses checked finite/upward surface geometry, idempotent access
finish and matching visible/walking heights on the clipped shoulders/collars.
Native review covered the access finish and walking under the bicycle gate.
The surface work adds two static draws; tree geometry remains slightly below
the previous triangle total, with at most three tree batches. No new dependency
or light was added. No comparable FPS benchmark was performed.

The legacy wall beyond the bicycle stairs was investigated rather than cut
speculatively. Its extended-axis intersection at [-61.838,23.142] is outside
bicycle parking264074614 and 7.16m beyond the mapped stairs. It lies within
general parking626313864, but the photo does not establish a straight onward
opening. The temporary audit/cut code was removed. That farther connection,
unregistered lawns and hidden facades are not marked complete.
