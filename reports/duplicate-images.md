# Duplicate hero images audit

Date: 2026-10-23

## Result

**172 published entries, 172 unique hero image files, 0 duplicate groups.**

The previous backlog had 20 groups / 54 entries (all concept/item/interface pages that shared one
representative object picture). All were replaced with distinct, semantically related Fandom pictures:

- cart / cart laser / cart-grabbing pages: CartBig, CartSmall, Pocket CART, Cartwand
- truck pages: truck interior, semibot truck, quantum-drive truck
- upgrade pages: range, tumble and health upgrade boxes; upgrade stand screenshot
- extraction pages: clean extraction point and extraction boxes
- energy pages: orbs, drone recharge
- semibot pages: full Semibot, burning Semibot, dapper Semibot
- gun pages: handgun, shotgun, corn ammo
- valuable pages: camera, dragon skull
- save/run pages: score screen, settings menu, magazines and maps
- cosmetic/shop pages: tax token, dapper Semibot
- level/map pages: manor map, map valuable
- museum/music pages: music box, painting
- television/tracker pages: television static, valuable tracker

## Gate

tools/duplicate-images.mjs now requires every entry hero file to be used by exactly one entry.
It runs in tools/preflight.mjs and is covered by the site test suite. The gate is file-level only:
two different pictures of the same subject can still look alike, but no two cards share the same file.
