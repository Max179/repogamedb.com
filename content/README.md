# Content model — three tiers

Every page on the site comes from this folder. The build refuses to emit a tier it cannot justify.

| Tier | Folder | In sitemap | Indexable | What may be in it |
| --- | --- | --- | --- | --- |
| published | `content/published/` | yes | yes | Player-facing entries with a verified factual core: what it is, where you find it, how you get it, what it is for, prerequisites or numbers. Needs images and evidence. |
| reference | `content/reference/` | no | no (noindex) | Technical material for modders: identifiers read from the game's files. Linked from published entries, never advertised as content. |
| draft | `content/draft/` | no | not built | Work in progress. Never emitted, never linked. |

## Rules the gate enforces (`tools/content-gate.mjs`)

1. A published entry needs: a real player title (not a bare identifier), a factual summary of at least 80 characters that answers a question, at least two body paragraphs, at least one fact with an evidence pointer, at least one image, at least one related entry, a version/source note, English **and** Chinese alt text for every image.
2. Prose in published entries may not contain internal implementation terms (the gate holds a banned-word list: IL2CPP, SerializedFile, PPtr, schema, metadata, payload, MonoBehaviour, ScriptableObject, parser, hash, and the words class / field / namespace used as nouns).
3. Images must exist on disk, be a supported format, be larger than 1 KB, and declare their tier: a real game image (`kind: "game"`, which requires a mapping the extractor confirmed), a community picture from a wiki with an explicit reusable licence (`kind: "community"`, which requires a manifest record with source page, author and licence), or an original diagram (`kind: "diagram"`, which must say so and must never be presented as a screenshot).
4. A published entry without an image is not published: it belongs in draft or reference.
5. No placeholder text: title/summary pairs must be unique, and a summary may not be the title reworded.

## Images: game, community or labelled diagram

6. **Every published entry declares its picture tier** in `imageTier`:
   - `"game-image"` — the entry carries at least one image exported from the game itself. The gate checks the file against
     `content/images-manifest.json` (source bundle, asset name, width, height, bytes, sha256), so the origin is re-checkable.
   - `"community-image"` — the entry carries a picture from a community wiki, used under an explicit reusable licence
     (currently CC-BY-SA 4.0 from the R.E.P.O. Fandom wiki). The manifest record must name the source page, the author
     (or "R.E.P.O. Fandom Wiki contributors"), the licence and licence URL, and the retrieval date; the page must credit
     them and link to `/credits.html`.
   - `"diagram-only"` — neither a game image nor a licensed community picture is confirmed for this subject yet. The entry
     must carry an original diagram whose disclaimer says it is not a screenshot, and it is kept as a noindex note rather
     than mixed in with finished entries.
7. **A diagram never stands in for a screenshot, and a community picture is never presented as a game asset.** A picture
   whose subject is not literal (for example a level screenshot used to illustrate a music entry) must set
   `illustrative: true` and a `shows` description; its caption says so. No entry gets a filler picture.
8. `node tools/image-coverage.mjs` writes `reports/image-coverage.md`, which lists every published entry with its tier and
   picture. It exits non-zero if an entry still has no picture (unless `--allow-notes`), if a used image has no manifest
   record, if a community picture lacks attribution, or if a community file is unreferenced. Unused game textures are a
   library rather than a gap.
9. Source priority for a missing picture: (1) a Fandom / other wiki image with an explicit reusable licence, (2) a game
   asset already extracted from the local copy, (3) an original diagram. Do not automatically scrape a wiki and do not
   bypass its bot protection; record the source page and retrieval date for every community picture.