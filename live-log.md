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
