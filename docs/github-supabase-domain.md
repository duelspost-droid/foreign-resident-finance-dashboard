# GitHub + Supabase + data.jbax.co.kr Setup

## GitHub

Repository:

https://github.com/duelspost-droid/foreign-resident-finance-dashboard

The repository includes GitHub Actions workflow:

- `.github/workflows/pages.yml`

It runs on:

- push to `main`
- manual workflow dispatch
- daily schedule at `18:30 UTC`, which is `03:30 Asia/Seoul`

The workflow:

1. Installs dependencies.
2. Runs `npm run data:all`.
3. Commits generated `lib/data/generated/realData.ts` if changed.
4. Loads Supabase when Supabase secrets exist.
5. Builds a static Next export.
6. Deploys to GitHub Pages.

## GitHub Pages Custom Domain

The repository includes:

- `public/CNAME`

Value:

```text
data.jbax.co.kr
```

In GitHub repository settings:

1. Go to Settings > Pages.
2. Source: GitHub Actions.
3. Custom domain: `data.jbax.co.kr`.
4. Enable HTTPS after DNS verification.

## DNS

Create this DNS record at the DNS provider for `jbax.co.kr`.

```text
Type: CNAME
Name: data
Value: duelspost-droid.github.io
TTL: Auto
Proxy: DNS only, if using Cloudflare
```

If GitHub asks for apex verification, add the TXT record GitHub shows in Pages settings.

## Supabase

Create a Supabase project, then run:

```sql
-- Supabase SQL Editor
-- paste contents of supabase/schema.sql
```

Add GitHub Actions repository secrets:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

The daily workflow then runs:

```bash
npm run supabase:load
```

It upserts:

- `foreign_resident_status`
- `foreign_resident_region_month`

## Local Commands

```bash
npm run data:all
$env:NEXT_OUTPUT="export"; npm run pages:build
npm run supabase:load
```

## Notes

The service role key must only be stored in GitHub Actions secrets or a local `.env` file. Do not commit it.

## Current Status - 2026-06-16

- GitHub repository is public: `https://github.com/duelspost-droid/foreign-resident-finance-dashboard`
- GitHub Pages source is configured as GitHub Actions.
- Custom domain is registered in GitHub Pages: `data.jbax.co.kr`
- `public/CNAME` is deployed (verified in build output `out/CNAME`).
- **DNS is now resolving correctly.** `data.jbax.co.kr` is a CNAME to
  `duelspost-droid.github.io`, which resolves to GitHub Pages IPs
  (`2606:50c0:800x::153`). `www.jbax.co.kr` also resolves to GitHub Pages.
  This was the blocker that previously prevented certificate provisioning.
- Because DNS now verifies, GitHub Pages auto-provisions a Let's Encrypt TLS
  certificate. Provisioning is automatic and can take from a few minutes up to
  ~24h after DNS verification passes.

### Remaining step to finish HTTPS (manual, repo owner only)

1. Settings → Pages → confirm Custom domain shows `data.jbax.co.kr` with a
   green check (DNS verified).
2. Tick **Enforce HTTPS**.
   - If the checkbox is greyed out, the certificate is still provisioning —
     wait and revisit. To force a re-check, clear the Custom domain field,
     Save, re-enter `data.jbax.co.kr`, and Save again.
3. After enforcement is on, the canonical URL becomes `https://data.jbax.co.kr/`.

Verified DNS (2026-06-16):

```text
data.jbax.co.kr  CNAME  duelspost-droid.github.io
www.jbax.co.kr   CNAME  duelspost-droid.github.io
duelspost-droid.github.io  →  2606:50c0:8000::153 (and :8001/:8002/:8003)
```

- Supabase GitHub Actions secrets are not configured yet.
- Add these repository secrets when the Supabase project is ready:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

- Public data fetch now has retry and cached raw CSV fallback for GitHub Actions.
- Tracked raw CSV cache files live under `data/raw/*.csv`.
