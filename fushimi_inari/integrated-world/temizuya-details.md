Temizuya close-up details
========================

`refineTemizuyaDetails(group)` from `temizuya-details.mjs` runs **after**
`refineEntranceObjects(group, materials)` and before `createPrecinctLife`.
It returns its detail group, returns the existing group on repeated calls, and
returns null for other zones or a basin that has not received the hollow-basin
refinement. It does not replace any interaction root, shader, light, collider,
placement transform, or existing ladle.

Appearance source: user's `photo_7_2026-10-20_17-41-36.jpg`: rough rectangular
stone rim, irregular moss, dark wet runoff channel, metal ladle rims and handle
ferrules. The adapter adds these details inside the pavilion's existing local
coordinate frame; mapped translation and yaw are inherited automatically.
The 2.2 x 1.25 m basin is retained. Detail dimensions are inferred, not measured
from the photograph. The runoff channel occupies z=.715–.9525 on the existing
3.8 m deep plinth. No additional basin or central fountain is created.

Two existing ladles remain children of the pavilion and keep userData.ladle.
Their attached cup rims and ferrules follow the current lift/pour animation.
The current bamboo spout and animated water shader are preserved.
Replacement moss comprises 58 small flattened patches at the lower wet seam
and drain; instance colours are not multiplied by a dark base material.

Verification: syntax and isolated Three.js fixture checks can validate
idempotence, local placement and interaction identity. Full integration and
render review belong to the root agent; no visual acceptance is claimed here.
