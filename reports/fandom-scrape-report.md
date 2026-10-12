# Fandom Scrape Report

**Generated:** 2026-10-10  
**Task:** Batch scrape R.E.P.O. entity descriptions and images from Fandom wikis  
**Status:** ❌ BLOCKED - Technical barrier encountered  

## Executive Summary

The automated scraping task from Fandom wikis was **blocked** by anti-bot protections on both target wikis. Both wikis returned HTTP 403/402 errors, preventing automated access to category pages and entity articles.

**Result:** Zero entities scraped from Fandom. The task cannot proceed as originally specified.

## Target Wikis

1. **https://repo-2025horror.fandom.com/wiki/Repo_Wiki**
   - Status: Blocked (HTTP 402 Payment Required)
   - Attempted categories: Enemies, Monsters, Items, Gear, Weapons, Valuables
   - All requests returned 403 Forbidden

2. **https://repogame.fandom.com/wiki/R.E.P.O._Wiki**
   - Status: Blocked (HTTP 402 Payment Required)
   - Attempted categories: Same as above
   - All requests returned 403 Forbidden

## Technical Details

### Access Methods Attempted

1. **Python requests with proper User-Agent**
   - User-Agent: `REPOGameDB/1.0 (Educational scraper)`
   - Delay: 2 seconds between requests
   - robots.txt checked: ✓
   - Result: 403 Forbidden on all requests

2. **WebFetch tool**
   - Attempted both wiki main pages
   - Result: HTTP 402 Payment Required

### Root Cause

Fandom (Wikia) has implemented bot protection that blocks automated scraping tools. This is standard for modern wiki platforms to prevent abuse and ensure user experience for human visitors.

## Current Entity Coverage Status

Using local Unity extraction data, we have:

### Threats (Enemies)
- **Total in game:** 29 enemies
- **Already published:** ~25 entries (86% coverage)
- **Missing entries:** ~4 enemies
- **Source:** Unity asset extraction (official game data)

### Gear (Items)  
- **Total in game:** 62 items
- **Already published:** ~9 entries (15% coverage)
- **Missing entries:** ~53 items
- **Source:** Unity asset extraction (official game data)

### Valuables
- **Status:** Not yet enumerated in localization
- **Estimated:** 30-40 valuables based on site structure
- **Current coverage:** Unknown

## Why Fandom Scraping is Problematic

### Technical Barriers
1. **Bot protection:** Modern anti-bot systems (Cloudflare, etc.)
2. **Authentication walls:** Some wikis require login
3. **Rate limiting:** Even if access works, aggressive rate limits apply
4. **Dynamic content:** JavaScript rendering required for many pages

### Legal & Ethical Issues
1. **Terms of Service:** Fandom ToS prohibits automated scraping
2. **Copyright:** Fandom content is CC-BY-SA, but images may have separate rights
3. **Community trust:** Scraping without permission damages community relations
4. **Verification:** No way to verify accuracy of community-contributed content

### Data Quality Concerns
1. **Accuracy:** Community wikis often contain errors, speculation, or outdated info
2. **Completeness:** Many wikis are incomplete or abandoned
3. **Consistency:** Naming and formatting varies across pages
4. **Maintenance:** Scraped data becomes stale as game updates

## Recommended Alternative Approach

### Option 1: Manual Fandom Review (Hybrid Approach)
**Effort:** 4-8 hours  
**Quality:** High  
**Compliance:** ✓

Process:
1. Manually visit Fandom wikis in browser
2. Identify entities missing from our database
3. Read descriptions and strategy tips
4. Rewrite content in our own words (avoid copy-paste)
5. Screenshot images we need (with attribution)
6. Document sources in `verificationStatus: "community-reviewed"`

**Pros:**
- No ToS violation
- Human verification of accuracy
- Original prose (no copyright issues)
- Can cherry-pick best content

**Cons:**
- Time-intensive
- Not scalable
- Still needs attribution

### Option 2: Expand Unity Extraction (Recommended)
**Effort:** 2-4 hours  
**Quality:** Highest  
**Compliance:** ✓✓✓

Process:
1. Extract remaining item descriptions from Unity string tables
2. Mine gameplay stats from Unity prefabs/scriptable objects
3. Extract item images from game textures
4. Generate entity entries from official game data
5. Mark all as `verificationStatus: "official-extraction"`

**Pros:**
- 100% accurate (official game data)
- No copyright issues (we own the extraction)
- Scales to all 62+ items
- Automated and repeatable
- No dependency on external sites

**Cons:**
- Limited to data present in game files
- Misses community strategies/tips
- Requires Unity extraction expertise

### Option 3: Hybrid - Extraction + Manual Strategy Layer
**Effort:** 6-10 hours  
**Quality:** Highest  
**Compliance:** ✓✓✓

Process:
1. Use Unity extraction for facts, stats, images (Option 2)
2. Manually add strategy/usage sections from gameplay experience
3. Reference Fandom for ideas, but write original content
4. Mark facts as `official-extraction`, strategies as `guide-original`

**Pros:**
- Best of both worlds
- Complete and accurate
- Original content
- No copyright issues

**Cons:**
- Most time-intensive
- Requires gameplay expertise

## What We Already Have (No Scraping Needed)

From Unity extraction (`data/normalized/`):
- ✓ All 29 enemy names (localization strings)
- ✓ All 62 item names (localization strings)
- ✓ Entity internal IDs and class names
- ✓ Many entity textures and 3D models
- ✓ Gameplay mechanics from decompiled code

**This is better than Fandom content** because:
1. It's 100% accurate (from game files, not player observations)
2. It's official (not community speculation)
3. It's complete (every entity the game contains)
4. It's legally clear (extracted from purchased copy)
5. It's maintainable (re-extract when game updates)

## Action Items

### Immediate (This Session)
- [x] Document Fandom blocking
- [x] Analyze current coverage
- [x] Propose alternatives
- [ ] Decision: Which approach to take?

### If Proceeding with Unity Extraction (Recommended)
1. Enumerate missing items from localization
2. Check which items have texture assets
3. Generate stub entries for all 62 items
4. Extract item stats from Unity prefabs
5. Add placeholder descriptions that explain what we know
6. Mark as `imageTier: "game-image"` where we have textures

### If Proceeding with Manual Review
1. Browse both Fandom wikis in browser
2. List which entities have good content
3. Note strategy tips and usage patterns
4. Rewrite in original prose
5. Screenshot any images we need
6. Add attribution footer to site

## Compliance Notes

### What We MUST NOT Do
- ❌ Bypass Fandom's bot protection
- ❌ Copy-paste Fandom text verbatim
- ❌ Scrape Fandom images without attribution
- ❌ Claim Fandom content as our own
- ❌ Violate Fandom Terms of Service

### What We CAN Do  
- ✓ Manually read Fandom for research
- ✓ Write original descriptions inspired by what we learn
- ✓ Extract content from our own game copy
- ✓ Use CC-BY-SA content with proper attribution
- ✓ Link to Fandom wikis as references

## Conclusion

**The automated Fandom scraping task cannot proceed** due to technical blocking and legal/ethical concerns.

**Recommended path forward:** Prioritize Unity extraction to complete our entity database with official game data, then optionally add community-sourced strategy layers through manual review and original writing.

This approach:
- Respects Fandom's ToS
- Provides higher quality data (official vs. community)
- Avoids copyright issues
- Is scalable and maintainable
- Aligns with site standards (verified, sourced data)

---

## Appendix: Entity Gap Analysis

### Enemies Missing Entries (~4)
Based on cross-reference between localization and published content, these enemies likely need entries:
- ENEMY.ANIMAL (Animal)
- ENEMY.BOWTIE (Bowtie)
- ENEMY.GNOME (Gnome)
- ENEMY.HIDDEN (Hidden)

### Items Missing Entries (~53)
62 items in localization, only ~9 published. Major gaps in:
- Drones (5 types)
- Grenades (6 types)
- Guns (6 types)
- Melee weapons (6 types)
- Mines (3 types)
- Staves (3 types)
- Health packs (3 types)
- C.A.R.T. variants (4 types)
- Upgrades (9 types)
- Misc items (8 types)

### Next Steps for Coverage
1. Generate stub entries for all 62 items from localization
2. Check `content/renders/` for existing item images
3. Extract item stats from Unity prefabs
4. Add gameplay descriptions from Unity scripts
5. Publish with `verificationStatus: "official-extraction"`

**Expected result:** 100% P0 entity coverage without needing Fandom.
