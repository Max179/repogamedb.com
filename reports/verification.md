# Verification record — R.E.P.O. (repogamedb.com)

Recorded from a full local run. Every line below was produced by the command above it, on the commit named here;
nothing is transcribed from memory. Status is machine-readable in `reports/status.json`, which a gate compares
against a fresh build (a stale status file fails the suite).

| Item | Value |
| --- | --- |
| Commit verified | `20dc1ac` (76 commits) |
| Build | `[site] pages=495 indexable=13 schema(noindex)=479 out=web/dist` |
| Site gates | `[site-tests] 38 passed, 0 failed` |
| Typecheck | `tsc --noEmit -p tsconfig.json` exit 0 |
| Preflight | `[preflight] 10 ok, 0 failed` exit 0 |
| Decoded value layer | 77 decoded instances |
| Tracked files | 45 (raw game packages 0, build output 0) |

## Commands
```
node pipeline/site.mjs                                   # build
node tests/site.test.mjs                                 # gates
node <22>/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node tools/preflight.mjs                                 # refuse to publish unless everything holds
node pipeline/status.mjs                                 # refresh reports/status.json
git ls-files | Select-String '^data/raw/|^web/dist/'      # must print nothing
```

## Handoff boundary
- In Git: `pipeline/`, `tests/`, `web/` (templates/static), `data/normalized/*.json`, `reports/`, `tools/`,
  `tsconfig*.json`, `wrangler.toml`, `.github/workflows/publish.yml`.
- Not in Git: `data/raw/**` (game packages) and `web/dist/**` (build output).

## Not done
- **Not published.** `publish.yml` runs build, gates, typecheck and preflight before a `needs: gate` deploy job
  that uploads `web/dist` to Cloudflare Pages with a token from secrets. Running it requires credentials that are
  not present in this environment, so no push, no Pages project and no DNS change has been made from here.
- The custom domain (`repogamedb.com`) is bound in the Cloudflare dashboard by the
  account owner; it is deliberately not encoded in this repository.
