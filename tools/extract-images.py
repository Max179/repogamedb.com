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