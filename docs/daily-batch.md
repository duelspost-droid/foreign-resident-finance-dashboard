# Daily Data Batch

## 목적

공공데이터포털에서 접근 가능한 원천 데이터를 매일 내려받고, 앱에서 사용할 정제 데이터를 생성한 뒤 타입체크와 Sites 빌드를 검증한다.

## 명령

```bash
npm run data:fetch
npm run data:build
npm run data:all
```

`npm run data:all`은 다음 순서로 실행된다.

1. `scripts/fetch_public_data.mjs`
2. `scripts/build_real_data.mjs`
3. `npm run typecheck`
4. `npm run build`

## 저장 위치

- 원천 파일: `data/raw`
- 원천 메타데이터: `data/catalog`
- 정제 JSON: `data/processed`
- 앱 import용 생성 파일: `lib/data/generated/realData.ts`
- 실행 로그: `data/logs`

## 현재 수집 대상

- 법무부 체류외국인 국적 및 체류자격별 현황
- 법무부 외국인체류데이터
- 법무부 연도별 외국인 유학생 체류 현황

행정안전부, 교육부, 대학알리미는 `scripts/data_sources.mjs`의 `discoveryQueries`로 후보 데이터셋을 매일 탐색한다. 실제 다운로드 가능한 dataset id와 detail pk가 확정되면 `publicDataSources`에 추가한다.

## API 키

파일형 데이터는 가능한 경우 로그인 없이 다운로드한다. ODCloud API를 쓰려면 `.env.local` 또는 실행 환경에 다음 값을 둔다.

```bash
DATA_GO_KR_SERVICE_KEY=...
```

현재 스크립트는 파일형 다운로드를 우선하며, API 키 기반 수집은 다음 단계에서 `publicDataSources`에 `api` 타입으로 확장한다.

## Windows 매일 실행 등록

관리자 PowerShell에서:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register_windows_daily_task.ps1 -Time "03:30"
```

수동 실행:

```powershell
schtasks /Run /TN ForeignResidentFinanceDailyBatch
```

작업 삭제:

```powershell
schtasks /Delete /TN ForeignResidentFinanceDailyBatch /F
```

## 배포까지 자동화하려면

배치가 데이터를 생성하고 빌드까지 검증한 뒤, Sites 재배포 단계는 별도 승인/자격증명이 필요하다. 운영 자동화 시에는 다음 중 하나를 선택한다.

- GitHub Actions에서 `npm run data:all` 후 커밋/푸시
- Sites 소스 저장소 credential을 발급받아 새 버전 저장/배포
- Supabase 또는 D1에 데이터를 적재하고 사이트는 런타임 조회
