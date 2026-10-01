# Mac handoff — repogamedb.com

Source-only handoff. This file is the checklist for the Mac side; everything in it was produced and verified on the
Windows machine that read the game files.

## What to clone
The repository as committed. Raw game packages are **not** included and are not needed: the normalized data that the
site is built from is committed under `data/normalized/`.

## How to build and verify
```
node pipeline/site.mjs                                   # production build
node tests/site.test.mjs                                 # 63 gates
node tools/verify-citations.mjs                         # every cited identifier exists in the build
node <22>/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node tools/content-gate.mjs                              # content model: entries and articles
node tools/classify-urls.mjs                             # refresh config/urls.json
node tools/deploy-check.mjs                              # local readiness vs external blockers
node tools/smoke.mjs                                     # the built artefact, the way a reader arrives at it
node tools/smoke.mjs https://<domain>                     # after publishing: every kept URL, live
```

Re-verified on 2026-10-01 (round 382): a fresh `git clone` of this repository built the site (pages=749 indexable=206), ran every gate (63 passing), the portable typecheck, the artefact smoke test and the preflight (11/11), all from the committed files alone and with no game package present.
This was verified from a clean clone: the same build, gates, typecheck and preflight results reproduce without any
game package and without `web/dist`.

## What the site contains
- Published subjects: 156 — 107 entities with a confirmed game picture under `/entries/`, 49 picture-less subjects kept as noindex notes under `/reference/notes/`; structured guides: 75. Target columns for this title: 21, of which 20 hold at least one published entry (reports/coverage-report.md).
- Real images extracted from the game with a recorded mapping: 129. 107 entities carry one; the other 49 subjects are notes and are labelled "no confirmed picture from the game yet". A diagram is never passed off as a screenshot. Per-entry origin is in reports/image-coverage.md.
- Build: `pages=753 indexable=206`. URL classification in `config/urls.json`: 206 keep, 541 noindex (the remaining noindex pages are the evidence layer's own tables, which the classifier does not track). The evidence layer lives under `/reference/`; the old top-level addresses are noindex stubs that point there. Player layer: home, game guide, `/entities/` and 10 category pages, 107 entity pages, 75 guides, `/tools/`, `/updates.html`; evidence layer: `/reference/`, `/entity/` and the tables.
- Technical reference is reachable from every page but marked `noindex` and excluded from `sitemap.xml`.

## Publishing (not done, and why)
`publish.yml` runs the build, the gates, the typecheck and the preflight, then a `needs: gate` job uploads `web/dist`
to Cloudflare Pages with `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_ACCOUNT_ID`. Publishing needs:
1. a git remote and push credentials (none is configured on the Windows machine);
2. the two Cloudflare secrets;
3. binding repogamedb.com to the Pages project in the Cloudflare dashboard (deliberately not encoded in the repository).

`node tools/deploy-check.mjs` prints exactly these as external blockers and reports 0 local failures.

Every entry and guide carries facts with grounding, a real game image or a labelled original diagram, related links and sources; the counts above are the current state.