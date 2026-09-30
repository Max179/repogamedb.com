# Publish checklist — repogamedb.com

Everything that can be done without credentials has been done and is verified on branch `main`.
This file lists exactly what is still missing, so publishing is a short, unambiguous step once the
credentials exist.

> **Re-measured 2026-10-01 on `1e56fce`.** Earlier versions of this file quoted 28 entries, 10 guides,
> `pages=588` and 50 gates, then 141 entries and `pages=698`; both had drifted. Everything below is measured
> on the current commit with the site's own generators.

## Verified locally on this commit (`1e56fce`, 368 commits)
- Build, gates, typecheck and preflight all pass on branch `main`, on a clean working tree.
- Content: **152 published entries, 43 structured guides**; 1 draft that documents an absence rather than a gap, all facts grounded in identifiers read from the game's own files.
- Build: `pages=717 indexable=174` (543 noindex reference pages kept out of the sitemap).
- Site gates: `[site-tests] 62 passed, 0 failed`.
- Coverage matrix: **21** target columns, **20** holding at least one published entry, 1 (`combos`) recorded as absent in the game, 0 quality failures.
- Images: **107** entries carry a picture confirmed from the game and **45** carry an original diagram only; the manifest holds **129 records**, none unused. Every record has been opened by eye and has a verdict in `reports/image-reviews.md`, and a gate fails the build if a record is added without one.
- Every image mapping is re-checkable: a gate asserts each `content/images-manifest.json` record matches the
  file on disk by byte count, sha256 and real dimensions.
- `.github/workflows/publish.yml` runs the build, then the gates, then the portable typecheck; the `deploy` job
  has `needs: gate`, so nothing reaches the internet unless those pass.
- `wrangler.toml` and the workflow agree on the Pages project name: `repogamedb`.
- No token or secret literal is committed; the deploy reads only `secrets.CLOUDFLARE_API_TOKEN` and
  `secrets.CLOUDFLARE_ACCOUNT_ID`.

## Missing — external, cannot be resolved from this machine
1. **No git remote.** Nothing can be pushed from here. Provide one, then:
   ```
   git remote add origin git@github.com:<owner>/<repo>.git
   git push -u origin main
   ```
2. **No `CLOUDFLARE_API_TOKEN`.** Set it as an Actions secret (repo → Settings → Secrets and variables → Actions).
3. **No `CLOUDFLARE_ACCOUNT_ID`.** Same place. The deploy job needs nothing else.
4. **The Pages project `repogamedb` must exist** in the account that owns the token. The first deploy can create it.
5. **The custom domain `repogamedb.com` is not bound.** Bind it to the Pages project in the Cloudflare dashboard
   and create the DNS record. This is deliberately not encoded in the repository, because it is an account action
   rather than a build artefact.
6. **`gh` and `wrangler` are not installed here**, so the push has to be done with plain `git` (or install one).

## Expected result once the above exist
- A push to `main` triggers the gate job: build → 60 gates → typecheck, then the deploy job runs the preflight and
  uploads `web/dist` to Cloudflare Pages.
- Live smoke to run afterwards: the home page, `/entries/`, `/topics/`, `/articles/`, one enemy or valuable page,
  `/sitemap.xml`, `/robots.txt`, the 404 page, and `/reference/` (which must stay `noindex` and out of the sitemap).

## Missing — in the build, not external (measured 2026-10-01, 7a98df1)

**The site is English-only. The agreed shape is eleven language versions, all fully switchable, with the English
site on the bare domain (no `/en` prefix).** Measured on the built output and the generator:

- Rendered pages are single-locale: `<html lang="en">`, and the only alternates on every page are
  `<link rel="alternate" hreflang="en">` and `hreflang="x-default"` (`pipeline/site.mjs`, the `layout()` function).
- There is no language switcher and no locale route: `web/dist` holds `/entries/`, `/articles/`, `/reference/`,
  `/entities/`, `/tools/` with no locale segment, and no rendered page carries a language menu. A grep for a
  switcher or a locale list in the page markup finds nothing.
- The only second-language data in the content is Chinese: every entry file carries `zh` strings beside `en`
  (142/142 entries), but the renderer prints `alt.en` and keeps the Chinese as a single `title=` tooltip on the
  entry hero image. No third language exists anywhere in `content/`.
- No document or config in the repository names the eleven languages, and there is no translation catalogue.

  **Correction (2026-10-01, game-data side): the game ships six language tables, but they are placeholders.**
  `REPO_Data/StreamingAssets/aa/StandaloneWindows64/` holds one Unity Localization string table per language —
  **6 languages** (da-DK, en-US, fi-FI, pt-BR, pt-PT, sv-SE), 566 strings each. Comparing every string against the
  English table: **da-DK 3, sv-SE 20, fi-FI, pt-BR and pt-PT 0** are genuinely translated; the rest are the English
  string with a `(<locale>)` marker in front of it — a placeholder the localizer never replaced. They are committed as
  `data/normalized/localization-<locale>.json` (extractor `tools/extract-localization.py`, with bundle sha256 and a
  `verification` block). A site must not present those strings as translations.

This is a build-side gap, not a credentials gap, which is why it is listed apart from the external blockers above.
It is template and content work — locale routing, per-locale rendering, the switcher, `hreflang`, per-locale
sitemaps, and the translated copy — so it belongs with the site-design session rather than with the game-data work,
which is why no game-data report claims it as done.
