# Image mapping audit — repogamedb.com

Why some entries carry a diagram and not a picture from the game.

**Method.** Every texture name in the readable bundles was enumerated with UnityPy
(`resources.assets` 2,207; `sharedassets0.assets` 306; `sharedassets1.assets` and `sharedassets2.assets` hold no
Texture2D in this build). Candidate names were searched for each subject a remaining diagram-only entry describes.
A mapping is only added when the texture **name states the subject** *and* the exported file is opened and shows
that subject.

## What is mapped

120 records in `content/images-manifest.json`, covering **104 of 142** published entries. Each record carries the
source bundle, asset name, byte count, dimensions and sha256, and a gate re-checks all four against the file on disk.

## What is not mapped, and why

The **38** diagram-only entries fall into three groups. None of them is a backlog item.

### 1. Nothing in the build depicts the subject — 30 entries

These describe behaviour, rules, records or screens. There is no texture of "how a monster sees you" or of "how a
run is scored", and the content rules forbid giving an entry a filler picture, so a diagram is the correct tier:

`choosing-when-to-leave`, `drifting-a-vehicle`, `driving-a-vehicle-and-staying-upright`, `glossary-of-terms`,
`hitting-things-with-a-vehicle`, `how-a-monster-sees-you`, `how-a-monster-takes-damage`, `how-a-run-is-scored`,
`how-a-vehicles-body-follows-its-physics`, `how-many-monsters-a-level-sends`, `how-many-valuables-a-level-holds`,
`how-monsters-jump`, `how-your-own-condition-is-shown`, `leaving-the-ground-in-a-vehicle`,
`questions-players-ask`, `the-body-every-monster-shares`, `the-lobby-and-spectating`, `the-music-of-a-level`,
`the-numbers-that-float-over-things`, `the-player-list-and-what-a-row-shows`, `the-readouts-that-fade-away`,
`the-readouts-you-play-by`, `the-record-every-monster-is-given`, `what-a-monster-does-when-it-has-not-seen-you`,
`what-being-grabbed-does-to-your-view`, `what-decides-whether-a-monster-appears`,
`what-happens-when-the-head-catches-you`, `what-the-game-draws-when-you-find-something`,
`what-the-game-records-about-each-monster`, `which-version-this-site-documents`

### 2. The subject is concrete but the texture does not exist — 3 entries

| Entry | Searched for | Result |
| --- | --- | --- |
| `the-gnomes-and-the-pickaxe` | `pickaxe` | **0 textures.** A gnome texture exists but is already mapped to `enemies-that-move-differently`; no pickaxe texture exists at all. |
| `the-bullet-and-what-it-leaves-behind` | `bullet`, `projectile` | **0 textures.** The bullet is an object with behaviour but has no texture of its own in these bundles. |
| `the-hidden` | `hidden` | No texture; the entry describes a spawn rule rather than an object. |

### 3. A texture exists but it would not read as the subject — 5 entries

A matching name is not enough: the file has to be opened.

| Entry | Texture considered | Why it is not used |
| --- | --- | --- |
| `the-box-that-holds-valuables` | `Safe_BaseColor` | The entry describes a **box**; the only container texture is a **safe**. Not the same object. |
| `the-heads-eyes-hair-and-teeth` | `Hair`, `eyebrows`, `Headman Eye Sockets`, `Teeth Bot - Albedo` | Generic names. Nothing ties `Hair` to the head this entry describes rather than to the player avatar, so the mapping cannot be confirmed. |
| `what-the-shop-puts-out` | `Shop Cash register` | The entry is about the stock pools the shop chooses from, not the register. |
| `the-things-that-are-not-loot` | `props_Material_BaseColor`, `shop prop candy shelves_DefaultMaterial_BaseColor` | "Props" is a catch-all sheet; it does not show the class of objects the entry is about. |
| `the-cart-as-an-object` | `PORTABLE CART_Cart Base.001_BaseColor`, `cart handle_DefaultMaterial_BaseColor` | Both cart textures are **already mapped** to `the-cart-and-its-boost-pads` and `carts-grabbing-and-physics`. Reusing one would put the same picture on three pages. |

### Recorded from the other sites

The same rule produced one rejection on supermarketsimulator.wiki: `T_PaperBag_alb` was exported, **opened**, and
rejected as a near-uniform tan field (stddev 2.5). Every `T_PaperBag_*` texture is a material map, so no picture of
a bag exists there either. The mapping was deleted and the entry returned to diagram-only.

## The rule this audit applies

A mapping is evidence only when the texture name states the subject **and** opening the file shows that subject.
Where either half fails, the entry keeps its diagram, which its page labels as an original illustration rather than
a screenshot. **No entry is given a picture to make it look finished.**
