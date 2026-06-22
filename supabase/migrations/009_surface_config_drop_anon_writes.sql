-- surface_config 쓰기 보안 강화 (2/2) — 익명 직접 쓰기 정책 제거.
-- ⚠️ 실행 시점: 008(보안 함수) 적용 + 신 프론트(.rpc 경유 쓰기) 배포 + 구 캐시 만료 후 마지막에 실행할 것.
--    (구 프론트는 surface_config 에 anon 으로 직접 upsert 하므로, 이 정책을 먼저 지우면 캐시된 구 프론트의
--     트리아지 쓰기가 RLS 기본거부로 조용히 실패한다. 읽기(allow_read_surface_config)는 유지되어 표시엔 무영향.)
--
-- 적용 후 검증:
--   SELECT polname FROM pg_policies WHERE tablename='surface_config';
--     → allow_read_surface_config 만 남아야 함(insert/update 정책 없음).
--   anon 키로 surface_config 직접 INSERT/UPDATE 시도 → RLS 거부 확인.

DROP POLICY IF EXISTS "allow_insert_surface_config" ON surface_config;
DROP POLICY IF EXISTS "allow_update_surface_config" ON surface_config;
