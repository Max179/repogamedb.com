# Publish plan — repogamedb.com (2026-10-22)

This is the executable handoff for publishing the completed image layer. It records what is already true, what is
blocked, and the exact commands to finish. Nothing here has been pushed to main or deployed.

## Current facts

- Branch **feat/entry-images** is pushed to GitHub and is a backup only: `publish.yml` triggers on `push: branches:[main]`,
  so the branch push started no workflow and no deploy.
- Branch HEAD: `06f6678` (config fix targets `repogamedb-com`). Local gates: build `pages=782 indexable=284`,
  68 site tests, content gate 0, image coverage 172/172, preflight 13/13. Clean clone verified.
- Remote default branch is **main**, which is an unrelated history (its root is different from this branch). Do not
  merge without `--allow-unrelated-histories`.
- Live domain currently serves a stale 13-URL build. The live Cloudflare Pages project is **repogamedb-com**
  (`repogamedb-com.pages.dev` resolves; `repogamedb.pages.dev` does not). The branch config was corrected from
  `repogamedb` to `repogamedb-com` in commit `06f6678`.
- GitHub Actions has 6 historical runs; all failed. Five passed the gate and failed at
  `pages deploy` with Cloudflare `Authentication error [code: 10000]` on
  `/accounts/***/pages/projects/repogamedb-com/upload-token`. The token identity resolves as a super admin, so the
  likely causes are a missing `Account → Cloudflare Pages: Edit` permission or a token/account-id mismatch.

## Blockers (owner-only)

1. **Cloudflare token**: create/rotate an API token with `Account → Cloudflare Pages: Edit` (and Account Settings: Read)
   on the account that owns **repogamedb-com**, update `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the
   repository secrets. Verify with `npx wrangler pages project list` (should show `repogamedb-com`).
2. **History merge**: main and this branch have no merge base. The merge produces exactly 13 add/add conflicts.
   Resolve all but the two config files with the branch side:
   `git checkout --theirs -- .`, then restore `wrangler.toml name = "repogamedb-com"` and
   `publish.yml --project-name=repogamedb-com`, run `node tests/site.test.mjs` and
   `node tools/preflight.mjs`, commit, push main.
3. **Intent**: publishing replaces a 13-URL live site with the 284-indexable build. Confirm that is intended before
   pushing main.

## Exact sequence

### A. Backup (already done)

```bash
git push origin feat/entry-images          # branch only; no workflow, no deploy
git bundle create /tmp/gsf-backup.bundle --all
git bundle verify /tmp/gsf-backup.bundle
```

### B. Lower-risk publish without touching main (after the token is fixed)

```bash
gh workflow run publish.yml --ref feat/entry-images
gh run list --workflow=publish.yml --limit 3
```

This runs the gate on the branch tree and deploys `web/dist` to `repogamedb-com`. It does not change main's history.

### C. Canonical publish (merge into main)

Rehearse in a scratch clone first. Then:

```bash
git switch main
git merge --allow-unrelated-histories --no-ff feat/entry-images
git checkout --theirs -- .
# restore the two config decisions
#   wrangler.toml: name = "repogamedb-com"
#   .github/workflows/publish.yml: --project-name=repogamedb-com
node tests/site.test.mjs
node tools/preflight.mjs
git add -A
git commit -m "merge: entry images onto main"
git push origin main
```

Verify with `gh run list --workflow=publish.yml --limit 3` and
`npx wrangler pages deployment list --project-name=repogamedb-com`.

## Do not do

- Do not push local `main` as-is: it is 24 commits ahead of origin/main and would fire the failing deploy.
- Do not push to a project named `repogamedb` (NXDOMAIN at `repogamedb.pages.dev`).
- Do not commit Cloudflare tokens or account secrets.
- Do not assume the branch push published anything; it did not.

## Repo hygiene note

The branch tracks `.scratch/` (14 files) and `.claude/` (1 file). They are now on the public branch via the backup
push; if that is unwanted, remove them in a follow-up commit and force-update the branch only with owner approval.
