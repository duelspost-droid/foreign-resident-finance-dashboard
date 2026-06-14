# Latest Handoff

## Status - 2026-06-14

- Project path: `C:\tmp\foreign-resident-finance-dashboard`
- GitHub repository: `https://github.com/duelspost-droid/foreign-resident-finance-dashboard`
- Repository visibility: public
- GitHub Pages source: GitHub Actions
- Custom domain configured in GitHub Pages: `data.jbax.co.kr`
- Latest successful Pages workflow run: `27502507989`
- GitHub Pages reported URL: `http://data.jbax.co.kr/`
- HTTPS enforcement: disabled until DNS and certificate verification complete

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

Add this DNS record at the DNS provider for `jbax.co.kr`:

```text
Type: CNAME
Name: data
Value: duelspost-droid.github.io
TTL: Auto
Proxy: DNS only, if using Cloudflare
```

After DNS resolves, enable HTTPS enforcement in GitHub Pages.

Create or choose a Supabase project, run the schema migration, then add these GitHub repository secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

After the secrets are present, the daily workflow will run `npm run supabase:load` and upsert:

- `foreign_resident_status`
- `foreign_resident_region_month`
