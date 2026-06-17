# AI 인사이트 어시스턴트 — Supabase 연계 설정

금융 인사이트 페이지의 AI 질의 창은 **두 단계로 동작**한다.

| 단계 | 동작 | 필요 설정 |
|---|---|---|
| 기본(즉시) | 데이터 기반 답변 + localStorage 이력 | 없음 |
| 연계(설정 후) | 생성형 AI(Claude) 답변 + Supabase 이력(기기 간) | 아래 1·2·3 |

Supabase 프로젝트는 이미 연결돼 있다(`lib/data/supabaseConfig.ts`의 URL/anon 키, 또는 GitHub Secret `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`). 아래만 추가하면 된다.

## 1. 이력 테이블 생성 (Supabase SQL Editor 또는 CLI)

```bash
supabase db push          # supabase/migrations/002_ai_insight_chat.sql 적용
# 또는 Supabase 대시보드 → SQL Editor에 002_ai_insight_chat.sql 내용 붙여넣고 실행
```

적용 즉시 질의 이력이 `ai_insight_chat` 테이블에 기기 세션 단위로 저장·조회된다(미적용 시 자동으로 localStorage 폴백).

## 2. 생성형 AI Edge Function 배포

```bash
supabase functions deploy insight-ai --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...      # 필수
supabase secrets set LLM_MODEL=claude-sonnet-4-6        # 선택(기본값 동일)
```

배포 후 위젯이 자동으로 함수를 호출하며, 답변 배지가 **"데이터 기반" → "AI 생성"** 으로 바뀐다. 함수 코드: `supabase/functions/insight-ai/index.ts` (수집 데이터 컨텍스트로 Claude 호출).

> ANTHROPIC_API_KEY 대신 다른 LLM을 쓰려면 함수의 `fetch(... api.anthropic.com ...)` 부분만 교체하면 된다.

## 3. (CI 배포 사이트용) 환경변수 확인

GitHub Pages 빌드가 Supabase에 연결되려면 워크플로 Secret에 `SUPABASE_URL`·`SUPABASE_ANON_KEY`가 있어야 한다(`pages.yml` 참조). 이미 기본값이 `supabaseConfig.ts`에 박혀 있어 없어도 동작하지만, 운영 키로 덮어쓰려면 Secret을 설정한다.

## 보안 메모
- anon(publishable) 키만 브라우저에 노출한다. service_role 키는 절대 프런트/리포에 두지 않는다.
- 이력 테이블은 anon 읽기·삽입·삭제 허용(질의는 공개 통계 대상, 개인정보 없음). 운영 강화 시 Supabase Auth + 소유자 제한 정책으로 교체 권장(`002_ai_insight_chat.sql` 주석 참조).
- ANTHROPIC_API_KEY는 Supabase **함수 시크릿**으로만 보관(브라우저 비노출).
