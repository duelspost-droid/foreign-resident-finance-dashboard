# Latest Handoff

## Status — 2026-06-22 (세션: 제안위젯·미연동 트리아지·홈 자동차트·SURFACED 감사·모바일·Supabase 활성화)

다른 PC에서 이어서 작업하기 위한 현재 상태 스냅샷. 로컬 경로 `C:\Users\duels\Projects\foreign-resident-finance-dashboard` 또는 임의 클론.

### 라이브/인프라 상태 (전부 활성)
- 사이트: https://data.jbax.co.kr/ (GitHub Pages 정적 export, 매일 01:00 KST 자동 수집·배포). CI: `.github/workflows/pages.yml`.
- Supabase project `nrdapzgtibbusvoaceuh`. **마이그레이션 002~007 전부 적용 완료**:
  - 002 ai_insight_chat(AI 질의 이력) · 003 metric_snapshots · 004 feature_requests/page_views(제안·접속통계) · 005 admin_config(관리자 인증) · 006/007 surface_config + disposition(트리아지·홈표시).
- Edge Functions **배포됨**: `admin`(운영콘솔 인증·답변·재빌드), `insight-ai`(생성형 AI). `ANTHROPIC_API_KEY` 설정됨 — AI 실호출 검증 완료(컨텍스트 기반 답변 정상).
- GitHub Secrets: SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY, DATA_GO_KR_SERVICE_KEY, KOSIS_API_KEY, ECOS_API_KEY 등록됨(SEOUL은 미발급).
- 검증: `npm install`→`npm run typecheck`→`npm run build`→`npm run dev -- --port 3000` 모두 통과(2026-06-22).
- ⚠️ Supabase RLS 포스처: source_candidates·feature_requests·surface_config·ai_insight_chat·page_views 모두 **anon write 허용**(USING(true)/WITH CHECK(true)). 내부도구 가정. 운영 강화 시 admin Edge Function 경유 쓰기로 이전 권장(feature_requests의 adminRespond가 그 패턴).

### 이 세션에서 한 일 (커밋 기준)
- **제안 위젯**(`components/feedback/FeedbackButton.tsx`): '내 제안'(세션필터)→'과거 제안 이력'(공개, `fetchPublicFeatureRequests` session_id 미반환). 모바일 모달 = `createPortal`로 body 렌더(헤더 backdrop-blur containing-block 탈출) + 중앙정렬 + a11y(role/aria·Esc·바디스크롤락·포커스). 안내문 공개고지.
- **Tailwind 팔레트 버그**: `tailwind.config.ts`가 teal/amber를 단일색으로 정의→`teal-600`등 음영 전부 무효(투명) → DEFAULT+전체 스케일로 정의(투명 배지/버튼 수정).
- **데이터 카탈로그**(`app/catalog/page.tsx`): 운영성 수집상태(성공/실패칩·전체수집표) 제거→메타데이터 관리로 일원화. CollectedSourcesTable 삭제.
- **승인 큐 일원화**: 메타관리=요약+링크(`components/admin/ApprovalSummaryLink.tsx`), 실제 승인은 `/admin` 한 곳. `SourceApprovalQueue` 상태바 이중라벨 정리.
- **사이드바**: '데이터 현황'→'대시보드' 최상단(`components/layout/Sidebar.tsx`).
- **미연동 1클릭 트리아지** + **'홈에 표시' 범용 자동차트** (핵심 신규):
  - `lib/data/sourceMeta.ts` `SURFACED` 맵 = 소스→화면 연동 라벨(정적, 개발이 차트 연결 시 갱신).
  - `surface_config.disposition`(none/shown/planned/archived/excluded) — 관리자가 메타관리 카드에서 1클릭. `lib/data/supabaseClient.ts`: `fetchSurfaceDispositions`/`setSourceDisposition`/`setSourceChartConfig`.
  - `components/data/CoverageSection.tsx`(client): 커버리지+트리아지 카드형. 'shown' 카드엔 차트설정(ShowConfig: 막대/선/표·범주/수치 컬럼·제목).
  - `scripts/build_generic_data.mjs`→`lib/data/generated/genericData.ts`: data/raw CSV를 범용 {columns,rows(40행),numericCols}로 파싱(인코딩 자동). `data:build`/`data:ci`/pages.yml 자동커밋에 연결.
  - `components/data/GenericSourceChart.tsx`(client): config(`note` JSON) 기반 막대/선/표 자동 렌더, 없으면 자동추론.
  - `components/data/HomeExtraData.tsx`: 홈 하단 '추가 데이터' — disposition='shown' 소스만 genericData 지연import해 렌더(없으면 섹션 숨김). `app/page.tsx` 하단 배치.
- **SURFACED 정확도 감사**: 실제 화면 렌더 추적·검증해 17개 등록 → 미연동 27→10. (moj_immigration_monthly은 raw가 status소스와 byte-identical이라 미연동 유지.)
- **정리**: 죽은 export 제거(fetchSurfaceConfig/upsertSurfaceConfig/SurfaceConfigRow/mapSurface/adminTriggerRebuild). 조사노트 표→카드. 9페이지 모바일 감사 → `app/globals.css`(.chip/.tag/.eyebrow `white-space:nowrap`, .surface-header `flex-wrap`), `components/ui/Panel.tsx`(헤더 모바일 세로스택), economy/consumption/financial-insights/nationalities 인라인 헤더 flex-wrap.

### 다음 작업: `docs/next-tasks.md` 참조 (이 세션 기준 최신)
