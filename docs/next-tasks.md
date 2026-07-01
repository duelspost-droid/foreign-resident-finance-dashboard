# 다음 작업 (백로그) — 2026-06-22 기준

전체 현재 상태는 `docs/latest-handoff.md` 참조. 이전 06-16 백로그 항목(ECOS 키·KOSIS objL·DNS/HTTPS·유학생 데이터 감사·data.go.kr file 소스 2종 등)은 대부분 완료됨.

## 🔑 소유자/자격증명 (코드로 해결 불가)
1. **일부 공공데이터 수집 실패** — 예 `nhis_foreigner_premium_2023`. data.go.kr 파일 다운로드가 실제 파일 대신 **HTML 반환**(`data/catalog/latest_fetch_catalog.json` headerLine="<!DOCTYPE html>") → **활용신청(구독)** 필요. 일부는 **.xlsx 저장**(빌드는 CSV만 파싱 → 아래 3번).
2. **`npm run supabase:load`** — 수집 실데이터를 Supabase 적재(SERVICE_ROLE_KEY). 사이트는 정적 realData로 동작하므로 선택.
3. **관리자 콘솔 첫 로그인 비번**(ADMIN_PASSWORD) — `admin` Edge Function 배포됨. `docs/admin-console.md`.
4. **송금 직접표**(KOSIS `DT_2FI004F/005F/001F`) — 격년·statHtml 전용이라 Param API 미노출 → 파일/수동 수집 경로 필요.

## 🛠 개발 (claude 가능)
5. ✅ **xlsx 파서**(2026-06-22, 커밋 17ffeb3) — `package.json`에 `xlsx ^0.18.5` + `build_generic_data`에 `xlsxToRows`(동적 import+try/catch, CSV 무영향). CI npm install 후 `.xlsx` 소스(nhis_foreigner_premium_2023 등)가 범용 뷰어에 노출. ※ build_real_data 큐레이션 전용 xlsx 변환은 해당 소스 활성화 시 후속.
6. ✅ **맞춤 차트/SURFACED**(2026-06-22, 커밋 6aba4dc) — /economy에 이미 렌더되는 건강보험·다문화 소스를 `SURFACED`에 등록(허위 '미연동' 해소). 그 외 신규 큐레이션 차트는 필요 시 추가.
7. ✅ **GenericSourceChart 엣지케이스**(2026-06-22) — ID/연도 컬럼 값 제외(`isIdLike`), config cat/val 음수·범위 가드, 전부0/빈값→표 폴백, `build_generic_data` 연도/코드 numericCols 제외(재생성 검증: id/연도 수치컬럼 0건).
8. ✅ **문서 stale 일원화**(2026-06-22) — `work-log.md`·`claude-handoff.md`에 STALE 배너(→ latest-handoff/next-tasks). `CLAUDE.md`는 상단 배너 기존 유지.
9. ✅ **명칭 일관성**(2026-06-22) — 홈 hero kicker '데이터 현황'→'대시보드'(사이드바·헤더 통일).
10. ✅ **읍면동 DT_110025 페이지네이션**(2026-06-22, 커밋 06c7fb3) — `splitCodesByBudget`+`collectKosisPaginated`(URL 6000·셀 40000·청크40 가드, skipped_too_large 분기 전용=회귀0). 오프라인 단위검증 통과(3957코드→9청크 무손실). 실제 KOSIS fetch는 **CI에서 검증 필요**(키·네트워크).
11. ✅ (방어) **단일 체류자격 YoY 급락 가드**(2026-06-22) — `build_real_data`에 `detectVisaActivityAnomalies`(체류자격별 경제활동 스톡 30%↑ 급락 시 품질경고, 다음 배치부터).

## 🔒 규정
12. **소형 셀 마스킹 검토** — 인원 적은 국적/지역 셀(유학생 등)에 CLAUDE.md 개인정보 제약 적용 여부.

## ⏸ 보류 (세션 한도)
- 다차원 코드 감사 워크플로 `find-next-work`가 2026-06-22 세션 한도(1:40am Asia/Seoul 리셋)로 중단. 한도 회복 후 재실행:
  `Workflow({ scriptPath:"<session>/workflows/scripts/find-next-work-wf_d7847c2e-34e.js", resumeFromRunId:"wf_d7847c2e-34e" })` — 완료분 캐시 반환. (※ runId는 세션 한정)

---

## 🔍 감사(find-next-work-2) 후속 수정 — 2026-06-23

### ✅ 완료 (커밋·푸시)
- **[HIGH] 개인정보 노출 차단** (150e2c5) — 범용 데이터 번들(`genericData.ts`)이 정적 export로 외국인 개인 성명·주소를 공개 배포하던 문제. `build_generic_data.mjs`에 PII 컬럼 정규식 + academyinfo 명부성 소스 통째 제외. 일일배치 재생성 후에도 PII 0건 검증.
- **[MED] 홈 등록외국인 KPI** (bf769b1) — `totalResidents*0.537` 추정치 → `kpiSummary.registeredResidents`(장기체류 비자 합계) 단일출처.
- **[MED] 홈 경제활동 TOP5 단위혼합** (bf769b1) — EPS 산업표(명)·합계행 혼입 제거, economy 페이지와 동일 로직(경활표 천명·체류자격별 첫 ITM).
- **[MED] 홈 FX 스파크라인/비정규직 비중** (bf769b1) — usd null 필터, regularShare null 가드.
- **[MED] 홈 '추가 데이터' 중복** (0eee294) — 이미 전용화면(SURFACED) 있는 소스를 generic 섹션에 중복 노출 안 함.
- **[MED] 범용 차트 소수셀 마스킹** (0eee294) — 표는 '<5' 마스킹하나 차트는 정확값 노출 → 차트 데이터에서도 마스킹 셀 제외.
- **[MED] visa-segments 매핑표 붕괴** (8e32a3b) — 국적 소스(segmentType 전부'기타'·visaCode 공백)로 1행 붕괴·빈 체류자격 → `stayVisaTypes` 실비자데이터에서 세그먼트별 대표 비자로 재구성.
- **[MED] nationalities 세그먼트 수/빈 컬럼** (8e32a3b) — '세그먼트 수' 항상 1 → 도넛과 일치하는 `visaDistributionData.length`. 공백 체류자격·세그먼트 컬럼 제거, 제목 '국적별…'로 정정.

### ⚠️ 남은 HIGH — 소유자 작업 필요 (마이그레이션 실행 + Edge Function 배포)
- **surface_config anon 쓰기 차단** — 현재 anon 키로 누구나 `surface_config`에 INSERT/UPDATE 가능 → 임의 소스를 공개 홈('추가 데이터')에 강제 노출/조작 가능. 조치: (1) anon INSERT/UPDATE 정책 DROP 마이그레이션, (2) `admin` Edge Function에 `surface` 액션(service_role) 추가, (3) `adminApi` 래퍼 + `setSourceDisposition`/`setSourceChartConfig`를 함수 경유로 재배선. ※ 마이그레이션 실행·함수 배포는 소유자(자동모드 분류기가 permissive-RLS·prod write 차단).

### 폴리시 마무리 — 2026-06-23 (claude 단독 완료)
- ✅ [MED] 모바일 사이드바 드로어 모달 a11y (b813308) — Esc·스크롤락·포커스 이동/트랩/복원·role=dialog.
- ✅ [MED] '홈에 표시' 무데이터 mismatch 가시화 (777c0a2) — 드롭다운 '미리보기 없음' 표기 + 안내 앰버 경고 격상.
- ✅ [LOW] AI챗 live region (b813308) — role=log·aria-live=polite·aria-busy.
- ✅ [LOW] 도넛 팔레트 단일출처 (cc85b6d) — `lib/theme/chartPalette.DONUT_PALETTE` 로 3곳 통합.
- ✅ [LOW] 007 마이그레이션 'shown' 주석 보정.
- (확인) admin trigger_rebuild '死프론트' → 프론트 호출 코드 실재 없음(백엔드 액션만 존재 = 정상, 제거 불필요).

### 🔐 surface_config 익명쓰기 차단 [HIGH] — 2026-06-23 (커밋 1e77832, 프론트 배포됨 · DB 마이그레이션 대기)
- **설계 변경**: Edge Function 재배포 불필요. SECURITY DEFINER 함수(admin_set_surface_config)로 토큰 검증 후 쓰기 → 마이그레이션만으로 백엔드 완결.
- **완료(코드·프론트)**: supabaseClient `.rpc` 전환, CoverageSection 토큰 게이팅(미인증 시 운영콘솔 로그인 안내), adminApi ADMIN_TOKEN_KEY. 5렌즈 적대적 보안검토 통과 + 지적 반영(008/009 분리·인증/입력 구분·토큰형식·note캡·감사로그·statement_timeout).
- **⏳ 남은 1스텝(소유자 DB 실행)**: Supabase SQL 편집기 **새 탭**(기존 비번리셋 쿼리 건드리지 말 것)에서
  1. `supabase/migrations/008_surface_config_lockdown.sql` 전체 실행(추가형·즉시 안전). **이걸 실행해야 신 프론트의 트리아지 쓰기가 동작**(미실행 시 rpc 없음→관리자 트리아지 실패).
  2. GitHub Pages 배포 완료 + 하드리프레시 후 `009_surface_config_drop_anon_writes.sql` 실행(anon 쓰기 정책 제거 = 취약점 완전 차단).
  3. 검증: `SELECT polname FROM pg_policies WHERE tablename='surface_config';` → allow_read_surface_config 만 남아야. anon 직접 INSERT/UPDATE 시도 → 거부 확인. (관리자 로그인 후 /data-pipeline 트리아지 정상 동작 확인)
  - ※ 자동모드 분류기가 claude의 프로덕션 DB 쓰기를 차단 → 소유자가 직접 실행하거나 크롬 실행을 명시 재인가해야 함.

### 남은 항목
- [MED·소유자/RLS] page_views/feature_requests/ai_insight_chat 공유 session_id anon SELECT 상관(RLS 강화+함수 경유 필요).
- [LOW·잔여하드닝(검토 지적)] 관리자 토큰이 localStorage(JS접근)에 있고 공개 /data-pipeline에서 읽힘 → XSS/기기탈취 시 토큰 재생(2차침해 전제, 핵심 잠금엔 영향X). 근본 완화는 HttpOnly 쿠키 인증 전환(admin 인증모델 전반 개편) — 별도 과제. (note는 JSON.parse·escaped 렌더라 stored-XSS 싱크 아님 확인)
- [LOW·데이터파이프라인] EPS 산업 합계가 byCountry 합산 / 다문화·status 변환에 '계'(합계행) 가드 부재 → `build_real_data.mjs` 수정 + 데이터 재생성·검증 필요(최저 우선).

### 🔍 5영역 개선 감사 [2026-06-23] — 우선순위 로드맵
- ✅ **[성능 완료] realData 클라 번들 7.7M→303K** (커밋 bb06019·d45f7ce): Header prop화 + RegionMap·SigunguBarChart·SidoScoreCompositionChart를 prop 기반으로 전환해 regionAggregates/opportunityReal 서버 전용화 → 거대 배열 트리셰이킹. 빌드 검증.
- ✅ **[보안·HIGH 완료, 2026-06-25 커밋 c28d7c0]** ① insight-ai IP 레이트리밋(시간당 20회·010 `insight_ai_rate_check`)+입력상한 ② `source_candidates` 익명쓰기 차단(010 `admin_set_candidate_status` SECURITY DEFINER + 011 anon write/insert DROP + 프론트 `.rpc` 전환). **⏳ 소유자**: 010 적용 → insight-ai 재배포 → 프론트 배포·캐시만료 후 011 적용. (③ ai_insight_chat anon DELETE/SELECT, ④ page_views/feature_requests anon SELECT — MED 잔여.)
- **[신뢰성·HIGH]** ✅ 순수함수 테스트 도입(maskSmallCell·normalize·score·build_real_data) — node:test 17건(커밋 adb71d6)+`score.ts` vitest 스캐폴드(커밋 47528ab, 소유자 `npm i -D vitest`). ⏳ **잔여(소유자)**: CI(pages.yml)에 `npm run typecheck`/`npm test` 단계 추가 + data:ci continue-on-error 보완.
- ✅ **[데이터파이프라인·MED 완료, 커밋 adb71d6·a49fb3f]** ① build_real_data per-source 변환 가드(`safe`, 단일 예외→배치 전면중단 해소) ② HTML→CSV 오저장 감지(build_real_data·build_generic_data 양쪽 `looksLikeHtml` 가드). ('계' 합계행 가드는 LOW 잔여.)
- ✅ **[SEO/a11y·HIGH 완료, 2026-06-25 커밋 a10d6fc]** `lib/seo.ts`(라우트별 title/description 단일 출처)+12개 공개 페이지 metadata·root layout(title template·OG·metadataBase·canonical·`app/icon.svg`)·`app/sitemap.ts`/`robots.ts`(정적 export, /admin 제외)·`app/admin/layout.tsx`(noindex)·`app/not-found.tsx`·`app/error.tsx`·차트 27개 인스턴스 `role="img"`+aria-label. tsc=0.
- **[코드품질·MED]** ESLint 전무, xlsx@0.18.5 취약점(devDep 이동), 죽은 export(sampleFinanceAggregates·sampleRegionInsights), 고아 .ts 4종, page.tsx 806줄+BarList 저활용 중복.
- (잔여 성능: recharts 280K 동적import·genericData lazy — 8MB 해결로 우선순위 낮아짐)

### 📰 매일 금융 인사이트 제안 [2026-06-23, 커밋 5fbce0d] — 프론트/생성기 완료 · 소유자 2스텝
- `scripts/build_insight_digest.mjs`: 수집 catalog 인벤토리 + Claude(opus-4-8) 웹검색 → 은행·캐피탈 인사이트 4~6건/일 → `lib/data/generated/insightDigest.json`(최근 30일 누적). 키 없으면 데이터 폴백, 항상 exit 0. `data:ci`·`daily_data_batch`에 단계 추가.
- `components/ai/InsightDigest.tsx` → 금융 인사이트 페이지 '오늘 + 지난 인사이트(히스토리)'.
- **⏳ 소유자 2스텝**:
  1. **GitHub Actions 시크릿에 `ANTHROPIC_API_KEY` 추가** (Settings→Secrets→Actions). 없으면 CI는 수집데이터 폴백만 생성.
  2. **`.github/workflows/pages.yml` 변경 적용** — OAuth workflow 스코프 제한으로 claude가 푸시 못함. 로컬 워킹트리에 diff 대기 중(env에 `ANTHROPIC_API_KEY` 줄 + commit file_pattern에 `lib/data/generated/insightDigest.json`). 소유자가 직접 커밋·푸시.
  - 로컬 수동 생성/테스트: `ANTHROPIC_API_KEY=... npm run data:digest`.

### 🌐 AI 웹 발굴 에이전트 [2026-06-25, 커밋 adb71d6] — 프론트/스크립트 완료 · 소유자 2스텝
- `scripts/discover_web_sources.mjs`: Claude+웹검색으로 data.go.kr 밖(KOSIS·법무부·통계청·OECD·UNESCO·ILO·고용정보원·MDIS 등)까지 외국인 데이터 후보를 발굴 → `lib/data/generated/webDiscoveredSources.json`(시드 58건·9도메인). 키 없으면 기존 유지·exit 0.
- **안전**: 리드는 '수동 검토용 외부 후보'다. 수집기는 아는 타입(file/openapi/kosis/ecos/seoul)만 수집 → 임의 웹 URL 자동 ingest 안 됨(SSRF 방지). `/data-pipeline` 'AI 웹 발굴 리드' 섹션(`components/data/WebDiscoverySection.tsx`)에 도메인별 렌더. `data:ci`·`data:discover` 배선.
- **⏳ 자동발굴 켜기 = 소유자 3스텝** (코드는 이미 배선 완료 — discover가 `data:ci` cron 01:00 KST에 포함. claude는 pages.yml/시크릿 불가). insight digest와 동일 키라 함께 켜짐:
  1. **GitHub Actions 시크릿 `ANTHROPIC_API_KEY` 추가** (Settings→Secrets→Actions).
  2. **`pages.yml` 잡 env(현재 23~29줄)에 1줄 추가** — 이게 있어야 `data:ci`의 discover·digest가 키를 봄:
     ```yaml
     ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
     ```
     (SUPABASE_SERVICE_ROLE_KEY·KOSIS 등은 이미 잡 env에 있음 → 발굴 결과의 승인 큐 적재도 정상. 011 적용 후에도 service_role이라 문제없음.)
  3. **`pages.yml` auto-commit `file_pattern`에 2줄 추가** — 매일 발굴/인사이트 결과가 커밋되도록:
     ```
     lib/data/generated/webDiscoveredSources.json
     lib/data/generated/insightDigest.json
     ```
  → 켜면 매일 01:00 KST에 자동 웹발굴 → JSON + `/admin` 승인 큐 적재. **크롬 수동 발굴 불필요.**

### 🔎 크롬 웹발굴 발견 [2026-06-30] — 한국부동산원 전국 외국인 부동산 거래(고가치·자동수집 불가)
- 크롬으로 data.go.kr 직접 탐색(소득/카드/송금/토지/주택). **금융거래(카드·송금) 직접 데이터는 공공포털에 사실상 없음**(민간영역) 재확인.
- **최대 발견**: **한국부동산원_부동산거래현황_외국인거래** 시리즈 = 전국·국가승인통계(제315003호)·집계, **토지·순수토지·건축물 × 월별/연도별**(datasetId 15068462·15068596·15068321·15068093 등). 외국인 부동산 매입 = 자산·정주형 금융수요의 강한 신호로, 현재 제주만 있는 부동산 데이터를 **전국으로 확장**할 최고 후보.
- ⚠️ **자동수집 불가**: 전부 `제공형태=기관자체 다운로드(외부 URL, reb.or.kr)` → data.go.kr 직접파일 아님 → 일반 file 수집기는 HTML 받아 가드로 스킵. `webDiscoveredSources.json`에 **검토 리드**로 등록(‘AI 웹 발굴 리드’ 패널 노출).
- **후속(선택)**: REB(reb.or.kr) statPage 전용 수집기 or 수동 주기 다운로드로 통합 시, 대시보드 ‘소비·금융거래/자산’ 도메인이 크게 강화됨. (직접 다운로드 가능한 건 지자체 조각뿐: 인천 서구·연수구·대구 서구 외국인 부동산 거래 통계 — 커버리지 작아 우선순위 낮음.)
- ✅ **발굴 리드 → 정식 소스 승격 (2026-06-25 커밋 a49fb3f)**: 자동수집 가능·집계·PII낮음 7종(법무부 체류·국적취득 15100013/47/46, 국립국제교육원 TOPIK·HURIK 3059526/15067926/15069776, 근로복지공단 산재 15104688)을 `data_sources.mjs`에 verified:false로 등록 → 다음 CI 배치에서 실수집 검증. 산업재해 마이크로데이터(15127634·식별변수)는 제외. ⏳ **잔여**: CI 수집 성공분 verified:true 승격 + 큐레이션 transform 연동(현재는 범용 뷰어 노출).

### ✅ 신뢰성·데이터·코드품질 [2026-06-25, 커밋 adb71d6]
- **[신뢰성]** `build_real_data` 순수함수 `node:test` 17건(maskSmallCell·normalize·숫자파싱·비자분류·wide감지·KOSIS중복제거·급락감지) + `npm test`(node --test, 추가의존 0). ※ `score.ts`(확장자없는 상대 import)는 TS 로더 필요 → 후속(vitest). CI에 테스트/typecheck 단계 추가는 소유자(pages.yml).
- **[데이터]** `build_real_data` per-source 변환 가드(`safe`) — 단일 소스 변환 예외가 배치 전면중단시키던 문제 해소(last-good/기본값 격리). HTML→CSV 오저장 감지(거짓 성공 차단). `realDataSummary.transformErrors` 노출.
- **[코드품질]** 죽은 export 2종(sampleFinanceAggregates·sampleRegionInsights)+연쇄 미사용 import 제거, 고아 .ts 5종 삭제(ingest_* 3·calculate_scores·utils/region).
