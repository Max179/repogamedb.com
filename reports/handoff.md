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

Re-verified on 2026-10-01 (round 530): a fresh `git clone` of this repository built the site (pages=765 indexable=219), ran every gate (63 passing), the portable typecheck, the artefact smoke test and the preflight (11/11), all from the committed files alone and with no game package present. The clone's own `deploy-check` reported 8 ready, 0 local failures and 2 external blockers (a clone carries a remote, so only the two Cloudflare secrets are missing there).
This was verified from a clean clone: the same build, gates, typecheck and preflight results reproduce without any
game package and without `web/dist`.

## What the site contains
- Published subjects: 165 — 117 entities with a confirmed game picture under `/entries/`, 48 picture-less subjects kept as noindex notes under `/reference/notes/`; structured guides: 82. Target columns for this title: 21, of which 20 hold at least one published entry (reports/coverage-report.md).
- Real images extracted from the game with a recorded mapping: 167. 117 entities carry one; the other 48 subjects are notes and are labelled "no confirmed picture from the game yet". A diagram is never passed off as a screenshot. Per-entry origin is in reports/image-coverage.md.
- Build: `pages=769 indexable=223`. URL classification in `config/urls.json`: 223 keep, 540 noindex (the remaining noindex pages are the evidence layer's own tables, which the classifier does not track). The evidence layer lives under `/reference/`; the old top-level addresses are noindex stubs that point there. Player layer: home, game guide, `/entities/` and 10 category pages, 117 entity pages, 82 guides, `/tools/`, `/updates.html`; evidence layer: `/reference/`, `/entity/` and the tables.
- Technical reference is reachable from every page but marked `noindex` and excluded from `sitemap.xml`.

## Publishing (not done, and why)
`publish.yml` runs the build, the gates, the typecheck and the preflight, then a `needs: gate` job uploads `web/dist`
to Cloudflare Pages with `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_ACCOUNT_ID`. Publishing needs:
1. a git remote and push credentials (none is configured on the Windows machine);
2. the two Cloudflare secrets;
3. binding repogamedb.com to the Pages project in the Cloudflare dashboard (deliberately not encoded in the repository).

`node tools/deploy-check.mjs` prints exactly these as external blockers and reports 0 local failures.

Every entry and guide carries facts with grounding, a real game image or a labelled original diagram, related links and sources; the counts above are the current state.