# Reception terrace support correction — R79

The mapped reception building (105449708) used one lower-court datum for its entire 29.32 m body. Actual integration samples rise from 42.382 m at its lower end to roughly 43.99 m beside the Naihaiden approach, burying the upper facade.

The counter wing and adjacent lower body retain the old datum. The eastern body now uses the highest sampled final ground level across its footprint, with a solid stone foundation extending from the original base. Its walls, windows, trim, roof and collider top move together. The split follows the existing 11.6 m counter-wing boundary. This stepped architectural treatment resolves the modeled level conflict; it is inferred, not independently surveyed historic roof geometry.

No walking heights, terrain grades or public ramp geometry are changed. A render-only terrain cut was tried and discarded because it did not resolve the facade's incorrect elevation.

Validation: focused regression tests cover rising, flat, descending and invalid grades. Full actual integration and two simplified-material Blender views checked the reception/ramp junction. Native browser walking and exact real roof-step proportions remain unverified. Evidence lives in ignored fushimi_inari/outputs/r79.
