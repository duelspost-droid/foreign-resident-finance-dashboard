# Latest Handoff

## 📌 현재 상태 스냅샷 — 2026-07-03

다른 PC에서 **git clone 후 이 문서 하나로 이어서 작업**할 수 있게 정리한 최신 상태.
전체 백로그·소유자 잔여 스텝은 `docs/next-tasks.md`, **사용자 지시·결정 로그는 `docs/directives-log.md`**, 깊은 이력은 `git log`.

- **GitHub**: `https://github.com/duelspost-droid/foreign-resident-finance-dashboard` (브랜치 `main`)
- **라이브**: https://data.jbax.co.kr/ (GitHub Pages 정적 export, 매일 01:00 KST 자동 수집·배포)
- **최신 커밋**: `6dc9a5b` (mock-residents Postgres 스토어) — 배포 성공, 라이브 반영
- **스택**: Next.js 16 App Router · TypeScript · Tailwind · Recharts · Supabase(옵션) · 정적 export(GitHub Pages)
- **목적**: 개인 단위가 아닌 **집계 통계**로 국내거주 외국인 금융시장 기회를 분석하는 B2B 대시보드

---

## 🚀 빌드·검증 (다른 PC = 일반 node/npm 환경 기준)

```bash
git clone https://github.com/duelspost-droid/foreign-resident-finance-dashboard
cd foreign-resident-finance-dashboard
npm install
npm run typecheck        # tsc --noEmit — 반드시 통과(=0)해야 커밋/푸시
npm test                 # node --test test/*.test.mjs — 27건 통과
npm run build            # vinext build (정적 export)
npm run dev -- -p 3000   # http://localhost:3000
```

> ⚠️ **이 Mac 로컬 특이사항**(다른 PC엔 해당 없음): 이 개발 머신엔 node/npm이 PATH에 없어
> 번들 노드(`/Users/hk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`, v24)를
> 직접 쓰고, `vinext build`는 rolldown 네이티브 바인딩 부재로 로컬 실행 불가 → **`tsc`+`node --test`로만 검증**.
> 일반 PC(node/npm 정상)에선 위 표준 명령이 전부 동작한다. 상세: `docs/`의 빌드 노트 및 자동메모리.

**작업 규칙(이 프로젝트 합의사항)**:
- 수정 → `tsc` 통과 확인 → **묻지 말고 바로 커밋·푸시**(`main`).
- 푸시 전 `git pull --rebase origin main`(매일 01:00 CI 자동 데이터 커밋과 충돌 방지).
- **소유자 전용**(claude 불가): Supabase 마이그레이션 실행·Edge Function 배포·시크릿/환경변수 설정·계정/프로젝트 생성·PAT/2FA. 이런 항목은 "⏳ 소유자"로 표기.

---

## 🖥 인프라 상태 (적용됨 vs 소유자 대기)

- **Supabase 프로젝트** `nrdapzgtibbusvoaceuh`
  - ✅ 마이그레이션 **002~007 적용됨**(ai_insight_chat·metric_snapshots·feature_requests/page_views·admin_config·surface_config/disposition).
  - ⏳ **008~011 미적용**(잠금 마이그레이션). 프론트는 **전환기 폴백**으로 이미 동작:
    RPC(admin_set_*) 있으면 그걸, 없으면 anon 직접 쓰기(009/011이 anon 정책을 DROP하기 전까진 동작). → 지금 승인/트리아지 버튼 **정상 작동**. 008~011 적용 시 폴백은 자동으로 RPC 경로만 남음.
- **Edge Functions** ✅ 배포됨: `admin`(운영콘솔 인증·답변·재빌드), `insight-ai`(생성형 AI 채팅).
  - `insight-ai`용 `ANTHROPIC_API_KEY`는 **Supabase Function 시크릿에 설정됨**(라이브 AI 채팅 동작 확인).
- **GitHub Actions 시크릿**: ✅ SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY, DATA_GO_KR_SERVICE_KEY, KOSIS_API_KEY, ECOS_API_KEY.
  - ⏳ **미등록**: `ANTHROPIC_API_KEY`(CI용 — 있어야 매일 웹발굴·인사이트 자동생성), `REB_API_KEY`, SEOUL 키.
- **CI**: `.github/workflows/pages.yml` — push + cron(01:00 KST). `build`(npm ci→data:ci→auto-commit→정적빌드→artifact) + `deploy`(Pages). `data:ci`는 timeout 15분·continue-on-error.

---

## 🗂 최근 세션 작업 이력 (2026-06-25 → 07-03, 최신순)

| 날짜 | 커밋 | 내용 |
|---|---|---|
| 07-03 | `6dc9a5b` | **가상 외국인정보 전용 Postgres 스토어** — `db/mock_residents/`(schema.sql·schema.supabase.sql·README) + `scripts/build_mock_residents_sql.mjs`(mockResidents.ts 단일출처 → COPY 시드) + `mock:sql` 스크립트. 프로덕션 분석 Supabase와 분리. |
| 07-03 | `fdc0934` | **외국인 정보 관리(가상) 조회 화면** — `/mock-residents`(10만 건 클라 생성·이름검색·국적/성별/지역 필터·페이지네이션·"가상 데이터" 경고배너·noindex) + 사이드바 '데이터 탐색' 메뉴. |
| 07-03 | `f161325` | 메타관리 '미연동 연동'(surface_config 트리아지) 버튼 수정 — 008 미적용 전환기 폴백. |
| 07-03 | `7c7a4bd` | CSV 파서 강화 — RFC 4180(따옴표 안 개행) 공유 모듈 `scripts/lib/csv.mjs` + 테스트 8건. |
| 07-03 | `83dc0d0` | 감사 마무리 — build_real_data per-source 가드 누락 3건(health/multicultural/uniStats) 보강. |
| 07-03 | `1796bce` | 감사 후속 — 죽은 코드 정리(고아 컴포넌트 4 + 죽은 함수 1). |
| 07-03 | `7514954` | **감사 확정 3건 수정** — ① SSRF(승인 openapi endpoint 미검증 allowlist) ② insight-ai XFF 스푸핑+무한테이블 ③ 승인 폴백 011-조용한성공. |
| 07-02 | `cad8e5e` | 승인 버튼 수정 — 010 미적용 전환기 폴백 + 실패 메시지 배너. |
| 07-01 | `20949fe`·`69dbe32`·`5fa660a` | **REB(한국부동산원) 수집기** — 크롬 발굴로 전국 외국인 부동산거래 발견 → R-ONE OpenAPI `type:"reb"` 컬렉터 + 소스 2종(statblId A_2024_00533/00543). |
| 06-30 | `3499327` | AI 웹 발굴 리드를 '데이터 에이전트 승인'(/admin)으로 일원화(이동+큐 통합). |
| 06-30 | `c28d7c0` | 보안 HIGH — source_candidates 익명쓰기 차단 + insight-ai 레이트리밋(010/011 마이그레이션). |
| 06-30 | `22665a4` | 발굴 리드 7종 정식 소스 등록 + build_generic_data HTML 가드. |
| 06-30 | `47528ab` | score.ts 테스트(vitest 스캐폴드). |
| 06-30 | `a10d6fc` | SEO/a11y — 라우트 metadata·sitemap/robots·error/not-found·차트 alt(27개). |
| 06-25 | `adb71d6` | 신뢰성(node:test 17건)·데이터(per-source safe 가드·HTML감지)·코드품질(죽은코드) + **AI 웹 발굴 에이전트**(discover_web_sources.mjs). |

---

## 🔨 가상 외국인정보 화면 ↔ Postgres 연동 (✅ 라이브 완료 — 2026-07-03)

**최종 구성(비용 0)**: 크롬으로 기존 대시보드 Supabase 프로젝트(`nrdapzgtibbusvoaceuh`)에 `mock_residents`
테이블 생성 + 읽기전용 RLS + anon SELECT 권한 + 서버측 `generate_series`로 **10만 행** 적재.
프론트는 마운트 시 이 테이블을 **프로브** → 데이터 있으면 "DB 연동" 모드(서버 페이지네이션), 없으면
"로컬 생성" 폴백. 기존 anon 키 재사용이라 **시크릿/pages.yml 변경 불필요**. (Supabase Free 조직이
프로젝트 한도라 별도 Pro 프로젝트는 $10/월 → 사용자가 비용 0인 '기존 프로젝트에 테이블' 방식 선택.)

> 완전 별도 프로젝트로 옮기려면 `NEXT_PUBLIC_MOCK_SUPABASE_URL/_ANON_KEY`로 오버라이드 + seed 적재.
> 상세: `db/mock_residents/README.md`.

---

## (이력) 초기 계획: 화면 ↔ Postgres 연동 (코드 완료 · 소유자 인프라)

**요구**: `/mock-residents` 화면이 지금은 클라이언트에서 10만 건을 생성한다. 이걸 **Postgres(전용 DB)에서 읽어오도록** 연동한다. Postgres 스토어는 **가상 데이터 관리 전용**(집계 분석 Supabase와 분리).

**✅ 이미 완료(커밋됨)**:
- `db/mock_residents/schema.sql` — 이식성 DDL(테이블·인덱스·pg_trgm 이름검색·합성/마스킹 주석).
- `db/mock_residents/schema.supabase.sql` — (선택) 별도 Supabase 프로젝트용 anon 읽기 RLS.
- `scripts/build_mock_residents_sql.mjs` — `lib/data/mockResidents.ts`를 단일출처로 import → COPY 시드 생성(`npm run mock:sql`, 10만 건 0.3s/13MB, `seed.sql`은 gitignore).
- `db/mock_residents/README.md` — 적재·조회·연동 가이드.
- `app/mock-residents/page.tsx`(클라 생성) · `layout.tsx`(noindex) · 사이드바 메뉴.

**✅ 연동 코드 완료(커밋 예정/됨, env-gated inert)**:
1. `lib/data/mockResidentsDb.ts` — **별도** env(`NEXT_PUBLIC_MOCK_SUPABASE_URL`/`_ANON_KEY`)로 전용 supabase 클라이언트 + `isMockDbConfigured()` + `fetchMockResidentsPage()`(서버 페이지네이션 `.range()` + `count:'exact'` + `.ilike/.eq` 필터, 실패/미설정 시 null).
2. `app/mock-residents/page.tsx` — **DB 모드**(설정 시: 필터/페이지 변경마다 조회, 이름검색 250ms 디바운스, "DB 연동" 배지) / **클라 생성 모드**(미설정 시 폴백, "로컬 생성" 배지) 이원화. 공통 뷰(`MockResidentsView`) 공유. 미설정이 기본이라 배포 무영향.
3. `scripts/load_mock_residents.mjs`(`npm run mock:load`) — PostgREST 배치 업서트 적재기(소유자용, service_role). `--dry-run`/`--count` 지원.

**⏳ 남은 것 = 소유자 인프라만(claude 불가 = 크롬으로도 규칙상 못 함)**:
- 정적 export라 런타임 DB=**클라 anon**만 → **별도 Supabase 프로젝트**(프로덕션 분석과 분리) 생성(=**DB 비밀번호 설정**=자격증명, claude 금지).
- 적재: `schema.sql`→`schema.supabase.sql`→ 데이터(`psql -f seed.sql` 권장, 웹 SQL편집기는 13MB 불가 / 또는 `mock:load`).
- 시크릿 `MOCK_SUPABASE_URL`·`MOCK_SUPABASE_ANON_KEY` + `pages.yml` build 잡 env에 `NEXT_PUBLIC_MOCK_SUPABASE_URL/_ANON_KEY` 2줄.
> 셋 다 되면 화면이 자동으로 "DB 연동" 모드로 전환. 상세 절차: `db/mock_residents/README.md`.

---

## 🧭 소유자 잔여 활성화 체크리스트 (요약 — 상세는 next-tasks.md)

1. **마이그레이션 008→011 실행**(순서·사이): 008 실행 → 배포·캐시만료 후 009 → 010 실행 → insight-ai 재배포 → 배포·캐시만료 후 011. (미실행이어도 프론트는 폴백으로 동작.)
2. **매일 AI 웹발굴·인사이트 켜기**: GitHub 시크릿 `ANTHROPIC_API_KEY` 추가 + `pages.yml` 잡 env에 `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}` 1줄 + auto-commit `file_pattern`에 `webDiscoveredSources.json`·`insightDigest.json` 2줄.
3. **REB 전국 외국인 부동산거래 켜기**: 무료 R-ONE 키 발급 → 시크릿 `REB_API_KEY` + `pages.yml` env 1줄. (statblId는 이미 확정.)
4. **CI 품질 게이트**: `pages.yml`에 `npm run typecheck`/`npm test` 단계 추가. `npm i -D vitest`(test:unit 활성).
5. **(선택) 가상 데이터 화면 DB 연동**: 위 '진행 중 작업'의 소유자 인프라 3개.

---

## 🔒 제약 (보안·개인정보 — 절대 준수)

- 개인 단위 외국인 데이터 결합 금지. **외국인등록번호·여권번호·국내거소신고번호·이름·전화번호·상세주소·계좌번호 사용 금지.**
- 내부 금융 데이터는 **지역·월·국적·세그먼트 단위 집계값만** 허용. 소수 셀(1~4)은 마스킹(`maskSmallCell`→'<5') 또는 상위 분류 병합.
- `/compliance` 페이지가 이 원칙을 공표. → **가상(합성) 데이터는 반드시 별도 스토어**로 분리, 프로덕션 분석 Supabase에 적재 금지.
- 가상 화면의 주민등록번호·외국인등록번호는 **뒷자리 마스킹 합성 포맷**(`YYMMDD-N●●●●●●`)만, 실제 유효번호 생성 금지.

---

## 🗺 핵심 파일 지도 (이번 mock 기능 + 파이프라인)

```
app/mock-residents/page.tsx        ← 가상 정보 조회 화면(DB/클라 이원화)
app/mock-residents/layout.tsx      ← noindex
lib/data/mockResidents.ts          ← 결정적(mulberry32) 합성 생성기(단일출처)
lib/data/mockResidentsDb.ts        ← 전용 Postgres 읽기(env-gated, 서버 페이지네이션)
db/mock_residents/                  ← 전용 Postgres: schema.sql·schema.supabase.sql·README(·seed.sql=gitignore)
scripts/build_mock_residents_sql.mjs ← 시드 SQL 생성기(mockResidents.ts import)
scripts/load_mock_residents.mjs    ← 전용 DB REST 적재기(소유자, service_role)

scripts/data_sources.mjs           ← 소스 카탈로그(수정 시 이 파일)
scripts/fetch_public_data.mjs      ← 수집기(file/kosis/openapi/ecos/seoul/reb + 승인 후보)
scripts/build_real_data.mjs        ← CSV/JSON → realData.ts(per-source safe 가드)
scripts/build_generic_data.mjs     ← 미연동 소스 → 범용 뷰어 데이터(PII 컬럼 제외)
scripts/discover_web_sources.mjs   ← AI 웹발굴(ANTHROPIC_API_KEY)
lib/data/supabaseClient.ts         ← Supabase 조회/쓰기(RPC + 전환기 폴백)
components/layout/Sidebar.tsx       ← 좌측 메뉴
supabase/migrations/               ← 001~011(008~011 소유자 대기)
.github/workflows/pages.yml         ← CI/CD(01:00 KST cron)
docs/next-tasks.md                  ← 전체 백로그·소유자 스텝
```
