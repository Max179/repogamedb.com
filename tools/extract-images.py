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

  {'entity': 'enemies-that-move-differently', 'bundle': 'resources.assets', 'match': "Gnome_Albedo",
   'file': 'enemies-that-move-differently-gnome.jpg', 'note': "albedo texture of the gnome monster, one of the enemies that moves unlike the others", 'max': 1024, 'quality': 84},
  {'entity': 'extraction-run', 'bundle': 'resources.assets', 'match': "extraction point_DefaultMaterial_BaseColor",
   'file': 'extraction-run-point.jpg', 'note': "base colour texture of the extraction point itself", 'max': 1024, 'quality': 84},
  {'entity': 'health-and-recovery', 'bundle': 'resources.assets', 'match': "health pack small_DefaultMaterial_BaseColor",
   'file': 'health-and-recovery-pack.jpg', 'note': "base colour texture of the small health pack the crew carries", 'max': 1024, 'quality': 84},
  {'entity': 'how-a-level-is-put-together', 'bundle': 'sharedassets0.assets', 'match': "level manor 01",
   'file': 'how-a-level-is-put-together-level.jpg', 'note': "the game's own manor picture, shipped under the name of the level theme the generator assembles", 'max': 1024, 'quality': 84},
  {'entity': 'how-monsters-find-you', 'bundle': 'resources.assets', 'match': "Enemy_Ceiling Eye_Albedo Engn 1",
   'file': 'how-monsters-find-you-eye.jpg', 'note': "albedo texture of a monster eye", 'max': 1024, 'quality': 84},
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
  {'entity': 'the-money-head-in-the-museum', 'bundle': 'resources.assets', 'match': "moneyhead grungle_DefaultMaterial_BaseColor", 'file': 'the-money-head-in-the-museum-head.jpg', 'note': "the colour texture the game ships for the money-head museum prop", 'max': 512, 'quality': 88},
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
  {'entity': 'the-shop-radio', 'bundle': 'resources.assets', 'match': "Boombox_DefaultMaterial_BaseColor",
   'file': 'the-shop-radio-boombox.jpg', 'note': 'the base colour texture of the music player in the shop', 'max': 512, 'quality': 88},
  {'entity': 'the-revive-item', 'bundle': 'resources.assets', 'match': "reviver_DefaultMaterial_BaseColor",
   'file': 'the-revive-item-reviver.jpg', 'note': 'the base colour texture of the revive item the crew carries', 'max': 1024, 'quality': 84},
  {'entity': 'the-valuable-tracker', 'bundle': 'resources.assets', 'match': "valuable tracker_DefaultMaterial_BaseColor",
   'file': 'the-valuable-tracker-device.jpg', 'note': 'the base colour texture of the valuable tracker the crew carries', 'max': 512, 'quality': 88},
  {'entity': 'the-valuables-you-can-find', 'bundle': 'resources.assets', 'match': "lots of valuables_Valuable Crystal Ball Glass_BaseColor",
   'file': 'the-valuables-you-can-find-crystal.jpg', 'note': 'the base colour texture of one of the valuable families the game ships', 'max': 512, 'quality': 88},
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
  {'entity': 'healing-at-the-truck', 'bundle': 'resources.assets', 'match': "Truck Healer_DefaultMaterial_BaseColor", 'file': 'healing-at-the-truck-healer.jpg', 'note': "the colour texture the game ships for the healer in the truck", 'max': 512, 'quality': 88},
  {'entity': 'the-floater', 'bundle': 'resources.assets', 'match': "enemy floater_Material_BaseColor", 'file': 'the-floater-texture.jpg', 'note': "the colour texture the game ships for the floater monster", 'max': 512, 'quality': 88},
  {'entity': 'running-a-gun-dry', 'bundle': 'resources.assets', 'match': "shotgun_DefaultMaterial_BaseColor", 'file': 'running-a-gun-dry-shotgun.jpg', 'note': "the colour texture the game ships for one of its guns", 'max': 512, 'quality': 88},
  {'entity': 'items-you-switch-carry-or-unlock', 'bundle': 'resources.assets', 'match': "Walkie_Basecolor RED", 'file': 'items-you-switch-carry-or-unlock-walkie.jpg', 'note': "the colour texture the game ships for the red walkie-talkie", 'max': 512, 'quality': 88},
  {'entity': 'items-you-switch-carry-or-unlock', 'bundle': 'resources.assets', 'match': "shockwave grenade_DefaultMaterial_BaseColor", 'file': 'items-you-switch-carry-or-unlock-grenade.jpg', 'note': "the colour texture the game ships for the shockwave grenade", 'max': 512, 'quality': 88},
  {'entity': 'the-beamer', 'bundle': 'resources.assets', 'match': "Beamer_Albedo", 'file': 'the-beamer-texture.jpg', 'note': "the colour texture the game ships for the beamer monster", 'max': 512, 'quality': 88},
  {'entity': 'the-tricycle-rider', 'bundle': 'resources.assets', 'match': "tricycle_bike_Albedo", 'file': 'the-tricycle-rider-bike.jpg', 'note': "the colour texture the game ships for the tricycle the rider arrives on", 'max': 512, 'quality': 88},
  {'entity': 'valuables-that-are-also-tools', 'bundle': 'resources.assets', 'match': "new valaubles_Valuable Arctic Jackhammer_BaseColor", 'file': 'valuables-that-are-also-tools-jackhammer.jpg', 'note': "the colour texture the game ships for the valuable jackhammer", 'max': 512, 'quality': 88},
  {'entity': 'valuables-that-are-also-tools', 'bundle': 'resources.assets', 'match': "new valaubles_Arctic Valuable Fire Extinguisher_BaseColor", 'file': 'valuables-that-are-also-tools-extinguisher.jpg', 'note': "the colour texture the game ships for the valuable fire extinguisher", 'max': 512, 'quality': 88},
  {'entity': 'the-hunter', 'bundle': 'resources.assets', 'match': "Hunter Material Albedo", 'file': 'the-hunter-texture.jpg', 'note': "the colour texture the game ships for the hunter monster", 'max': 512, 'quality': 88},
  {'entity': 'the-shadow', 'bundle': 'resources.assets', 'match': "shadow_DefaultMaterial_BaseColor", 'file': 'the-shadow-texture.jpg', 'note': "the colour texture the game ships for the shadow monster", 'max': 512, 'quality': 88},
  {'entity': 'the-balloon-monster', 'bundle': 'resources.assets', 'match': "BirthdayBoyBaseColor", 'file': 'the-balloon-monster-texture.jpg', 'note': "the colour texture the game ships for the balloon monster", 'max': 512, 'quality': 88},
  {'entity': 'the-runner', 'bundle': 'resources.assets', 'match': "Runner_substance01_Albedo", 'file': 'the-runner-texture.jpg', 'note': "the colour texture the game ships for the runner monster", 'max': 512, 'quality': 88},
  {'entity': 'the-thin-man', 'bundle': 'resources.assets', 'match': "Thin Man_Albedo", 'file': 'the-thin-man-texture.jpg', 'note': "the colour texture the game ships for the thin man monster", 'max': 512, 'quality': 88},
  {'entity': 'the-upscream', 'bundle': 'resources.assets', 'match': "upscream exp_Upscream_Legs_BaseColor", 'file': 'the-upscream-texture.jpg', 'note': "the colour texture the game ships for the upscream monster", 'max': 512, 'quality': 88},
  {'entity': 'the-elsa', 'bundle': 'resources.assets', 'match': "Elsa_Albedo", 'file': 'the-elsa-texture.jpg', 'note': "the colour texture the game ships for the elsa monster", 'max': 512, 'quality': 88},
  {'entity': 'the-heart-hugger', 'bundle': 'resources.assets', 'match': "HeartHuggerBaseColor", 'file': 'the-heart-hugger-texture.jpg', 'note': "the colour texture the game ships for the heart hugger monster", 'max': 512, 'quality': 88},
  {'entity': 'the-slow-mouth', 'bundle': 'resources.assets', 'match': "enemy slow mouth player mouth", 'file': 'the-slow-mouth-texture.jpg', 'note': "the mouth texture the game puts on the player when the slow mouth attaches", 'max': 512, 'quality': 88},
  {'entity': 'the-animal', 'bundle': 'resources.assets', 'match': "Animal_Albedo", 'file': 'the-animal-texture.jpg', 'note': "the colour texture the game ships for the animal monster", 'max': 512, 'quality': 88},
  {'entity': 'the-duck-monster', 'bundle': 'resources.assets', 'match': "duckckckck_Enemy_Duck_BaseColor", 'file': 'the-duck-monster-texture.jpg', 'note': "the colour texture the game ships for the duck monster", 'max': 512, 'quality': 88},
  {'entity': 'the-oogly', 'bundle': 'resources.assets', 'match': "Oogly_Albedo", 'file': 'the-oogly-texture.jpg', 'note': "the colour texture the game ships for the oogly monster", 'max': 512, 'quality': 88},
  {'entity': 'the-slow-walker', 'bundle': 'resources.assets', 'match': "Slow Walker_Albedo", 'file': 'the-slow-walker-texture.jpg', 'note': "the colour texture the game ships for the slow walker monster", 'max': 512, 'quality': 88},
  {'entity': 'valuables-with-a-behaviour-of-their-own', 'bundle': 'resources.assets', 'match': "milk carton_DefaultMaterial_BaseColor", 'file': 'valuables-with-a-behaviour-milk.jpg', 'note': "the colour texture the game ships for the milk carton valuable", 'max': 512, 'quality': 88},
  {'entity': 'valuables-with-a-behaviour-of-their-own', 'bundle': 'resources.assets', 'match': "new valaubles_Valuable Arctic Scale_BaseColor", 'file': 'valuables-with-a-behaviour-scale.jpg', 'note': "the colour texture the game ships for the scale valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-car-and-the-plane-you-can-carry', 'bundle': 'resources.assets', 'match': "car_car_BaseColor", 'file': 'the-car-and-the-plane-car.jpg', 'note': "the colour texture the game ships for the car valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-truck-screen', 'bundle': 'resources.assets', 'match': "Truck Screen_DefaultMaterial_BaseColor", 'file': 'the-truck-screen-texture.jpg', 'note': "the colour texture the game ships for the screen in the truck", 'max': 512, 'quality': 88},
  {'entity': 'the-cartoon-television', 'bundle': 'resources.assets', 'match': "Cartoon Cat Texture", 'file': 'the-cartoon-television-cat.png', 'note': "the picture the game itself uses for the cat in the cartoon the television plays", 'max': 256},
  {'entity': 'the-cartoon-television', 'bundle': 'resources.assets', 'match': "Cartoon Mouse Texture", 'file': 'the-cartoon-television-mouse.png', 'note': "the picture the game itself uses for the mouse in the cartoon the television plays", 'max': 256},
  {'entity': 'the-tick-and-its-mouth', 'bundle': 'resources.assets', 'match': "Tick_basecolor", 'file': 'the-tick-and-its-mouth-texture.jpg', 'note': "the colour texture the game ships for the tick monster", 'max': 512, 'quality': 88},
  {'entity': 'the-valuable-thrower', 'bundle': 'resources.assets', 'match': "Valuable Thrower_Albedo", 'file': 'the-valuable-thrower-texture.jpg', 'note': "the colour texture the game ships for the monster that throws valuables", 'max': 512, 'quality': 88},
  {'entity': 'the-bowtie-monster', 'bundle': 'resources.assets', 'match': "bowtie_BaseColor", 'file': 'the-bowtie-monster-texture.jpg', 'note': "the colour texture the game ships for the bowtie monster", 'max': 512, 'quality': 88},
  {'entity': 'the-robed-monster', 'bundle': 'resources.assets', 'match': "robey01", 'file': 'the-robed-monster-texture.jpg', 'note': "the colour texture the game ships for the robed monster", 'max': 512, 'quality': 88},
  {'entity': 'the-boombox-valuable', 'bundle': 'resources.assets', 'match': "Boombox_DefaultMaterial_BaseColor", 'file': 'the-boombox-valuable-texture.jpg', 'note': "the colour texture the game ships for the boombox valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-boombox-valuable', 'bundle': 'resources.assets', 'match': "Boombox_DefaultMaterial_Emissive", 'file': 'the-boombox-valuable-lights.png', 'note': "the emissive map the game ships for the boombox valuable, showing the two speaker lights it carries", 'max': 512},
  {'entity': 'the-snow-bike-valuable', 'bundle': 'resources.assets', 'match': "Arctic snow bike_DefaultMaterial_BaseColor", 'file': 'the-snow-bike-valuable-texture.jpg', 'note': "the colour texture the game ships for the snow bike valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-potions-you-can-find', 'bundle': 'resources.assets', 'match': "lots of valuables_Valuable Levitation Potion_BaseColor", 'file': 'the-potions-you-can-find-levitation.jpg', 'note': "the colour texture the game ships for its levitation potion valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-potions-you-can-find', 'bundle': 'resources.assets', 'match': "cauldron box_DefaultMaterial_BaseColor", 'file': 'the-potions-you-can-find-cauldron.jpg', 'note': "the colour texture the game ships for the boxed cauldron valuable", 'max': 512, 'quality': 88},
  {'entity': 'valuables-that-move-glow-or-talk', 'bundle': 'resources.assets', 'match': "Teeth Bot - Albedo", 'file': 'valuables-that-move-glow-or-talk-teethbot.jpg', 'note': "the colour texture the game ships for the teeth bot valuable", 'max': 512, 'quality': 88},
  {'entity': 'valuables-that-move-glow-or-talk', 'bundle': 'resources.assets', 'match': "valuable scream doll_Material.002_BaseColor", 'file': 'valuables-that-move-glow-or-talk-screamdoll.jpg', 'note': "the colour texture the game ships for the scream doll valuable", 'max': 512, 'quality': 88},
  {'entity': 'valuables-that-move-glow-or-talk', 'bundle': 'resources.assets', 'match': "valuabless_Valuable Old Camera_BaseColor", 'file': 'valuables-that-move-glow-or-talk-camera.jpg', 'note': "the colour texture the game ships for the old camera valuable", 'max': 512, 'quality': 88},
  {'entity': 'how-the-staffs-are-fired', 'bundle': 'resources.assets', 'match': "Void Staff_Albedo", 'file': 'how-the-staffs-are-fired-void.jpg', 'note': "the colour texture the game ships for the void staff", 'max': 512, 'quality': 88},
  {'entity': 'how-the-staffs-are-fired', 'bundle': 'resources.assets', 'match': "Torque Staff_Albedo", 'file': 'how-the-staffs-are-fired-torque.jpg', 'note': "the colour texture the game ships for the torque staff", 'max': 512, 'quality': 88},
  {'entity': 'the-extraction-point-and-its-machinery', 'bundle': 'resources.assets', 'match': "extraction buttons and screens_DefaultMaterial_BaseColor", 'file': 'the-extraction-point-buttons.jpg', 'note': "the colour texture the game ships for the extraction point's button and screens", 'max': 512, 'quality': 88},
  {'entity': 'the-upgrade-stand-and-its-roll', 'bundle': 'resources.assets', 'match': "upgrade stand button_DefaultMaterial_BaseColor", 'file': 'the-upgrade-stand-button.jpg', 'note': "the colour texture the game ships for the upgrade stand's button", 'max': 512, 'quality': 88},
  {'entity': 'the-upgrade-stand-and-its-roll', 'bundle': 'resources.assets', 'match': "upgrade stand roller_DefaultMaterial_BaseColor", 'file': 'the-upgrade-stand-roller.jpg', 'note': "the colour texture the game ships for the upgrade stand's roller", 'max': 512, 'quality': 88},
  {'entity': 'the-shopkeeper-and-what-it-watches', 'bundle': 'resources.assets', 'match': "shopkeeper_DefaultMaterial_BaseColor", 'file': 'the-shopkeeper-texture.jpg', 'note': "the colour texture the game ships for the shopkeeper", 'max': 512, 'quality': 88},
  {'entity': 'the-charging-station-and-its-beam', 'bundle': 'resources.assets', 'match': "Charging station new_DefaultMaterial_BaseColor", 'file': 'the-charging-station-panel.jpg', 'note': "the base colour texture the game ships for the charging station", 'max': 512, 'quality': 88},
  {'entity': 'the-museums-laser', 'bundle': 'resources.assets', 'match': "security laser _DefaultMaterial_BaseColor", 'file': 'the-museums-laser-texture.jpg', 'note': "the base colour texture the game ships for the security laser", 'max': 512, 'quality': 88},
  {'entity': 'the-walkie-talkie-and-how-it-answers', 'bundle': 'resources.assets', 'match': "Walkie_Basecolor RED", 'file': 'the-walkie-talkie-texture.jpg', 'note': "the colour texture the game ships for the walkie-talkie the crew talks through", 'max': 512, 'quality': 88},
  {'entity': 'the-bomb-and-its-fuse', 'bundle': 'resources.assets', 'match': "bang_DefaultMaterial_BaseColor", 'file': 'the-bomb-and-its-fuse-body.jpg', 'note': "the colour texture the game ships for the monster that carries the bomb", 'max': 512, 'quality': 88},
  {'entity': 'the-traffic-light-valuable', 'bundle': 'resources.assets', 'match': "TrafficLightBaseColor", 'file': 'the-traffic-light-valuable-light.jpg', 'note': "the game's own colour texture for the traffic light valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-baby-head-valuable', 'bundle': 'resources.assets', 'match': "babyhead_Material.007_BaseColor", 'file': 'the-baby-head-valuable-head.jpg', 'note': "the colour texture the game ships for the baby head valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-egg-valuable-that-cracks', 'bundle': 'resources.assets', 'match': "Egg 3", 'file': 'the-egg-valuable-that-cracks-egg.jpg', 'note': "one of the egg textures the game ships for its egg valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-blender-valuable', 'bundle': 'resources.assets', 'match': "blender disembled (no glass)_DefaultMaterial_BaseColor", 'file': 'the-blender-valuable-body.jpg', 'note': "the colour texture the game ships for the blender valuable's body", 'max': 512, 'quality': 88},
  {'entity': 'the-gumball-machine-that-hypnotises', 'bundle': 'resources.assets', 'match': "Screen Spiral", 'file': 'the-gumball-machine-hypnosis-spiral.jpg', 'note': "the spiral the game draws over the screen when the gumball machine has you", 'max': 512, 'quality': 88},
  {'entity': 'the-tray-valuable', 'bundle': 'resources.assets', 'match': "tray_DefaultMaterial_BaseColor", 'file': 'the-tray-valuable-tray.jpg', 'note': "the colour texture the game ships for the tray valuable", 'max': 512, 'quality': 88},
  {'entity': 'the-spinny', 'bundle': 'resources.assets', 'match': "Spinny_Albedo", 'file': 'the-spinny-texture.jpg', 'note': "the colour texture the game ships for the spinny monster", 'max': 512, 'quality': 88},
  {'entity': 'the-elsa-in-two-sizes', 'bundle': 'resources.assets', 'match': "Elsa Fur Big", 'file': 'the-elsa-in-two-sizes-fur.jpg', 'note': "the fur texture the game ships for the elsa at its big size, one of the two the game keeps for the two sizes", 'max': 512, 'quality': 88},
  # The three below have texture names that name their subject outright, so the
  # mapping needs no interpretation: "Grenades Base" is the grenade, the
  # tricycle albedo is the tricycle, and the wings texture names the upgrade.
  {'entity': 'the-thrown-grenade', 'bundle': 'resources.assets', 'match': "Grenades Base", 'file': 'the-thrown-grenade-grenade.jpg', 'note': "the base colour texture the game ships for the grenade the player throws", 'max': 512, 'quality': 88},
  {'entity': 'the-tricycle-riders-rig', 'bundle': 'resources.assets', 'match': "tricycle_bike_Albedo", 'file': 'the-tricycle-riders-rig-tricycle.jpg', 'note': "the albedo texture of the tricycle the rider monster arrives on", 'max': 512, 'quality': 88},
  {'entity': 'the-tumble-wings-upgrade', 'bundle': 'resources.assets', 'match': "Upgrade_Tumble-Wings_Albedo", 'file': 'the-tumble-wings-upgrade-wings.jpg', 'note': "the albedo texture the game ships for the tumble wings upgrade", 'max': 512, 'quality': 88},
  # The entry names a front and a back light with their own renderers, and the
  # game ships a lamp texture for the vehicle; the other is the cosmetic
  # machine's own screen, which the entry describes as the thing that shows.
  {'entity': 'the-lights-and-beeps-on-a-vehicle', 'bundle': 'resources.assets', 'match': "truck lamp_DefaultMaterial_BaseColor", 'file': 'the-lights-and-beeps-on-a-vehicle-lamp.jpg', 'note': "the base colour texture the game ships for a lamp on the vehicle", 'max': 512, 'quality': 88},
  {'entity': 'the-token-machines-show', 'bundle': 'resources.assets', 'match': "cosmetic machine_CosmeticShopMachine___Screen_BaseColor", 'file': 'the-token-machines-show-screen.jpg', 'note': "the base colour texture of the cosmetic machine's own screen", 'max': 512, 'quality': 88},
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