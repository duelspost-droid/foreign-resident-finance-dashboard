# 작업계획서 — 실버 프로젝트

> 국내거주 외국인 금융 인사이트 대시보드
> 작성일: 2026-07-01 · 브랜치: `claude/silver-project-z6z0pc`
> 근거 문서: `docs/latest-handoff.md`, `docs/next-tasks.md`

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 목적 | 개인정보가 아닌 **집계 통계**로 외국인 금융 시장 기회를 분석하는 B2B 대시보드 |
| 스택 | Next.js 16 App Router · TypeScript · Tailwind · Recharts · Supabase(옵션) |
| 배포 | GitHub Pages 정적 export → **https://data.jbax.co.kr** (매일 01:00 KST 자동 수집·빌드·배포) |
| 리포 | `duelspost-droid/foreign-resident-finance-dashboard` |
| 인프라 | Supabase `nrdapzgtibbusvoaceuh` (마이그레이션 002~007 적용) · Edge Functions `admin`/`insight-ai` 배포됨 |

---

## 2. 현재 상태 스냅샷

### ✅ 완료 (라이브)
- 전체 라우트 구현: `/` `/dashboard` `/regions` `/nationalities` `/universities` `/visa-segments` `/opportunity-scores` `/economy` `/consumption` `/financial-insights` `/data-sources` `/data-pipeline` `/catalog` `/admin` `/compliance`
- 공공데이터 자동 수집 파이프라인(KOSIS·법무부·행안부·건보·EPS·REB 부동산 등)
- 관리자 승인 워크플로 + 미연동 1클릭 트리아지 + 홈 '추가 데이터' 자동차트
- 생성형 AI 인사이트(`insight-ai` Edge Function, ANTHROPIC_API_KEY 검증 완료)
- SEO/a11y, 모바일 감사, 보안 HIGH(익명쓰기 차단 일부)

### ⚠️ 주의 (환경)
- **fresh clone 상태 → `npm install` 필요** (미설치 시 typecheck/build 실패)
- 검증 순서: `npm install` → `npm run typecheck` → `npm run build` → `npm run dev -- --port 3000`

---

## 3. 작업 항목 (우선순위별)

### 🔴 P0 — 소유자 액션 필요 (코드로 해결 불가, 보안·기능 차단)

| # | 항목 | 조치 | 미실행 영향 |
|---|------|------|-------------|
| 1 | **surface_config 익명쓰기 차단 [HIGH]** | Supabase SQL 편집기에서 `008_surface_config_lockdown.sql` 실행 → Pages 재배포 확인 후 `009_surface_config_drop_anon_writes.sql` 실행 | 미실행 시 관리자 트리아지 쓰기 실패 + 익명 조작 취약점 |
| 2 | data.go.kr 파일소스 **활용신청(구독)** | 해당 데이터셋 구독 (예 `nhis_foreigner_premium_2023`) | HTML 반환으로 수집 실패 지속 |
| 3 | 관리자 콘솔 첫 로그인 비번(`ADMIN_PASSWORD`) 설정 | `docs/admin-console.md` 참조 | 운영콘솔 로그인 불가 |

### 🟡 P1 — 검증 필요 (코드 완료, CI/실환경 확인 대기)

| # | 항목 | 검증 방법 |
|---|------|-----------|
| 4 | **REB 부동산 수집기** (최근 커밋) | CI 배치 실행 → `latest_fetch_catalog.json`에서 REB `A_2024_00533/00543` 행수 확인 |
| 5 | **읍면동 DT_110025 페이지네이션** | CI에서 KOSIS 실 fetch 성공·무손실 확인 (오프라인 단위검증만 통과 상태) |
| 6 | xlsx 파서 실동작 | 활용신청 완료된 `.xlsx` 소스가 범용 뷰어에 노출되는지 |

### 🟢 P2 — 개발 백로그 (claude 가능)

| # | 항목 | 비고 |
|---|------|------|
| 7 | 소형 셀 마스킹 규정 검토 | 인원 적은 국적/지역 셀에 개인정보 제약 적용 여부(규정) |
| 8 | 송금 직접표(KOSIS `DT_2FI004F/005F/001F`) 수집 경로 | statHtml 전용 → 파일/수동 경로 설계 |
| 9 | 신규 큐레이션 차트 추가 | SURFACED 소스 확장 시 |
| 10 | 다차원 코드 감사 워크플로 재실행 | `find-next-work` (세션 한도로 중단됐던 것) |

---

## 4. 권장 진행 순서

1. **환경 복구**: `npm install` → typecheck/build 통과 확인 (즉시)
2. **P1 검증(#4, #5)**: 최근 커밋 실동작을 CI로 확인 — 회귀 없는지 우선 점검
3. **P0 소유자 항목 안내(#1)**: 마이그레이션 008/009 실행 가이드 전달 (보안 HIGH)
4. **P2 개발**: 코드 감사 워크플로 재실행 → 발견된 이슈 처리

---

## 5. 검증 기준 (Definition of Done)

```bash
npm install          # 성공
npm run typecheck    # 에러 0
npm run build        # 성공
npm run data:all     # 공공데이터 수집 성공
npm run dev -- --port 3000   # http://localhost:3000 정상
```

- 커밋 → `claude/silver-project-z6z0pc` 브랜치 푸시
- 개인정보(성명·주소·등록번호 등) 노출 0건 유지
- 소수 셀 마스킹 규정 준수
