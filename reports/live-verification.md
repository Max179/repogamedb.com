# Live verification — 2026-10-23

## Deployment

- Workflow runs: **39922044212** (initial deploy), **39923136016** (docs redeploy) and **39924210257** (SEO clean-URL deploy) — all **success**
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
| canonical | https://repogamedb.com/ (clean URLs; sitemap has 0 .html URLs) |

## Not covered

- www.repogamedb.com does **not** resolve in DNS; only the apex domain is attached.
- Full live smoke: **284 pages checked, exit 0** — every kept URL answered with a titled page on the published domain.
- The deploy token should be rotated/revoked by the account owner if it was created only for this publish.
