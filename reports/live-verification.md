# Live verification — 2026-10-23

## Deployment

- Workflow runs: **39922044212** (initial), **39923136016** (docs), **39924210257** (canonical), **39934852416** (valid sitemap/title cap), **39951849465** (IndexNow) and **40274469779** (analytics/www) — all **success**
- Main commit: **a2b452e** (latest deployed; docs-only on top of 4b8781d — workflow run **40275998887**, gate + deploy success, 2026-10-26T05:47Z)
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
| Cloudflare Web Analytics | cookieless beacon added; data pending |
| https://www.repogamedb.com/ | attached; resolves and serves the same site |

## Not covered

- www.repogamedb.com is now attached as a Cloudflare Pages custom domain with a proxied CNAME. It resolves; local direct curl sometimes hits one slow Cloudflare edge, while explicit edge-IP checks return 200.
- Full live smoke: **284 pages checked, exit 0** — every kept URL answered with a titled page on the published domain.
- The deploy token should be rotated/revoked by the account owner if it was created only for this publish.
- IndexNow was attempted but returned HTTP 403; it is not counted as a successful submission.
- Bing Webmaster Tools was opened; the site shows as unauthorized and still needs the add-site/verification step. Backlink/social distribution is not started. Analytics data needs up to 24 hours.

## Re-verified from macOS — 2026-10-30

Read-only re-check of the published site after the local verification pass (macOS 26.5.1/arm64, Node 22.23.2).
The deployed commit is still a2b452e; this pass changed no site code, content or data.

| Check | Result |
| --- | --- |
| Latest deploy | run **40275998887** (a2b452e): gate **success**, deploy **success** — fetched from the public GitHub Actions API |
| Live sitemap | **284 URLs**, all `<lastmod>` present; URL set identical to the local `web/dist/sitemap.xml` (0 only-live, 0 only-local) |
| Live smoke | **284 kept URLs checked, 0 failures, exit 0** (`npm run smoke -- https://repogamedb.com`) |
| Sampled pages vs local dist | 13 pages (home, guide, entities, tools, credits, search, updates, about, 3 entries, 2 guides): title, canonical, robots, hreflang, JSON-LD, OG, Twitter, lang — **0 differences** |
| `https://repogamedb.com/` | 200; `http://` → **301** to https |
| `https://www.repogamedb.com/` | **200** (same build; canonical stays on the apex domain) |
| Unknown path | **404** with `<title>Not found · R.E.P.O. Wiki</title>` and `robots: noindex, follow` |
| /robots.txt, /social-card.png, /tools/, /entities/, IndexNow key | 200 each |
| Cloudflare Web Analytics beacon | present in the live HTML and in the local build (same public site token) |

Not re-verifiable from here (owner accounts): Google Search Console sitemap status (recorded 284 discovered / 0 errors on
2026-10-23), Bing Webmaster Tools authorisation, IndexNow (last attempt returned HTTP 403 and was not retried).
