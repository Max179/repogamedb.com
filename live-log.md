# R.E.P.O. UI reconstruction

## 2026-10-05 player interaction pass

- Compared official Steam presentation: charcoal backgrounds, yellow accents and colorful robot artwork. Preserved Dave-inspired wiki navigation rather than copying its ocean palette.
- Replaced public field lookup with a session-persistent preparation checklist; replaced field search with published-page search, query URL support, content filters and an empty state.
- Ego desktop/mobile screenshots inspected; mobile menu, gear query, empty search, checklist reload persistence and reset verified. New preview uses port 4184 because 4174 served an old checkout.
- Existing enemy references and editorial content are not a completed verified entity catalog. No deployment performed.

## 2026-10-05

- Compared actual Dave homepage screenshot and HomeBanner/HomeDashboard components.
- Replaced cream/Impact marketing styling with a dark player wiki, full-width official game banner, compact category navigation, responsive controls and guide sections.
- Removed both texture atlases from generated pages. Added local Steam promotional artwork and a clearly labeled original route illustration; recorded media provenance and unresolved publication rights.
- Existing automated site tests pass (38). Browser visual acceptance remains pending: Ego TaskSpace 10 disappeared during this turn and cannot be resumed. No new screenshot is claimed.
- Search and lookup destinations still expose technical records; this change is not a declaration of completed player content or interaction parity with Dave.
- No deployment or remote push performed.

## 2026-10-05 verified art pass

- Installed `reverse-skill-router` from `zhaoxuya520/reverse-skill` and inspected its Unity route and scope rules.
- Rejected the unreadable texture-atlas exports (duck, bomb thrower, extraction point and walkie) after visual inspection; removed them from the public asset set instead of presenting them as screenshots.
- Kept only the readable crate and level exports, the official Steam banner and a clearly labeled original route illustration. `media-manifest.json` records the Windows source directory and reuse boundary.
- Threat cards now render an image and honest alt text on every card. Ego screenshot acceptance shows zero broken images on `/enemies.html`.
- Full one-to-one sync for the Windows image mapping is pending because the Windows MCP endpoint currently returns 503; no completion claim is made for that catalog.

## 2026-10-05 HUD simplification pass

- Removed the route SVG from the public homepage and deleted the asset; the feature panel now uses a readable crate export.
- Reworked the shell toward a compact game HUD: square controls, uppercase navigation labels, hard-edged panels, warning-yellow frame line and denser category cards.
- Ego acceptance after rebuild: 0 broken images, 0 SVG images on the homepage and 0 horizontal overflow.

## 2026-10-06 wiki entry architecture pass

- Added a Featured entries rail to the homepage and linked every published threat card to a dedicated `/threat/<slug>.html` page.
- Threat detail pages now have image, verified name, version/source facts, field notes, response steps and related links.
- Added unique per-entry field notes so the new indexable pages are not template duplicates.
- Desktop and 390px mobile Ego checks show zero broken images and zero horizontal overflow.

## 2026-10-06 catalog expansion pass

- Expanded the player-facing catalog from 24 threat entries to 24 threats + 38 valuables + 28 gear entries.
- Added `/valuables.html`, `/gear.html` and 66 dedicated entry pages with image, verified name, version/source facts, field notes and related links.
- Technical classes remain Reference/noindex; the new catalog is built only from curated player-facing names present in the verified inventory.

## 2026-10-06 canonical entity names + six-locale rebuild

- Removed `data/community/` (97 files) in full. It held machine-written filler and two invented numbers
  ("estimated 5+ second stun", "<30% health") that were reused across entries, which made them look
  cross-verified when they were only self-copied. Nothing read that directory: the generator loads only
  `p0-inventory.json` and `p0-instances.json`, so the whole set was dead weight.
- Found the published threat names came from a hardcoded list of Unity internal class names (24 entries). The
  game's own string table says the player-facing names are different: BombThrower is "Cleanup Crew", Duck is
  "Apex Predator", Runner is "Reaper", Tricycle is "Bella", Hunter is "Huntsman", Beamer is "Clown" and four
  more. Two entries (Checklist, HiddenOld) are internal classes with no player-facing enemy at all, and seven
  real enemies were missing. 8 of 24 names were correct.
- Added `data/canonical/entities.json`: 29 enemies, 60 items and 6 levels named from the game's own English
  string table. Key-by-key and value-by-value comparison of the full ENEMY.*, ITEM.* and LEVEL.NAME.* sets
  against the extracted table returned zero differences. Internal class names are kept as a labelled
  cross-reference layer, never as player-facing text.
- Added `data/canonical/i18n.json`: authored strings for the six locales the game itself ships (en-US, da-DK,
  fi-FI, pt-BR, pt-PT, sv-SE). The game's own tables cannot supply translations: 543 of their 566 entries are
  English placeholders, and only da-DK (3 entries) and sv-SE (20) carry real translations.
- Retired the invented page copy: the `Profile: quiet door.` sentence, the identical three-step "Quick response"
  block and the repeated catalog sentences are gone.
- Stopped publishing the 38 haul names. The string tables contain no name key for them, so the catalog names
  were class-derived and unverified; the pages now say so instead of presenting them as in-game names.
- Per-entity pages are noindex cross-references. The game ships exactly one string per entity and no description
  key, so two enemy pages measured 82% identical and two item pages 94%. The substance moved into the three
  catalog tables (name, string key, internal class, declared/written field counts), which are now the indexed
  answer.
- Fixed four defects found by measurement, each now covered by a gate: hreflang on the English-only reference
  pointing at locale URLs that were never generated; a language switcher linking to pages that do not exist;
  522 dead links from catalog cards pointing at `/threat/` while entries were written to `/enemy/`; and the home
  page keyed as a directory and silently dropped from `sitemap.xml`.
- Rebuilt: 1135 pages across 6 locales, 78 indexable, 0 dead links in 26158 checked, 0 indexable page pairs
  above 90% main-text containment. `tests/site.test.mjs` 42 passed / 0 failed; `tests/player-ui.test.mjs`
  23 assertions across 6 locales.
- Not done and not claimed: no push, no deploy, no Search Console submission, no AdSense. Behaviour, damage,
  health, speed, spawn rates and prices are absent from the string tables and are therefore not published.

## 2026-10-06 entity images and one honest disclaimer

- Synced the game texture exports from the Windows build (181 files on branch `assets/entity-images`, pushed by the
  Windows agent). The Mac repo keeps only the 52 that a page actually shows; the 181 raw exports stay on that
  branch rather than adding 13 MB of unused art to this history.
- Added `data/canonical/media.json`: 28 of 29 enemies and 31 of 60 items have a sheet. Every entry is keyed to the
  game's own entity key, carries the asset name, bundle, dimensions and sha256 of the file that was opened, and
  records how legible the sheet reads.
- Reused the Windows review ledger instead of re-deciding it: 221 reviewed rows, 37 rejections. Three sheets were
  opened here as a spot check and matched their ledger verdict, so the verdicts were accepted rather than redone.
- A mapped sheet is shown as what it is: the game's own colour sheet, a UV layout in most cases, with the asset
  name and a plain description of what the sheet shows. Nothing is captioned as a screenshot or as official art.
  Where several entities genuinely share one in-game atlas (five drones, four grenades) the page says so.
- `ENEMY.TUMBLER` (Chef) has no sheet in the build and keeps its icon; `ENEMY.HIDDEN` maps to a footprint, which
  the page labels as a footprint rather than as the body. Levels keep icons: the bundles hold level prop and
  signage textures, but no sheet depicts a level.
- Corrected a statement that the images made false. The footer and disclaimer claimed "no game assets are
  redistributed"; entity pages now show texture sheets, so both say instead that names come from the game's own
  string tables and the sheets are exported from a locally owned copy for identification, with the package,
  models, audio and code not redistributed.
- Gate added: every mapping must be keyed to a canonical entity, exist on disk, still hash to the verdict it was
  reviewed under, record its legibility, and its page must not claim a screenshot. Measured 59/59 sha256 match.
- `tests/site.test.mjs` 54 passed / 0 failed; `tests/player-ui.test.mjs` 23 assertions across 6 locales.
- Image bytes are published unmodified. Re-encoding to save bytes would make the published file differ from the
  file that was opened and reviewed, which is the one thing the sha256 record exists to prevent.
