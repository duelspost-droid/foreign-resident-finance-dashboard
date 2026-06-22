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

### 남은 항목
- ⚠️ [HIGH·소유자] surface_config anon INSERT/UPDATE 차단 — 위 '남은 최우선' 참조(마이그레이션+Edge Function 배포 필요).
- [MED·소유자/RLS] page_views/feature_requests/ai_insight_chat 공유 session_id anon SELECT 상관(RLS 강화+함수 경유 필요).
- [LOW·데이터파이프라인] EPS 산업 합계가 byCountry 합산 / 다문화·status 변환에 '계'(합계행) 가드 부재 → `build_real_data.mjs` 수정 + 데이터 재생성·검증 필요(최저 우선).
