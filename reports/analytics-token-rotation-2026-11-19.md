# Analytics token rotation — 2026-11-19

The Cloudflare Web Analytics beacon token was rotated from
`f292fd509ecf420b8a323f36c2f815a2` to the account's current site token
`40369ef574cb4fa28f472e125feddb7d`.

## Changed

- `pipeline/site.mjs` — the one hard-coded token in the footer beacon.
- `pipeline/site.mjs` — corrected the beacon JSON quoting. The old source emitted
  `data-cf-beacon="{\"token\":\"…\"}"`; because backslash is not an HTML escape,
  the parser truncated the attribute to `{\` and the beacon never read a token
  (no `cdn-cgi/rum` request). It now emits HTML-escaped quotes
  (`data-cf-beacon="{&quot;token&quot;:&quot;…&quot;}"`), so the DOM value is
  valid JSON. This is a pre-existing bug, not a token-value change.
- `reports/analytics-setup.md` — recorded the new public token (old value kept only as history).

The beacon URL (`https://static.cloudflareinsights.com/beacon.min.js`) is
unchanged. Every page still gets exactly one beacon element; no second script
was added.

## Not changed

- No Web Analytics automatic installation, RUM ruleset, zone RUM setting, or
  lite mode was touched. Installation remains manual (the hard-coded beacon).
- No privacy copy, icon/favicon, sitemap, CSP, DNS, or content page was edited.

## Local verification before push

- `npm run build`: `pages=783 indexable=285 schema(noindex)=492 out=web/dist`.
- HTML pages in `web/dist`: 778.
- Pages carrying the new token: 778. Pages carrying the old token: 0.
- Pages with exactly one `beacon.min.js` element: 778; 0 pages with zero or more than one.
- `npm test`: 94 passed, 0 failed.
- Browser check of the two encodings against the live beacon: the old `\"` form
  left `data-cf-beacon` as `{\` and requested only `beacon.min.js`; the
  `&quot;` form produced `window.__cfBeacon.token =
  "40369ef574cb4fa28f472e125feddb7d"` and requested
  `https://cloudflareinsights.com/cdn-cgi/rum`.

## Post-deploy check

Push to `main` deploys Pages project `repogamedb-com`. The live check is the
rendered HTML on `https://repogamedb.com/` (new token present, still a single
beacon) plus the Cloudflare Web Analytics dashboard starting to report traffic.
The dashboard is read as a traffic sentinel once the new token starts collecting;
it is not compared 1:1 against edge page views.
