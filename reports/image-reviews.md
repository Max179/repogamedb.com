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

Nothing in this batch was rejected, so no mapping or file was removed and the entry set is unchanged.
