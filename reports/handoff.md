# Mac handoff — repogamedb.com

Source-only handoff. This file is the checklist for the Mac side; everything in it was produced and verified on the
Windows machine that read the game files. Raw game packages are **not** included and are not needed.

## What to clone

Two ways to move this tree to the Mac side:

1. **The lightweight package** (recommended). `node tools/mac-package.mjs . <outDir>` writes the whole site — source,
   content, images, the data indexes the build reads and the live reports — with **no git history**, no `web/dist`,
   no `data/raw`, no payload dumps, no extracted locale tables and no report history. Its receipt is
   `reports/mac-handoff-manifest.json`: every kept file with its byte size and sha256, every excluded path with its
   size and the reason it was excluded, and the totals.
2. The repository as committed, if a full clone with history is wanted. `data/raw` is untracked either way; the
   payload and locale dumps are tracked there and are not needed to build.

## The package, measured

642 files, 17,562,605 bytes (16.7 MiB) when this file was last built. Rebuilding the package after any edit to this
file moves the total by the size of that edit, so `reports/mac-handoff-manifest.json` inside the package is the
authoritative list; the summary below is the measurement.

| Group | Files | Bytes | What it is |
| --- | --- | --- | --- |
| images | 329 | 13,232,483 | 181 mapped game images (12,947,456 B) + 148 per-entry diagrams in `content/assets/*.svg` (285,027 B) |
| data | 5 | 2,635,199 | `p0-inventory.json` 1,719,175, `repo-object-names.json` 860,328, `p0-instances.json` 45,321, `guide-questions.json` 7,443, `v22-header-samples.json` 2,932 |
| published | 167 | 804,420 | the entry JSON, one file per published subject |
| articles | 87 | 248,607 | the structured guide JSON, one file per guide |
| source | 37 | 432,941 | `pipeline/`, `tools/`, `tests/`, `config/`, `docs/`, `.github/` |
| reports | 7 | 114,749 | `handoff.md` (this file), `status.json`, `coverage-report.md`, `image-coverage.md`, `image-sanity.md`, `image-reviews.md`, and the compact `local-complete.md` |
| content root | 3 | 89,159 | `content/images-manifest.json` 83,757, `content/updates.json` 2,323, `content/README.md` |
| draft | 1 | 667 | `content/draft/item-combinations.json` — the honest "absent" record the coverage gate reads |
| shell | 5 | 1,016 | the five root config files (`.gitattributes`, `.gitignore`, `tsconfig.json`, `tsconfig.ci.json`, `wrangler.toml`) |

The files that move most often, with the hash that identifies them:

| File | Bytes | sha256 |
| --- | --- | --- |
| `content/images-manifest.json` | 83,757 | `1f8eb4fcfb0a9b84a139cfb2ac1ec5651529a852df704b7e31decb135ca5ba15` |
| `config/urls.json` | 126,708 | `5c938e3c701e6cdfd5f192585a4a62613252ce372b4f88de8c1be34dd32b6f1a` |
| `content/updates.json` | 2,323 | `f30f7cf988057c6350669c5ce2ad62eb64215ec13c7c96ad1393a6b6cb1545ee` |
| `data/guide-questions.json` | 7,443 | `8c358e51fe5947651f8aacd25f83bd035476b580ca0418f14f8a50bfc5c0d4af` |
| `data/normalized/p0-instances.json` | 45,321 | `3a7ab89ea6e815508dde1f3d5fc7fd4f48ced7b01080ed6b642bdd61ee18cf02` |
| `data/normalized/p0-inventory.json` | 1,719,175 | `b46b72fb061e7812cf67a42731ccb74c164de76e847da1706a578f505331317d` |
| `data/normalized/repo-object-names.json` | 860,328 | `686164f681956fd4234ff7b80246917718fc35bc24583c1cbcc861451e91168a` |

Whole-group digests, each a sha256 over the sorted lines `path TAB bytes TAB sha256`:

- mapped game images and entry diagrams (329): `dc241a4ca44d162dd80320fbc88edcafdcb9a9e7eefc30428a62cc886e619259`
- published entries (167): `ffe4203b92a751063565b8917e0db97e6f9c815897909e90b5ba2f8ebca066cc`
- guide JSON (87): `4f24cf161423a611da1fbd7d2ab7191b73f8b6a143d9ff10eecc44d58ae66b4f`
- data indexes (4): `ed18350f32a11362a38f884a406387787f34040222799ec640f1ef15bf650f6b`

## What stays on the extraction host, and what replaces it

| Stays on Windows | Size | Why it does not travel |
| --- | --- | --- |
| `data/raw/` (the unpacked game package) | 1,716,046,040 (219 files) | raw input; the site is built from the committed indexes |
| `.git` | 17,609,167 (69 files) | the package ships without history |
| `web/dist/` | 17,684,260 (1,105 files) | rebuilt by `node pipeline/site.mjs` after unpacking |
| `data/normalized/repo-mb-payloads.json` (payload dump) | 224,185 | extraction input for the decoder scripts, read by no build step, gate or test |
| 6 `data/normalized/localization-*.json` tables | 221,636 | extraction output; no build step, gate or test reads them |
| `reports/redesign-p0/*.png` screenshots | 1,385,200 | the site rebuilds them |
| extraction-side working reports | 52,021 | the live report set listed above is kept |
| `HARNESS-NEXT-ACTION.md` (process note) | 610 | not site content |

Nothing has to be replaced for this title, and that is the honest difference from the supermarket package: the decoded
value layer here, `data/normalized/p0-instances.json` (45,321 B), is small and is read by the build itself for the
`/reference/values.html` table, so it travels; the citation universe is built from `repo-object-names.json` and
`p0-inventory.json`, which travel as well. No derived value or citation index is needed and none is claimed.

One check used to read the raw level files by absolute path, which meant it passed on the extraction host by reading the
original tree and failed on any other machine. It now uses the tree's own file when it has one and the committed byte
record `data/normalized/v22-header-samples.json` (2,932 B: both files' real length, their sha256 and their first 512
bytes) when it does not, and reports the check as unreadable rather than passing it when neither is present. That is
also what the independent run on the Mac side found and why the record is in the package.

## Design-owned files: merge, do not overwrite

The Mac design integration (commit `efb7b6b`) owns the page shell. In the package that shell is the Windows copy and a
blind `rsync` would take the design back:

- `pipeline/site.mjs` — the whole layout and style: the `SITE` block at line 14, `layout()` at line 93, the emitted
  `brand.svg` at line 402 and the emitted `style.css` from line 404.

This tree has no `web/assets/` files, so `pipeline/site.mjs` is the only design-owned path. Content-owned and safe to
take as-is: `content/published/*.json`, `content/articles/*.json`, `content/draft/*.json`,
`content/images-manifest.json`, `content/updates.json`, `content/assets/*`, `data/*`, `config/urls.json`,
`tools/*`, `tests/*`, `pipeline/*` other than `site.mjs`.

## What the Mac side needs from this tree

- `config/urls.json` — the keep/noindex split the classifier writes;
- `content/images-manifest.json` — every mapped game image with its source bundle, size and hash;
- `content/updates.json` — the rows behind `/updates.html`;
- `data/guide-questions.json` — the player questions that pair one-to-one with the guides;
- `data/normalized/p0-instances.json`, `p0-inventory.json` and `repo-object-names.json` — the value layer the build reads and the two indexes the citation check reads;
- `content/draft/item-combinations.json` — the record that keeps the missing column honest rather than hidden;
- `reports/status.json` — the machine-readable counts the preflight checks;
- `reports/coverage-report.md`, `reports/image-coverage.md`, `reports/image-sanity.md`, `reports/image-reviews.md` — the gates' own output, including the verdict on every image;
- `reports/handoff.md` (this file) and `reports/local-complete.md` (the compact copy; the full round-by-round log stays on the extraction host);
- `reports/mac-handoff-manifest.json` — the package receipt (per-file size and sha256, exclusions, totals).

Nothing in the tree is generated at publish time that is not committed or in the package.

## How to build and verify

On the Mac side, from the package root (no game package needed):

    node pipeline/site.mjs                                   # production build into web/dist
    node tests/site.test.mjs                                 # 63 gates
    node tools/verify-citations.mjs                          # every cited identifier exists in the build
    node <22>/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
    node tools/content-gate.mjs                               # content model: entries and articles
    node tools/classify-urls.mjs                              # refresh config/urls.json
    node tools/preflight.mjs                                  # clean tree, status consistency, deploy gating
    node tools/smoke.mjs                                      # the built artefact, the way a reader arrives at it
    node tools/smoke.mjs https://<domain>                      # after publishing: every kept URL, live
    node tools/deploy-check.mjs                               # local readiness vs external blockers

Extraction host only, never needed on the Mac:

    node pipeline/normalize_values.ts and the decoder scripts  # rebuild p0-instances.json from the payload dump
    node tools/mac-package.mjs . <outDir>                      # rebuild this package

Re-verified on 2026-10-01 (round 573): the package was unpacked outside the repositories, committed in a scratch git
repository and put through the full thirteen-step runner. All thirteen exited 0 — preflight 11/11, site pages=776
indexable=230 (546 noindex), classify 230 keep / 540 noindex, verify entries=167 facts=1,374 universe=36,861
confirmedElsewhere=6 unmatched=0, gate 167 entries 0 violations, coverage 20/21 with `combos` recorded as ABSENT and
draft=1, image coverage 167 entries / 119 with a game image / 48 notes / 178 records / 0 unused, image sanity 178
records, status recorded from `p0-instances.json`, tests 63 passing, typecheck exit 0, smoke passed, deploy-check
7 ready / 0 local failures / 3 external blockers (a package carries no remote, so it adds the git-remote blocker to the
two Cloudflare secrets). The same build, gates, typecheck and preflight results reproduce without any game package,
without `data/raw`, without the payload dump and without `web/dist`.

## What the site contains

- Published subjects: 167 — 119 entities with a confirmed game picture under `/entries/`, 48 picture-less subjects kept as noindex notes under `/reference/notes/`; structured guides: 87.
- Real images extracted from the game with a recorded mapping: 178 records. 119 entities carry one; the other 48 subjects are notes and are labelled "no confirmed picture from the game yet". A diagram is never passed off as a screenshot. Per-entry origin is in reports/image-coverage.md.
- Build: `pages=776 indexable=230` (546 noindex). URL classification in `config/urls.json`: 230 keep, 540 noindex (the remaining noindex pages are the evidence layer's own tables, which the classifier does not track). The evidence layer lives under `/reference/`; the old top-level addresses are noindex stubs that point there. Player layer: home, game guide, `/entities/` and 10 category pages, 119 entity pages, 87 guides, `/tools/`, `/updates.html`; evidence layer: `/reference/`, `/entity/` and the tables.
- Gates: 63 passing, 0 failing. Content gate: 167 entries and 87 articles, 0 violations. Typecheck: exit 0. Preflight: 11/11 on a clean tree.
- Coverage matrix: 21 target columns, 20 holding at least one published entry. `combos` (item combinations) is recorded as ABSENT in `content/draft/item-combinations.json` rather than padded with guesses.
- Every image record has been opened by eye and carries a verdict in `reports/image-reviews.md`; `tests/site.test.mjs` fails the build if a record is ever added without one.
- Technical reference is reachable from every page but marked `noindex` and excluded from `sitemap.xml`.

## Publishing (not done, and why)

`publish.yml` runs the build, the gates, the typecheck and the preflight, then a `needs: gate` job uploads `web/dist`
to Cloudflare Pages with `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_ACCOUNT_ID`. Publishing needs:
1. a git remote and push credentials (none is configured on the Windows machine);
2. the two Cloudflare secrets;
3. binding repogamedb.com to the Pages project in the Cloudflare dashboard (deliberately not encoded in the repository).

`node tools/deploy-check.mjs` prints exactly these as external blockers and reports 0 local failures.

Every entry and guide carries facts with grounding, a real game image or a labelled original diagram, related links and
sources; the counts above are the current state.
