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

- **82 community files** are used; **26** have an exact wiki page (and, where available, the original CDN URL) from
  the local `.scratch` scrape data; **55** have **weak provenance** and point at the wiki root.
- Three earlier files (`bella.png`, `clown-monster.png`, `loom.png`) were removed after the refined mapping stopped
  using them, so no unreferenced community file remains.
- All 85 originally downloaded files were stored as WebP with a `.png`/`.jpg` name. They were re-encoded to the
  declared PNG/JPEG format so the server and the image tool agree on the bytes; the manifest marks the surviving files
  `modified: true` and the entry captions say they were re-encoded.

Weak-provenance files (follow-up list):

- `fandom/baby-head.png`
- `fandom/blender.png`
- `fandom/c-a-r-t-laser.png`
- `fandom/c-a-r-t.png`
- `fandom/ceiling-eye.png`
- `fandom/cosmetic-boxes.png`
- `fandom/cosmetics.png`
- `fandom/defibro.png`
- `fandom/disposal-arena.png`
- `fandom/duct-taped-grenade.png`
- `fandom/egg.png`
- `fandom/elsa.png`
- `fandom/enemy-valuable.png`
- `fandom/energy-crystal.png`
- `fandom/explosive-mine.png`
- `fandom/extraction-point.png`
- `fandom/feather-drone.png`
- `fandom/flashlight.png`
- `fandom/grenade.png`
- `fandom/gumball-machine.png`
- `fandom/health-pack.png`
- `fandom/jackhammer.png`
- `fandom/keycard.png`
- `fandom/leaf-blower.png`
- `fandom/levitation-potion.png`
- `fandom/locations.png`
- `fandom/map.png`
- `fandom/milk.png`
- `fandom/museum-boombox.png`
- `fandom/museum-of-human-art.png`
- `fandom/prodzap.png`
- `fandom/pulse-pistol.png`
- `fandom/purchased-items.png`
- `fandom/radio.png`
- `fandom/roll-staff.png`
- `fandom/rubber-duck.png`
- `fandom/rugrat.jpg`
- `fandom/rugrat.png`
- `fandom/semibot-walkies.png`
- `fandom/semibot.png`
- `fandom/shotgun.png`
- `fandom/snow-bike.png`
- `fandom/swiftbroom-academy-rooms.png`
- `fandom/sword.png`
- `fandom/teeth-bot.png`
- `fandom/television.png`
- `fandom/toy-car.png`
- `fandom/traffic-light.png`
- `fandom/tray.png`
- `fandom/truck.png`
- `fandom/upgrades.jpg`
- `fandom/valuable-tracker.png`
- `fandom/valuables.png`
- `fandom/void-staff.png`
- `fandom/wizard-broom.png`

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
