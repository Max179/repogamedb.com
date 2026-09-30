# Mac handoff — repogamedb.com

Source-only handoff. This file is the checklist for the Mac side; everything in it was produced and verified on the
Windows machine that read the game files.

## What to clone
The repository as committed. Raw game packages are **not** included and are not needed: the normalized data that the
site is built from is committed under `data/normalized/`.

## How to build and verify
```
node pipeline/site.mjs                                   # production build
node tests/site.test.mjs                                 # 49 gates
node <22>/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node tools/content-gate.mjs                              # content model: entries and articles
node tools/classify-urls.mjs                             # refresh config/urls.json
node tools/deploy-check.mjs                              # local readiness vs external blockers
```

This was verified from a clean clone: the same build, gates, typecheck and preflight results reproduce without any
game package and without `web/dist`.

## What the site contains
- Published entries: 46; structured guides: 24.
- Real images extracted from the game with a recorded mapping: 49. 46 of 46 published entries carry one; the other 0 are diagram-only and labelled as such. Per-entry origin is in reports/image-coverage.md.
- Content at handoff: 8 entries and 3 structured guides.
- Build: `pages=512 indexable=19`. URL classification in `config/urls.json`: 19 keep, 485 noindex.
- Technical reference is reachable from every page but marked `noindex` and excluded from `sitemap.xml`.

## Publishing (not done, and why)
`publish.yml` runs the build, the gates, the typecheck and the preflight, then a `needs: gate` job uploads `web/dist`
to Cloudflare Pages with `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_ACCOUNT_ID`. Publishing needs:
1. a git remote and push credentials (none is configured on the Windows machine);
2. the two Cloudflare secrets;
3. binding repogamedb.com to the Pages project in the Cloudflare dashboard (deliberately not encoded in the repository).

`node tools/deploy-check.mjs` prints exactly these as external blockers and reports 0 local failures.

## Content breadth at handoff
- Published entries: 28; structured guides: 10.
- Real images extracted from the game with a recorded mapping: 29. 26 of 28 published entries carry one of those images; the other 2 are diagram-only, labelled as such on their own page and demoted out of the featured list. Per-entry origin (bundle, asset name, size, bytes, sha256) is in reports/image-coverage.md.
- Build: `pages=588 indexable=59` (485 reference pages stay noindex); gates: 50 all passing; typecheck: exit 0.
- Categories covered: Enemies, Extraction, Valuables, Items, Shop, Maps, Comms, Weapons, Physics, Cosmetics.
- Every entry carries facts with grounding, a labelled diagram (or a game image recorded in `content/images-manifest.json`), related links and sources.
