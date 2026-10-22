# Persistent animated pose — R82

R81 reset joints to their captured bind pose before every mixer update. Three.js PropertyMixer does not rewrite unchanged track values; constant arm rotations therefore stayed at the manually restored T-pose after the first frame.

Evaluate the initial clip before binding, restore the previous mixer output before each update, then capture the new mixer output before adding gait. This retains constant animated tracks and prevents additive accumulation.

Regression: all three actual GLBs are compared frame-by-frame against independent idle-only mixers over 360 frames, including walking, pauses and zero-delta updates. All 248 repository tests pass. Rendered and inspected the three models after the full repeated update sequence, both walking and standing: arms remain lowered. Live browser playback was not independently verified. Ignored evidence: fushimi_inari/outputs/r82.
