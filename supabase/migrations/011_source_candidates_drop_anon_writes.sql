-- 보안 강화 (2/2) — source_candidates 익명 직접 쓰기 정책 제거.
-- ⚠️ 실행 시점: 010(보안 함수) 적용 + 신 프론트(.rpc 경유 승인) 배포 + 구 캐시 만료 후 마지막에 실행.
--    (구 프론트는 source_candidates 에 anon 으로 직접 UPDATE 하므로, 이 정책을 먼저 지우면 캐시된
--     구 프론트의 승인/거부가 RLS 기본거부로 조용히 실패한다. 읽기(allow_read_source_candidates)는 유지.)
--    CI 의 sync_candidates 는 SERVICE_ROLE_KEY(RLS 우회)라 후보 수집·upsert 에는 영향 없음.
--
-- 적용 후 검증:
--   SELECT polname FROM pg_policies WHERE tablename='source_candidates';
--     → allow_read_source_candidates 만 남아야 함(write/insert 정책 없음).
--   anon 키로 source_candidates 직접 INSERT/UPDATE 시도 → RLS 거부 확인.
--   관리자 로그인 후 /admin 승인/거부 정상 동작(.rpc admin_set_candidate_status) 확인.

DROP POLICY IF EXISTS "allow_write_source_candidates" ON source_candidates;
DROP POLICY IF EXISTS "allow_insert_source_candidates" ON source_candidates;
