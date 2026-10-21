# R29 — Mountain torii scale and dedication variation

## References and scope

- [Fushimi Inari official FAQ](https://inari.jp/en/faq/) confirms mountain
  gateways of many sizes. It does not establish a linear increase with altitude.
- User photographs (especially the woodland path and monumental torii) show
  different pillar proportions, spacing, paint condition and dedication text.
- Inspected the existing Google Maps Ninomine panorama by shin kane, February
  2020, including the large gate in its photo panel. This supports the visual
  distinction, not exact dimensions for each gate on each path.

Three stable size cohorts now coexist along the nine mountain route sections:
baseline, medium (+13% height / +22% pillar thickness), large (+29% height /
+45% pillar thickness). Span increases by 7% / 16% respectively. These multiply
the existing section scale and subtle variations; they are inferred proportions.
The original merged gate geometry is reused. Only the pillar components are
thickened; their centres, beam forms and black feet remain consistent. Collision
radii use the same thickness factor. Senbon retains its smaller dimensions.

## Lettering and materials

Front lettering retains the repeated dedication characters 奉納, one on each
post. Rear lettering has four generic collective dedications and four dates,
combined independently into sixteen variants. These are interpretive inscriptions,
not transcriptions of actual named donors or verified dedication years.

Curved ink patches follow the taper of each pillar and its instance transform.
One shared 2048 × 1024 atlas, alpha-tested material, and spatially merged chunks
replace repeated floating labels. The old column maps already contained donor
text: generated mountain/Senbon gates now use the original unlettered timber
maps underneath the new ink. Fresh/weathered roughness, gloss and instance tint
remain different; unrelated original scene materials are untouched.

## Validation

- 77 tests pass, including stable size cohorts, conservative clear width above
  two metres for mountain gates, adjacent dedication variation and sixteen pairs.
- Native browser review in Ninomine and Senbon; walking input exercised both
  locations, with additional turning and movement to inspect rear lettering.
- First review detected overlapping baked/new text; corrected and reviewed again.
- Final runtime inventory: 1,313 mountain gates, 568 weathered, three size cohorts.
- Final Ninomine snapshot: 245 draw calls, 1,555,282 triangles at 975 × 812 / DPR 1;
  no captured console errors. This is not a before/after GPU benchmark.
- Evidence: `fushimi_inari/outputs/r29/ninomine-torii.png` (local ignored QA).

Remaining: gate-by-gate dimensional survey and exact donor inscriptions; full
route collision and device performance coverage. The wider scene is not claimed
to be an exact historical replica.
