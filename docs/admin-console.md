# 제안 접수 + 운영 콘솔

헤더의 **제안하기** 버튼으로 사용자가 기능/데이터 요청을 익명 접수하고, **운영 콘솔**(`/admin/console`)에서
관리자가 답변·상태 관리, 접속통계, 방문자 세션을 본다. 정적 export 호환(모든 백엔드는 Supabase).

## 동작
- **접수**: `feature_requests`에 익명 세션(localStorage) 단위로 insert (anon).
- **내 제안**: 같은 세션 id로 조회 → 상태·관리자 답변 확인 (anon SELECT).
- **답변(쓰기)**: anon UPDATE는 **차단**. `admin-respond` Edge Function이 **패스코드를 서버 검증**한 뒤
  **service_role**로만 수정 → 브라우저 anon 키로는 답변 위조 불가.
- **접속통계**: `page_views`(세션·경로·유입도메인만, IP/UA/쿼리 미수집, `/admin` 제외)를 콘솔이 집계.

## 활성화 (소유자)

1. **마이그레이션**: `supabase/migrations/004_feedback_and_analytics.sql` 적용 (SQL Editor).
2. **Edge Function 배포 + 패스코드 시크릿** (insight-ai 때와 동일 방식):
   ```bash
   supabase functions deploy admin-respond --no-verify-jwt
   supabase secrets set ADMIN_PASSCODE_HASH=<패스코드의 SHA-256 hex>
   ```
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 함수에 자동 주입(별도 설정 불필요).
   - 패스코드 해시 생성: `echo -n '패스코드' | shasum -a 256`
3. **(선택) 클라이언트 게이트 즉시검증**: GitHub Secret/빌드 env에 `NEXT_PUBLIC_ADMIN_PASSCODE_HASH`(같은 해시).
   - 설정 시 콘솔 진입 시점에 패스코드를 즉시 검증(UX). 미설정 시 진입은 통과하되 **쓰기는 서버가 최종 검증**.

> 패스코드는 콘솔 메모리에만 보관되어 저장 시 함수로 전송된다(새로고침 시 재입력). 데이터(제안/통계)는
> anon SELECT라 읽기는 공개 — 민감정보가 아니므로 경량 모델에서 허용. 강화하려면 SELECT도 Auth로 제한.

## 보안 메모
- `ADMIN_PASSCODE_HASH` 미설정 시 함수는 **fail-closed**(모든 쓰기 401) — 위조 방지가 목적.
- service_role 키는 함수 런타임에만 존재(브라우저/리포 비노출).
- 개인식별정보 미수집(제안 본문은 자유 텍스트라 anon 읽기 가능 → 모달에 개인 연락처 입력 자제 안내).
