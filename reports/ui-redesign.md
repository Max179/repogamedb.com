# UI redesign — R.E.P.O. industrial HUD

Date: 2026-10-23 · Branch: `feat/entry-images` · Generator: `pipeline/theme.mjs` + `pipeline/site.mjs`

## Direction

The site now follows the game's own industrial-horror HUD language rather than a generic dark wiki:

| Token | Value | Use |
| --- | --- | --- |
| background | `#080a08` | page base, near-black steel |
| panel | `#121712` / `#1a211a` | cards, facts, tables |
| metal / line | `#252d26` / `#3b463b` | borders, dividers |
| hazard yellow | `#f2b705` / `#ffd23f` | primary buttons, labels, focus, stripes |
| warning red | `#d3402f` | danger accents, callouts, hazard corner marks |
| bone text | `#f1ecda` | headings and body |
| CRT green | `#a8cf6a` | reserved for readouts |

Typography: condensed display headings (Impact / Arial Narrow stack), monospace uppercase labels for HUD metadata.
No external fonts or network requests.

## Elements

- Hazard-stripe bands under the sticky header and above the footer, plus hero and category corner marks.
- Square-edged metal panels, thin borders, 2px radius, corner stripes and rivet-like accents.
- Primary actions are hazard-yellow with black text; secondary actions are dark metal.
- Entry pages use a framed picture with a hazard border, a HUD metadata line and warning-red callouts for unverified claims.
- Tables (including image credits) use yellow uppercase headers and hover rows.
- Responsive: 4-column category rail on desktop, 2 columns at 980px and 1 column at 430px; mobile nav and search stack.

## Search

`/search.html` is now a real player search over the published entries, guides and core pages (not the technical field
table). It includes category chips, a query parameter, result count, empty state and a clear button; the technical
field lookup stays at `/reference/tool.html`.

## Social / SEO

Every page now emits:

- `og:image` / `og:image:width` / `og:image:height` / `og:image:alt` pointing at `/social-card.png` (1200×630, generated from the game hero artwork with hazard branding);
- `twitter:card=summary_large_image` plus title/description/image;
- JSON-LD: WebSite on the home page (with SearchAction), WebPage on other pages, Article on entries and guides;
- theme-color, site name and locale.

## Performance

The generated artwork was re-encoded in place with Pillow (LANCZOS, optimize):

| Asset | Before | After |
| --- | --- | --- |
| hero artwork | 2172×724 · 1.87 MB | 1600×533 · 1.05 MB |
| four category icons | 1254×1254 · 1.6–2.3 MB each | 384×384 · 185–248 KB each |
| beacon icon | 1254×1254 · 2.02 MB | 256×256 · 101 KB |
| `web/assets` total | 11.26 MiB | **2.61 MiB** |
| homepage `<img>` payload | ~10.3 MB | **1.82 MiB** |

The page-weight test also asserts the homepage payload stays below 3 MiB.

## Verification

- `node pipeline/site.mjs` → pages 782 / indexable 284
- `node tests/site.test.mjs` → **76 passed, 0 failed** (new search, social metadata, JSON-LD, social-card and image-budget checks)
- `npx tsc --noEmit -p tsconfig.ci.json` → exit 0, now including `pipeline/**/*.ts`
- Browser QA: desktop and 390px; no horizontal overflow; search query `oogly` returns the entry and a guide; credits 81 rows; 0 broken images after lazy load.
