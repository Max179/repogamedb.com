# Publish plan — repogamedb.com (completed 2026-10-23)

## Status: published

The site is live on the custom domain and the Cloudflare Pages project.

- Main commit: **2ef1f43** (merge of the completed branch onto main)
- Workflow: **39922044212** — gate success, deploy success
- Cloudflare Pages project: **repogamedb-com**
- Live: https://repogamedb.com/ → 200
- Live sitemap: **284 URLs** (matches local indexable=284)
- Live title: R.E.P.O. guide and reference · R.E.P.O. Wiki
- Verification: reports/live-verification.md

## What changed to make it publish

1. Merged the completed site onto main with --allow-unrelated-histories, keeping the branch content and the repogamedb-com project configuration. Main-only dead assets were removed.
2. Created a Cloudflare API token with Pages Read + Pages Write for account 8cc2c42af026d513aded51986a011494 from the logged-in dashboard session; stored only in GitHub secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
3. Ran the workflow on main; gate + deploy both passed.

## Remaining operational notes

- www.repogamedb.com is not attached; only the apex domain resolves.
- Rotate/revoke the deploy token if it should not remain in GitHub Actions.
- For the full live smoke: node tools/smoke.mjs https://repogamedb-com.pages.dev.
- The feature branch feat/entry-images remains as a backup; main is the deployed branch.

## Do not

- Do not commit tokens or account secrets.
- Do not deploy to a project named repogamedb (the correct project is repogamedb-com).
