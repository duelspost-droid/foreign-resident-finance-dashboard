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
