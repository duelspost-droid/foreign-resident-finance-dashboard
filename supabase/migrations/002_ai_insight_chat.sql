-- AI 인사이트 질의 이력 (브라우저 session_id 단위). 질의 대상은 공개 집계 통계라 개인식별정보 없음.
CREATE TABLE IF NOT EXISTS ai_insight_chat (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'data',          -- ai | data
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,      -- 관련 분석 페이지 딥링크
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_insight_chat_session
  ON ai_insight_chat (session_id, created_at DESC);

ALTER TABLE ai_insight_chat ENABLE ROW LEVEL SECURITY;

-- 공개 데모/내부 도구: anon 읽기·삽입·삭제 허용(질의는 공개 통계 대상, 개인정보 없음).
-- 운영 강화 시 Supabase Auth + session 소유자 제한 정책으로 교체 권장.
CREATE POLICY "allow_read_ai_insight_chat"
  ON ai_insight_chat FOR SELECT USING (true);
CREATE POLICY "allow_insert_ai_insight_chat"
  ON ai_insight_chat FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_ai_insight_chat"
  ON ai_insight_chat FOR DELETE USING (true);
