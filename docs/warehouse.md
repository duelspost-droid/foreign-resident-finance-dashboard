# 분석용 데이터 웨어하우스 (metric_snapshots)

수집 데이터를 **이력 누적**으로 Supabase에 적재해 시계열·추세 분석을 가능하게 한다.
정적 `lib/data/generated/realData.ts`는 **최신 스냅샷만** 담으므로, 시간에 따른 변화 분석은 이 테이블이 담당한다.
대시보드(GitHub Pages) 자체는 그대로 정적 TS를 읽는다 — 웨어하우스는 **분석·AI·아카이브 전용**.

## 구조 (long/tall 제네릭 1테이블)

`metric_snapshots`: `batch_date · source · dataset · metric · dims(JSONB) · period · value · unit`

배치마다 append. 같은 `(batch_date, source)`는 로더가 delete 후 insert → 재실행 멱등.
이질적 공개통계를 한 스키마에 담으므로 **신규 소스 추가 시 마이그레이션이 불필요**하다.

현재 적재 dataset(10종): `employment_status·industry·age_activity·bop_transfer_income·exchange_rate·duty_free_sales·land_acquisition·student_nationality·wage_distribution·eps_introduction` (배치당 ~270행).

## 파이프라인

```
data:ci = fetch → sync_candidates → build_real_data → build_warehouse_snapshots
          → (CI) Load Supabase data 스텝에서 supabase:load
```

- `npm run data:warehouse` → `data/processed/metric_snapshots.json` 생성(gitignore, 빌드 산출물).
- `npm run supabase:load` → 정규화 테이블 upsert + 웨어하우스 append.
- `DRY_RUN=1 npm run supabase:load` → 네트워크 없이 적재 대상 건수만 출력(검증용).

## 활성화 (소유자 작업)

1. **마이그레이션 적용**: `supabase/migrations/003_metric_snapshots.sql`을 Supabase SQL Editor에 실행(또는 `supabase db push`).
2. **GitHub Secret 설정**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   - 이게 있어야 `pages.yml`의 "Load Supabase data" 스텝이 동작한다(현재 조건부 스킵).
   - **service_role 키는 절대 프런트/리포에 두지 않는다**(브라우저 비노출). 키 입력·관리는 소유자만.

## 분석 예시 (SQL)

```sql
-- 원/달러 환율 월별 추세
SELECT period, value FROM metric_snapshots
WHERE dataset='exchange_rate' AND metric='usd' AND dims->>'kind' IS NULL
ORDER BY period;

-- 면세 소비 국적 1위의 배치별 변화(이력)
SELECT batch_date, dims->>'nationality' AS nat, value
FROM metric_snapshots
WHERE dataset='duty_free_sales' AND metric='sales'
ORDER BY batch_date DESC, value DESC;
```

## 보안

- 테이블 RLS 기본 **잠금**(anon 정책 없음) → service_role 로더만 쓰기/읽기.
- 집계 통계만 적재(개인식별정보 없음). 브라우저/AI에 직접 노출이 필요하면 `read_metric_snapshots` anon SELECT 정책을 소유자가 추가.
