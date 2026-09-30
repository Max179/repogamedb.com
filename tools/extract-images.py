#!/usr/bin/env python3
"""Extract only the game images whose mapping to a player-facing entity is confirmed, and record that mapping."""
import os, json, hashlib
import UnityPy
ROOT = r'C:/Users/CHEN/Desktop/repo/data/raw/R.E.P.O.v0.4.0/REPO/REPO_Data'
OUT_DIR = os.path.join('content', 'assets', 'mapped')
MANIFEST = os.path.join('content', 'images-manifest.json')
MAPPINGS = [
  {'entity': 'moving-loot-and-gear', 'bundle': 'resources.assets', 'match': 'Crate_DefaultMaterial_BaseColor', 'file': 'moving-loot-and-gear-crate.png', 'note': 'albedo texture of a crate used to move stock in the game'},
  {'entity': 'enemies-and-their-behaviour', 'bundle': 'resources.assets', 'match': 'Enemy Bomb Thrower BaseColor (Screaming)', 'file': 'enemies-and-their-behaviour-bombthrower.png', 'note': 'albedo texture named for the game bomb-throwing monster'},
  {'entity': 'enemies-and-their-behaviour', 'bundle': 'resources.assets', 'match': 'Duck monster_BaseColor', 'file': 'enemies-and-their-behaviour-duck.png', 'note': 'albedo texture of another monster kind the enemies entry describes'},
  {'entity': 'valuables-and-looting', 'bundle': 'resources.assets', 'match': 'Egg 2', 'file': 'valuables-and-looting-egg.png', 'note': 'texture of an egg-shaped valuable'},
  {'entity': 'valuables-and-looting', 'bundle': 'sharedassets0.assets', 'match': 'Coin Albedo', 'file': 'valuables-and-looting-coin.png', 'note': 'albedo texture of a coin valuable, taken from the shared assets of the game'},
  {'entity': 'gear-you-carry', 'bundle': 'resources.assets', 'match': 'Walkie_Basecolor RED', 'file': 'gear-you-carry-walkie.png', 'note': 'albedo texture of the walkie-talkie item the entry cites'},
  {'entity': 'cosmetics-and-the-token-machine', 'bundle': 'resources.assets', 'match': 'CosmeticShopToken_Basecolor_Rare',
   'file': 'cosmetics-and-the-token-machine-token.jpg', 'note': 'the game token the cosmetic machine dispenses, in its rare colouring',
   'max': 1024, 'quality': 84},
  {'entity': 'cosmetics-and-the-token-machine', 'bundle': 'resources.assets', 'match': 'Witch hat_Albedo',
   'file': 'cosmetics-and-the-token-machine-hat.jpg', 'note': 'albedo texture of one wearable cosmetic the game ships',
   'max': 1024, 'quality': 84},
  {'entity': 'stunning-instead-of-killing', 'bundle': 'resources.assets', 'match': 'Stun baton_DefaultMaterial_BaseColor',
   'file': 'stunning-instead-of-killing-baton.jpg', 'note': 'albedo texture of the stun baton the game ships',
   'max': 1024, 'quality': 84},
  {'entity': 'the-cart-and-its-boost-pads', 'bundle': 'resources.assets', 'match': 'PORTABLE CART_Cart Base.001_BaseColor',
   'file': 'the-cart-and-its-boost-pads-cart.jpg', 'note': 'albedo texture of the portable cart the crew hauls loot with',
   'max': 1024, 'quality': 84},
  {'entity': 'your-avatar-and-where-it-is-shown', 'bundle': 'sharedassets0.assets', 'match': 'PlayerAvatar_Albedo',
   'file': 'your-avatar-and-where-it-is-shown-avatar.jpg', 'note': 'albedo texture of the player character whose parts cosmetics are laid over',
   'max': 1024, 'quality': 84},
  {'entity': 'the-truck-and-the-end-of-a-run', 'bundle': 'resources.assets', 'match': 'Truck Healer_DefaultMaterial_BaseColor',
   'file': 'the-truck-and-the-end-of-a-run-healer.jpg', 'note': 'albedo texture of the truck healer the crew recovers in',
   'max': 1024, 'quality': 84},
  {'entity': 'valuables-that-fight-back', 'bundle': 'resources.assets', 'match': 'Gumball basecolor',
   'file': 'valuables-that-fight-back-gumball.jpg', 'note': 'albedo texture of a gumball machine valuable, one of the trap valuables the entry describes',
   'max': 1024, 'quality': 84},
  {'entity': 'carts-grabbing-and-physics', 'bundle': 'resources.assets', 'match': "cart handle_DefaultMaterial_BaseColor",
   'file': 'carts-grabbing-and-physics-handle.jpg', 'note': "base colour texture of the cart handle the crew grabs", 'max': 1024, 'quality': 84},
  {'entity': 'choosing-when-to-leave', 'bundle': 'resources.assets', 'match': "Grandfather Clock_Albedo",
   'file': 'choosing-when-to-leave-clock.jpg', 'note': "albedo texture of the shop clock the run is measured against", 'max': 1024, 'quality': 84},
  {'entity': 'enemies-that-move-differently', 'bundle': 'resources.assets', 'match': "Gnome_Albedo",
   'file': 'enemies-that-move-differently-gnome.jpg', 'note': "albedo texture of the gnome monster, one of the enemies that moves unlike the others", 'max': 1024, 'quality': 84},
  {'entity': 'extraction-run', 'bundle': 'resources.assets', 'match': "extraction point_DefaultMaterial_BaseColor",
   'file': 'extraction-run-point.jpg', 'note': "base colour texture of the extraction point itself", 'max': 1024, 'quality': 84},
  {'entity': 'health-and-recovery', 'bundle': 'resources.assets', 'match': "health pack small_DefaultMaterial_BaseColor",
   'file': 'health-and-recovery-pack.jpg', 'note': "base colour texture of the small health pack the crew carries", 'max': 1024, 'quality': 84},
  {'entity': 'how-a-level-is-put-together', 'bundle': 'sharedassets0.assets', 'match': "level manor 01",
   'file': 'how-a-level-is-put-together-level.jpg', 'note': "one of the game own level theme textures, named for the manor theme the generator assembles", 'max': 1024, 'quality': 84},
  {'entity': 'how-monsters-find-you', 'bundle': 'resources.assets', 'match': "Enemy_Ceiling Eye_Albedo Engn 1",
   'file': 'how-monsters-find-you-eye.jpg', 'note': "albedo texture of a monster eye, the part the game uses for sensing", 'max': 1024, 'quality': 84},
  {'entity': 'how-upgrades-are-kept-track-of', 'bundle': 'resources.assets', 'match': "Upgrade Stand_DefaultMaterial_BaseColor",
   'file': 'how-upgrades-are-kept-track-of-upgradestand.jpg', 'note': "base colour texture of the upgrade stand the entry describes", 'max': 1024, 'quality': 84},
  {'entity': 'levels-and-the-way-out', 'bundle': 'resources.assets', 'match': "Shop Door",
   'file': 'levels-and-the-way-out-door.jpg', 'note': "the game own shop door texture, the way back out of a level start", 'max': 1024, 'quality': 84},
  {'entity': 'protecting-your-loot', 'bundle': 'resources.assets', 'match': "locker_Material_BaseColor",
   'file': 'protecting-your-loot-locker.jpg', 'note': "base colour texture of the locker loot can be shut away in", 'max': 1024, 'quality': 84},
  {'entity': 'reading-a-monster-before-it-reaches-you', 'bundle': 'resources.assets', 'match': "Headman Face_Albedo",
   'file': 'reading-a-monster-before-it-reaches-you-face.jpg', 'note': "albedo texture of one of the monster faces the entry says to read", 'max': 1024, 'quality': 84},
  {'entity': 'staying-in-touch-with-the-crew', 'bundle': 'resources.assets', 'match': "Radio_BaseColor",
   'file': 'staying-in-touch-with-the-crew-radio.jpg', 'note': "base colour texture of the radio the crew uses to talk", 'max': 1024, 'quality': 84},
  {'entity': 'the-museum-and-its-props', 'bundle': 'resources.assets', 'match': "Museum Painting H 01",
   'file': 'the-museum-and-its-props-painting.jpg', 'note': "one of the paintings the game places in the museum level", 'max': 1024, 'quality': 84},
  {'entity': 'the-shop-between-runs', 'bundle': 'resources.assets', 'match': "Truck Depot_DefaultMaterial_BaseColor",
   'file': 'the-shop-between-runs-depot.jpg', 'note': "base colour texture of the depot the shop sits in between runs", 'max': 1024, 'quality': 84},
  {'entity': 'weapons-you-can-bring', 'bundle': 'resources.assets', 'match': "Guns_DefaultMaterial_BaseColor",
   'file': 'weapons-you-can-bring-guns.jpg', 'note': "base colour texture of the guns the crew can buy and carry", 'max': 1024, 'quality': 84},
  {'entity': 'when-a-monster-has-you', 'bundle': 'resources.assets', 'match': "Headman Mouth Bite Albedo",
   'file': 'when-a-monster-has-you-bite.jpg', 'note': "albedo texture of the monster mouth that grabs a player", 'max': 1024, 'quality': 84},
  {'entity': 'what-being-grabbed-feels-like', 'bundle': 'resources.assets', 'match': "HeadGrabberBaseColor",
   'file': 'what-being-grabbed-feels-like-grabber.jpg', 'note': "albedo texture of the head-grabber monster, the enemy that takes hold of a player", 'max': 1024, 'quality': 84},
  {'entity': 'the-upgrades-you-find', 'bundle': 'resources.assets', 'match': "Upgrade_Energy_Albedo",
   'file': 'the-upgrades-you-find-energy.jpg', 'note': 'albedo texture of one of the player upgrades the game ships', 'max': 512, 'quality': 88},
  {'entity': 'what-the-map-shows-you', 'bundle': 'resources.assets', 'match': "valuabless_Valuable Map_BaseColor",
   'file': 'what-the-map-shows-you-valuablemap.jpg', 'note': "base colour texture of the map marker the crew map uses for valuables", 'max': 512, 'quality': 88},
  {'entity': 'when-the-chat-box-will-not-open', 'bundle': 'sharedassets0.assets', 'match': "emojis",
   'file': 'when-the-chat-box-will-not-open-emojis.jpg', 'note': "the sheet of emoji the game uses with its chat box", 'max': 1024, 'quality': 84},
]
os.makedirs(OUT_DIR, exist_ok=True)
records = []
for m in MAPPINGS:
    path = os.path.join(ROOT, m['bundle'])
    if not os.path.exists(path):
        print('  MISSING BUNDLE ' + path); continue
    env = UnityPy.load(path)
    done = False
    for o in env.objects:
        if o.type.name != 'Texture2D':
            continue
        try:
            d = o.read(); name = getattr(d, 'm_Name', '') or ''
        except Exception:
            continue
        if name != m['match']:
            continue
        dest = os.path.join(OUT_DIR, m['file'])
        img = d.image
        # Keep the image faithful but web-sized, and record the size actually written.
        cap = m.get('max')
        if cap and max(img.size) > cap:
            scale = cap / float(max(img.size))
            img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))))
        if m['file'].lower().endswith(('.jpg', '.jpeg')):
            img.convert('RGB').save(dest, quality=m.get('quality', 85), optimize=True)
        else:
            img.save(dest)
        raw = open(dest, 'rb').read()
        records.append({'entity': m['entity'], 'kind': 'game', 'file': 'mapped/' + m['file'], 'sourceBundle': m['bundle'],
                        'assetName': name, 'note': m['note'], 'width': img.width, 'height': img.height,
                        'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
        print('  exported %-40s %dx%d %d bytes sha256=%s' % (m['file'], img.width, img.height, len(raw), records[-1]['sha256'][:12]))
        done = True; break
    if not done:
        print('  no asset matched ' + m['match'])
json.dump({'source': ROOT, 'records': records}, open(MANIFEST, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('wrote %s with %d record(s)' % (MANIFEST, len(records)))