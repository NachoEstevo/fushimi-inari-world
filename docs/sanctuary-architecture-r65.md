# R65 — Honden, Gonden and Okumiya architecture/support pass

## Delivered

- Gonden: replaced the inherited flat roof, solid gold ridge and blank front
  fence with a curved dark roof, short ridge, five-bay frontage, lattice and
  photograph-supported hanging fittings. See `r65-gonden-reference.md`.
- Okumiya: longer front roof slope, curved fascia, pale rafter ends, stepped
  brackets and restrained fittings. Details now merge by material. See
  `r65-okumiya-reference.md`.
- Terrain supports the five existing 3.6 m sanctuary aprons plus mapped exterior
  Honden link 105449689, stair 1213198208 and landing 1213198209. Previously the
  terrain support was narrower than the visible apron. No new route is invented;
  walking heights, building placement and collision remain unchanged.

## Section inventory and next construction requirements

| Section | Remaining work | Evidence needed before geometry changes |
| --- | --- | --- |
| Honden/Naihaiden | Side enclosure, veranda/retaining-wall connections, precise platform boundaries | Official front/side photos plus continuous oblique views; retain existing detailed Honden asset |
| Gonden | Stone base proportions, side/rear framing and actual approach pavement | Current frontal sources establish facade, not unseen rear or exact base dimensions |
| Northern stair | Stair-to-landing intersections and retaining faces | Mapped route is fixed; close side views needed to distinguish retaining wall from sloping ground |
| Tamayama/Byakko | Replace simple roof/wall placeholders with documented architecture | Dedicated front/side references; do not copy Gonden indiscriminately |
| Okumiya | Measured terrace outline, base, side joinery and sculpture | Front/right photos support current details; dimensions remain estimated |

The official shrine map https://inari.jp/trip/map01/ and its Honden side/front
photos were consulted for sector identity and architectural context. It is not
a measured construction drawing. YouTube text retrieval failed during this pass;
no claim is made of newly reviewing the tour video or Street View.

## Validation and limitations

142 Node tests pass, including mapped support widths, actual reported camera
position, stair preservation and unchanged walking heights. Both facade modules
pass syntax checks. Native browser inspection covered Gonden front/oblique and
Okumiya front/right, with short walking checks. Local evidence is in ignored
`fushimi_inari/outputs/r65/`. No warning/error console messages observed.

One native review temporarily showed black sky and textured surfaces; a clean
reload restored them. Cause remains unconfirmed; do not count this as a resolved
renderer bug. Geometry is still an approximation, elevated edges remain elsewhere,
and neither complete site fidelity nor a measured performance improvement is claimed.
