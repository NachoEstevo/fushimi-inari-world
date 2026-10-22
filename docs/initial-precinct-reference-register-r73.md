# R73 — initial precinct reference register

Review date: 2026-10-22. Scope: Omotesando → Temizuya → Rōmon → Gehaiden/Naihaiden → Gonden/Tamayama → Okumiya/Byakko. This register distinguishes identified omissions from completed geometry. It is not a completion or metric-accuracy claim.

## Source hierarchy

- [Official precinct map](https://inari.jp/en/map/): site relationships; not a measured plan. Do not redistribute the map image.
- [Official VR](https://inari.jp/vr/): architectural descriptions and linked 360 tour / 3D Gaussian-splat experience. The official page was read this pass; its interactive capture was not inspected this pass.
- [360 tour](https://my.matterport.com/show/?m=SL81CVbVWww) and [Hacosco reference](https://hacosco.com/fushimiinari/), independently linked by [Kansai Guide](https://www.the-kansai-guide.com/en/article/item/20324/). Useful next references for side-wall separations; links verified, not dimensional surveys or reusable model assets.
- [User walking video](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=28s): existing paused captures at 00:28 and 00:43 were inspected again. Direct YouTube fetch failed this pass; no new playback or timestamps claimed.
- Earlier videos [FmRyJ-RtBPg](https://www.youtube.com/watch?v=FmRyJ-RtBPg&t=84s) and [zFKeYi0AK0M](https://www.youtube.com/watch?v=zFKeYi0AK0M) remain secondary comparison candidates, not newly viewed evidence.

## Zone register and next geometry work

| Zone | Evidence / real feature | Current representation | Next action and confidence |
|---|---|---|---|
| Omotesando | Video 00:28/00:43: narrow grey-green lighting columns with pale vertical panels | R73 adds five fixtures; a sixth candidate is excluded by mapped obstacles | Appearance observed; 44/66/88 m stations, offset and 1.32 m height inferred. Verify registration in integrated view |
| Temizuya | Existing r52/r56 photos: clipped terraces, mineral margins, basin pavilion | Prior modules own basin, planted terraces and shoulders | Compare boundary widths and pavilion-side access; do not add central fountain or blanket lawn |
| Rōmon | Official VR + prior north-wing photos | R70/R71 wings and R72 drainage present | Verify drainage placement; guardian alcove sculpture remains simplified; no duplicate side buildings |
| Gehaiden/Naihaiden | Official 360 / 3D reference available | Existing structures and north court planter | Register side separations in 360 before adding new volumes |
| Gonden/Tamayama | [Okumiya route photos](https://fushimiinari-guide.com/okumiya/) show gate/stairs, Tamayama landing, then right-hand stair continuation | R66/R68 mapped access modules | Preserve the left branch; compare both stair-to-landing interfaces |
| Byakko beside Okumiya | [Photographic guide](https://fushimiinari-guide.com/byakkosha/), IMG_6959_20210312, processing_IMG_6621_20210309, IMG_6615_20210308 inspected by reference agent | Legacy box shrine and two cone foxes; no dedicated refinement | Add granite pedestal/red fox case, actual lateral opening and gabled heritage board. Existence observed; dimensions and registration not yet established |
| Nōsatsusho / pond-side branch | [Photo guide](https://fushimiinari-guide.com/nosatsusho/): left branch from Tamayama, return pavilion beside pond | Mapped building way/305214607 exists as generic volume | Register facade/orientation against photos before replacing volume. Keep separate from right-hand Okumiya climb |

Okumiya is not Okusha Hohaisho: the latter lies beyond Senbon Torii. Do not use photographs of the post-tunnel courtyard to rebuild the earlier Okumiya landing.

## Maps observations and limitations

Opened the Google Maps embeds linked by the Okumiya and Nōsatsusho guides; the text-fetch surface returned no visual map content. No new Street View panorama inspection is claimed. Embedded map camera centres are not used as building coordinates. Existing geographic IDs remain authoritative for placement until corroborated registration.

## Implemented and checked

`omotesando-bollards.mjs` adds an observed subset of modern approach fixtures after the shoulder surfaces are built. Four instanced material batches, five narrow colliders, no point lights. Existing route and building exclusions are applied; no legacy architecture is removed. Geometry is deterministic and repeat invocation does not duplicate it.

203 Node tests passed. Diff whitespace check passed. Tests cover mapped exclusions, sloped seating, idempotence, preservation and invalid elevations. Browser visual/walking check and FPS measurement remain pending because the previous browser authority denial has not been resolved. Neither screenshots nor exactness are claimed for the integrated result.
