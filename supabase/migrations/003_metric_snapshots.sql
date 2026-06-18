-- 분석용 데이터 웨어하우스: 제네릭 메트릭 스냅샷 (이력 누적).
-- 수집 배치마다 batch_date를 찍어 append → 같은 지표의 시계열·추세를 보존한다.
-- (정적 realData.ts는 "최신 스냅샷"만 담으므로 시간에 따른 변화 분석이 불가능 → 이 테이블로 보완)
--
-- 모델: long/tall 한 테이블에 이질적 공개통계를 모두 담는다.
--   source   = 수집 소스 id (예: ecos_exchange_rate_daily)
--   dataset  = 논리 지표 그룹 (예: exchange_rate, employment_status)
--   metric   = 지표명 (예: usd, count, transfer_income)
--   dims     = 차원(JSONB): { nationality, status, industry, band, country, currency ... }
--   period   = 기간 라벨 (연 "2025", 월 "2025-07", 일 "20260617"); 차원성 스냅샷은 latestYear
--   value    = 수치값,  unit = 단위
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_date DATE NOT NULL,
  source TEXT NOT NULL,
  dataset TEXT NOT NULL,
  metric TEXT NOT NULL,
  dims JSONB NOT NULL DEFAULT '{}'::jsonb,
  period TEXT,
  value DOUBLE PRECISION,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 조회 인덱스: 지표 시계열, 소스별, 차원 필터.
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_dataset
  ON metric_snapshots (dataset, metric, batch_date);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_source
  ON metric_snapshots (source, batch_date);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_period
  ON metric_snapshots (dataset, period);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_dims
  ON metric_snapshots USING gin (dims);

-- 적재는 멱등: 로더가 (batch_date, source) 단위로 delete 후 insert 하므로
-- 같은 날 재실행해도 중복이 쌓이지 않는다(별도 유니크 제약 불필요).

-- RLS: 기본은 잠금(service_role 로더만 쓰기/읽기). 공개통계지만 원시 웨어하우스라
-- 브라우저 anon 노출은 보류한다. 필요 시 아래 주석의 anon 읽기 정책을 소유자가 추가.
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;
-- (선택) 분석 결과를 브라우저/AI에 직접 노출하려면:
-- CREATE POLICY "read_metric_snapshots" ON metric_snapshots FOR SELECT USING (true);

-- 시계열 조회 편의 뷰: 지표별 batch_date 추세(최신 차원값 1개씩).
CREATE OR REPLACE VIEW metric_latest AS
SELECT DISTINCT ON (dataset, metric, dims)
  dataset, metric, dims, period, value, unit, batch_date
FROM metric_snapshots
ORDER BY dataset, metric, dims, batch_date DESC;
