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
- Published entries: 3; structured guides: 2 (each guide has goal, version, prerequisites, grounded steps, common mistakes, related entries, sources).
- Real images extracted from the game with a recorded mapping: 2. Origin, asset name, size and sha256 are in `content/images-manifest.json`; diagrams are labelled as diagrams.
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
- Published entries: 6; structured guides: 2; indexable pages: 25.
- Build: `pages=521 indexable=25`; gates: 50 all passing.
- Every entry carries facts with grounding, a labelled diagram (or a game image recorded in `content/images-manifest.json`), related links and sources.
