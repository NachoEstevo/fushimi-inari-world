# R94 — Omotesando pedestrian arrival

## Contract

`buildOmotesandoArrivalR94(root, features, surfaces)` builds the zebra crossing opposite Ichiban torii after the mapped path surfaces exist. It returns auditable layout metadata and is idempotent by group name. Three material batches; no lights, texture downloads, collision changes, new shops, or generic facade massing.

`omotesandoArrivalLayoutR94(features)` resolves the actual shared OSM junction node 749327076 of road way/79699850 and approach way/105449722. Crossing center: **X −157.407, Z 10.342**. Recommended initial position is this center, using the existing walking-height/eye-height mechanism. Aim toward first-torii midpoint **X −138.295876, Z 10.764595**, approximately 19.12 metres east. This begins on the pedestrian crossing before passing through the starting torii.

## Sources and dimensional status

- [Townphoto station-facing photograph](https://townphoto.net/kyoto/k01/k01102smal.webp), linked by [the 2016 station/approach sequence](https://townphoto.net/kyoto/fushimiinari.html). Pixels inspected in this pass: zebra directly across the road opposite the first gate, pale gutter/edge material, low curb away from pedestrian opening. Temporary festival flags in the photograph are not permanent-fixture evidence.
- [Omotesando guide](https://fushimiinari-guide.com/omotesando/) confirms station directly opposite, road before the first gate, and approach east toward Romon. Its image endpoints timed out; those pixels were not inspected in this pass.
- [Requested video at 00:11](https://youtu.be/iqK2tg-TxbY?t=11) could be opened only as page metadata in this isolated source pass. Do not claim video pixel review from that fetch.
- Local `geography/features.json` supplies shared node and road heading. Existing `pathWidth` establishes the model's 6 m fallback road width, not a measured street width.

Six stripes, 3.6 m band length across the road, 0.43 m band thickness along the road, 0.90 m spacing, 0.24 m gutter width, 0.16 m curb width and 0.09 m curb height are appearance estimates. Curbs leave a 5 m uninterrupted opening and do not add collisions. Exact current marking count, shop facades and road widths remain unverified. Existing mapped neighborhood and station retain their ownership.

## Two-pass verification

Pass one resolved source geometry and constructed terrain-following markings. Pass two corrected top-face winding and added regression checks for the actual mapped node, containment inside road width, the 5 m curb aperture, finite sloping geometry, upward marking normals, repeat-call identity, and explicit missing-source/invalid-height behavior. `node --test fushimi_inari/integrated-world/omotesando-arrival-r94.test.mjs`: **5/5 pass**.

The final added-file diff was inspected. No browser/GPU instance was started by this specialist; root owns integrated visual and walking QA. Confirm crossing visibility, curb seating and route clearance in the root's existing viewer before declaring integrated acceptance.

User-reviewed correction: the zebra marking pattern is rotated 90 degrees around its mapped center; road, gutter and curb placement retain their existing axes. The geometric regression checks the actual first band vertex edge against the across-road vector.
