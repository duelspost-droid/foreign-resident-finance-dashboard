# Latest Handoff

## Status - 2026-06-14

- Project path: `C:\tmp\foreign-resident-finance-dashboard`
- GitHub repository: `https://github.com/duelspost-droid/foreign-resident-finance-dashboard`
- Repository visibility: public
- GitHub Pages source: GitHub Actions
- Custom domain configured in GitHub Pages: `data.jbax.co.kr`
- GitHub Pages reported URL: `http://data.jbax.co.kr/`
- HTTPS: DNS now resolves (`data.jbax.co.kr` CNAME → `duelspost-droid.github.io`).
  Cert auto-provisions; remaining manual step is ticking **Enforce HTTPS** in
  Settings → Pages once the cert is ready. See `docs/github-supabase-domain.md`.

## What Was Added

- `.github/workflows/pages.yml`
  - Runs on push to `main`
  - Runs manually via workflow dispatch
  - Runs daily at `18:30 UTC`, equal to `03:30 Asia/Seoul`
- `public/CNAME`
  - Contains `data.jbax.co.kr`
- `scripts/load_supabase.mjs`
- `supabase/migrations/001_initial_schema.sql`
- `docs/github-supabase-domain.md`

## Build Reliability Fixes

- `scripts/daily_data_batch.mjs`
  - Replaced Windows-only `cmd /c npm ...` flow with cross-platform npm execution.
- `scripts/fetch_public_data.mjs`
  - Added retry and timeout handling for `www.data.go.kr`.
  - Added cached raw CSV fallback when metadata fetch fails.
- `scripts/build_real_data.mjs`
  - Generated `realData.ts` now includes explicit TypeScript types.
  - Removed generated extra field that did not exist in `ForeignResidentRegionMonth`.
- `.gitignore`
  - Allows `data/raw/*.csv` to be tracked as a GitHub Actions fallback cache.

## Verification

- Local `npm run data:all`: success
- GitHub Actions Pages workflow: success
- Build job: success
- Deploy job: success
- Supabase load step was skipped because repository secrets are not configured yet.

## Remaining Work

DNS is already configured and verified (2026-06-16): `data.jbax.co.kr` is a
CNAME to `duelspost-droid.github.io` and resolves to GitHub Pages.

Finish HTTPS (repo owner, one-time): Settings → Pages → tick **Enforce HTTPS**
once the Let's Encrypt cert finishes provisioning. If greyed out, wait or
re-save the custom domain to force a re-check.

Create or choose a Supabase project, run the schema migration, then add these GitHub repository secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

After the secrets are present, the daily workflow will run `npm run supabase:load` and upsert:

- `foreign_resident_status`
- `foreign_resident_region_month`
