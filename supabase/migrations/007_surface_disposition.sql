-- 미연동 소스 '트리아지' 처리 상태를 surface_config 에 누적한다.
-- disposition: NULL/미설정 = 미연동(미정), 'shown' = 홈에 표시(범용 자동 차트),
--              'planned' = 연동 예정(개발 백로그), 'archived' = 보관(raw만), 'excluded' = 제외.
-- ('shown' 의 차트 설정(종류·컬럼·제목)은 surface_config.note 에 JSON 으로 저장)
-- 실제 차트 연동(연동됨)은 코드의 SURFACED 맵이 기준이며, 개발이 'planned' 백로그를
-- 처리한 뒤 SURFACED 를 갱신한다. 관리자는 여기서 '의도(triage)'만 1클릭으로 남긴다.

ALTER TABLE surface_config ADD COLUMN IF NOT EXISTS disposition TEXT;

-- (RLS·읽기공개/쓰기허용 정책은 006 에서 이미 적용됨 — source_candidates 와 동일 포스처)
