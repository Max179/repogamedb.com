> **Re-recorded 2026-10-22 on branch `feat/entry-images`.** The earlier records below are historical.
>
> | Item | Value |
> | --- | --- |
> | Build | `[site] pages=782 indexable=284 schema(noindex)=492` |
> | Site gates | `[site-tests] 68 passed, 0 failed` |
> | Content gate | 172 entries, 87 articles, 0 violations |
> | Image coverage | 172/172 entries have a picture; 0 notes; 262 records; 0 unused community files |
> | Image sanity | 262 records, 10 flagged; every flagged file has a verdict in `reports/image-reviews.md` |
> | Classified URLs | 284 keep, 492 noindex |
> | Community pictures | 131 entries; 81 files; 63 exact provenance, 18 weak |
> | Typecheck | not run locally (no `node_modules`); CI installs TypeScript |
>

## 干净克隆复验（2026-10-22，feat/entry-images）

用 `git archive HEAD`（不含 data/raw、不含 web/dist）解到工区外，`git init` 后整链执行：

- build：`pages=782 indexable=284 schema(noindex)=492`
- tests：`68 passed, 0 failed`（含新增的“every image reference resolves to an emitted file”）
- content gate：172 entries / 0 violations
- image coverage：172/172、0 notes、262 records、0 unused community
- image sanity：262 records / 10 flagged
- classify：284 keep / 492 noindex
- preflight：13 ok / 0 failed；smoke：284 kept
- 未跑 typecheck（本机无 node_modules；CI 会安装 TypeScript）
> Commands: `node pipeline/site.mjs`, `node tools/content-gate.mjs`, `node tools/image-coverage.mjs`,
> `python3 tools/image-sanity.py`, `node tests/site.test.mjs`, `node tools/classify-urls.mjs`, `node pipeline/status.mjs`.
> Fandom HTML/API remained Cloudflare-blocked; no scraping was attempted.
# Verification record — R.E.P.O. (repogamedb.com)

Recorded from a full local run on this machine. Every line below was produced by the command above it on the
commit named here; nothing is transcribed from memory. The machine-readable status lives in
`reports/status.json`, which a gate compares against a fresh build (a stale status file fails the suite).

> **Re-recorded 2026-10-01.** The previous record was taken at `20dc1ac` (76 commits) and had drifted:
> it claimed 38 gates and `pages=495`, against 60 gates and `pages=698` today. Numbers below are measured.

| Item | Value |
| --- | --- |
| Commit verified | `01fddb6` (256 commits) |
| Build | `[site] pages=698 indexable=157 schema(noindex)=535 out=web/dist` |
| Site gates | `[site-tests] 60 passed, 0 failed` |
| Preflight | `[preflight] 11 ok, 0 failed` exit 0 |
| Coverage matrix | 21 columns, 20 with published content, 1 recorded as absent in the game, 0 quality failures |
| Content | 141 published entries, 35 structured guides, 1 draft (documented absence), 0 reference pages |
| Decoded value layer | 77 decoded instances |
| Tracked files | 493 (raw game packages 0, build output 0) |

## Not run here

- **Typecheck: not run.** `node_modules/typescript` is not installed on this machine, so
  `tsc --noEmit -p tsconfig.json` was **not** executed and is **not** claimed. The CI workflow installs
  TypeScript on the runner before running it. Treat the typecheck as verified only once CI has run.

## Commands
```
node pipeline/site.mjs                                   # build
node tests/site.test.mjs                                 # gates
node tools/coverage.mjs                                  # coverage matrix (exit 0 = no site gap)
node tools/preflight.mjs                                 # refuse to publish unless everything holds
node pipeline/status.mjs                                 # refresh reports/status.json
git ls-files | Select-String '^data/raw/|^web/dist/'      # must print nothing
```

## Handoff boundary
- In Git: `pipeline/`, `tests/`, `web/` (templates/static), `content/`, `data/normalized/*.json`, `config/`,
  `reports/`, `tools/`, `tsconfig*.json`, `wrangler.toml`, `.github/workflows/publish.yml`.
- Not in Git: `data/raw/**` (game packages, 0 tracked) and `web/dist/**` (build output, 0 tracked) —
  re-measured on this commit.

## Not done
- **Not published.** `publish.yml` runs build, gates, typecheck and preflight before a `needs: gate` deploy job
  that uploads `web/dist` to Cloudflare Pages with a token from secrets. Running it requires credentials that are
  not present in this environment, so no push, no Pages project and no DNS change has been made from here.
- The custom domain (`repogamedb.com`) is bound in the Cloudflare dashboard by the account owner; it is
  deliberately not encoded in this repository.

## Provenance
The extracted data was read from a local copy of build 0.4.0 — Mono engine, `Assembly-CSharp.dll` sha256
`57e631840687760c8de930f0c5774cf387d6a2e6b8d6b3eb3d67436cf999d372`. The copy is an unauthorised repack
(see `reports/data-boundary.md`); the factual values are unaffected, but the source must not be described as a
legitimate installed copy.
