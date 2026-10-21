# Browser regression checks

With `fushimi_inari` served on port 8420, open
`http://127.0.0.1:8420/tests/reception-animation.html`.

The reception check uses the actual GLB, AnimationMixer and production reach
solver without creating a WebGL renderer. It checks 120 evaluations at the same
timestamp, 600 idle frames and one stamp gesture. The page title/result must say
PASS. Asset loading has a ten-second timeout; the Three.js import map uses the
same CDN version as the viewer.

R34 regression evidence: the previous implementation produced a maximum idle
wrist rotation of 1.674 radians per frame. The fixed implementation measured
0.0000506 radians, zero drift when repeating one timestamp, and 0.0595 m of
stamp travel. Arms now reset to their sampled initial pose before each solve;
the idle clip no longer owns those joints. World quaternions are normalized
before measuring angular differences to exclude decomposition roundoff.

The live viewer was also checked at the counter, including E and requesting a
stamp. The existing 84 Node tests passed. This targeted check does not benchmark
whole-world rendering performance.
