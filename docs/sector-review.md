# Sources and reconstruction limits

Fushimi Inari · Inariyama Explorer combines mapped geography, reference-informed architecture and an interpreted interactive environment. This page consolidates the former sector research notes.

## Geography and site references

| Source | Use |
| --- | --- |
| [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL | Trail topology, street connections, named points and building footprints |
| [Geospatial Information Authority of Japan](https://maps.gsi.go.jp/development/demtile.html) | Elevation tiles; derived terrain attribution: 国土地理院 標高タイルを加工して作成 |
| [Official Fushimi Inari map](https://inari.jp/trip/map01/) and [English map](https://inari.jp/en/map/) | Named shrines, precinct organization and destination context |
| Reference walkthroughs [zFKeYi0AK0M](https://www.youtube.com/watch?v=zFKeYi0AK0M) and [FmRyJ-RtBPg](https://www.youtube.com/watch?v=FmRyJ-RtBPg), visit photographs and dated Street View panoramas | Architectural appearance, surface vocabulary and relative arrangement |

The [geographic manifest](../fushimi_inari/geography/manifest.json) retains exact source URLs, source hashes, acquisition dates, extent, coordinate conventions and data uncertainties. One scene unit represents one metre; X points east, Y is elevation and Z points south. The study rectangle includes surrounding streets and is not the shrine's legal boundary.

Mapped paths do not certify current public access. The 10 m elevation model does not resolve individual stairs, retaining edges or small terraces. Local grading, unmeasured dimensions, unseen facades, tree placement, furnishings, lighting and shop inventories include authored estimates. A footprint establishes location, not the identity or completeness of an architectural reconstruction. Reference observations are dated and may describe different site states.

## Audio and character credits

Keep attribution beside the assets, where filenames and runtime derivatives can be traced:

- [Recorded railway sources and hashes](../fushimi_inari/assets/audio/recorded-rail/manifest.json).
- [Station audio credits](../fushimi_inari/assets/audio/recorded-station/CREDITS.md) and [arrival voice manifest](../fushimi_inari/assets/audio/recorded-station/arrival-voices.json).
- [Footstep credits](../fushimi_inari/assets/audio/footsteps/CREDITS.md) and [ambient audio credits](../fushimi_inari/assets/audio/CREDITS.md).
- [Character model credits](../fushimi_inari/assets/models/visitors/CREDITS.md).

The IC-gate recording is Hinoki.owo's [Card Beep in Japan Railways Ticket Gate](https://freesound.org/people/Hinoki.owo/sounds/796687/), CC BY 4.0, recorded at JR Tokyo rather than Keihan. LG's [Kyoto station hall recording](https://freesound.org/people/LG/sounds/462725/), CC BY 4.0, is a research candidate, not a validated Keihan platform recording. Other railway layers may be interpretive substitutes; the asset manifests distinguish their origins. The separate arrival voice files have their own manifest. No blanket asset license replaces the individual credits.

## Scope of validation

Scene screenshots show this implementation; they are not independent site references. Connected routes and passing CPU samples do not establish complete doorway/courtyard clearance, native shader appearance or surveyed accuracy. See [validation and performance](ultra-quality-and-release.md) for the dated observations and remaining device/deployment limits.

Detailed revision reports, research registers and diagnostic captures are retained in a private local archive with original relative paths. Historical filenames in source comments and older audit manifests identify that archived evidence rather than current build inputs.
