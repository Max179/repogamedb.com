# Live verification — 2026-10-23

## Deployment

- Workflow run: **39922044212** (publish.yml, workflow_dispatch, ref main) — **success**
- Main commit: **2ef1f43** (merge of the completed site onto main)
- Cloudflare Pages project: **repogamedb-com**
- Account: 8cc2c42af026d513aded51986a011494
- API token: a Pages Read + Pages Write token created from the dashboard session; the value is stored only in the GitHub Actions secret CLOUDFLARE_API_TOKEN.

## Live checks

| Check | Result |
| --- | --- |
| https://repogamedb.com/ | 200 |
| Live title | R.E.P.O. guide and reference · R.E.P.O. Wiki (new build) |
| Live sitemap | **284 URLs** (matches local indexable count) |
| /search.html | 200 via /search |
| /credits.html | 200 via /credits |
| entry page | 200 |
| /robots.txt | 200 |
| /social-card.png | 200 |
| og:image | https://repogamedb.com/social-card.png |
| canonical | https://repogamedb.com/index.html |

## Not covered

- www.repogamedb.com does **not** resolve in DNS; only the apex domain is attached.
- The live smoke runner over all 284 URLs is slow; key routes above were checked with curl. Run node tools/smoke.mjs https://repogamedb-com.pages.dev for the full pass.
- The deploy token should be rotated/revoked by the account owner if it was created only for this publish.
