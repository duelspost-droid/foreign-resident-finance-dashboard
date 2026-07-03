# 지시·결정 로그 (Directives & Decisions)

> 다른 PC에서 이어서 작업할 때 **왜/어떤 규칙으로** 만들어졌는지 파악하는 문서.
> 작업 이력 = `docs/latest-handoff.md`, 백로그 = `docs/next-tasks.md`, 깊은 이력 = `git log`.
> 이 문서는 **사용자 지시·결정**을 시간순으로 기록한다. 새 지시/결정이 생기면 계속 갱신한다.

---

## A. 소통·작업 규칙 (항상 적용)

- **한국어**로 소통·답변(영어 드리프트 금지).
- **자동 푸시**: 코드 수정 → `tsc --noEmit` 통과 확인 → **묻지 말고 바로 커밋·푸시**(`main`). 푸시 전 `git pull --rebase origin main`(매일 01:00 KST CI 데이터 커밋과 충돌 방지).
- **검증 방식**: 이 개발 Mac은 node/npm이 PATH에 없음 → 번들 노드(`/Users/hk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`)로 `tsc --noEmit` + `node --test test/*.test.mjs`만 사용. `vinext build`는 로컬 불가(rolldown 네이티브 부재). 일반 PC(node/npm 정상)는 `npm run typecheck/test/build` 표준 명령 동작.
- **소유자 전용(claude 수행 불가)**: Supabase 마이그레이션 실행·Edge Function 배포·GitHub/CI 시크릿·환경변수 설정·계정/프로젝트 생성·DB 비밀번호·PAT/2FA 입력. 이런 항목은 "⏳ 소유자"로 표기.
- **크롬 작업**: 사용자가 "크롬으로 진행해"라고 **명시**하면 claude가 크롬(브라우저 MCP)으로 UI 조작 가능. 단 **자격증명 입력·비용 발생 확정·계정/프로젝트 생성의 최종 확정 버튼**은 사용자가 직접(“최종 버튼은 내가 누른다”).

## B. 보안·개인정보 제약 (절대 준수 — verbatim)

- 개인 단위 외국인 데이터 결합 금지.
- **외국인등록번호·여권번호·국내거소신고번호·이름·전화번호·상세주소·계좌번호 사용 금지.**
- 내부 금융 데이터는 **지역·월·국적·세그먼트 단위 집계값만** 허용.
- 소수 셀(1~4)은 마스킹(`maskSmallCell`→'<5') 또는 상위 분류 병합.
- **가상(합성) 데이터**는 별도 스토어/테이블로 분리하고 "실제 개인정보 아님"을 명시. 주민등록번호·외국인등록번호는 **뒷자리 마스킹 합성 포맷**(`YYMMDD-N●●●●●●`)만, 실제 유효번호 생성 금지.

---

## C. 지시·결정 타임라인

### 2026-07-03 — 외국인 정보 관리(가상) + Postgres 라이브 연동 (이번 세션)

1. **지시**: "데이터탐색 메뉴에 외국인 정보 관리(가상) 메뉴를 구성하고 이름·성별·주민등록번호·주소·외국인번호 등을 10만개 만들어. 조회 화면도. 전부 가상데이터."
   → **결정/구현**: `/mock-residents` 화면 + `lib/data/mockResidents.ts`(mulberry32 결정적 10만 건 클라 생성), 식별번호 **마스킹 합성**, noindex, 사이드바 '데이터 탐색'에 메뉴. (커밋 `fdc0934`)

2. **지시**: "이거를 postgre DB 형태로 저장해서 관리할수 있나" → "아니. postgre DB는 **가상 외국인정보 관리만** 해당이야."
   → **결정**: 대시보드 집계 데이터는 그대로, **가상 데이터만** Postgres로. 프로덕션 분석 스키마와 **분리**. → `db/mock_residents/`(schema·seed 생성기·README) 구축. (커밋 `6dc9a5b`)

3. **지시**: "지금하고 크롬으로 네가 전부다해" → "이어서 작업하고" → "내가 최종 버튼 누를때까지 크롬으로 진행해".
   → **구현**: 화면↔DB 연동 코드(`lib/data/mockResidentsDb.ts` 서버 페이지네이션, `page.tsx` DB/클라 이원화, `load_mock_residents.mjs`). (커밋 `723f7cb`)
   → **크롬 진행**: Supabase 로그인 확인 → 새 전용 프로젝트 생성 시도.

4. **막힘/결정**: Free 조직이 **무료 프로젝트 한도 초과**(계정 전체 2개) → 새 전용 프로젝트는 **korail(Pro) 조직에서만 가능 = $10/월**.
   - **지시**: "잠만 비용이 왜 필요한거야?"
   - **결정(사용자 선택)**: **A안 — 기존 대시보드 Supabase 프로젝트에 `mock_residents` 테이블만 추가(비용 0, 라이브)**. (B=로컬/무료 Postgres SQL만, C=Pro 새 프로젝트 $10/월 는 미채택.)

5. **크롬 셋업 완료**(claude, 기존 프로젝트 `nrdapzgtibbusvoaceuh` SQL 편집기):
   - `mock_residents` 테이블 + 인덱스 + **읽기전용 RLS**(`for select using(true)`) + `grant select to anon`.
   - 서버측 `generate_series`로 **합성 10만 행** 생성(붙여넣기 없이).
   - **검증**: postgres count=100000, **anon count=100000**(RLS 통과=프론트 읽기 OK), 샘플 정합.
   - **Pro 새 프로젝트는 생성 안 함 → 과금 $0.**
   → **코드**: `page.tsx`가 마운트 시 테이블 **프로브** → 데이터 있으면 "DB 연동" 모드, 없으면 "로컬 생성" 폴백. 기존 anon 키 재사용 → 시크릿/pages.yml 변경 불필요. (커밋 `1ca9f25`)

6. **지시**: "다른 pc에서 이어서 작업하도록 GitHub에 모든 작업이력/할 일 기록" → latest-handoff·next-tasks 갱신(커밋 `66ac455`). 이어서 "모든 작업과 지시에 대해서 md에 저장 … 지속적으로 확인해" → 이 문서(`directives-log.md`) 신설 + 배포 상태 지속 확인.

### 이전 세션 지시 요약 (2026-06 ~ 07-02, 상세는 latest-handoff/next-tasks/git)
- 신뢰성(테스트)·데이터(가드)·코드품질(죽은코드) 개선.
- 발굴 에이전트: "data.go.kr만 볼 게 아니라 인터넷 전체로 AI/웹 검색해서 관련 데이터 전부 제안". "웹발굴은 네가 크롬으로 작업해"(반복). "메타데이터 관리의 AI웹 발굴리드는 데이터 에이전트 승인으로"(반복) → /admin 큐 통합.
- 메일 없이 자동발굴만 켜기. REB(한국부동산원) 수집기 구축 후 "대기".
- "승인 버튼 왜 동작 안 하지?" → 010/008 미적용 전환기 폴백. "미연동 연동 눌렀더니 백엔드 없다" → 동일 폴백. "전반적으로 오류·개선점 찾아봐" → 감사 3건(SSRF·DoS·폴백). "csv 파서 강화". "배포해".

---

## D. 현재 상태 & 다음

- **현재**: 가상 외국인정보 화면 ↔ Postgres **라이브 연동 완료**(기존 프로젝트 `mock_residents`, 10만 행, anon 읽기 검증). 코드 `1ca9f25` 배포 진행 중 → 배포되면 라이브 화면이 "DB 연동"으로 전환.
- **다음/소유자 잔여**: `docs/next-tasks.md`의 소유자 활성화 목록(마이그레이션 008~011, CI용 ANTHROPIC_API_KEY, REB 키, CI 품질 게이트).
- **배포 확인 방법**: `curl -s https://api.github.com/repos/duelspost-droid/foreign-resident-finance-dashboard/actions/runs?per_page=1` 로 최신 run status/conclusion, 라이브 화면은 https://data.jbax.co.kr/mock-residents (상단 배지 "DB 연동" 확인).
