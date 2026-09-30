# Publish checklist — repogamedb.com

Everything that can be done without credentials has been done and is verified on branch `main`.
This file lists exactly what is still missing, so publishing is a short, unambiguous step once the
credentials exist.

## Verified locally on this commit
- Build, gates, typecheck and preflight all pass on branch `main`.
- Content: 28 published entries, 10 structured guides, all facts grounded in identifiers read from the game's own files.
- Build: `pages=588 indexable=59` (485 noindex reference pages kept out of the sitemap).
- `.github/workflows/publish.yml` runs the build, then the gates, then the portable typecheck; the `deploy` job has `needs: gate`, so nothing reaches the internet unless those pass.
- `wrangler.toml` and the workflow agree on the Pages project name: `repogamedb`.
- No token or secret literal is committed; the deploy reads only `secrets.CLOUDFLARE_API_TOKEN` and `secrets.CLOUDFLARE_ACCOUNT_ID`.

## Missing — external, cannot be resolved from this machine
1. **No git remote.** Nothing can be pushed from here. Provide one, then:
   ```
   git remote add origin git@github.com:<owner>/<repo>.git
   git push -u origin main
   ```
2. **No `CLOUDFLARE_API_TOKEN`.** Set it as an Actions secret (repo → Settings → Secrets and variables → Actions).
3. **No `CLOUDFLARE_ACCOUNT_ID`.** Same place. The deploy job needs nothing else.
4. **The Pages project `repogamedb` must exist** in the account that owns the token. The first deploy can create it.
5. **The custom domain `repogamedb.com` is not bound.** Bind it to the Pages project in the Cloudflare dashboard and create the DNS record. This is deliberately not encoded in the repository, because it is an account action rather than a build artefact.
6. **`gh` and `wrangler` are not installed here**, so the push has to be done with plain `git` (or install one of them).

## Expected result once the above exist
- A push to `main` triggers the gate job: build → 50 gates → typecheck, then the deploy job runs the preflight and uploads `web/dist` to Cloudflare Pages.
- Live smoke to run afterwards: the home page, `/entries/`, `/topics/`, `/articles/`, one enemy or valuable page, `/sitemap.xml`, `/robots.txt`, the 404 page, and `/reference/` (which must stay `noindex` and out of the sitemap).
