# R94 — Senbon common arrival and mapped court-edge envelopes

The existing paired tunnel layout already ends both gate rows on one common
frontage. The R88 arrival apron is one flush surface and the mapped Okusha court
is a 38 × 20 m mineral terrace. This packet preserves those contracts and makes
the two existing mapped court-edge buildings read as complete enclosures when
approached from either tunnel, rather than open-ended roof sheets.

## Authority and limits

[The official Okusha page](https://inari.jp/en/map/spot_08/) places the prayer
precinct at the end of Senbon Torii in Myobu-dani valley and describes the 1975
rearward move of the sanctuary with a prayer area in front. It does not document
the service buildings' elevations, board spacing, structural sections or exact
court dimensions. Those dimensions remain R88 interpretations of the checked-in
OSM footprints `way/301527739` and `way/301527730`; this packet does not claim a
survey or a photographic reconstruction of their sidewalls. The requested guide
URL `https://fushimiinari-guide.com/okusha/` returned HTTP 404 on 2026-10-23.
The specified walking videos were not used as dimensional authority here.

Two user-supplied court video stills were inspected directly (clipboard IDs
`69a82189-e4d8-4f21-819a-b70a07ddd2dd` and
`3ee9aa06-bb02-4d7f-a72c-25c4ed08842b`). They support the grey pitched service roof,
dark timber facade, shutters/counter ledges, pale upper banner and horizontal
lower boarding. R94 adds five dark horizontal boards below the existing counter
ledges, preserving the existing shutter apertures. The photographs do not show
the roof ends: gable closures and side boarding remain architectural completion
estimates, not evidence of a photographed ornament or exact sidewall pattern.

The other joinery is restrained completion of the existing timber/roof vocabulary:
closed timber gable triangles at the existing 3.05 m eave and 4.15 m ridge,
side boarding, corner posts, eave members and a continuous narrow mineral rear
plinth. There are no new building identities, windows, doors, inscriptions,
invented houses, lights, trees or decorative props. Broad mineral ground and the
wooded backdrop retain their existing owners; adding trees or sidewalls across
this public court without a reliable location would obscure the real endpoint.

## API and ownership

`buildSenbonRestFrontage(group, {id, width, depth}, materials)` augments only a
recognized existing mapped building group. It returns `{group, stats, id}` or
null for invalid/unknown footprints or duplicate invocation. The call is inside
the existing `okusha-details.mjs` building loop. `staticParts` merges the detail
into three static material batches per building; no dependency or runtime loop
was added. No interaction mesh or callback is replaced.

The prior common gate frontage, gate spacing, path clipping, terrain grade,
court surface UV scale, pavilion, Omokaru and ema arrangement remain active.
No collision geometry or height function changes. Details sit on the existing
mapped enclosure boundaries and above its plinth; they add no public obstacle.

## Validation

Twelve focused Node tests pass: new finite/bounded geometry, both gable peaks,
static budget, invalid input and idempotency; prior Okusha source decomposition,
interaction identity, arrival clipping, public collision clearance, ema exit gap,
and the two Senbon common-frontage/spacing regressions. Syntax and diff-whitespace
checks pass. Final scoped diff was inspected.

Native visual review and walking both complete tunnel routes remain root-owned.
No browser/GPU work, production deployment, surveyed dimensional check or commit
was performed by this packet owner. The new material/joinery appearance therefore
remains awaiting whole-scene visual acceptance.
