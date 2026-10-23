# Data pipeline — how `data/normalized/` was produced

This document records where the site's data comes from, how it was extracted, and — just as importantly — what a
clean macOS clone can and cannot reproduce. The short version: **the committed normalized index is the build input;
the extraction chain ran on a Windows host with a local copy of the game and is not reproducible from this
repository alone.**

Measured counts below are from the committed files on branch `feat/entry-images` (2026-10-23). They describe the
current data, not the round in which it was first written.

## 1. What the build reads

`pipeline/site.mjs` and `tests/site.test.mjs` read only committed files. The primary input is
`data/normalized/p0-inventory.json`; the value layer is merged from `data/normalized/p0-instances.json` when it is
present.

| File | Bytes | Role |
| --- | ---: | --- |
| `data/normalized/p0-inventory.json` | 1,719,175 | Class/field/enum schema: 478 candidate classes, 4,802 fields, 130 enums. Every field carries source, version, confidence and value. |
| `data/normalized/p0-instances.json` | 45,321 | 77 decoded object instances. A field is `extracted` only when every decoded instance of its class agreed. |
| `data/normalized/repo-object-names.json` | 860,328 | 32,599 object/asset names read from the readable bundles, used to verify that a cited identifier exists. |
| `data/normalized/v22-header-samples.json` | 2,932 | First 512 bytes of real Unity 6 `level` files, recorded on the extraction host so the v22 header reader can be checked without the game. |
| `data/normalized/localization-*.json` | ~35 KB each | Six shipped locale tables (da-DK, en-US, fi-FI, pt-BR, pt-PT, sv-SE), 566 keys each. No build step reads them. |
| `data/guide-questions.json` | 7,443 | Editorial question set used by the guide layer. |
| `content/images-manifest.json` | ~84 KB | Image licence/provenance ledger (see section 3.8). |

Nothing under `data/raw/` is tracked, and `web/dist/` is generated.

## 2. Source package and evidence anchors

The data was read from a local unpacked copy of **R.E.P.O. v0.4.0** on the Windows extraction host:

```
data/raw/R.E.P.O.v0.4.0/REPO/REPO.exe
data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data/
    Managed/Assembly-CSharp.dll
    resources.assets, sharedassets0.assets, globalgamemanagers
    level0, level1, level2
    StreamingAssets/aa/StandaloneWindows64/...
```

- Archive: `C:\uTorria\Downloads\REPOv040rar\R.E.P.O.v0.4.0.rar` (0.54 GB, RAR4), unpacked with `UnRAR.exe`.
- Engine: Unity, **Mono** backend (`Managed/` exists; no `il2cpp_data/`). Game/product: `semiwork` / `REPO`
  (`REPO_Data/app.info`).
- Version **0.4.0** is the game's own label: `REPO_Data/sharedassets0.assets` holds the serialized text record
  `Version - RELEASE` + `v0.4.0` at offset 66,428,081. The player-settings slot in `globalgamemanagers` reads
  `0.1`, a stale default, and is deliberately **not** used.

Byte-level anchors (re-check these if a different package copy is ever used):

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `REPO_Data/sharedassets0.assets` | 67,228,396 | `c4b42e9553f716578a9358b92b5e39705aa3e7edaa379c0d643d98395d0cf84a` |
| `REPO_Data/globalgamemanagers` | — | `b97d60f0527d166c73deee0cb9a32ef707fecfa832d8c77e0b406066e9812252` |
| `REPO_Data/resources.assets` | — | `10647e717948919fefbefb3736ebdf3f09d4551d1fec796480d56c23150b94a9` |
| `REPO_Data/Managed/Assembly-CSharp.dll` | 2,915,840 | `57e631840687760c8de930f0c5774cf387d6a2e6b8d6b3eb3d67436cf999d372` |

**Rights note.** `reports/data-boundary.md` records that this local package carries the markers of an unofficial
repack. That does not change the technical facts above — every number is read from the game's own bytes and remains
verifiable — but it does mean the project never publishes the raw package and never describes it as a lawful
purchase. The site wording is "read from a local copy of build 0.4.0", and the raw files stay on the extraction host.
See `reports/data-boundary.md` before repeating or publishing any source claim.

## 3. Extraction chain

All of this ran on the Windows host. Scripts that touch raw bytes are host-only; only their committed outputs travel.

### 3.1 Unpack

`UnRAR.exe x -o+ -idq` to `data/raw/R.E.P.O.v0.4.0/`. `data/raw/` is gitignored, and the raw package is excluded
from the Mac handoff package as well.

### 3.2 Schema from the managed assembly

`pipeline/inventory.ts` + `pipeline/dotnet-metadata.ts`

- `dotnet-metadata.ts` is an **ECMA-335 metadata reader** written for this project: DOS/PE header, section table,
  CLI header (data directory 14), metadata root (`BSJB`), then the `#~`, `#Strings` and `#Blob` streams and the
  TypeDef/Field/TypeRef tables. It reads metadata only; no IL is executed or interpreted.
- `inventory.ts` filters candidate gameplay classes by name and walks each class's written fields (base class
  first) to produce `p0-inventory.json` with per-field provenance.
- Output measured today: **478 classes, 4,802 fields, 130 enums**; 4,642 fields are `verified-schema` and 160 are
  `extracted`. The data file also records totals over the whole assembly: 1,501 types, 19,505 fields, 436
  candidate classes.
- The script contains the host's absolute Windows path to the DLL and output, so it is not parameterized for
  another machine.

### 3.3 Object table and object names

The R.E.P.O. files are Unity 6 SerializedFiles (v22). The project's own search for the v22 object-table entry layout
returned a **negative result**: none of the three candidate layouts tiled the data section exactly
(`reports/v22-object-table.md`). Rather than guess, the pipeline used **UnityPy** (a general-purpose library) to
enumerate objects; the parsing *method* was reused, never another game's data.

- `pipeline/unitypy_probe.py`, `unitypy_find_scripts.py`, `unitypy_multifile.py`, `unitypy_rawscript.py` are
  read-only probes that established where MonoScripts live and how cross-file PPtrs resolve.
- `pipeline/unitypy_name_all.py` names every MonoBehaviour by reading the fixed header directly out of the object
  bytes — `m_GameObject` PPtr (12 B) + `m_Enabled` (1 B, padded to 4) + `m_Script` PPtr (12 B), so the script
  pathID sits at byte 20 — and resolving it against `globalgamemanagers.assets`. Result:
  `data/normalized/repo-object-names.json` (32,599 names; the report records 637/637 REPO objects named).
- `pipeline/serialized.ts` is the project's own Unity 2019.4 (v21) SerializedFile reader. It is kept for the
  measured v21 layout and its self-check, not as the reader for the v22 R.E.P.O. files;
  `pipeline/serialized-v22.mjs` implements only the measured v22 **header** fields, not the v22 object table.
- The full v22 container path therefore remains open (section 6).

### 3.4 Payload dump

`pipeline/unitypy_dump_payloads.py` loads each level file together with `globalgamemanagers.assets`, resolves the
MonoScript class name, and dumps small (<= 4,096 bytes) MonoBehaviour payloads as base64 into
`data/normalized/repo-mb-payloads.json`. That intermediate file is **gitignored**
(`data/normalized/*-payloads.json`) because it is raw game bytes: it is extraction input, not a build input.

### 3.5 Value decoder

`pipeline/mono-layout.ts` and `pipeline/mono-values.ts`

- Layout rules were measured, not remembered: the MonoBehaviour header was confirmed structurally over 2,356 objects;
  primitive sizes and 4-byte field alignment were accepted only when they consumed real payloads exactly.
- The decoder supports primitives, strings, 12-byte object references, enums (size read from the enum's own
  `value__`), arrays and one level of nested assembly-declared structs, up to a measured depth.
- **Acceptance rule: the decode must consume the payload exactly.** Anything unmeasured — notably Unity built-ins
  such as `Vector3`, `Color`, `Quaternion`, `AnimationCurve`, `Keyframe` and `LayerMask` — refuses the whole
  class rather than guessing a value.
- `pipeline/decode_values.ts` / `decode_values2.ts` are the host-side runners that exercise the decoder over the
  dumped payloads.

### 3.6 Normalization

`pipeline/normalize_values.ts`

- Merges decoded instances into the inventory. A field becomes `confidence: extracted` only when **every** decoded
  instance of that class agrees on the value; otherwise its value stays `null` and the field remains
  `verified-schema`.
- Writes `data/normalized/p0-instances.json` (77 instances) and updates the inventory's per-field confidence.
- Output paths are derived from the working directory, but the DLL lookup still expects `data/raw/` beside the
  checkout, so this step cannot run on a clone that does not have the game.

### 3.7 Header samples and localization

- `pipeline/v22_sample_record.mjs` recorded the first 512 bytes of eight real v22 files (three games) into
  `data/normalized/v22-header-samples.json`, so the measured v22 header reader can be tested on a machine that does
  not carry the game. `reports/v22-header.md` records the measured relations.
- `tools/extract-localization.py` reads the game's addressable localization bundles (`StreamingAssets/aa/...`) and
  writes the six `data/normalized/localization-<locale>.json` files. Each output records the bundle SHA-256 and an
  integrity check. The tables are mostly placeholders except da-DK/sv-SE partial translations; **no translation is
  authored here**, and no build step or gate reads these files.

### 3.8 Images (a separate ledger)

The image layer is not part of `p0-inventory.json`; it has its own provenance ledger:

- `tools/extract-images.py` — UnityPy texture export restricted to textures whose mapping to a player-facing subject
  was confirmed by hand; writes files under `content/assets/` and records bundle, asset name, bytes, dimensions and
  SHA-256.
- `tools/add-renders.mjs` — registers Blender renders made from exported prefabs.
- `tools/record-image.py` — the only writer of `content/images-manifest.json`; it refuses a community record
  without source page, author, licence, licence URL and retrieval date, and a game record without bundle and asset
  name.
- `tools/image-sanity.py` — flags near-uniform or near-blank exports before human review.
- Policy and the weak-provenance follow-up list: `reports/image-sources.md`.

Images are committed under `content/`, so the build and gates do not need the game.

## 4. Why it is not reproducible on a clean Mac clone

1. **The raw input is absent by design.** `data/raw/` is untracked and excluded from the handoff package. Without
   the 1.6 GB unpacked game there is nothing to re-extract.
2. **The extractors are tied to the Windows host.** `pipeline/inventory.ts`, `pipeline/unitypy_dump_payloads.py`,
   `pipeline/unitypy_*.py`, `tools/extract-images.py` and the localization default paths contain absolute
   `C:/Users/CHEN/...` locations; several were written against a specific Python 3.12 install.
3. **Python tooling is not pinned.** The extraction host used Python 3.12.10 with UnityPy from
   `...\Python312\Lib\site-packages`, plus Pillow for image sanity. The repository commits no
   `requirements.txt`/`pyproject.toml` lock, so even the exact UnityPy version is not reproducible from the repo.
4. **The decoder's acceptance depends on the raw corpus.** Rules are validated by "does this consume the payload
   exactly" against thousands of real objects. Without those objects there is no way to re-measure a rule.
5. **CI never performs extraction.** The publish workflow builds from the committed index, runs the tests and the
   typecheck. Extraction is a manual, host-specific step; no test regenerates `p0-inventory.json` from raw bytes.
6. **Intermediate raw dumps are not committed.** `repo-mb-payloads.json` is gitignored, so the decoder's direct input
   is not in the clone either.

## 5. What *is* reproducible here

From the committed tree, on macOS or in CI, with Node 22:

```sh
node pipeline/site.mjs            # rebuild web/dist from the committed index
node tests/site.test.mjs          # site + data invariants
node tools/content-gate.mjs       # editorial/image rules
node tools/image-coverage.mjs     # every entry has a credited picture
node tools/preflight.mjs          # publish checklist (expects a clean tree)
```

The tests treat the committed index as evidence: they check that every `extracted` field has a value, that every
field carries provenance, that cited identifiers exist in `repo-object-names.json`, and that the build's output
holds together. They do not, and cannot, re-derive the index.

## 6. Residual gaps (documented, not hidden)

- **Normalization/decoder work is the main residual gap.** The full chain from raw game bytes to
  `p0-inventory.json`/`p0-instances.json` exists only as host scripts plus this write-up; it is not automated, not
  pinned, not covered by CI, and cannot be re-run from a clean clone.
- **Value coverage is partial.** Of 4,802 fields, 160 are `extracted`; 4,642 remain `verified-schema` with a
  `null` value. The dominant refusals are classes whose fields include Unity built-ins that are not declared in
  `Assembly-CSharp.dll` and whose on-disk encoding must be measured rather than assumed
  (`reports/decoder-arrays.md`, `reports/decoder-structs.md`, `reports/decoder-enums.md`).
- **The Unity 6 (v22) object table was not solved by this project.** The measured search failed and the negative
  result is recorded; UnityPy supplies the object table, which is a host dependency, not a committed parser.
  `serialized-v22.mjs` covers only the header.
- **Class-name resolution is fragile by design.** A simple name is accepted only when unique; ambiguity is refused
  (`reports/local-complete.md`, value-layer update). Some classes are deliberately left undecoded.
- **Image provenance is partial.** 18 of 82 community files are marked weak provenance; the Fandom wikis answer
  automated requests with a challenge and were not scraped further. See `reports/image-sources.md` and
  `reports/image-reviews.md`.
- **Localization is mostly placeholder text** and is not used by the site. It is committed as extraction output, not
  as translated content.
- **The raw package is an unofficial copy**; see the rights note in section 2 and `reports/data-boundary.md`.

## 7. Evidence map

| Question | File |
| --- | --- |
| What was on the host, and what stayed there | `reports/data-boundary.md`, `reports/handoff.md` |
| How the data and gates were measured | `reports/verification.md`, `reports/status.json` |
| Decoder rules and refusals | `reports/decoder-arrays.md`, `decoder-structs.md`, `decoder-enums.md` |
| Unity object table / UnityPy route | `reports/unitypy-object-table.md`, `reports/monoscript-location.md`, `reports/route-d-values.md` |
| v22 header and object-table search | `reports/v22-header.md`, `reports/v22-object-table.md` |
| Image provenance and licensing | `reports/image-sources.md`, `reports/image-reviews.md`, `content/images-manifest.json` |
| Localization extraction | `reports/localization-extraction.md` |
| Reproducibility and publication | `reports/publish-plan.md`, `.github/workflows/publish.yml` |

## 8. If a re-extraction is ever required

Use a Windows machine that holds the unpacked 0.4.0 copy, verify the anchors in section 2 first, install Python 3.12
with UnityPy and Pillow, and run the steps in section 3 in order (`inventory.ts` → UnityPy naming/dump →
`normalize_values.ts`), then re-run the gates. Any new value must still satisfy the exact-consumption rule; do not
fill a missing value because a page needs one. Update `reports/data-boundary.md`, the anchors here, and
`reports/verification.md` in the same change.
