# Image sources and licensing policy

Updated 2026-10-23 for branch `feat/entry-images`.

## Source priority

1. **Fandom community images** (R.E.P.O. Fandom wiki) under CC-BY-SA 4.0, recorded in
   `content/images-manifest.json` with source page, author/attribution, licence URL and retrieval date.
2. **Other community wikis** only when the file page states a reusable licence; no such source was used in this pass.
3. **Local game assets** extracted from the user's own game copy (source bundle and asset name recorded).
4. **Original diagrams** drawn for this site, labelled `not a screenshot`.

## Fandom access limitation (important)

The two R.E.P.O. Fandom wikis (`repo-2025horror.fandom.com`, `repogame.fandom.com`) answer automated requests with
a Cloudflare challenge/HTTP 403 from this machine; the CDN (`static.wikia.nocookie.net`) is reachable. This pass
therefore did **not** scrape the wikis and did **not** bypass the challenge. It used the community files that were
already in the repository.

- **147 community files** are used; **147** have an exact wiki page (and, where available, the original CDN URL) from
  the local scrape data or the Fandom API; **0** have weak provenance.
- Four earlier files (`bella.png`, `clown-monster.png`, `loom.png`, `semibot-walkies.png`) were removed after the refined mapping stopped
  using them, so no unreferenced community file remains.
- All 85 originally downloaded files were stored as WebP with a `.png`/`.jpg` name. They were re-encoded to the
  declared PNG/JPEG format so the server and the image tool agree on the bytes; the manifest marks the surviving files
  `modified: true` and the entry captions say they were re-encoded.

Weak-provenance files: **none**. The 2026-10-23 pass resolved all 19 records to exact Fandom file pages and uploaders.

## Audit flags

The provenance audit also flagged these limitations; they are recorded here rather than hidden:

- The eight opaque screenshots that were previously weak have been replaced with exact Fandom files (category title cards, map, shelf, DA image, museum painting); they are no longer weak.
- **14 JPGs** are 268 px Fandom thumbnails; re-encoding to JPEG lost any alpha. They are still legible at the size the page displays them, but they are not the full-size wiki file.
- **Five subjects exist twice** (268 px JPG and 512 px PNG of the same artwork): banger, birthday-boy, headman, peeper, rugrat. Both copies are published on different entries; the credits page lists each file separately.
- All 147 community records were resolved live through the Fandom MediaWiki API from a browser session; no weak record remains.

## UV texture replacement (2026-10-23)

Thirteen entry heroes that were raw UV/texture sheets (or a particle sheet) were replaced with Fandom pictures of the
subject itself: balloon monster → Birthday Boy, beamer → Clown, duck monster → duck gameplay shot, floater → Mentalist,
runner → Huntsman, shopkeeper → Shopkeeper, spinny → Gambit, thin man → Trudge, tricycle rider → Bella, valuable thrower
→ Rugrat, tumble wings → Tumble Wings icon, museum laser → museum laser, tutorial → tutorial title card. Twelve are exact
file-page records; the duck screenshot is weak provenance. The old texture files remain in the game library and are no
longer used as entry heroes. This moved 13 entries from `game-image` to `community-image` (game 41→28, community 131→144).

## Attribution used on the site

Each community image caption renders: "Community picture from <wiki link>, <licence> (<licence link>), by <author>.
It has been re-encoded for this page. It is not a screenshot taken by this site." Illustrative pictures add
"showing <what the picture shows>." The `/credits.html` page lists every community record with the entry that uses
it, the source, the author and the licence. The manifest is the machine-readable source of the same facts.

## Rejected sources

- `wiki.biligame.com/repo` is reachable but its file licensing is not established, so it was not used.
- Guide sites (e.g. repo-game.org) do not state a reusable licence and were not used.
- `repo.wiki.gg` returned 401/challenge and no reusable file pages were confirmed.
- No automated scraping or bot-protection bypass is used.

## Verification

- `node tools/content-gate.mjs` — every community picture has a source page, author, licence and retrieval date.
- `tests/site.test.mjs` — credits page list, no game-label on community pictures, manifest/file hashes and dimensions.
- `node tools/image-coverage.mjs` — every published entry has a picture; community files are all referenced.
