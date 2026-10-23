# SEO audit — 2026-10-23

## Technical SEO in place

- **284 indexable pages** (sitemap matches the classified keep set; 492 noindex pages stay out).
- **284 unique titles** and **284 unique descriptions**; no duplicates, no empty values.
- Meta descriptions are capped at **160 characters** (the old build had 203 pages over that limit; max is now 160).
- Canonical URLs, og:url and sitemap URLs are now **clean URLs** (/entries/the-balloon-monster, /guide, /) instead of the .html forms that Cloudflare Pages 308-redirects.
- Canonical = sitemap URL on every indexable page; rel=alternate en/x-default, robots, sitemap, robots.txt, Open Graph, Twitter card, JSON-LD, social card and image alt are present.
- SEO gate in the test suite: unique title/description, description <=160, clean canonical matching the sitemap.

## Remaining title issues

- **10 titles exceed 60 characters**; they are editorial article/entry titles and will be truncated in some search results.
- **18 titles are under 30 characters**; short but not invalid; they are mostly short entity names with the site suffix.
- Titles remain unique, which is the important indexability property.

## Operational SEO not done here

These need the site owner's accounts and ongoing cadence, not a code change:

1. Submit the sitemap in **Google Search Console** and **Bing Webmaster Tools**; verify domain ownership.
2. Add **analytics** (privacy-friendly or GA4) and consent handling if required.
3. Earn **backlinks / social distribution**; the site currently has no external linking campaign.
4. Review the 10 long titles and the 9 descriptions under 70 characters when doing editorial polish.
5. Monitor Core Web Vitals and indexed-page coverage after the clean-URL deploy.

## Verification

- node tests/site.test.mjs → **79 passed, 0 failed** (the new SEO gate is included).
- node tools/preflight.mjs → 14/14.
- Live verification after deploy: reports/live-verification.md.
