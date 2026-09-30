# Image review log

Every image the site shows as a picture from the game is exported from this installation by
`tools/extract-images.py`, hashed when it is written, and listed with its origin in
`content/images-manifest.json`. This log records the separate, human step: opening the exported file and
checking by eye that it is a legible picture of the thing the entry says it is.

A picture fails the review if it is near-blank or featureless (a flat colour, an all-black or all-white
sheet, or unreadable stripes), or if what it actually shows is not the thing the note claims. A failed
picture is deleted together with its mapping and the manifest is regenerated; the entry then either gets a
different picture or is demoted to an original diagram. A verdict of "ok" below means the file was opened,
compared against its note, and kept.

| reviewed | file | asset name | entity | verdict |
| --- | --- | --- | --- | --- |
| 2026-09-30 | mapped/the-walkie-talkie-texture.jpg | Walkie_Basecolor RED | the-walkie-talkie-and-how-it-answers | ok — a red greebled colour sheet with a legible layout; matches the set the crew talks through |
| 2026-09-30 | mapped/how-a-level-is-put-together-level.jpg | level manor 01 | how-a-level-is-put-together | ok, note corrected — a clean greyscale manor drawing on black; the note no longer calls it a theme texture without saying it is a picture |
| 2026-09-30 | mapped/valuables-and-looting-coin.png | Coin Albedo | valuables-and-looting | ok — a coin icon and bar, legible, matches the coin valuable |
| 2026-09-30 | mapped/your-avatar-and-where-it-is-shown-avatar.jpg | PlayerAvatar_Albedo | your-avatar-and-where-it-is-shown | ok — a grey avatar atlas with legible seams and features; not blank |
| 2026-09-30 | mapped/enemies-that-move-differently-gnome.jpg | Gnome_Albedo | enemies-that-move-differently | ok — a coloured gnome atlas with a readable face and clothing |
| 2026-09-30 | mapped/how-monsters-find-you-eye.jpg | Enemy_Ceiling Eye_Albedo Engn 1 | how-monsters-find-you | ok — an eye and flesh atlas, legible, matches the eye the note names |
| 2026-09-30 | mapped/the-cart-and-its-boost-pads-cart.jpg | PORTABLE CART_Cart Base.001_BaseColor | the-cart-and-its-boost-pads | ok — a cart atlas with the blue pads and the beam tank visible |

| 2026-09-30 | mapped/enemies-and-their-behaviour-bombthrower.png | Enemy Bomb Thrower BaseColor (Screaming) | enemies-and-their-behaviour | ok — the pink flesh with the screaming faces and the yellow cloth; legible, matches the monster the note names |
| 2026-09-30 | mapped/valuables-and-looting-egg.png | Egg 2 | valuables-and-looting | ok — a green and yellow creature face on a sunburst; an egg valuable with a face, which is what the game ships under this name |
| 2026-09-30 | mapped/cosmetics-and-the-token-machine-token.jpg | CosmeticShopToken_Basecolor_Rare | cosmetics-and-the-token-machine | ok — the magenta token with its two faces; legible, matches the rare colouring the note names |
| 2026-09-30 | mapped/the-truck-and-the-end-of-a-run-healer.jpg | Truck Healer_DefaultMaterial_BaseColor | the-truck-and-the-end-of-a-run | ok — the grey healer housing with its hazard stripes and green core; legible |
| 2026-09-30 | mapped/valuables-that-fight-back-gumball.jpg | Gumball basecolor | valuables-that-fight-back | ok — the red and white gumball machine; legible, matches the trap valuable |
| 2026-09-30 | mapped/extraction-run-point.jpg | extraction point_DefaultMaterial_BaseColor | extraction-run | ok — the large extraction point sheet with its blue machinery; legible |
| 2026-09-30 | mapped/how-upgrades-are-kept-track-of-upgradestand.jpg | Upgrade Stand_DefaultMaterial_BaseColor | how-upgrades-are-kept-track-of | ok with a note — dark blue and hard to read as an object, but the panel structure is visible and this is the stand the entry describes |

| 2026-09-30 | mapped/moving-loot-and-gear-crate.png | Crate_DefaultMaterial_BaseColor | moving-loot-and-gear | ok — a wooden crate with visible planks and corner battens; legible |
| 2026-09-30 | mapped/enemies-and-their-behaviour-duck.png | Duck monster_BaseColor | enemies-and-their-behaviour | ok — the yellow and red duck monster; legible, matches the monster the note names |
| 2026-09-30 | mapped/gear-you-carry-walkie.png | Walkie_Basecolor RED | gear-you-carry | ok — the red walkie-talkie sheet; legible, and the same asset the walkie-talkie entry maps under its own record |
| 2026-09-30 | mapped/cosmetics-and-the-token-machine-hat.jpg | Witch hat_Albedo | cosmetics-and-the-token-machine | ok with a note — a very light sheet, but the crown and brim of the hat are visible in the shading, so it is a hat rather than a blank export |
| 2026-09-30 | mapped/stunning-instead-of-killing-baton.jpg | Stun baton_DefaultMaterial_BaseColor | stunning-instead-of-killing | ok — the grey baton with its green stripe; legible |
| 2026-09-30 | mapped/carts-grabbing-and-physics-handle.jpg | cart handle_DefaultMaterial_BaseColor | carts-grabbing-and-physics | ok with a note — dark, but the handle geometry and its fasteners can be made out, and it is the handle the entry describes |
| 2026-09-30 | mapped/health-and-recovery-pack.jpg | health pack small_DefaultMaterial_BaseColor | health-and-recovery | ok — the grey and white pack with its vents, straps and panels; legible |

| 2026-09-30 | mapped/levels-and-the-way-out-door.jpg | Shop Door | levels-and-the-way-out | ok — the purple shop door with its handle and hinges; legible |
| 2026-09-30 | mapped/protecting-your-loot-locker.jpg | locker_Material_BaseColor | protecting-your-loot | ok with a note — dark navy lockers, but the door seams, vents and handles are visible |
| 2026-09-30 | mapped/reading-a-monster-before-it-reaches-you-face.jpg | Headman Face_Albedo | reading-a-monster-before-it-reaches-you | ok — the face, ear and eye areas of the headman texture; legible and exactly what the note claims |
| 2026-09-30 | mapped/staying-in-touch-with-the-crew-radio.jpg | Radio_BaseColor | staying-in-touch-with-the-crew | ok — the radio's parts sheet: casing, dial faces, grille and panels; legible |
| 2026-09-30 | mapped/the-museum-and-its-props-painting.jpg | Museum Painting H 01 | the-museum-and-its-props | ok — a painted landscape with trees and sea; legible, a museum picture rather than a texture of a surface |
| 2026-09-30 | mapped/the-shop-between-runs-depot.jpg | Truck Depot_DefaultMaterial_BaseColor | the-shop-between-runs | ok — the depot sheet with its structures, signs and hazard stripes; legible |
| 2026-09-30 | mapped/weapons-you-can-bring-guns.jpg | Guns_DefaultMaterial_BaseColor | weapons-you-can-bring | ok — the guns sheet with its barrels, grips and scopes; legible |

| 2026-09-30 | mapped/when-a-monster-has-you-bite.jpg | Headman Mouth Bite Albedo | when-a-monster-has-you | ok — the mouth's plates and teeth in maroon and cream; legible as the texture it is |
| 2026-09-30 | mapped/what-being-grabbed-feels-like-grabber.jpg | HeadGrabberBaseColor | what-being-grabbed-feels-like | ok — the grabber's pieced skin texture; legible, matches the monster the note names |
| 2026-09-30 | mapped/the-cart-laser-cannon.jpg | laser cannon_DefaultMaterial_BaseColor | the-cart-laser | ok — the cannon sheet with its housing, hazard stripes and lens ring; legible |
| 2026-09-30 | mapped/the-leaf-blower-blower.jpg | leafblower_DefaultMaterial_BaseColor | the-leaf-blower | ok — the worn green and rust blower sheet with its nozzle and housing; legible |
| 2026-09-30 | mapped/melee-weapons-sword.jpg | Sword_Albedo | melee-weapons | ok — the blade, guard and grip materials; legible |
| 2026-09-30 | mapped/guns-and-how-they-fire-lasergun.jpg | laser gun_DefaultMaterial_BaseColor | guns-and-how-they-fire | ok — the gun sheet with its striped housing, sights and grip; legible |
| 2026-09-30 | mapped/the-exploding-rubber-duck-duck.jpg | rubber duck_DefaultMaterial_BaseColor | the-exploding-rubber-duck | ok with a note — a mostly flat yellow sheet, which is what a rubber duck looks like: the eyes, beak and leg are the readable parts |
| 2026-09-30 | mapped/the-spinny-texture.jpg | Spinny_Albedo | the-spinny | ok with a note — the game's own colour sheet for the spinny: a mottled grey-brown atlas with a few distinctly coloured patches (a pink star, orange and brown wedges) and dark spots. It is an atlas rather than a portrait, and the low spread is the mottled ground; it is the game's own picture for this monster, so it is kept |
| 2026-09-30 | mapped/the-elsa-in-two-sizes-fur.jpg | Elsa Fur Big | the-elsa-in-two-sizes | ok with a note — a small 64x64 greyscale fur card (a tuft of fur on a dark field), the game's own fur picture for the big size; kept because it is exactly the subject the entry names, with the size recorded here |
| 2026-09-30 | mapped/the-money-head-in-the-museum-head.jpg | moneyhead grungle_DefaultMaterial_BaseColor | the-money-head-in-the-museum | ok with a note — a blue-grey atlas for the prop: a blotched face area with dark eye and mouth sockets in the upper half and flat UV bands below. It is an atlas rather than a portrait, but it is the game's own colour texture for this prop and was not flagged by the sanity pass |
| 2026-09-30 | mapped/the-bomb-and-its-fuse-body.jpg | bang_DefaultMaterial_BaseColor | the-bomb-and-its-fuse | ok — the game's own colour atlas for the monster that carries the bomb: pale bone-white skull faces with black eye sockets and mouths plus a red and a blue panel area. An atlas rather than a portrait, but it is the game's own picture of the creature, and it lets this entry move from a picture-less note to a real entry page |
| 2026-09-30 | (removed) the-bomb-and-its-fuse-glow.jpg | bang_DefaultMaterial_Emissive | the-bomb-and-its-fuse | **rejected** — the emissive map for the same monster: a black sheet with six tiny yellow dots (2.2 KB). Near-blank and featureless, so the mapping and the file were deleted and the manifest regenerated; the entry keeps the colour texture instead |
| 2026-09-30 | mapped/the-traffic-light-valuable-light.jpg | TrafficLightBaseColor | the-traffic-light-valuable | ok with a note — the game's own sheet for the light: blue and yellow stripes, spray-painted hearts, stars and tags on grey, with dark blotches where the casing and lenses sit. An atlas rather than a picture of the object, but it is the valuable's own colouring and was not flagged |
| 2026-09-30 | mapped/the-baby-head-valuable-head.jpg | babyhead_Material.007_BaseColor | the-baby-head-valuable | ok with a note — the head's own sheet: skin tones with an eye and brow at the top, a mouth below and part of a hand to the right. An atlas of features rather than a portrait, but it is the valuable's own colouring and was not flagged |
| 2026-09-30 | mapped/the-egg-valuable-that-cracks-egg.jpg | Egg 3 | the-egg-valuable-that-cracks | ok with a note — one of the egg textures: a decorated shell in orange, yellow and green patches with a cartoon face painted on it. An atlas of the shell rather than a portrait, but it is the valuable's own skin and it was not flagged |
| 2026-09-30 | mapped/the-blender-valuable-body.jpg | blender disembled (no glass)_DefaultMaterial_BaseColor | the-blender-valuable | ok with a note — the blender body's own sheet: red and white parts with the buttons, a dial and the jug shape, plus a yellow piece at one corner. An atlas rather than a picture of the machine, but it is the valuable's own colouring and was not flagged |

Five review batches are recorded in the table above, and none of them rejected a picture. A later pass did, and that rejection is recorded below. The manifest is regenerated whenever a mapping changes and currently holds 113 records; reports/image-coverage.md carries the current count and each picture's entry.

Rejected in a later pass: `Headman Eye Sockets`, mapped for a new entry about how a monster's eyes move. Opened for review it turned out to be a near-blank dark maroon band with nothing readable on it, so the mapping and the file were deleted and the manifest regenerated (108 records). The entry was not written with that picture; the subject waits for a legible one.

## Sanity pass before the eye check (tools/image-sanity.py)

`tools/image-sanity.py` measures every exported file first: greyscale, with transparent pictures composited on the dark page background, flagging a file when it carries almost no variation (stddev below 12) or when more than 90% of its pixels sit within 6 of the median. The run for this build flagged 4 of 113 records:

- **moving-loot-and-gear-crate.png** (stddev 10.3) — the wooden crate sheet, already opened above: planks and battens are visible, the low spread is because the wood is one tone. Kept.
- **when-the-chat-box-will-not-open-emojis.jpg** (90%) — the emoji sheet the game uses with its chat box; the emoji sit on the game's own black field. Kept.
- **the-boombox-valuable-lights.png** (93%) — an emissive map, so it is nearly black by nature, and the entry is explicitly about that map (its bright spots are the speakers the game lights). Rather than drop it, the entry now also carries the game's colour texture for the same item, `the-boombox-valuable-texture.jpg`, so the reader sees the case and the light map together; the light map is kept because it is the subject the entry describes.
- **the-spinny-texture.jpg** (stddev 10.2) — the colour sheet for the monster the new entry describes: a mottled grey-brown atlas with a few distinctly coloured patches and dark spots. Opened above; the spread is low because the sheet is mostly mottled fur, so it is kept with that caveat recorded rather than dropped.

The run is written to `reports/image-sanity.md` on every build; a flag is a request for a look, not a verdict.
