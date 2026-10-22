# Visitor joint binding correction — R81

The R80 pose code looked up GLB source joint names such as UpperLeg.L. GLTFLoader sanitizes those names to UpperLegL, so optional bone lookups silently skipped every limb. Navigation moved the root while only the imported idle animation played.

Bind joints using Three.js PropertyBinding.sanitizeNodeName with an original-name fallback, and fail visibly on missing required bones. Keep pose reset and distance-driven gait in a dedicated rig module. Feet are siblings of Body in these exports; preserve each animated foot-to-lower-leg transform when applying the additive leg pose so the feet follow instead of staying at their original positions.

Regression tests parse all three actual GLBs and verify joint binding, changing skinned vertex positions between opposite phases, preserved foot attachment, exact reset and zero-weight behaviour. Two opposite poses of all three models, with their imported idle clip active, were rendered and inspected offline. This corrects missing limb animation; it is a procedural gait, not motion capture or foot-placement IK. Native browser smoothness remains unverified.
