# Image sources and licensing policy

Updated 2026-10-22 for branch `feat/entry-images`.

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

- **82 community files** are used; **64** have an exact wiki page (and, where available, the original CDN URL) from
  the local scrape data or the Fandom API; **18** have **weak provenance** and point at the wiki root.
- Four earlier files (`bella.png`, `clown-monster.png`, `loom.png`, `semibot-walkies.png`) were removed after the refined mapping stopped
  using them, so no unreferenced community file remains.
- All 85 originally downloaded files were stored as WebP with a `.png`/`.jpg` name. They were re-encoded to the
  declared PNG/JPEG format so the server and the image tool agree on the bytes; the manifest marks the surviving files
  `modified: true` and the entry captions say they were re-encoded.

Weak-provenance files (follow-up list):

- `fandom/c-a-r-t.png`
- `fandom/cosmetics.png`
- `fandom/disposal-arena.png`
- `fandom/duct-taped-grenade.png`
- `fandom/enemy-valuable.png`
- `fandom/explosive-mine.png`
- `fandom/feather-drone.png`
- `fandom/health-pack.png`
- `fandom/locations.png`
- `fandom/map.png`
- `fandom/museum-boombox.png`
- `fandom/museum-of-human-art.png`
- `fandom/purchased-items.png`
- `fandom/shotgun.png`
- `fandom/swiftbroom-academy-rooms.png`
- `fandom/sword.png`
- `fandom/valuable-tracker.png`
- `fandom/valuables.png`

## Audit flags

The provenance audit also flagged these limitations; they are recorded here rather than hidden:

- **8 opaque screenshots** may be local captures rather than wiki uploads: `cosmetics.png`, `disposal-arena.png`, `locations.png`, `map.png`, `museum-of-human-art.png`, `purchased-items.png`, `swiftbroom-academy-rooms.png`, `valuables.png`. They are treated as weak provenance and should be replaced or linked to a verified file page before publishing.
- **14 JPGs** are 268 px Fandom thumbnails; re-encoding to JPEG lost any alpha. They are still legible at the size the page displays them, but they are not the full-size wiki file.
- **Five subjects exist twice** (268 px JPG and 512 px PNG of the same artwork): banger, birthday-boy, headman, peeper, rugrat. Both copies are published on different entries; the credits page lists each file separately.
- **No file was verified live** before this pass; the file pages above were resolved through the Fandom MediaWiki API from a browser session. Pages not found remain weak.

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
