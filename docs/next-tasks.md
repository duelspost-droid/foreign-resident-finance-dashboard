# 다음 작업 (백로그) — 2026-06-22 기준

전체 현재 상태는 `docs/latest-handoff.md` 참조. 이전 06-16 백로그 항목(ECOS 키·KOSIS objL·DNS/HTTPS·유학생 데이터 감사·data.go.kr file 소스 2종 등)은 대부분 완료됨.

## 🔑 소유자/자격증명 (코드로 해결 불가)
1. **일부 공공데이터 수집 실패** — 예 `nhis_foreigner_premium_2023`. data.go.kr 파일 다운로드가 실제 파일 대신 **HTML 반환**(`data/catalog/latest_fetch_catalog.json` headerLine="<!DOCTYPE html>") → **활용신청(구독)** 필요. 일부는 **.xlsx 저장**(빌드는 CSV만 파싱 → 아래 3번).
2. **`npm run supabase:load`** — 수집 실데이터를 Supabase 적재(SERVICE_ROLE_KEY). 사이트는 정적 realData로 동작하므로 선택.
3. **관리자 콘솔 첫 로그인 비번**(ADMIN_PASSWORD) — `admin` Edge Function 배포됨. `docs/admin-console.md`.
4. **송금 직접표**(KOSIS `DT_2FI004F/005F/001F`) — 격년·statHtml 전용이라 Param API 미노출 → 파일/수동 수집 경로 필요.

## 🛠 개발 (claude 가능)
5. **xlsx 파서** — `scripts/build_real_data.mjs`/`build_generic_data.mjs`가 .csv만 처리. .xlsx 소스(premium·면세점 15140207/15148728 등) 받아와도 미파싱. xlsx 파싱 추가 시 활성화.
6. **맞춤 차트** — '연동 예정'으로 둔 소스(건보·다문화 등)를 전용 페이지에 큐레이션 차트로 연결 + `SURFACED` 등록(자동 '홈에 표시'보다 정교).
7. **GenericSourceChart 엣지케이스**(다차원 감사 부분결과):
   - 자동 수치-컬럼 추론이 '번호/일련번호/id' 컬럼을 값으로 선택 → 무의미 차트. ID성 컬럼 제외 휴리스틱.
   - `config.cat`/`config.val` 음수·범위초과 가드(현재 `< columns.length`만).
   - chartData 전부 0/빈값일 때 차트 대신 표 폴백 보장.
   - `build_generic_data.mjs` 수치 판별이 연도/코드 문자열을 수치로 오인 여지.
8. **문서 stale 일원화** — `CLAUDE.md` 세션이력·`docs/work-log.md`·`docs/claude-handoff.md`가 06-16 상태. latest-handoff 기준 갱신/중복정리.
9. **명칭 일관성** — 홈 hero kicker '데이터 현황' vs 사이드바/헤더 '대시보드'(`app/page.tsx`) 통일 여부.
10. **읍면동 외국인주민** `DT_110025` 페이지네이션(분류 3,957개 URL 초과, 우선순위 낮음).
11. (방어) 단일 체류자격 YoY 비정상 급락(예 -40%↓) 시 stale/품질경고 플래그.

## 🔒 규정
12. **소형 셀 마스킹 검토** — 인원 적은 국적/지역 셀(유학생 등)에 CLAUDE.md 개인정보 제약 적용 여부.

## ⏸ 보류 (세션 한도)
- 다차원 코드 감사 워크플로 `find-next-work`가 2026-06-22 세션 한도(1:40am Asia/Seoul 리셋)로 중단. 한도 회복 후 재실행:
  `Workflow({ scriptPath:"<session>/workflows/scripts/find-next-work-wf_d7847c2e-34e.js", resumeFromRunId:"wf_d7847c2e-34e" })` — 완료분 캐시 반환. (※ runId는 세션 한정)
