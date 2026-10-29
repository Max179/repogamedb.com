# SEO audit — 2026-10-23

## Technical SEO in place

- **284 indexable pages** (sitemap matches the classified keep set; 492 noindex pages stay out).
- **284 unique titles** and **284 unique descriptions**; no duplicates, no empty values.
- Meta descriptions are capped at **160 characters** (the old build had 203 pages over that limit; max is now 160).
- Canonical URLs, og:url and sitemap URLs are now **clean URLs** (/entries/the-balloon-monster, /guide, /) instead of the .html forms that Cloudflare Pages 308-redirects.
- Canonical = sitemap URL on every indexable page; rel=alternate en/x-default, robots, sitemap, robots.txt, Open Graph, Twitter card, JSON-LD, social card and image alt are present.
- SEO gate in the test suite: unique title/description, title <=60, description <=160, clean canonical matching the sitemap.

## Title/description state

- **0 titles exceed 60 characters**; the site suffix is omitted when it would push the title past 60.
- **18 titles are under 30 characters**; short but not invalid; they are mostly short entity names.
- **8 descriptions are under 70 characters** (re-measured 2026-10-30; the 2026-10-26 privacy re-wording moved one above 70); utility pages, still unique and non-empty.
- Titles and descriptions remain unique.

## Operational SEO not done here

These need the site owner's accounts and ongoing cadence, not a code change:

1. **Google Search Console: done** — domain property `repogamedb.com` is verified; the sitemap was submitted and shows **284 discovered URLs, 0 errors** (2026-10-23).
2. **Bing Webmaster Tools**: not submitted; can import from GSC or use IndexNow. An IndexNow key/tool was added, but the first API call returned HTTP 403, so it is not counted as a successful submission.
3. Add **analytics** (privacy-friendly or GA4) and consent handling if required — not done.
4. Earn **backlinks / social distribution** — not started.
5. Monitor Core Web Vitals and indexed-page coverage in GSC after the clean-URL deploy.

## Verification

- node tests/site.test.mjs → **79 passed, 0 failed** (the new SEO gate is included).
- node tools/preflight.mjs → 14/14.
- GSC sitemap row: 284 discovered / 0 errors, status success.
- Live verification after deploy: reports/live-verification.md.

## Re-measured 2026-10-30 (macOS gate pass)

Independent recount over the 284 classified keep pages in `web/dist` (no site code changed):

- titles: **284 unique**, max **60** chars, **18** under 30 chars — unchanged.
- descriptions: **284 unique**, max **160** chars, **8** under 70 chars (was recorded as 9 on 2026-10-23; the 2026-10-26
  analytics/privacy re-wording lengthened one description past 70).
- every keep page: one `<h1>`, `robots: index, follow`, a canonical equal to its sitemap URL, `hreflang en` +
  `x-default`, valid JSON-LD, Open Graph and Twitter card.
- sitemap: 284 URLs = classified keep set exactly; 492 noindex pages stay out; 0 internal links broken across 777 HTML pages.

SEO item 3 in the operational list above is now **done** (Cloudflare Web Analytics beacon, cookieless) — see
`reports/analytics-setup.md` and `reports/live-verification.md`.
