# R98 Shin-ike boundaries: photographic audit against R97

Research only. Fresh source pages and actual image pixels were inspected; no
production code, local browser, renderer, GPU or 3D instance was opened.

## Concrete result

There are more kinds of built boundaries than the current short R97 L, but the
pond is NOT source-supported as a fully fenced perimeter. The shrine's stone
projection carries red/black tamagaki; the nearby memorial/lookout sector also
has a low solid gray parapet. Across the pond, visible banks are densely wooded,
with branches/roots reaching water. No continuous opposite-bank red fence is
visible in the independently dated wide views. Occluded areas remain unknown,
not proof that no small hidden barrier exists.

The most actionable missing piece is the SOUTHWEST end return of the shrine's
narrow rear passage. A bounded proposal is given below. The memorial parapet is
positively observed but does not yet have safely registered endpoints.

## Source pixels inspected

New files are saved under `outputs/r98-shinike-boundaries/`:

| Local file | Source | Observed / limits |
| --- | --- | --- |
| `pond-wide-P3600680.jpg` | [P3600680_20190210](https://fushimiinari-guide.com/wp-content/uploads/P3600680_20190210.jpg) | Pond-facing view with red shrine fence at right foreground; opposite banks are dense natural woodland, with no visible continuous rail. This does not expose every hidden bank. |
| `commons-2019-pond.jpg` | [Kodamagaike Pond in Fushimi Inari Grand Shrine](https://commons.wikimedia.org/wiki/File:Kodamagaike_Pond_in_Fushimi_Inari_Grand_Shrine.jpg) | Independent actual photo dated1Feb2019, author Soramimi, CC BY-SA4.0. Wide opposing woodland and natural water-edge branches; no red opposite-bank perimeter. Metadata camera34.968394,135.778611, heading144.3055°. Camera metadata is not a survey. |
| `commons-2013-pond.jpg` | [Kodamagaike Pond of Fushimi Inari Grand Shrine](https://commons.wikimedia.org/wiki/File:Kodamagaike_Pond_of_Fushimi_Inari_Grand_Shrine.jpg) | Independent17Dec2013 photo, Soramimi, CC BY-SA3.0, looking through shrine tamagaki toward natural wooded banks. Metadata camera34.968375,135.778672, heading158.1553°. Confirms barrier is localized to viewing/shrine edge. |
| `official-kumatakasya.jpg` | [Official Kumataka image](https://inari.jp/sp/wp-content/uploads/2016/09/kumatakasya.jpg) | Actual worship-front close view; useful identity/roof evidence, NOT perimeter-length evidence. |
| `south-turn-P3600735.jpg` | [P3600735_20190210](https://fushimiinari-guide.com/wp-content/uploads/P3600735_20190210.jpg) | Memorial shrine/stone enclosure beside route toward pond viewing location; no full water-edge trace. |
| `shore-access-P3600738.jpg` | [P3600738_20190210](https://fushimiinari-guide.com/wp-content/uploads/P3600738_20190210.jpg) | Memorial corridor turn into lakeside viewing sector, identified by guide captions; no calibrated shore endpoints. |
| `shore-view-P3600740.jpg` | [P3600740_20190210](https://fushimiinari-guide.com/wp-content/uploads/P3600740_20190210.jpg) | Nankiri Fudo shrine, explicitly named by guide. Left/background has a continuous LOW SOLID GRAY parapet beside the narrow path, with foliage/water beyond. This is distinct from red open shrine tamagaki. Exact material thickness and endpoint positions are not measured. |
| `memorial-P3600743.jpg` | [P3600743_20190210](https://fushimiinari-guide.com/wp-content/uploads/P3600743_20190210.jpg) | Memorial terrace/stair approach and various small shrine rails; these are local memorial enclosures, not evidence for extending a shoreline wall around the whole pond. |

Existing source pixels freshly re-inspected:
`outputs/r97-kumataka-references/DSC_0009_20190202.jpg`,
`P3600705_20190210.jpg`, `P3600706_20190210.jpg`.
[Wide DSC0009 source](https://fushimiinari-guide.com/wp-content/uploads/DSC_0009_20190202.jpg)
shows stone projection, red slats wrapping its lake-facing side and adjoining
built shrine sector; the rest of visible bank has grass/trees. Sources filename
dates are not verified EXIF or proof of today's appearance. The guide notes some
wide pond imagery dates from April2017 and2018 typhoon effects were later
cleared. No temporary fallen branches are a new boundary requirement.

## Official and map cross-check

[Official Kumataka page](https://inari.jp/sp/map/spot_09/) and
[official precinct map](https://inari.jp/trip/map01/) describe the red tamagaki
and the shrine on stonework projecting into the pond. They do not specify a
fence around the entire lake or dimension its runs. The official image is a
worship-front close-up, so no perimeter claim is derived from it.

The existing OSM source extract was checked for barrier-tagged ways intersecting
local X515–585/Z-165–-60: none were found. Absence in OSM is not proof of physical
absence; it means mapped water/roof polygons cannot be called measured fence
linework. No barrier endpoints are fabricated from that absence.

For orientation only, Commons camera coordinates convert with the existing
geographic manifest to local `[541.963,-139.595]` (2019) and
`[547.528,-137.480]` (2013). They corroborate a view from the northwest shrine
sector across the lake toward southeast natural banks. Metadata precision is
not enough to extract new millimetric endpoints from perspective.

## Current R97 footprint and bounded missing southwest return

Actual `outputs/r97-kumataka/final/build-reports.json` records:

| Current run | Start X,Z | End X,Z |
| --- | --- | --- |
| Main lake-side run | A543.787969,-129.901690 | B547.063878,-136.358675 |
| Existing NE end return | B547.063878,-136.358675 | C545.606551,-136.032300 |

The main run is about7.24m long. R97 currently builds ONE return, at the
northeast end B. This was compared to actual code `kumataka-registration-r97.mjs`,
not inferred from an aerial alone.

P3600705 shows lake/fence LEFT and dark shrine wall RIGHT while looking ALONG
the narrow rear passage toward a visible perpendicular terminal fence. Since
the lake is southeast and the shrine northwest of this registered edge, this
view direction is southwest. Therefore its photographed far-end return belongs
to southwest end A. P3600706 corroborates the confined passage, red slats, black
heads and continuous hood; it is not a second calibrated endpoint survey.

**Implementable bounded proposal:** add a southwest return from existing
A`[543.787969,-129.901690]` to D`[543.030998,-131.420229]`, approximately1.70m.
D derives from the exact same accepted R97 pavilion transform and original R67
rear-body endpoint used for C, but with source local`[-7.77,0,-2.48]` instead of
`[-7.77,0,+2.48]`. The source establishes end/side topology; the precise endpoint
and width remain inferred from the accepted architectural registration. Keep
existing R97 floor, slat/material and pier contracts; verify whole return against
actual public routes, shrine body and support before committing it. It closes
the narrow lake-facing rear passage end, not the public northwest worship lane.

No photograph inspected here proves the existing NE return should be deleted;
it may be out of view. Retain it pending another source. Do not turn this
approximately1.7m proposal into a complete rectangular shrine/pond enclosure.

## Other observed gaps and explicit limits

DSC0009 shows red fence continuing around the adjoining built southwest shrine/
memorial sector. It supports more localized boundary architecture than one
isolated lake-side strip, but cannot safely locate every turn behind roofs or
foliage. P3600740 proves a different low gray parapet near Nankiri Fudo and the
southern viewing approach. Those southern memorial paths/terrace boundaries are
not mapped in enough detail here to assign exact parapet start/end coordinates.
No numerical implementation polygon is supplied for them.

The new opposite-bank vegetation is consistent with the observed natural bank;
replacing it with continuous red rails would conflict with the photographs.
Next useful evidence for the separate parapet is a georeferenced panorama
showing Nankiri Fudo, viewing edge and current shrine pier together. That is a
specific registration need, not a reason to fabricate an all-pond barrier.

Only this research document and downloaded reference files were written. No
production file, integration, browser, renderer or commit was touched.
