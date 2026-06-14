# Work Log

## 2026-06-14

### 요청

신규 프로젝트로 "국내거주 외국인 데이터를 금융 데이터 관점에서 분석하는 웹페이지"를 개발. GitHub 또는 Supabase와 공유/확장할 수 있게 만들고, 모든 작업을 Claude Code와 공유 가능하게 기록.

### 작업 내용

- 첨부 작업지시서를 UTF-8로 읽고 요구사항을 정리함.
- 기본 작업공간 `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Git`는 실제 Windows ACL로 쓰기가 막혀 있어 `C:\tmp\foreign-resident-finance-dashboard`에 프로젝트 생성.
- Next.js + TypeScript + Tailwind CSS 프로젝트 파일 작성.
- Recharts 기반 차트 컴포넌트 작성.
- B2B 대시보드형 사이드바/헤더/필터/카드/테이블 컴포넌트 작성.
- 주요 페이지 8개 구현.
- 샘플 데이터, 스코어 계산, 추천 문구 생성 로직 작성.
- Supabase용 schema/seed SQL 작성.
- 공개 데이터 CSV 샘플과 GeoJSON placeholder 작성.
- Claude Code 인수인계를 위한 `CLAUDE.md`, `docs/claude-handoff.md`, `docs/work-log.md` 작성.

### 아직 실제 연결하지 않은 항목

- 실제 공공 API 수집
- 실제 Supabase 프로젝트 생성과 데이터 적재
- GitHub 원격 저장소 push
- 실제 행정구역 GeoJSON 기반 Choropleth 지도
- 로그인/권한관리

### 다음 검증 명령

```bash
cd C:\tmp\foreign-resident-finance-dashboard
npm install
npm run typecheck
npm run build
npm run dev
```

### 검증 결과

- `npm install`: 성공
- `npm audit --omit=dev`: PostCSS 관련 moderate 경고 확인
- 조치: `postcss`를 `^8.5.10`으로 올리고 `overrides` 추가, `recharts`를 `^3.0.0`으로 갱신
- 재설치 후 취약점: 0개
- `npm run typecheck`: 성공
- `npm run build`: 성공
- `npm run dev -- -p 3000`: 백그라운드 실행 성공
- `http://localhost:3000`: 200 OK
- 주요 라우트 8개: 모두 200 OK

### 브라우저 검증 제한

인앱 브라우저 연결은 Windows 권한 오류 `CreateProcessAsUserW failed: 5`로 두 차례 실패했다. 대신 HTTP 응답과 Next 빌드 결과로 라우트 정상 동작을 확인했다.

### Git 상태 메모

- 로컬 git 저장소 생성 완료
- 첫 커밋 생성: `62ed518 Initial foreign resident finance dashboard MVP`
- 이후 생성 캐시 `tsconfig.tsbuildinfo`를 추적 대상에서 제거하려고 `.gitignore`에 `*.tsbuildinfo`를 추가하고 `git rm --cached tsconfig.tsbuildinfo`까지 수행함
- 추가 git add/amend 단계는 승인 시스템 크레딧 부족으로 중단됨

## 2026-06-14 배포 작업

### 요청

사용자가 "홈페이지에 올려줘"라고 요청해 Sites 프로덕션 배포를 진행.

### 작업 내용

- Sites 호스팅 지침 확인
- `.openai/hosting.json` 생성
- Sites 프로젝트 생성
  - project_id: `appgprj_6a2e1124e3a8819196ead14256439e4f`
  - slug: `foreign-resident-finance`
- 기존 Next 앱을 Sites 호환 vinext 빌드로 전환
- `vite.config.ts`, `build/sites-vite-plugin.ts`, `worker/index.ts` 추가
- `npm install`, `npm run typecheck`, `npm run build` 성공
- 소스 저장소에 커밋 `b09ad63745962c38e486aaeb12c14bbcb71efffb` 푸시
- Sites 버전 1 저장 및 프로덕션 배포 성공

### 배포 결과

- URL: `https://foreign-resident-finance.workspace-276930.chatgpt-team.site`
- deployment_id: `appgdep_6a2e11b6eac481918556b47c88d8b803`
- version_id: `appgprj_6a2e1124e3a8819196ead14256439e4f~appgver_6e03f6d098988191be5f346c4428b454`
- access_mode: `custom`

### 확인 사항

직접 HTTP 요청은 OpenAI/Cloudflare 로그인 챌린지에 걸렸다. Sites 상태는 `succeeded`이며 현재 접근 정책상 소유자 계정만 허용되어 있다. 다른 사용자에게 공유하려면 접근 모드를 `workspace_all`로 변경할지 확인해야 한다.

## 2026-06-14 실제 데이터/매일 배치 작업

### 요청

사용자가 실제 데이터를 가져오고, 이 자료들을 매일 배치로 올릴 수 있게 해달라고 요청.

### 구현

- `scripts/data_sources.mjs`: 공공데이터포털 수집 대상과 탐색 쿼리 정의
- `scripts/fetch_public_data.mjs`: 공공데이터포털 파일형 데이터 메타 추출 및 CSV 다운로드
- `scripts/build_real_data.mjs`: EUC-KR/UTF-8 자동 판별, CSV 파싱, 앱 import용 `realData.ts` 생성
- `scripts/daily_data_batch.mjs`: 다운로드, 정제, 타입체크, vinext 빌드 일괄 실행
- `scripts/register_windows_daily_task.ps1`: Windows 작업 스케줄러 등록
- `docs/daily-batch.md`: 운영 문서
- `lib/data/mockData.ts`: 생성된 실제 데이터가 있으면 실제 데이터를 우선 사용하고, 없으면 기존 샘플 데이터 fallback

### 수집 성공 데이터

- 법무부 체류외국인 국적 및 체류자격별 현황 2024
- 법무부 외국인체류데이터 2024
- 법무부 연도별 외국인 유학생 체류 현황 2024

### 검증 결과

- `npm run data:all`: 성공
- 실제 체류자격 데이터 정제 행 수: 400
- 전국/국적 요약 행 수: 200
- `npm run typecheck`: 성공
- `npm run build`: 성공
- Windows 작업 스케줄러 등록 성공
  - Task name: `ForeignResidentFinanceDailyBatch`
  - Schedule: daily 03:30

### 배포

- commit: `e209f057ce63d365f1457b22816cf9c473e1b8a2`
- Sites version: 2
- deployment_id: `appgdep_6a2e6ba4801481919d377119fdf57e78`
- URL: `https://foreign-resident-finance.workspace-276930.chatgpt-team.site`

### 남은 사항

- 매일 배치는 로컬 머신에서 데이터 다운로드와 빌드 검증까지 수행한다.
- Sites 재배포까지 완전 자동화하려면 장기 배포 credential 또는 GitHub Actions/외부 CI가 필요하다.
- 행안부/교육부/대학알리미 후보 데이터셋은 매일 탐색 카탈로그에 남기며, 다운로드 가능한 dataset id/detail pk가 확정되면 `publicDataSources`에 추가한다.
