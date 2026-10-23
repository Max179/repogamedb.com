# Accessibility audit — 2026-10-23

## Scope and method

- Tool: axe-core 4.14.0, injected into the built site in ego-browser.
- Rules: WCAG 2.0 A/AA and WCAG 2.1 AA tags.
- Pages sampled: home, a monster entry, a weapon entry, search, credits, Monsters category, an article, the game guide, and the technical reference index.
- Additional static checks over the built output: language attribute, title, h1, image alt text.

## Result

- **0 axe violations** on all sampled page types.
- **777 HTML pages / 1,782 images / 0 images without alt**.
- Every checked page has a single h1, a main landmark, a skip link, a language attribute and a responsive viewport.
- No accessibility-specific code changes were required after the audit.

## Limits

- This is an automated axe pass plus static checks, not a full 782-page crawl.
- No screen-reader session or manual keyboard-only session was performed.
- WCAG 2.2-only rules were not included.

Run again after UI changes by loading axe-core and calling axe.run with the same tags on the same page types.
