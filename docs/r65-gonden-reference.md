# R65 Gonden reference and implementation

## Evidence actually inspected

- [Pakutaso81550, zubotty, published2022-10-19](https://www.pakutaso.com/20221028292post-42553.html), [photo](https://cdn.pakutaso.com/shared/img/thumb/zubotty-inari-asaDSC00131-12821_TP_V.jpg): full frontal pixels inspected in a dedicated2D tab. Broad dark curved bark roof, short dark ridge with five small gold bosses, six red front columns/five bays, dark timber shutters, white lower panels with black lattice, repeated eave ends, hanging bells and two framed lanterns.
- [Fushimi Inari-taisha Gonden.jpg, Cun Cun,2019-06-05](https://commons.wikimedia.org/wiki/File:Fushimi_Inari-taisha_Gonden.jpg): closer frontal pixels inspected. Confirms curved roof, small gilded ridge decorations rather than solid gold ridge, fine facade divisions and hanging fittings. Used as reference, not redistributed as a texture.
- [Commons category](https://commons.wikimedia.org/wiki/Category:Gonden,_Fushimi_Inari-taisha) identified the second photo; category membership alone is not geometry evidence.

## Existing model

`interactive_viewer/index.html` Gonden group has a6.2x4.2m wall box,8.4x6.6m flat roof slab, full gold ridge, plain red front fence and generic lattice-textured lower wrap. The wall mesh carries the original interaction. Integration already transforms its nested group with the Gonden anchor.

## Bounded implementation

`integrated-world/gonden-facade.mjs` exports `refineGondenFacade(object, materials)`. Call in `moveObject` before its world transformation, beside existing facade refinements. Nested groups are selected using combined exact wall/roof/fence signatures; the operation is idempotent.

Only the roof, ridge, front fence/cap and generic lower lattice wrap are replaced. Original podium/veranda, interaction-bearing wall mesh, local group position/yaw and collider remain. The wall becomes dark timber. Five front bays receive red framing, shutter divisions, white/black lower lattice, five modest bells and two framed lanterns. Repeated pieces merge by material. No lights, paths, platforms or signs are introduced.

Roof plan remains the inherited8.4x6.6m. A sampled curved two-pitch surface with flared ends replaces the slab; dark margins and a6.38m short ridge carry five small gold bosses. This is a photographic approximation, not a measured conservation model.

## Estimated dimensions and limits

- Existing footprint/placement are inherited estimates, not newly surveyed dimensions.
- Ridge5.45m above inherited group datum,1.64m roof fall,1.24m bay spacing and fitting sizes are estimated. Native QA must assess the new silhouette.
- Five bays and front fitting categories are visible. Exact carving/rope patterns, crest motifs and hidden rear details are omitted.
- Podium/terrain support is another owner's task. Existing body collision and interaction are retained.
- Syntax and scoped diff checks pass. Native rendering and route-clearance acceptance remain root-owned.
