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
