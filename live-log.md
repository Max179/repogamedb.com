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
