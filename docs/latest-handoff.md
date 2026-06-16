# Latest Handoff

## Status - 2026-06-16 (origin/main 동기화 + 수집 실패 triage)

- 이 Mac 로컬 체크아웃은 origin/main보다 **95커밋 뒤**였음 → `main`을 origin/main(`0d87c0f`)으로 fast-forward 완료. 커밋 안 된 6/15 로컬 Supabase 스캐폴드는 `stash@{0}`에 보존(복구 가능: `git stash branch <name> stash@{0}`).
- **현재 수집 상태** (마지막 CI 배치 `0d87c0f`, catalog 2026-06-16T00:14Z, 27소스): 13 downloaded / KOSIS api_error 3(objL·no_data) / metadata_without_file 4(교육부×2·국민연금·고용노동부) / 행안부 openapi no_data 1 / skipped_no_key 6(ECOS×5·서울).
- **블로커**:
  - KOSIS_API_KEY·DATA_GO_KR_SERVICE_KEY는 GitHub Secret이라 로컬에 없음 → KOSIS/openapi 로컬 검증 불가. `.env.local`(gitignore됨)에 직접 입력 대기. ECOS_API_KEY·SEOUL_OPENAPI_KEY 미발급.
  - 이 Mac엔 system node/npm 없음 → 번들 노드 `/Users/hk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`(v24) 사용.
  - **로컬 푸시 불가**: `gh` 미설치 + osxkeychain 자격증명 없음 → 커밋만 준비, 레포 소유자가 직접 푸시.
- **다음 작업**: `.env.local`에 두 키 입력 후 `node --env-file=.env.local scripts/fetch_public_data.mjs` 실행 → KOSIS objL/period·행안부 openapi·국민연금(file→openapi) 수정·검증. 상세는 `CLAUDE.md`의 **2026-06-16 세션** 항목 참조.

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
