# Keihan commerce detail · r104

Owner: `keihan-street-commerce.mjs`, with two bounded openings added to the already registered anonymous frontage rows in `keihan-frontages.mjs`. No new mapped parcels, store identities, photographs, dependencies or point lights were added.

## Integration

Call `installKeihanStreetCommerce(assembly)` after `integrate` has finished static batching and before building the walking collision world. It registers four interactive groups in `assembly.legacy.interactables` and two new street-machine colliders in `assembly.colliders`. Keep the existing two station vending colliders, but remove the original low-detail station machine meshes to avoid duplicates. Station replacements stay within 0.78 × 1.14 × 1.85 m world bounds.

The returned `detailGroups` are seven independent spatial owners (four cabinets, three counter-detail groups). They may be hidden by the root chunk manager without removing collision data or interaction identity. `update(camera,timeSeconds)` updates selection/tray state only within 22 m and only when the machine group is visible. No dynamic light, reflection capture or canvas redraw runs per frame.

`planKeihanCommerce(assembly)` returns machine specs and three `vendorStations` on the existing store floors. The attendant strip at local `u=width/2,v=-1.12` is reserved. The public-facing yaw uses the source frontage normal. The NPC owner was informed of this contract.

## Visible content and behavior

- Two Keihan platform machines replace the former boxes; two street machines sit **inside** new shallow, backed service bays on registered anonymous rows 305213533 and 305213560. Each row retains its other two shutter bays and full source envelope.
- Cabinets have physical product bottles/caps/labels, three display shelves, selection buttons, a payment/control recess, coin slot, return slot, lower collection recess/shelf, service seams, vents and four feet.
- A shared original 1024² atlas supplies drink labels and menu print. Illustrative products and the open service-bay treatment are interpretations, not assertions about the real businesses' current equipment or inventory.
- Press E while aiming at a machine. **Next drink** cycles four choices. **Dispense** places the chosen can in the collection tray and locks selection. **Collect drink** removes the can and allows another choice. There is no payment or network transaction.
- The three food counters gain trays, plated sweets, cups, condiment bottles, chopsticks, serving tongs, menus, hanging lanterns and small upper service fittings. Existing counter bodies and named business signage remain owned by the frontage builder.

## Budget and validation

Commerce adds **16,030 triangles, 43 mesh batches, one texture atlas and zero lights** before spatial activation. The two row-opening changes leave the frontage owner at 10,272 triangles and its existing eight material batches, with 48 colliders. These are geometry budgets, not FPS measurements.

The first native machine closeup confirmed physical products, selection indication and a released can in the tray. Its lower bottle row obscured the instruction printed behind it, so the same atlas instruction is repeated on an unobstructed 0.82 × 0.13 m plate between the display and collection tray. This adds two triangles per machine and no new batches/materials. No other blocking visual defect was found in that closeup; the texture and geometry remain stylized rather than photorealistic.

The food-counter closeup confirmed the vendor and physical food display. The apparent gray trapezoid in the center is the existing continuous stone countertop seen between two grill plates, not a floating mesh or character defect. The added vertical menu overlapped the original larger food panels; it now sits below them (grill center 1.62 m above the floor, other counters 1.80 m), with no floor, collision or budget change.

Fourteen focused tests pass across commerce and frontage modules: legal action sequence, repeated install, ray-hit ancestor identity, visible product/tray changes, cabinet support and platform clearance, bounded street recesses, preserved central/lateral route clearance, source-footprint guards and reserved vendor positions. Native visual and user-input interaction acceptance remain root-owned.

Machine positions (metres; X east, Y up, Z south):

| ID | Position | Facing yaw |
| --- | --- | --- |
| platform 1 | -299.65, 31.039095, -169 | -π/2 |
| platform 2 | -299.65, 31.039095, -170.25 | -π/2 |
| north street row | -192.225911, 33.559962, -88.224895 | 0.011318 |
| south street row | -185.489, 33.786192, -79.475 | π |

The platform floor is taken from the canonical station spec at runtime; the table records the current frozen source. Street floors are the frontage owner's existing emitted floor heights. No raw off-road terrain lookup positions these cabinets.

## Hommachi view correction

The initial native Hommachi view showed blank side walls because `keihan-street-context.mjs` selected facades against only the east-west station streets and stopped at Z=-40. It now also uses mapped Hommachi way 79699850, preserves up to two street-facing edges on corner buildings, and extends west-side context to Z=35 at the first-torii junction. Facade selection requires an edge aligned with its source street; it no longer decorates only the nearest north-facing edge. Source footprints remain unchanged.

West-side context excludes the existing JR station 952687107 and mio frontage 795552041, plus registered owners already present in the root. Six existing east-side entrance-neighborhood shells receive **finish-only** doors, windows, mullions, handles, shallow awnings, drainpipes and service boxes. Their original owner remains intact: no new walls, roofs, floors or colliders are emitted for those finishes. R96's corner apartment and the Urasando owners are excluded. These elevations are interpretive, without new business-name claims.

With all six eligible finish owners present, context measures **30,476 triangles in six material batches**, 113 context footprints and 588 wall colliders. The earlier version measured 19,504 triangles. Twenty-one focused commerce/frontage/context tests pass, including Hommachi/Omotesando path clearance, shared-owner exclusion, unchanged existing-owner children/collider counts, facade orientation and bounded geometry. Native review of this corrected Hommachi view remains root-owned.
