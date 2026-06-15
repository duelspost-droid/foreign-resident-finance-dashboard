# Supabase 연결 가이드

관리자 승인 워크플로(`/admin`)와 실데이터 적재를 켜기 위한 1회성 설정. 약 10분.

## 1. 프로젝트 생성
1. https://supabase.com 로그인 → **New project**
2. 이름/리전(Northeast Asia - Seoul 권장)/DB 비밀번호 설정 → 생성(약 2분)

## 2. 스키마 적용
1. 좌측 **SQL Editor** → **New query**
2. 리포지토리의 `supabase/schema.sql` 전체 내용을 붙여넣고 **Run**
   - 생성 테이블: `foreign_resident_region_month`, `foreign_resident_status`,
     `foreign_student_university`, `finance_segment_aggregate`, `region_finance_score`,
     **`source_candidates`**(승인 큐)
3. (선택) `supabase/seed.sql` 로 샘플 데이터 적재

## 3. 키 확인
**Project Settings → API** 에서 3개 값 복사:
| 값 | 위치 | 용도 |
|----|------|------|
| Project URL | Project URL | `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | Project API keys → `anon` | `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY` |
| service_role | Project API keys → `service_role` ⚠️비밀 | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ **service_role 키는 절대 브라우저/깃에 노출 금지.** GitHub Secrets에만 저장.

## 4. GitHub Secrets 등록
**Repo → Settings → Secrets and variables → Actions → New repository secret** 로 3개 등록:
- `SUPABASE_URL` = Project URL
- `SUPABASE_ANON_KEY` = anon public 키
- `SUPABASE_SERVICE_ROLE_KEY` = service_role 키

(pages.yml 이 빌드 시 anon 키만 브라우저로 주입하고, 배치는 service_role 로 적재한다.)

## 5. 검증
로컬(.env.local 에 키 입력 후):
```bash
npm run supabase:check     # 6개 테이블 접근 확인
npm run supabase:load      # 수집된 실데이터 적재
```
CI: main 에 푸시하면 빌드 시 자동 반영. `/admin` 에서 "Supabase 연결됨" 확인.

## 동작 흐름
```
매일 배치 발굴 → sync_candidates(큐 upsert) → /admin 승인 → approved_candidates.json → 다음 배치 자동 수집
```

## 보안 메모
- `source_candidates` RLS 는 현재 공개 read + 쓰기 허용(내부 도구 가정).
- 운영 전환 시 Supabase Auth 로 관리자 역할을 만들고 UPDATE/INSERT 정책을
  `auth.role() = 'admin'` 등으로 제한할 것(schema.sql 주석 참조).
