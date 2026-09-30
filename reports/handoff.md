# Mac handoff — repogamedb.com

Source-only handoff. This file is the checklist for the Mac side; everything in it was produced and verified on the
Windows machine that read the game files.

## What to clone
The repository as committed. Raw game packages are **not** included and are not needed: the normalized data that the
site is built from is committed under `data/normalized/`.

## How to build and verify
```
node pipeline/site.mjs                                   # production build
node tests/site.test.mjs                                 # 61 gates
node tools/verify-citations.mjs                         # every cited identifier exists in the build
node <22>/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node tools/content-gate.mjs                              # content model: entries and articles
node tools/classify-urls.mjs                             # refresh config/urls.json
node tools/deploy-check.mjs                              # local readiness vs external blockers
```

This was verified from a clean clone: the same build, gates, typecheck and preflight results reproduce without any
game package and without `web/dist`.

## What the site contains
- Published subjects: 142 — 100 entities with a confirmed game picture under `/entries/`, 42 picture-less subjects kept as noindex notes under `/reference/notes/`; structured guides: 37. Target columns for this title: 21, of which 20 hold at least one published entry (reports/coverage-report.md).
- Real images extracted from the game with a recorded mapping: 115. 100 entities carry one; the other 42 subjects are notes and are labelled "no confirmed picture from the game yet". A diagram is never passed off as a screenshot. Per-entry origin is in reports/image-coverage.md.
- Build: `pages=701 indexable=161`. URL classification in `config/urls.json`: 161 keep, 534 noindex. The evidence layer lives under `/reference/`; the old top-level addresses are noindex stubs that point there. Player layer: home, game guide, `/entities/` and 10 category pages, 100 entity pages, 37 guides, `/tools/`, `/updates.html`; evidence layer: `/reference/`, `/entity/` and the tables.
- Technical reference is reachable from every page but marked `noindex` and excluded from `sitemap.xml`.

## Publishing (not done, and why)
`publish.yml` runs the build, the gates, the typecheck and the preflight, then a `needs: gate` job uploads `web/dist`
to Cloudflare Pages with `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_ACCOUNT_ID`. Publishing needs:
1. a git remote and push credentials (none is configured on the Windows machine);
2. the two Cloudflare secrets;
3. binding repogamedb.com to the Pages project in the Cloudflare dashboard (deliberately not encoded in the repository).

`node tools/deploy-check.mjs` prints exactly these as external blockers and reports 0 local failures.

Every entry and guide carries facts with grounding, a real game image or a labelled original diagram, related links and sources; the counts above are the current state.