-- 대시보드 반영 설정: 수집 소스(dataLineage id)별로 "어느 화면에 어떻게 반영할지"를 관리한다.
-- 프론트(정적)는 이 설정을 런타임에 anon 으로 읽어 커버리지/라벨/표시여부를 즉시 반영하고,
-- 실제 차트 변환(빌드 타임)은 다음 배치에서 적용된다.
--
-- RLS 포스처는 source_candidates 와 동일(읽기 공개 + 내부 관리도구용 쓰기 허용).
-- 운영 강화 시: 쓰기를 admin Edge Function(토큰 검증) 경유로 옮기고 anon write 정책을 제거한다
--   (feature_requests 의 adminRespond 가 그렇게 이전됨).

CREATE TABLE IF NOT EXISTS surface_config (
  source_id TEXT PRIMARY KEY,              -- lib/data/generated/dataLineage.ts 의 소스 id
  screen TEXT,                             -- 반영 화면 라벨(예: '지역 분석'). NULL/'' = 미연동(수집만)
  display_label TEXT,                      -- 표시 라벨 override(선택)
  enabled BOOLEAN NOT NULL DEFAULT TRUE,   -- 카탈로그/커버리지 노출 여부
  target_table TEXT,                       -- 대상 도메인 override(선택)
  note TEXT,                               -- 운영 메모
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

ALTER TABLE surface_config ENABLE ROW LEVEL SECURITY;

-- 읽기 공개(프론트 런타임 반영). 쓰기는 내부 관리도구(관리자 콘솔) 용도로 허용.
CREATE POLICY "allow_read_surface_config"
  ON surface_config FOR SELECT USING (true);
CREATE POLICY "allow_insert_surface_config"
  ON surface_config FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_surface_config"
  ON surface_config FOR UPDATE USING (true) WITH CHECK (true);
