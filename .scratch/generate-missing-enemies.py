import json
import os

# Load source data
enemies = json.load(open('enemies-final.json'))

# Target 5 missing enemies
targets = ['rugrat', 'banger', 'birthday-boy', 'peeper', 'tumbler']

for enemy_id in targets:
    enemy = next((e for e in enemies if e['id'] == enemy_id), None)
    if not enemy:
        print(f"❌ {enemy_id} not found")
        continue
    
    # Extract game fields
    audio_fields = [f for f in enemy['fields'] if 'audio' in f['name'].lower() or 'sound' in f['name'].lower()]
    visual_fields = [f for f in enemy['fields'] if 'visual' in f['name'].lower() or 'transform' in f['name'].lower()]
    
    # Build facts from identifiers
    facts = []
    if audio_fields:
        audio_names = [f['name'] for f in audio_fields[:5]]
        facts.append({
            "claim": f"Audio identifiers include: {', '.join(audio_names[:3])}.",
            "evidence": f"identifiers: {', '.join(audio_names)}"
        })
    
    facts.append({
        "claim": f"Internal class name: {enemy['className']}",
        "evidence": f"class: {enemy['className']}"
    })
    
    facts.append({
        "claim": f"P0 field count: {enemy['p0Fields']}",
        "evidence": f"p0Fields: {enemy['p0Fields']}"
    })
    
    # Build entry
    entry = {
        "id": f"the-{enemy_id}",
        "title": enemy['displayName'],
        "category": "Enemies",
        "summary": f"A monster in R.E.P.O. (game data verified, behavior details pending).",
        "body": [
            f"This entry documents the {enemy['displayName']} from game file analysis.",
            f"The game assigns it the internal class {enemy['className']} with {enemy['p0Fields']} identifiable fields.",
            "What we can verify: the identifiers the game uses, the sounds it has, and the components it needs.",
            "What this entry does not claim: exact damage numbers, spawn rates, or behavior details. We print only what we have verified from the game files."
        ],
        "facts": facts,
        "related": [
            "enemies-and-their-behaviour"
        ],
        "images": [],
        "sources": [
            "A local copy of the game, read only. The grounding for each fact is listed in the evidence field; nothing here is estimated."
        ],
        "imageTier": "no-image",
        "_needsReview": True,
        "_verificationStatus": "game-data-only",
        "_dataConfidence": "high"
    }
    
    # Write to content/published
    output_path = f'../content/published/the-{enemy_id}.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(entry, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Generated: {output_path}")

print("\n✅ 5 entries generated")
