-- ============================================================================
--  mock_residents — Supabase 전용(선택) RLS/정책
-- ----------------------------------------------------------------------------
--  '별도의 Supabase 프로젝트'에 이 가상 데이터를 적재하고, 대시보드에서
--  anon 키로 읽기(client-side)까지 연동할 때만 실행한다. 일반 psql/Postgres에는
--  필요 없다(schema.sql 만으로 충분).
--
--  ⚠️ 이 프로젝트의 '프로덕션 분석 Supabase'에는 적용하지 말 것.
--     가상 데이터는 반드시 '별도 전용 프로젝트'로 분리한다.
--
--  전제: 먼저 db/mock_residents/schema.sql 로 테이블을 만든 뒤 실행.
-- ============================================================================

ALTER TABLE mock_residents ENABLE ROW LEVEL SECURITY;

-- 읽기 전용 공개 정책(가상 데이터라 anon SELECT 허용). 쓰기 정책은 두지 않는다
-- → anon/authenticated는 INSERT/UPDATE/DELETE 불가(적재는 service_role/psql로만).
CREATE POLICY "allow_read_mock_residents"
  ON mock_residents FOR SELECT
  USING (true);
