# SEO audit — repogamedb.com

> **Update 2026-11-02 — full SEO pass (pre-deploy).** Titles, descriptions, internal URL form, sitemap
> `<lastmod>`, JSON-LD and the robots policy were brought up to one contract and the test suite now enforces it.
> The indexable count and URL set are unchanged: **284 indexable / 777 HTML files / 492 noindex**, sitemap 284.
> Every number below was measured on the built `web/dist` on macOS with the committed content (no network, no game
> files). The 2026-10-23 and 2026-10-30 sections are kept as history.

## Measured state (2026-11-02)

| Item | Result |
| --- | --- |
| Indexable pages / HTML files / noindex | **284 / 777 / 492** (unchanged) |
| Sitemap `<loc>` count | **284**, exactly the classified keep set, all clean URLs, no duplicates |
| Titles | **284 unique**, **30–60 chars** (197 at 45–60, 87 at 30–44), min 30, max 60 |
| Descriptions | **284 unique**, **70–160 chars** (min 94, max 160) |
| URL form | canonical = og:url = sitemap URL = hreflang = JSON-LD `url` on all 284 |
| Internal links | **0** internal `href`/form actions use the redirecting `.html` form (777 pages); search index 264 URLs, all clean |
| Sitemap `<lastmod>` | **274 of 284** are content git dates (distinct: 2026-10-01, 10-13, 10-22, 10-23); **10 pages omit** it (no dated content source); build date never used |
| JSON-LD | one parseable `@graph` per page: home = **WebSite + SearchAction** (`/search?q={search_term_string}`); 172 entries + 87 guides = **259 Article + BreadcrumbList**; 24 WebPage + BreadcrumbList (hubs/categories/static); **283 breadcrumbs**, every one ends on the canonical; image resolves on all 283 non-home pages |
| Dates in JSON-LD | `dateModified` only where `content/dates.json` records a content date; `datePublished` only where the updates log records the item as new |
| Social | og:title/description/url/image/type + twitter:card/title/description/image on all 284; twitter:image = og:image |
| robots.txt | `User-agent: *`, `Allow: /`, one `Sitemap:` line, **0 Disallow** |
| noindex policy | 492 noindex pages marked `noindex, follow` and absent from the sitemap (evidence layer and redirect stubs) |
| IndexNow | public key file emitted to dist root (`/ac280030861ab8d0fe5283a0f8378b82.txt`, also `/indexnow-key.txt`); `tools/indexnow.mjs` submits the built sitemap to api.indexnow.org; manual only, never run by build/CI |

## Before → after (same machine, same content, 2026-11-02)

| Metric | Before | After |
| --- | --- | --- |
| Titles under 25 chars | 8 | **0** |
| Titles 25–29 chars | 10 | **0** |
| Titles 30–44 / 45–60 | 92 / 174 | **87 / 197** |
| Shortest title | 21 | **30** |
| Descriptions under 70 chars | 8 | **0** |
| Shortest description | 17 | **94** |
| Duplicate titles / descriptions | 0 / 0 | 0 / 0 |
| Canonical = og:url = sitemap | 284 / 284 | 284 / 284 (now gated) |
| Sitemap `lastmod` | 284, all the **build date** (2026-11-02) | **274 content dates**, 10 omitted |
| JSON-LD on home | WebPage, no SearchAction | **WebSite + SearchAction** |
| JSON-LD pages with BreadcrumbList | 0 | **283** |
| Internal `.html` links (777 pages) | **8,755** | **0** |
| Search index URLs in `.html` form | 263 | **0** |
| Test suite | 79 gates | **94 gates** (15 new/extended SEO checks) |

## What changed

- `pipeline/site.mjs` — longer truthful titles and descriptions; internal links/form actions rendered in the clean
  public form (`/guide`, not `/guide.html`); one JSON-LD `@graph` per page (WebSite+SearchAction, Article/WebPage,
  BreadcrumbList, dates and images where provable); sitemap `<lastmod>` read from `content/dates.json`; redirect
  stubs keep their noindex/meta-refresh but point at the clean target; 404 uses an explicit robots override.
- `pipeline/dates.mjs` (new) — derives one date per page from the newest git commit touching the page's content
  source (entry JSON, guide JSON, updates log, guide-questions); reports when full history is unavailable instead of
  guessing.
- `tools/content-dates.mjs` (new, manual) — writes `content/dates.json` (274 dated pages). Not part of the build
  and not part of CI; run it after editing content. The build reads the committed file, so it stays hermetic.
- `content/dates.json` (new) — the committed date map (content dates only; no build dates).
- `tools/classify-urls.mjs` — the sitemap publishes clean URLs while the build emits `.html` files; the classifier
  now maps one to the other. Before this fix a re-run would have classified every page noindex. It now reproduces
  the existing 284 keep / 492 noindex file unchanged.
- `tests/site.test.mjs` — 15 new/extended gates (94 total): title 25–60 unique; description 70–160 unique; a
  description truncator that cuts on word boundaries; canonical = og:url = sitemap; sitemap parsed as XML (structure,
  one loc per url, no duplicates, no .html form); truthful `lastmod` (recording exactly `content/dates.json`, pages
  without a date omit it, no single build date) plus a staleness check that re-derives the dates from git; JSON-LD
  parses and declares WebSite+SearchAction / Article|WebPage / BreadcrumbList ending on the canonical; `datePublished`
  only where the updates log records it; og/twitter metadata and twitter:image = og:image; robots.txt
  allows/no Disallow; noindex pages stay out of the sitemap; no internal link uses the redirecting `.html` form.
- `.github/workflows/publish.yml` — both checkouts use `fetch-depth: 0`, because the new lastmod gate re-derives the
  content dates from git history.

**Not changed:** no content, data, image, page or URL was added or removed; indexable stays 284 and the HTML file set
stays 777. Titles/descriptions were rewritten only where the measured ranges required it or to add the page's real
subject keywords; no game fact was added.

## Mutation check (the new gate can fail)

| Mutation | Observed | Reverted |
| --- | --- | --- |
| `contact.html` title shortened back to "Contact" | `FAIL every indexable page has a 25-60 character title :: contact.html = 23 "Contact · R.E.P.O. Wiki"` — 93 passed / 1 failed, exit 1 | `94 passed, 0 failed`, exit 0 |
| Sitemap `lastmod` switched back to the build date | two failures: `every sitemap lastmod is the recorded content date…` and `the sitemap does not stamp one build date on every URL :: {"dated":284,"undated":0,"distinct":["2026-11-02"]}` — 92 passed / 2 failed, exit 1 | `94 passed, 0 failed`, exit 0 |

## Maintenance rules

1. After editing `content/published/*.json`, `content/articles/*.json`, `content/updates.json` or
   `data/guide-questions.json`: run `node tools/content-dates.mjs` and commit `content/dates.json` with the content.
   The test suite fails when the file is stale (it re-derives the dates from git).
2. Never write `new Date()` into the sitemap. A page with no dated content source omits `<lastmod>`; that is correct.
3. Page copy that lives in `pipeline/site.mjs` (about/contact/legal/tools/search/guide/credits/start-here) has no
   content date, so those pages deliberately carry no `lastmod`.
4. In a checkout without full git history the dates gate prints an explicit SKIP detail (CI checks out full history).

## Verification on this commit

- `node pipeline/site.mjs` → `pages=782 indexable=284 schema(noindex)=492` (777 HTML + 5 shell files), exit 0.
- `node tests/site.test.mjs` → **94 passed, 0 failed**, exit 0.
- `npm run typecheck` → exit 0. Content gate → 172 entries / 0 violations, exit 0. Image coverage 172/172,
  178 records, 0 problems; duplicate hero images 0 groups; citations unmatched 0; coverage 21 columns / 20 covered /
  0 quality failures; classify 284 keep / 492 noindex — all exit 0.
- `node tools/preflight.mjs` → 14 ok / 0 failed, exit 0; `node tools/smoke.mjs` → 284 kept / 492 noindex, exit 0.
- Full gate log and live-vs-deploy status: `reports/revival-2026-10-30.md` and `reports/live-verification.md`.
  The new commits are local-only until the Lead pushes and the publish workflow deploys them.

## Operational SEO not done here (owner actions, unchanged)

1. **Google Search Console**: domain property verified; sitemap showed **284 discovered / 0 errors** (2026-10-23).
   Re-submit the sitemap after this deploy so the new `lastmod` values are picked up.
2. **Bing Webmaster Tools**: still unauthorised; the IndexNow key/tool is in place, but the last live attempt returned
   HTTP 403 and is not counted as submitted.
3. **Analytics**: done (cookieless Cloudflare Web Analytics beacon); data reporting is owner-side.
4. **Backlinks / social distribution**: not started.
5. **Core Web Vitals / indexed coverage**: needs GSC data after the deploy.

## Historical record — 2026-10-30 (superseded by the section above)

Independent recount over the 284 classified keep pages in `web/dist` (no site code changed on that date):

- titles: 284 unique, max 60 chars, 18 under 30 chars.
- descriptions: 284 unique, max 160 chars, 8 under 70 chars.
- every keep page: one `<h1>`, `robots: index, follow`, a canonical equal to its sitemap URL, `hreflang en` +
  `x-default`, valid JSON-LD, Open Graph and Twitter card.
- sitemap: 284 URLs = classified keep set exactly; 492 noindex pages stay out; 0 internal links broken across 777 HTML pages.

## Historical record — 2026-10-23 (superseded)

- 284 indexable pages (sitemap matches the classified keep set; 492 noindex pages stay out).
- 284 unique titles and 284 unique descriptions; no duplicates, no empty values.
- Meta descriptions capped at 160 characters; canonical URLs, og:url and sitemap URLs clean (no `.html` form).
- SEO gate at the time: unique title/description, title ≤60, description ≤160, clean canonical matching the sitemap.
