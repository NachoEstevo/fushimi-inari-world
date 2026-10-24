# Observed Inari-shinmichi details

Scope: commercial-street review angle 3 for the recorded-immersion revision. The builder adds small observed object families to the accepted Keihan street owners. It does not replace architecture, rename a business, change walking floors or add a traffic simulation.

## Evidence inspected

| Local source observation | Visible evidence used | Reconstruction boundary |
| --- | --- | --- |
| `outputs/keihan-arrival-review/streetview-01-station-street.png`, October 2024 | Road utility covers, narrow roadside drainage and overhead service wiring | Exact cover spacing, sizes and wire connections are inferred inside the mapped street; screenshot pixels are not shipped textures. |
| `streetview-02-bridge-approach.png`, October 2024, panorama `jdt_0bBLBQcMoedhCMDVJA` | Circular cover near the food counter, roadside drainage and an illustrated skewer panel across the lower counter front | The counter is the existing photo-inferred parcel 305213554. Its business identity remains withheld. The new printed artwork is original and generic. |
| `streetview-06-east-street.png`, November 2020, panorama `6ki716lGb157sL6O6f-Gqw` | Narrow drainage edges and dense overhead wiring along the east commercial street | Supports the detail category; does not establish a surveyed utility map or current equipment. |
| `streetview-07-hommachi.png`, October 2024 | Round service covers at the junction approach and drainage covers along the building edge | New marks stop short of the separately owned crossing. No stop sign is placed without a registered location. |

The primary [merchant association map](https://inari-kyoto.com/map), [Kyozuan page](https://inari-kyoto.com/kyozuan) and [Hogyokudo listing](https://inari-kyoto.com/?p=452) were consulted to preserve existing business context. They corroborate the established merchants and food categories; they do **not** supply centimetre positions for utility covers, wires or counter advertisements. No new merchant identity was inferred from them.

## Implemented families

1. Six circular cast-metal service covers along mapped ways 946510942 and 79699849. Original concentric/radial detail is used instead of copied municipal artwork. Radii 0.27–0.31 m and along-street offsets are inferred.
2. Twelve narrow slotted grates within the existing outside drainage band. These add detail to existing paving; there is no second gutter, curb, road surface or white edge stripe.
3. Four thin overhead service cables in one short span between the existing Kyozuan and north-counter facade owners, with wall brackets. Heights start 4.75 m above the respective shop floors. Sag and attachment positions are illustrative interpretations of the visible wiring, not a utility-network claim.
4. One illustrated skewer fascia on the existing north counter's lower front, following the October 2024 appearance. A locally authored 1024 × 256 atlas shows a generic skewer illustration and category text, with no business logo, price or copied advertisement.

## Runtime contract and cost

Call `buildKeihanStreetObservedDetails(assembly)` **after final walking-surface reconciliation**, so every surface-mark vertex samples `assembly.walkHeight`. It returns `{built, group, detailGroups, stats, records}` and is idempotent. The five detail groups have local geometry and explicit world origins for the existing chunk owner: three street-surface groups, the cable group and the counter-panel group.

Flat detail sits 8 mm above the sampled rendered floor; its dark incisions sit 1 mm above that. A face whose sampled slope would turn it into a curb-spanning vertical flap is withheld. There is no new floor sampler, collider, light, animation or network request. Existing walking/collision arrays and functions remain unchanged. The report records source owner IDs and source-image dates for each family.

The current fixture builds **1,262 triangles, nine batches, five groups and one small atlas**, with zero added colliders and lights. Actual activation and native frame time remain the root chunk/renderer owner's measurements.

## Validation

Five focused tests pass: source-bound counts and repeated install, finite geometry, per-vertex floor adherence and upward normals, drainage-band registration, overhead clearance and required facade ownership, and fail-before-mutation guards for missing/malformed street input. Geometry and placement were reviewed against the four saved reference views. Native visual acceptance of the integrated surface details, cable span and counter fascia remains root-owned.
