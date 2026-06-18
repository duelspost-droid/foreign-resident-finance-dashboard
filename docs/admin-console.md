# 제안 접수 + 운영 콘솔

헤더의 **제안하기** 버튼으로 사용자가 기능/데이터 요청을 익명 접수하고, **운영 콘솔**(`/admin/console`)에서
관리자가 답변·상태 관리, 접속통계, 방문자 세션, 설정(비밀번호 변경)을 관리한다. 정적 export 호환(백엔드는 Supabase).

## 인증 (맛집 트래커 방식)
- **비밀번호 로그인**: `admin` Edge Function이 **PBKDF2 솔트 해시**(admin_config)로 서버 검증 → **세션 토큰** 발급.
- **토큰만 보관**: 브라우저 localStorage에 토큰만 저장(비밀번호 미저장). 새로고침 시 토큰 서버 검증 → 자동 재로그인.
- **세션 8시간 만료**, 로그아웃 시 서버에서 세션 삭제.
- **무차별 대입 잠금**(IP당 15분 내 5회 실패) + **감사 로그**(admin_login/admin_fail/admin_pw_change, `admin_audit`).
- **비밀번호 변경**(설정 탭): 변경 시 모든 세션 무효화 후 현재 기기 새 토큰.

## 데이터 쓰기 보안
- **답변 쓰기**: `admin` 함수 `respond` 액션이 **토큰 검증 후 service_role**로만 `feature_requests` 수정.
  anon UPDATE는 RLS로 차단 → 위조 불가.
- **접속통계**: `page_views`(세션·경로·유입도메인만, IP/UA/쿼리 미수집, `/admin` 제외).
- admin_config/admin_sessions/admin_audit는 RLS 정책 없음 → **anon 접근 불가**, 함수(service_role)만.

## 활성화 (소유자)

1. **마이그레이션**: SQL Editor에서 순서대로 실행
   - `004_feedback_and_analytics.sql` (제안·통계)
   - `005_admin_auth.sql` (관리자 인증 테이블)
2. **Edge Function 배포 + 최초 비밀번호** (insight-ai 때와 동일 방식):
   ```bash
   supabase functions deploy admin --no-verify-jwt
   supabase secrets set ADMIN_PASSWORD=<최초 비밀번호>
   ```
   - 첫 로그인 시 이 비밀번호가 PBKDF2로 시드된다. 이후 **설정 탭에서 변경** 권장(변경 후엔 ADMIN_PASSWORD 불필요).
   - `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`는 함수에 자동 주입(별도 설정 불필요).

> 클라이언트에는 비밀번호·해시가 전혀 없다(서버 PBKDF2 검증). 데이터(제안/통계)는 anon SELECT라 읽기는 공개 —
> 민감정보 아님(경량). 강화하려면 SELECT도 제한 가능.
