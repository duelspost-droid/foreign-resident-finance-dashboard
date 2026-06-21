# Claude Code Handoff

> **최신 상태(2026-06-22)는 `docs/latest-handoff.md` + `docs/next-tasks.md`를 먼저 보세요.** 아래 세션 이력은 ~06-16 기준이라 일부 stale입니다(이후 작업: 제안위젯 공개이력·미연동 1클릭 트리아지·홈 '추가 데이터' 범용 자동차트·SURFACED 정확도 감사·9페이지 모바일 감사·Supabase 마이그레이션 002~007 전부 적용+Edge Function 활성화 — latest-handoff 참조).

## 프로젝트

- 이름: 국내거주 외국인 금융 인사이트 대시보드
- 경로: `/home/user/foreign-resident-finance-dashboard` (리모트 환경) / `C:\tmp\foreign-resident-finance-dashboard` (로컬)
- GitHub: `https://github.com/duelspost-droid/foreign-resident-finance-dashboard`
- 브랜치: `main` (개발 완료 후 통합됨)
- 스택: Next.js 16 App Router, TypeScript, Tailwind CSS, Recharts, Supabase (옵션)
- 목적: 개인 단위 정보가 아닌 집계 통계로 외국인 금융 시장 기회를 분석하는 B2B 대시보드

## 작업 이력 (세션별, 최신순)

### 2026-06-16 세션 (이어서) — KOSIS objL 근본해결 + API 연동 6종 추가 (유학생·EPS·금융)

사용자가 KOSIS·DATA_GO_KR 키를 `.env.local`(브라우저 마이페이지에서 복사)로 제공 → 보유 키로 실검증하며 작업. (KOSIS 키는 base64 끝 `=` 누락 주의.)

1. **KOSIS objL 문제 근본해결** (커밋 `cee9755`): KOSIS가 비표준 JSON(키 따옴표 없음) 반환 → `JSON.parse` 실패 → itmId/objL=ALL 폴백 → "필수요청변수값 누락(objL)". 수정(`fetch_public_data.mjs`): `parseKosisJson`(관대한 파서) + `getMeta(ITM)`에서 항목 itmId·분류 실코드 추출(`getMeta(OBJ)`는 err30이라 미사용) + Param 엔드포인트 + `getMeta(PRD)` END_PRD_DE로 최신연도 + 40k셀/URL 길이 가드. 검증: TX_11025 5,580·DT_1B040A11 24,210·경제활동 429행. 읍면동 DT_110025_A033_A는 분류 3,957개로 URL 초과 → `skipped_too_large`(페이지네이션 필요).

2. **병렬 발굴 워크플로 2개**(발굴→독립검증)로 외부 원천 확정 → **KOSIS 6종 신규 등록**(커밋 `4826c71`·`8e8a63a`, 모두 보유 키로 실검증):
   - 유학생 국적×성별×학위 `DT_1B040A14`(법무부 111) 18,188행 — 폐기된 교육부 file 15050054 대체
   - KEDI 고등교육 외국인유학생 `DT_1963003_010_S`(org 334) 1,224행 — 15050055 대체 (대학유형 분해: `_011_S` 전문대·`_013_S` 대학·`_014_S` 대학원 등)
   - EPS 국가별 도입 `DT_11827_N001`(org 118) 169행 · 업종별 `DT_11827_I001` 64행 — 폐기된 고용노동부 file 대체
   - 외국인 임금분포 `DT_2FC001F`(통계청 101) 863행 · 고용계약기간 `DT_2FC002F` 624행 — 금융 소득 핵심 지표

3. **정리/정정**: 죽은 소스 비활성화(교육부 file 2·고용노동부 EPS file·국민연금 15005710=외국인 데이터 아님, 국적 차원 없는 오라벨). ECOS statCode 정정(이전소득수지 021Y205/301Y017 → **301Y013** A/M; 환율 일별 731Y001 정확; 월평균 **731Y004** 추가 권장; 거주자외화예금 104Y014는 ECOS API 미존재=폐기 권고) — 단 ECOS는 `ECOS_API_KEY` 미보유로 skipped.

**블로커 / 소유자 작업 필요**:
- **data.go.kr openapi REST는 API별 '활용신청(구독)' 필요** → 행안부 openapi(정답 endpoint=`apis.data.go.kr/1741000/ForeignLocalGovernmentsYear/getForeignLocalGovernmentsYear`, datasetId 15107331, 403)·국민연금 모두 미구독. file 다운로드는 신청 불필요(정상). 시군구 외국인주민은 file 3079542(1,692행)로 이미 커버.
- **`ECOS_API_KEY` 미발급** → 송금/환율 거시지표(301Y013·731Y001·731Y004) 활성화 대기. statCode는 확정됨.
- 외국인 **송금 직접표**(KOSIS DT_2FI004F 송금여부·DT_2FI005F 송금액·DT_2FI001F 월총소득 등)는 격년/3년 주기라 KOSIS Param API 미노출(statHtml 전용) → 자동수집 불가, 파일/수동 경로 필요.
- data.go.kr file 금융 후보(대전 유성구 외국인 카드소비·면세점 국적별 매출·근로복지공단 국가별 보험급여)는 검증됨이나 관광/면세 성격 — 필요 시 추가 등록 가능(워크플로 결과 보관).

검증 명령: `node --env-file=.env.local scripts/fetch_public_data.mjs` → downloaded 21/30(KOSIS 9종 포함). 현재 `main` = origin/main +여러 커밋(소유자 직접 push).

### 2026-06-16 세션 (opus, Mac 로컬) — origin/main 동기화 + 수집 실패 분류 + 키/푸시 블로커

사용자 지시: "수집기 다시 배치 돌려 되는거/안되는거 확인" → "안되는 거 고치고 / 오늘 데이터 커밋 / 백엔드 배치" → "작업 기록을 원격에서도 공유 가능하게".

**상황**: 이 Mac 로컬 체크아웃(`~/Documents/Claude/Scheduled/foreign-resident-finance-dashboard`)이 origin/main보다 **95커밋 뒤** + 커밋 안 된 6/15 Supabase 스캐폴드 포크가 갈라져 있었음.

1. **동기화**: 로컬 미커밋 변경을 `git stash`(stash@{0}, untracked 포함)로 보존 → `main`을 origin/main(`0d87c0f`)으로 fast-forward. ⚠️ stash@{0}에 6/15 로컬 스캐폴드(app/data-ops·supabase/functions·002 migration 등)가 들어있음 — 필요시 `git stash branch <name> stash@{0}`로 복구.

2. **현재 실패 분류** (마지막 CI 배치 `0d87c0f`, catalog 2026-06-16T00:14Z, 27소스):
   - ✅ 13 downloaded (법무부 3·여가부·건보 2·통계월보·행안부 1,692·교육부 지역/최신·대학알리미 2·KOSIS 경제활동 429)
   - ❌ KOSIS 3: 시도별 `TX_11025_A000_A`·법무부 `DT_1B040A11` = objL 누락; 읍면동 `DT_110025_A033_A` = "데이터가 존재하지 않습니다"
   - ❌ metadata_without_file 4: 교육부 국적별(15050054)·대학유형별(15050055)·국민연금(15005710)·고용노동부 EPS(15032256)
   - ❌ no_data 1: 행안부 openapi 시군구(`mois_foreign_resident_by_region_api`)
   - ⏭️ skipped_no_key 6: ECOS 5 + 서울 1

3. **file 소스 실측 진단(키 불필요)**: 15050054=다중파일+변수형 버튼(`fn_fileDataDown(self.publicDataPk, self.publicDataDetailPk)`)이라 `extractDetailPk`(5-arg 정규식) 매칭 실패; 15050055/15032256=페이지 uddi가 실제 다운로드 pk 아님(`selectFileDataDownload.do`가 JSON 아닌 HTML 반환→metadata_failed, `/download/{pk}/fileData.do`=404); **15005710=파일 아님, openapi 전용 데이터셋(`type:"file"` 오설정)**. → 교육부/고용노동부 file은 파일목록 AJAX 리버스 필요(낮은 우선순위, 유학생 데이터는 동작 소스로 커버됨).

4. **환경/블로커**: 이 Mac엔 system node/npm 없음 → 번들 노드 `/Users/hk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`(v24, `--env-file` 지원). KOSIS_API_KEY·DATA_GO_KR_SERVICE_KEY는 GitHub Secret이라 로컬에 없어 KOSIS/openapi 로컬 검증 불가. **푸시 불가**: `gh` 미설치 + osxkeychain에 github 자격증명 없음.

5. **사용자 결정**: (a) 기존 KOSIS·DATA_GO_KR 키를 `.env.local`(gitignore됨, 템플릿 생성함)에 직접 입력해 로컬 검증; (b) 배포는 "커밋 준비 → 소유자 직접 푸시". ECOS·서울 키 발급은 보류.

**다음 세션 TODO** (키 입력 후):
- 실행: `node --env-file=.env.local scripts/fetch_public_data.mjs`
- KOSIS `TX_11025`·`DT_1B040A11`: statisticsData.do 경로에서도 실제 OBJ 코드 조회(getMeta type=OBJ) 후 objL 전달 (현재 코드는 Param 엔드포인트일 때만 OBJ 조회 → statisticsData.do는 objL=ALL 누락 오류)
- KOSIS `DT_110025`: `startPrdDe=endPrdDe=CY`(2026, 무데이터) → 최근 기간(newEstPrdCnt 또는 CY-2~CY)
- 행안부 openapi: endpoint/params 실응답으로 확정, 0행 해소
- 국민연금 15005710: `type:"file"`→`openapi`(DATA_GO_KR 키, operation 확인)
- ECOS 5 + 서울 1: 키 발급 시 활성화(statCode/serviceName 실응답 확정)
- 수정 후 `build_real_data.mjs` 정제 검증 → 커밋(소유자 푸시)

### 2026-06-15 세션 (이어서) — 관리자 승인 워크플로 + 수집 성공 확인
사용자 지시: "매일 새로 조사를 해서 반영할 데이터를 관리자페이지에서 승인받고 등록". 승인 저장 방식=**Supabase 기반** 선택.

1. **수집 실제 성공 확인** (네트워크 회복): run 결과 16개 중 11개 다운로드 — 행안부 지자체 외국인주민 1,692행, 통계청 경제활동인구 376행(**KOSIS 2단계 검증됨**), 법무부 3종, 통계월보, 다문화, 건강보험 등. 실패 5개: KOSIS TX_11025/DT_110025/DT_1B040A11(api_error, 테이블별 파라미터 필요), 교육부 유학생(파일없음), 행안부 openapi(0건).
2. **승인 워크플로 구축 (Supabase)**:
   - `supabase/schema.sql`: `source_candidates` 테이블(status pending/approved/rejected, target_table, priority, rationale) + RLS.
   - `lib/data/supabaseClient.ts`: `fetchSourceCandidates`, `updateCandidateStatus`.
   - `app/admin/page.tsx`: 관리자 승인 페이지(client) — 승인 대기 큐/승인·거부 버튼/대상 테이블 지정/처리 이력. Supabase 미연결 시 조사노트 후보 읽기전용 fallback.
   - `scripts/sync_candidates.mjs`: 발굴 후보→Supabase 큐 upsert(pending), 승인 목록→`data/registry/approved_candidates.json` 내려받기. 미연결 시 `pending_candidates.json` 스냅샷만(no-op).
   - `scripts/fetch_public_data.mjs`: `loadApprovedCandidateSources()` — 승인된 후보를 동적 소스로 수집(승인→다음 배치 자동 등록).
   - `scripts/daily_data_batch.mjs`: fetch→**sync_candidates**→build 순서.
   - `components/layout/Sidebar.tsx`: "관리자 승인"(ShieldCheck) 메뉴.
   - `pages.yml`: 승인 레지스트리 auto-commit 추가, build에 NEXT_PUBLIC_SUPABASE_URL/ANON_KEY 주입(anon만, service_role 금지).
   - **흐름**: 매일 배치 발굴 → 관리자 페이지 승인 → 레지스트리 기록 → 다음 배치 자동 수집.
   - **활성화 조건**: Supabase 프로젝트 생성 → schema.sql 적용 → GitHub Secrets에 SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 등록. 미설정 시 관리자 페이지는 "미연결" 읽기전용.

### 2026-06-15 세션 (이어서) — 데이터 출처 2차 확장 (경제·금융·4대보험)
사용자 지시: "더 많은 데이터 원해, 가져올수 있는 정보 찾아봐".
- 소스 16개로 확장(file 11/kosis 4/openapi 1), 발굴 키워드 12개. 상세는 `docs/data-sources-research.md` 2차 조사 섹션.
- **오라벨 정정**: 이전에 `DT_110025_A033_A`를 "국적별 등록외국인"으로 잘못 등록 → 실제는 "읍면동별 지역 외국인주민" (region 매핑으로 수정).
- 신규 KOSIS: `DT_1B040A11`(법무부 111, 시군구×체류자격), `DT_2FA002F`(통계청 101, 경제활동인구=취업·소득).
- 신규 건강보험: `15138933`(내외국인 보험료 부과·급여=소득지표), `15095076`(외국인 적용인구 직장/지역).
- 미등록 후속 후보: 국민연금 openapi 15005710, KOSIS DT_56701_B000011/DT_1DA7012, 서울 열린데이터광장(별도 키).
- 검증은 네트워크 차단 해제 후 예약 런에서 확인 필요(아래 참고).

### 2026-06-15 세션 (이어서) — 수집 실행 + 네트워크 차단 진단
사용자 지시: "수집하자".

진행:
1. **KOSIS 2단계 수집 구현**(`fetch_public_data.mjs`): `getMeta(type=ITM)`로 itmId 조회 → `statisticsParameterData.do` 호출. 실패 시 ALL 폴백, 단계별 로깅.
2. **신규 소스 등록**(총 12개): 행안부 외국인주민 file(3079542), 교육부 국적별 유학생 file(15050054), KOSIS 국적별 등록외국인 DT_110025_A033_A.
3. **런타임 바운드**(`fetch_public_data.mjs`+`pages.yml`): fetchWithRetry 15s×2회(env FETCH_TIMEOUT_MS), fetch 단계 `timeout-minutes:8`+`continue-on-error`(수집 실패가 배포 차단 안 함).
4. **수집 런 실행 결과 (run #15, 커밋 89da3a3 카탈로그)**: ⚠️ **전 소스 `fetch failed`** — GitHub Actions 러너가 한국 정부 서버(data.go.kr/kosis.kr/apis.data.go.kr)에 **도달 자체 실패**. 평소 잘 받던 법무부 CSV도 동일 실패 → 코드 문제 아님(네트워크 차단/타임아웃). 행안부 openapi만 status=500(서버 도달, 오퍼레이션 오류).
   - **원인 추정**: 오늘 14+회 런으로 GitHub IP가 일시 rate-limit/차단된 것으로 추정(오전 초기 런 #1~9는 CSV 정상 다운로드 400/380/42행).
   - **영향 없음**: 대시보드는 이전 성공 수집분(realData.ts 커밋)으로 실데이터 계속 표시.
   - **KOSIS 2단계 미검증**: getMeta도 네트워크 실패라 로직 확인 불가. 차단 풀린 뒤 재확인 필요.

**결정(사용자)**: 추가 재시도 안 함. **매일 18:30 UTC 예약 런**(다른 시점·IP)에서 네트워크 회복 시 자동 수집되길 대기.
**다음 세션 확인사항**: 18:30 UTC 이후 run 의 `latest_fetch_catalog.json` 확인 → 한국 서버 도달 회복 여부, KOSIS 2단계(itmIdSource=getMeta 성공?), 신규 file 소스 다운로드 여부. 회복됐는데 KOSIS 여전히 실패면 `getMeta` 응답 필드명(ITM_ID) 실제값 확인.

### 2026-06-15 세션 (이어서) — 출처 조사 + 수집기 메뉴 분리
사용자 지시: "어디서 더 많은 정보를 가져와야할지 면밀하게 찾아봐" / "수집기가 정보 가져오는건 별도 메뉴로 분리해서 관리".

완료:
1. **신규 데이터 출처 조사** → `docs/data-sources-research.md` 작성
   - ★최우선: 한국은행 ECOS OpenAPI(국제수지·개인송금, 키 별도 발급 필요), 금융위 금융공공데이터(국내은행 통계, 기존 키)
   - KOSIS 실패 원인 규명: `statisticsData.do`+`ALL` 대신 `getMeta`로 itmId/objL 코드 조회 후 `statisticsParameterData.do` 2단계 호출 필요. 신규 테이블 DT_110025_A033_A(국적별 등록외국인) 발견
   - data.go.kr 발굴 후보 file/openapi 수십 개 목록화(미등록)
2. **발굴 키워드 확장** (`scripts/data_sources.mjs` discoveryQueries): 한국은행 송금/금융위 은행통계/외국인 환전 3종 추가
3. **수집기 메뉴 분리**: `/data-sources`에서 파이프라인 관리 부분을 신규 `/data-pipeline`(수집 파이프라인)로 이동
   - `app/data-pipeline/page.tsx`: 배치 실행 상태 바, 수집 요약 카드, lineage 테이블, 출처별 상세(요청 URL/오류), 발굴 후보
   - `app/data-sources/page.tsx`: 출처 정의·한계 큐레이션만 유지 + 파이프라인 바로가기 카드
   - `components/layout/Sidebar.tsx`: "수집 파이프라인"(DatabaseZap) 메뉴 추가
   - typecheck/build 통과, `/data-pipeline` 라우트 정상 등록

다음 작업 후보: docs/data-sources-research.md "다음 작업 권장 순서" 참고 (file 후보 일괄 등록 → KOSIS 2단계 호출 → ECOS collector 신규).

### 2026-06-15 세션 (claude-sonnet, session_012cb25b)
사용자 지시: "외국인 정보 모든정보를 api 등을 통해서라도 전부 가져오자" /
"홈페이지 디자인이 난해하다 … 분석가 관점에서 쉽게 확인할수 있도록 도표나 통계를 넣어 디자인 확 변경" /
"작업기록 모두 저장해서 다른 PC에서 이어서 작업 가능하게".

완료한 것:
1. **홈페이지 전면 재디자인** (`app/page.tsx`) — 커밋 `4acb9c5`
   - 다크 KPI 스트립(총 체류외국인/등록외국인/유학생/평균 기회점수, YoY 표기)
   - 3열 그리드: ① 지역별 기회점수 순위(점수 바) ② 국적 분포(가로 막대 + Recharts 막대) + 체류자격 세그먼트(범례 + 도넛) ③ 월별 추세선 + 자동 인사이트
   - 하단 기회점수 상세 테이블(`RankingTable`)
   - 인라인 컴포넌트 `ScorePill`, `ScoreBar`, `SectionHeader` (page.tsx 내부 정의)
   - 미연결 `FilterBar` 홈에서 제거
   - `app/dashboard/page.tsx` 는 `export { default } from "../page"` 라서 같이 변경됨
2. **KOSIS 키 마스킹 버그 수정** (`scripts/fetch_public_data.mjs` 276행) — `encodeURIComponent(apiKey)` 치환 추가. 이전엔 base64 키가 카탈로그에 평문 노출됨.
3. **신규 파일 소스 4종 추가** (`scripts/data_sources.mjs`) — 고용노동부 15137198·15137115, 여성가족부 15054868, 법무부 월보 3069975 (모두 verified:false).
4. **CI run #10 결과 분석**: 일시적 네트워크 장애로 전 소스 "fetch failed"(법무부 CSV 포함) → cached raw 사용. 단, 행안부 openapi `getForeignResidentInfo` 는 HTTP 200(0행) 반환 — 이전 `getStatisticsForeignResidentInfo` HTTP 500 대비 진전. KOSIS 는 network fail 로 파라미터 검증 불가.
5. 커밋 `4acb9c5` 푸시 완료 → CI run #11 트리거됨(결과 미확인).

다음 세션에서 **가장 먼저 할 것**: CI run #11(또는 최신) 의 `data/catalog/latest_fetch_catalog.json` 확인 →
- KOSIS `itmId/objL` 파라미터로 `필수요청변수값 누락` 해결됐는지
- 행안부 openapi 가 행 반환하는지(여전히 0행이면 발굴 후보 openapi 15057877/15108065 시도)
- 신규 파일 소스 4종 다운로드 성공 여부

확인 명령:
```bash
git pull origin main
git show HEAD:data/catalog/latest_fetch_catalog.json | python3 -c "
import json,sys
cat=json.load(sys.stdin)
for s in cat['sources']:
    r=s.get('result',{}); st=r.get('status','?')
    print(('✅' if st in('downloaded','cached') else '❌'), st, s['provider'], s['title'], r.get('rowCount',''), r.get('reason',''))
"
```

## 현재 구현 상태 (2026-06-15 기준)

### 완료된 항목
- Next.js App Router 기반 전체 라우트 구현
  - `/` · `/dashboard` · `/regions` · `/nationalities` · `/universities`
  - `/visa-segments` · `/opportunity-scores` · `/data-sources` · `/compliance`
- 좌측 사이드바 + 상단 헤더
- `app/page.tsx`: 분석가용 홈 대시보드 (다크 KPI 스트립 + 3열 도표 그리드 + 상세 테이블) — 2026-06-15 재디자인
- `components/charts/RegionMap.tsx`: SVG 버블맵 (선형 메르카토르 투영, 17개 시도 거품 크기=인구, 색상=점수)
- `public/data/korea_regions.geojson`: 17개 시도 중심점 GeoJSON (Point 형식)
- `lib/data/supabaseClient.ts`: `fetchRegionData`, `fetchForeignResidentStatus`, `fetchFinanceSegments`, `fetchUniversityData` (Supabase 없을 때 null 반환, graceful fallback)
- `lib/data/generated/realData.ts`: 법무부 CSV 3종 실제 데이터 포함 (빌드 시 자동 생성)
- `lib/data/generated/dataLineage.ts`: 데이터 수집 이력 자동 기록
- `scripts/fetch_public_data.mjs`: 공공 데이터 수집기 (file/openapi/kosis 타입 지원)
- `scripts/build_real_data.mjs`: CSV+JSON → TypeScript 변환기
- `scripts/data_sources.mjs`: 데이터 소스 카탈로그 (현재 8개 소스 등록)
- `.github/workflows/pages.yml`: GitHub Actions CI/CD (매일 18:30 UTC 자동 수집·빌드·배포)
- GitHub Secrets 등록 완료: `KOSIS_API_KEY`, `DATA_GO_KR_SERVICE_KEY`
- 데이터 소스 페이지: 수집 이력, 요청 URL, 발굴 후보 표시

### 데이터 파이프라인 현황

**성공 (매일 자동 수집)**
| 소스 | 행수 | 상태 |
|------|------|------|
| 법무부 체류외국인 국적·자격별 현황 (3045188) | 400행 | ✅ downloaded |
| 법무부 외국인체류데이터 (3069963) | 380행 | ✅ downloaded |
| 법무부 연도별 외국인 유학생 (15100038) | 42행 | ✅ downloaded |

> 참고: 법무부 CSV 3종은 정상 동작하나 CI run #10 에서는 일시적 네트워크 장애로
> 전 소스 fetch failed → cached raw 로 폴백됨. run #11 이상에서 재확인 필요.

**미해결 (API 조회 실패 중)**
| 소스 | 최근 오류 | 시도 중인 수정 |
|------|------|----------------|
| KOSIS 행안부 시도별 외국인주민 (TX_11025_A000_A) | `필수요청변수값이 누락` → run #10 은 network fail 로 미검증 | `itmId=ALL, objL1=ALL, objL2=ALL` 추가됨 (run #11 에서 검증) |
| 행안부 openapi (1741000/StatisticsForeignResident) | HTTP 200·0행 (run #10) — 이전 HTTP 500 보다 진전 | operation `getForeignResidentInfo`. 0행 지속 시 발굴 후보 15057877/15108065 시도 |

**새로 추가된 (미검증)**
| 소스 | datasetId | 상태 |
|------|-----------|------|
| 고용노동부 외국인 고용 현황 | 15137198 | verified: false |
| 고용노동부 외국인 취업자 현황 | 15137115 | verified: false |
| 여성가족부 다문화가족 현황 | 15054868 | verified: false |
| 법무부 출입국 외국인 통계월보 | 3069975 | verified: false |

### API 키 현황
- **KOSIS_API_KEY**: GitHub Secret 등록 완료. **보안 경고**: 이전 CI 수집 카탈로그(`data/catalog/latest_fetch_catalog.json`)에 키가 평문으로 노출되었음(마스킹 버그로 인해). 키 재발급 권장.
- **DATA_GO_KR_SERVICE_KEY**: GitHub Secret 등록 완료.
- 마스킹 버그는 2026-06-15에 수정됨 (`encodeURIComponent(apiKey)` 치환 추가).

## 중요한 제약 (보안·개인정보)

- 개인 단위 외국인 데이터 결합 금지
- 외국인등록번호, 여권번호, 국내거소신고번호, 이름, 전화번호, 상세주소, 계좌번호 사용 금지
- 내부 금융 데이터는 지역·월·국적·세그먼트 단위 집계값만 허용
- 소수 셀은 마스킹 또는 상위 분류 병합 필요

## 다음 해야 할 일 (우선순위 순)

### 즉시 (API 연동 완성)
1. **KOSIS TX_11025_A000_A 확인**: CI run #10 결과 확인 후
   - 성공 시 → `verified: true`로 변경, `responseMapping` 필드명 실제 응답으로 확정
   - 실패 시 → KOSIS `metaData.do` API 호출해 테이블 분류코드 조회 후 재시도
     ```
     GET https://kosis.kr/openapi/metaData.do?method=classificationId&apiKey=...&orgId=110&tblId=TX_11025_A000_A&format=json
     ```
2. **행안부 openapi 확인**: CI run #10 결과 확인 후
   - 성공 시 → `verified: true`, 필드명 확정
   - 실패 시 → data.go.kr 발굴 결과의 다른 openapi 소스 시도 (15057877, 15108065)

### 단기
3. **API 키 재발급**: KOSIS와 data.go.kr 키 모두 재발급 후 GitHub Secrets 업데이트
4. **새 파일 소스 검증**: CI 결과에서 15137198·15137115·15054868·3069975 다운로드 확인
5. **Supabase 연동**: Supabase 프로젝트 생성 → `supabase/schema.sql` 적용 → 환경변수 설정 → 페이지에서 `fetchRegionData()` 등 호출 연결

### 중기
6. **대시보드 페이지에 실제 데이터 연결**: 현재 `lib/data/generated/realData.ts` 임포트는 되나 페이지 컴포넌트에서 mock 대신 실제 데이터 사용하도록 교체
7. **지역 페이지 제목 교체**: `/regions` 페이지에 "placeholder" 텍스트 남아있음
8. **FilterBar 상태 연결**: 필터 UI가 차트에 실제로 반영되지 않음

## 파일 구조 핵심

```
scripts/
  data_sources.mjs         ← 소스 카탈로그 (수정 시 이 파일만)
  fetch_public_data.mjs    ← 수집 실행기 (file/kosis/openapi 콜렉터)
  build_real_data.mjs      ← CSV+JSON → TypeScript 변환기

lib/data/
  generated/
    realData.ts            ← 자동 생성 (git commit됨, 편집 금지)
    dataLineage.ts         ← 자동 생성 (git commit됨)
  supabaseClient.ts        ← Supabase 조회 함수

components/charts/
  RegionMap.tsx            ← SVG 버블맵 ("use client" 필요)

public/data/
  korea_regions.geojson    ← 17개 시도 중심점

.github/workflows/
  pages.yml                ← CI/CD (매일 18:30 UTC)

data/catalog/              ← .gitignore 제외, 최신 카탈로그 커밋됨
  latest_fetch_catalog.json
```

## 검증 기준

```bash
npm install          # 성공
npm run typecheck    # 성공
npm run build        # 성공
npm run data:all     # 성공 (법무부 CSV 3종 다운로드)
npm run dev -- -p 3000  # 실행 후 http://localhost:3000 확인
```

## GitHub Actions 수동 실행

```bash
# GitHub UI: Actions → Deploy GitHub Pages → Run workflow
# 또는 gh cli: gh workflow run pages.yml
```

## KOSIS API 참고

- 엔드포인트: `https://kosis.kr/openapi/statisticsData.do`
- 필수 파라미터: `method=getList&orgId=110&tblId=TX_11025_A000_A&prdSe=Y&startPrdDe=2020&endPrdDe=2024&itmId=ALL&objL1=ALL&format=json&jsonVD=Y`
- 오류 확인: 응답 JSON에 `err` 또는 `errMsg` 필드 존재 시 실패
- 메타데이터 조회: `https://kosis.kr/openapi/metaData.do?method=classificationId&...`
