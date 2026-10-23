# Live verification — 2026-10-23

## Deployment

- Workflow runs: **39922044212** (initial deploy), **39923136016** (docs), **39924210257** (clean canonical), **39934852416** (valid sitemap + title cap) and **39951849465** (IndexNow support) — all **success**
- Main commit: **4ea2d5b** (latest deployed)
- Cloudflare Pages project: **repogamedb-com**
- Account: 8cc2c42af026d513aded51986a011494
- API token: a Pages Read + Pages Write token created from the dashboard session; the value is stored only in the GitHub Actions secret CLOUDFLARE_API_TOKEN.

## Live checks

| Check | Result |
| --- | --- |
| https://repogamedb.com/ | 200 |
| Live title | R.E.P.O. guide and reference · R.E.P.O. Wiki (new build) |
| Live sitemap | **284 URLs**, valid XML `<url>` entries with `<lastmod>` (matches local indexable count) |
| /search.html | 200 via /search |
| /credits.html | 200 via /credits |
| entry page | 200 |
| /robots.txt | 200 |
| /social-card.png | 200 |
| og:image | https://repogamedb.com/social-card.png |
| canonical | https://repogamedb.com/ (clean URLs; sitemap has 0 .html URLs) |
| Google Search Console | domain property verified; sitemap **284 discovered / 0 errors** |

## Not covered

- www.repogamedb.com does **not** resolve in DNS; only the apex domain is attached.
- Full live smoke: **284 pages checked, exit 0** — every kept URL answered with a titled page on the published domain.
- The deploy token should be rotated/revoked by the account owner if it was created only for this publish.
- IndexNow was attempted but returned HTTP 403; it is not counted as a successful submission.
- Analytics, Bing Webmaster and backlink/social distribution remain operational tasks.
