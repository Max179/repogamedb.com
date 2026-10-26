# Analytics setup — 2026-10-26

## What was added

- **Cloudflare Web Analytics** site created for host `repogamedb.com` (account 8cc2c42af026d513aded51986a011494).
- Public site token: `f292fd509ecf420b8a323f36c2f815a2`.
- The build injects the official Cloudflare beacon on every page:
  `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="{...}"></script>`
- The script is cookieless and aggregate; no personal profiles are built by the site.
- The privacy page was updated from "no analytics / no third-party requests" to the accurate wording: no cookies, Cloudflare Web Analytics (cookieless aggregate), no other third-party requests.

## Where to read the data

Cloudflare Dashboard → Web Analytics → `repogamedb.com` (or the account-level Web Analytics list).

## Limits

- Cloudflare Web Analytics does not provide full session replay, funnels, or per-page user paths; use it for traffic/aggregate page views.
- No Google Analytics / Clarity was installed, so there are no cookies, user IDs, or consent-banner requirements.
- Data starts after the next deploy; allow up to 24 hours for the first reports.

## www

`www.repogamedb.com` was attached as a Cloudflare Pages custom domain with a proxied CNAME to `repogamedb-com.pages.dev`. It serves the same site; canonical URLs remain on the apex domain.
