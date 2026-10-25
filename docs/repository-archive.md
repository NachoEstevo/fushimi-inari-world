# Repository archive — 25 October 2026

This cleanup removes historical review packets and unused old presentation images from the current Git tree, and three older local export packets from the working directory. Everything removed was copied outside the repository with its original relative path, length and SHA-256. These are historical artifacts, not established duplicates. No source model, runtime asset, reference collection, checkpoint, credit or license file was selected.

The private recovery archive is named `fushimi-cleanup-2026-10-25`, under `RepositoryBackups` in the operator's Windows profile, on C: (outside this D: checkout). Its `files/` directory preserves repository-relative paths. Keep that archive private: it contains historical logs, machine paths and research evidence. The archive is local, not a separately replicated or publicly downloadable backup.

The [exact recovery manifest](audits/repository-cleanup-2026-10-25.json) records all 360 files and their hashes. **1,411,858,438 bytes** were archived and removed from this checkout. Of those, **104 tracked files / 75,173,042 bytes** are removed from the current Git tree; **256 ignored files / 1,336,685,396 bytes** were local only. Removing tracked files does not shrink or sanitize earlier Git history. New index/manifest documentation adds a small amount back to the working tree.

## Historical review evidence

The following complete packets were archived, including their scripts, camera poses, hashes, audit records and review notes. Original relative paths quoted in historical reports are lookup keys in the manifest; their findings and limitations remain historical, not validation of the current dirty checkout.

| Original directory | Files | Bytes |
| --- | ---: | ---: |
| `docs/review-r66` | 2 | 165,044 |
| `docs/review-r67` | 2 | 92,792 |
| `docs/review-r68` | 5 | 623,715 |
| `docs/review-r75` | 2 | 1,510,804 |
| `docs/review-r87-mountain` | 4 | 2,252,048 |
| `docs/review-r88-okusha` | 6 | 4,276,671 |
| `docs/review-r89-yotsu` | 6 | 4,410,469 |
| `docs/review-r90-gate` | 9 | 13,525,352 |
| `docs/review-r91-shinmesha` | 8 | 9,497,006 |
| `docs/review-r92` | 2 | 7,209,289 |
| `docs/review-r93` | 3 | 940,760 |
| `docs/review-r95` | 8 | 3,855,368 |
| `docs/review-r96` | 21 | 8,497,241 |
| `docs/review-r97` | 14 | 5,838,781 |
| `docs/review-r98` | 6 | 1,532,964 |

Some packet files were ignored rather than tracked; the manifest records that distinction per file. Retained in Git: arrival review, R99 registration/source evidence, R101 including its unresolved R100 review, R102, standalone sector/reference narratives and tracked arrival/audio output reports.

Six old images with no surviving textual consumers were also archived: `docs/images/aerial-context.png`, `inariyama-overview.png`, `reception.png`, `romon-current.png`, `romon.png` and `yotsutsuji-current.png` (10,944,738 bytes). The current README WebPs, referenced `autumn.png` and `temizuya.png`, and the untracked project cover remain.

## Historical local exports

| Original directory | Files | Bytes |
| --- | ---: | ---: |
| `outputs/r95-integrated` | 99 | 544,017,286 |
| `outputs/r96-integrated` | 127 | 687,493,656 |
| `outputs/r101-visual` | 30 | 105,174,454 |

These contain old diagnostic geometry exports, Blender scenes/backups, captures and associated scripts/logs. They are not selected by `scripts/build-static.mjs`. Historical reports now point here for recovery. Their unique geometry and evidence remain in the archive; no claim is made that they could be recreated exactly from today's source.

Preserved locally: `fushimi_inari/outputs/` including checkpoints and reference captures; `fushimi_inari/references/`; prior cleanup archives; original audio; R103 work; recent loading/Ultra/arrival outputs; source models and exporters. This pass deliberately does not resolve all remaining storage candidates.

## Recovery and verification

Before removal, every archived file matched its source by length and SHA-256. The complete target inventory and all source hashes were checked again, with a final hash comparison immediately before each individual file deletion. No recursive deletion or cross-shell move was used. A separate restore of `outputs/r95-integrated/tamayama.json` matched its hash and parsed as JSON.

Private archive control files: `manifest.json`, `removed.json`, `result.json`, `targets.json`, `archive-batch.ps1`, `initial-status.txt`, `initial-dirty.patch`, and `preserved-work.json`. The initial patch/status are context for recovery, not an instruction to overwrite ongoing work.

To recover one file, use its exact `path` in the manifest, copy it from `files/<path>` into a separate recovery directory, and compare SHA-256 before integrating it. Never restore over current work automatically. For tracked files, the parent commit also retains the original version; ignored artifacts require the external archive.

Validation for this cleanup: source/build-input inspection, incoming-reference search, archival hash checks, independent restore/parse, preserved-work hash comparison, local Markdown link checks and scoped Git diff review. No renderer, server, runtime test or new build is needed for this documentation/archive-only change. Runtime, deployment and device behavior are not newly validated.

## Publication review remains open

A bounded heuristic scan examined 855 tracked UTF-8 text files (21,998,184 bytes) and all 1,488 reachable UTF-8 text blobs (30,941,199 bytes), across 99 commits / 1,799 blobs. Common provider-token, credential-assignment and private-key patterns produced no matches. This used Python regex heuristics; dedicated secret scanners were unavailable. It does not cover untracked/ignored files, binary metadata or embedded text, unreachable objects, or unknown credential formats.

Machine-path triage found 31 lines in 19 tracked files plus a generic tool path. These are privacy/portability findings, not confirmed credentials. They include scripts, historical source notes and the retained arrival render log; older commits still contain them. No secret values are included in this report. A dedicated release review must address them and inspect image/binary metadata before public publication.

The project owner confirmed the required asset permissions. Repository visibility was not changed by this cleanup.
