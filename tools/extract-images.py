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
  {'entity': 'the-cart-laser', 'bundle': 'resources.assets', 'match': "laser cannon_DefaultMaterial_BaseColor",
   'file': 'the-cart-laser-cannon.jpg', 'note': 'the base colour texture of the laser fitted to the cart', 'max': 512, 'quality': 88},
  {'entity': 'the-leaf-blower', 'bundle': 'resources.assets', 'match': "leafblower_DefaultMaterial_BaseColor",
   'file': 'the-leaf-blower-blower.jpg', 'note': 'the base colour texture of the leaf blower the crew carries', 'max': 512, 'quality': 88},
  {'entity': 'melee-weapons', 'bundle': 'resources.assets', 'match': "Sword_Albedo",
   'file': 'melee-weapons-sword.jpg', 'note': 'the albedo texture of one of the melee weapons the game ships', 'max': 512, 'quality': 88},
  {'entity': 'guns-and-how-they-fire', 'bundle': 'resources.assets', 'match': "laser gun_DefaultMaterial_BaseColor",
   'file': 'guns-and-how-they-fire-lasergun.jpg', 'note': 'the base colour texture of the laser gun the game ships', 'max': 512, 'quality': 88},
  {'entity': 'the-exploding-rubber-duck', 'bundle': 'resources.assets', 'match': "rubber duck_DefaultMaterial_BaseColor",
   'file': 'the-exploding-rubber-duck-duck.jpg', 'note': 'the base colour texture of the rubber duck item', 'max': 512, 'quality': 88},
  {'entity': 'the-ladder', 'bundle': 'resources.assets', 'match': "ladder_DefaultMaterial_BaseColor",
   'file': 'the-ladder-ladder.jpg', 'note': 'the base colour texture of the extending ladder the crew carries', 'max': 512, 'quality': 88},
  {'entity': 'the-shop-radio', 'bundle': 'resources.assets', 'match': "Boombox_DefaultMaterial_BaseColor",
   'file': 'the-shop-radio-boombox.jpg', 'note': 'the base colour texture of the music player in the shop', 'max': 512, 'quality': 88},
  {'entity': 'the-revive-item', 'bundle': 'resources.assets', 'match': "reviver_DefaultMaterial_BaseColor",
   'file': 'the-revive-item-reviver.jpg', 'note': 'the base colour texture of the revive item the crew carries', 'max': 1024, 'quality': 84},
  {'entity': 'the-cart-cannon', 'bundle': 'resources.assets', 'match': "cannon_DefaultMaterial_BaseColor",
   'file': 'the-cart-cannon-cannon.jpg', 'note': 'the base colour texture of the cannon that fits the cart', 'max': 512, 'quality': 88},
  {'entity': 'the-valuable-tracker', 'bundle': 'resources.assets', 'match': "valuable tracker_DefaultMaterial_BaseColor",
   'file': 'the-valuable-tracker-device.jpg', 'note': 'the base colour texture of the valuable tracker the crew carries', 'max': 512, 'quality': 88},
  {'entity': 'the-orb', 'bundle': 'resources.assets', 'match': "Item Orb_Albedo",
   'file': 'the-orb-orb.jpg', 'note': 'albedo texture of the orb the crew can carry', 'max': 512, 'quality': 88},
  {'entity': 'the-valuables-you-can-find', 'bundle': 'resources.assets', 'match': "lots of valuables_Valuable Crystal Ball Glass_BaseColor",
   'file': 'the-valuables-you-can-find-crystal.jpg', 'note': 'the base colour texture of one of the valuable families the game ships', 'max': 512, 'quality': 88},
  {'entity': 'the-level-themes-and-what-they-hold', 'bundle': 'resources.assets', 'match': "Valuable Arctic Laptop_DefaultMaterial_BaseColor",
   'file': 'the-level-themes-and-what-they-hold-arctic.jpg', 'note': 'the base colour texture of a valuable belonging to one of the level themes', 'max': 512, 'quality': 88},
  {'entity': 'the-save-and-your-run-record', 'bundle': 'sharedassets0.assets', 'match': "result screen_truck background",
   'file': 'the-save-and-your-run-record-background.jpg', 'note': 'the background the game itself uses for its end-of-run result screen', 'max': 1024, 'quality': 86},
  {'entity': 'batteries-and-charging', 'bundle': 'resources.assets', 'match': "Charging station new_DefaultMaterial_BaseColor",
   'file': 'batteries-and-charging-station.jpg', 'note': 'base colour texture of the charging station the crew can use', 'max': 1024, 'quality': 84},
  {'entity': 'the-staffs', 'bundle': 'resources.assets', 'match': "Antigrav Staff_Albedo",
   'file': 'the-staffs-antigrav.jpg', 'note': 'albedo texture of one of the staffs the crew can bring', 'max': 512, 'quality': 88},
  {'entity': 'the-drone', 'bundle': 'resources.assets', 'match': "Drone",
   'file': 'the-drone-drone.jpg', 'note': 'albedo texture of the drone the crew can deploy', 'max': 512, 'quality': 88},
  {'entity': 'keycards-and-the-office', 'bundle': 'resources.assets', 'match': "shop office keycard_DefaultMaterial_BaseColor",
   'file': 'keycards-and-the-office-keycard.jpg', 'note': 'the base colour texture of the office keycard the shop uses', 'max': 512, 'quality': 88},
  {'entity': 'what-a-monster-is-doing', 'bundle': 'resources.assets', 'match': "Enemy_Robe_Albedo",
   'file': 'what-a-monster-is-doing-robe.jpg', 'note': 'albedo texture of one of the monsters whose states the entry describes', 'max': 512, 'quality': 88},
  {'entity': 'the-upgrades-you-find', 'bundle': 'resources.assets', 'match': "Upgrade_Energy_Albedo",
   'file': 'the-upgrades-you-find-energy.jpg', 'note': 'albedo texture of one of the player upgrades the game ships', 'max': 512, 'quality': 88},
  {'entity': 'what-the-map-shows-you', 'bundle': 'resources.assets', 'match': "valuabless_Valuable Map_BaseColor",
   'file': 'what-the-map-shows-you-valuablemap.jpg', 'note': "base colour texture of the map marker the crew map uses for valuables", 'max': 512, 'quality': 88},
  {'entity': 'when-the-chat-box-will-not-open', 'bundle': 'sharedassets0.assets', 'match': "emojis",
   'file': 'when-the-chat-box-will-not-open-emojis.jpg', 'note': "the sheet of emoji the game uses with its chat box", 'max': 1024, 'quality': 84},
  {'entity': 'the-wizard-valuables', 'bundle': 'resources.assets', 'match': "Valuable Wizard Time Glass NEW_DefaultMaterial_BaseColor", 'file': 'the-wizard-valuables-hourglass.jpg', 'note': "the colour texture the game ships for the wizard's time glass valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-wizard-valuables', 'bundle': 'resources.assets', 'match': "Valuable Wizard Cube of Knowledge_DefaultMaterial_BaseColor", 'file': 'the-wizard-valuables-cube.jpg', 'note': "the colour texture the game ships for the wizard's cube of knowledge valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-wizard-valuables', 'bundle': 'resources.assets', 'match': "Valuable Wizard Sword_DefaultMaterial_BaseColor", 'file': 'the-wizard-valuables-sword.jpg', 'note': "the colour texture the game ships for the wizard's sword valuable", 'max': 512, 'quality': 88},
  {'entity': 'mines-traps-and-lasers', 'bundle': 'resources.assets', 'match': "Explosive mine_DefaultMaterial_BaseColor", 'file': 'mines-traps-and-lasers-mine.jpg', 'note': "the colour texture the game ships for an explosive mine found in a level", 'max': 512, 'quality': 88},
  {'entity': 'mines-traps-and-lasers', 'bundle': 'resources.assets', 'match': "Stun trap_DefaultMaterial_BaseColor", 'file': 'mines-traps-and-lasers-trap.jpg', 'note': "the colour texture the game ships for a stun trap", 'max': 512, 'quality': 88},
  {'entity': 'healing-at-the-truck', 'bundle': 'resources.assets', 'match': "Truck Healer_DefaultMaterial_BaseColor", 'file': 'healing-at-the-truck-healer.jpg', 'note': "the colour texture the game ships for the healer in the truck", 'max': 512, 'quality': 88},
  {'entity': 'the-floater', 'bundle': 'resources.assets', 'match': "enemy floater_Material_BaseColor", 'file': 'the-floater-texture.jpg', 'note': "the colour texture the game ships for the floater monster", 'max': 512, 'quality': 88},
  {'entity': 'running-a-gun-dry', 'bundle': 'resources.assets', 'match': "shotgun_DefaultMaterial_BaseColor", 'file': 'running-a-gun-dry-shotgun.jpg', 'note': "the colour texture the game ships for one of its guns", 'max': 512, 'quality': 88},
]
os.makedirs(OUT_DIR, exist_ok=True)
records = []
# Loading a bundle is by far the slowest part of this script, and mappings are grouped by bundle, so the
# loaded environment is cached per file. Reading the same bundle once per mapping made long runs exceed their time
# limit and could leave the manifest written from a partial run.
_env_cache = {}
for m in MAPPINGS:
    path = os.path.join(ROOT, m['bundle'])
    if not os.path.exists(path):
        print('  MISSING BUNDLE ' + path); continue
    if path not in _env_cache:
        _env_cache[path] = UnityPy.load(path)
    env = _env_cache[path]
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