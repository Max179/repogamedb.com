# Citation verification — repogamedb.com

Every fact on this site points at a game identifier as its evidence. The content gate checks that a fact **has**
an evidence pointer; it cannot check that the pointer names something that exists. This records that second half,
which was run over the whole corpus.

## Result

| | |
| --- | --- |
| Published entries checked | **142** |
| Facts checked | **950** |
| Distinct identifiers cited | **2,569** |
| Identifier universe | **36,861** |
| Cited identifiers that do not exist | **0** |

**Every identifier cited as evidence is a real identifier in this build.** No fact is grounded in a name that
was invented.

## The universe an identifier is checked against

| Source | Size | What it contributes |
| --- | --- | --- |
| `data/normalized/repo-object-names.json` | 32,599 names | every named object in the readable bundles: `resources.assets` 356,756 objects, `sharedassets0.assets` 4,666, `level0/1/2` 982/832/844, `globalgamemanagers.assets` 3,448 |
| `data/normalized/p0-inventory.json` | 4,262 names | class names (478), field names (19,505 declared), enum names (130) and enum member names |

## Six identifiers are real but sit outside the universe

They were looked up in the shipped assemblies by searching for the name, and are recorded in the checker so it can
pass without being weakened. They are absent from the inventory because it lists only classes that have written
instances, and from the object index because they are type names rather than asset names.

| Identifier | Found in | Cited by |
| --- | --- | --- |
| `TrapTV` | `Assembly-CSharp.dll` | `mines-traps-and-lasers` |
| `CeilingEyeLine` | `Assembly-CSharp.dll` | `mines-traps-and-lasers` |
| `ParticleScriptExplosion` | `Assembly-CSharp.dll` | `mines-traps-and-lasers` |
| `LineBetweenTwoPoints` | `Assembly-CSharp.dll` | `the-charging-station-and-its-beam` |
| `TricycleHandlebars` | `Assembly-CSharp.dll` | `the-tricycle-riders-rig` |
| `Photon.Voice.Unity` | `Assembly-CSharp.dll`, `Photon3Unity3D.dll`, `PhotonChat.dll` | `the-lobby-and-spectating` |

## How to re-run it

```
node tools/verify-citations.mjs      # exits non-zero when a cited identifier is not in the universe
```

The identifier universe is committed, so the check runs on any machine. It is **not** re-derived at check time:
rebuilding it needs the game package, which only the Windows host has (see `reports/data-boundary.md`). The run
that produced it is recorded above so a later reader can tell which build the universe came from.

## What a miss means

A miss is a request for a look, not a verdict: a class with no written instances is not in the inventory, and an
assembly outside `Assembly-CSharp` carries its own names. The six above were resolved that way. A name that is in
neither the universe nor a search of the shipped assemblies would be a fact whose evidence does not exist, and the
entry would have to change rather than the checker.

## Method note

Identifiers may contain a dot — Unity material names such as `babyhead_Material.007_BaseColor` — so only a comma or
a semicolon separates them. Splitting on a full stop truncates those names and reports a false miss; that happened
during this run and was corrected before the result above was recorded.
