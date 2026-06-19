# 데이터 출처 자동 발굴 → 관리자 승인 → 자동 수집 파이프라인

매일 배치가 공공데이터포털(data.go.kr)에서 신규 외국인 데이터셋을 **자동 발굴**하고,
관리자가 **승인**하면 다음 배치부터 **자동 수집**되는 흐름. 아래는 동작 방식과 개선점 기록.

## 전체 흐름

```
discoveryQueries(키워드)  →  discoverDataGoKr()  →  catalog.discovery[]
        │                         (검색 HTML 스크래핑)        │
        │                                                     ▼
        └──────────────────────────────────────►  sync_candidates.mjs
                                                   (미등록 후보 → Supabase upsert, pending)
                                                              │
                                                              ▼
                                              source_candidates 테이블 ──► /admin 승인 페이지
                                                              │                 (승인/거부)
                                                   (status=approved)             │
                                                              ▼                  │
                                              approved_candidates.json ◄─────────┘
                                                              │
                                                              ▼
                                  fetch_public_data.loadApprovedCandidateSources()
                                                   (다음 배치에서 동적 수집)
```

## 1) 어떻게 정보를 가져오나 (발굴)

- **키워드 정의**: `scripts/data_sources.mjs` → `discoveryQueries[]`
  (행안부 외국인주민 / 교육부 유학생 / 대학알리미 / 법무부 출입국 / 고용노동부 외국인고용 / 다문화 / 한국은행 송금 …)
- **검색·추출**: `scripts/fetch_public_data.mjs` → `discoverDataGoKr()`
  - 각 키워드로 `https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=...` (검색 결과 HTML) 요청
  - 응답 HTML의 `<a href="/data/{id}/{fileData|openapi}.do">제목</a>` 앵커를 정규식 파싱 →
    **datasetId · kind · title** 추출(키워드당 최대 20건)
  - 결과를 `data/catalog/latest_fetch_catalog.json` 의 `discovery[].links[]` 에 기록
  - ⚠️ 정부 서버는 봇 UA를 차단 → 브라우저 UA + Accept-Language ko 로 우회(이미 적용)

## 2) 승인 큐 적재 (sync)

- `scripts/sync_candidates.mjs` (배치 `data:ci` 단계에 포함)
  - catalog.discovery 에서 **이미 등록된 datasetId(publicDataSources)는 제외**
  - 나머지를 `source_candidates`(Supabase)에 `status:'pending'` 으로 upsert
  - **결정 보존**: 기존 행의 status(approved/rejected)는 유지하고 title·메타만 갱신(백필)
  - 인증: `source_candidates` RLS가 anon 읽기·쓰기를 허용 → 공개 키로도 적재됨
    (service_role 있으면 우선 사용)

## 3) 승인 → 수집

- `/admin` 페이지: `source_candidates` 의 pending 큐 표시 → 승인/거부(`updateCandidateStatus`)
- 승인분은 `data/registry/approved_candidates.json` 으로 내려받음
- 다음 배치에서 `loadApprovedCandidateSources()` 가 동적 소스로 변환해 수집

## 근본 원인 (2026-06-18 — "올라온 게 하나도 없음")

- **discovery 는 정상 작동**(catalog.discovery 22그룹 / 링크 다수).
- 그러나 **`source_candidates` 라이브 테이블이 한 번도 성공 적재된 적 없음** → 승인 큐가 빈 채.
  (테이블 미존재/RLS/에러로 과거 CI sync upsert 가 조용히 실패했던 것으로 추정)
- **조치**: sync 를 실행해 **미등록 후보 73건을 pending 으로 적재**. 이후 매 배치마다 자동 동기화.

## 개선점

### ✅ 적용함
1. **제목 캡처** — 기존엔 `title:null`(관리자가 datasetId 숫자만 봄). 이제 검색 HTML 앵커에서
   데이터셋 **제목**을 추출(`parseDiscoveryLinks`) → 큐를 이름으로 평가 가능. 라이브 73건 백필 완료.
2. **결정 보존 + 메타 백필 upsert** — 기존 `ignoreDuplicates`(절대 갱신 안 함) → 승인/거부는
   유지하면서 제목·메타는 갱신하도록 변경.

### 🔧 권장(미적용 — 우선순위순)
3. **동기화 실패 가시화** — sync 가 실패해도 console 로그뿐, 큐가 조용히 빈다(이번 사고의 본질).
   → 마지막 sync 시각·건수를 lineage/관리자 페이지에 노출하거나, 지속 실패 시 빌드 경고.
4. **수집 가능성 표시** — `openapi` 후보는 활용신청(구독), `fileData` 는 detailPk 추출이 필요해
   승인해도 수집이 실패할 수 있음. → 후보에 수집 난이도 태그(file=대체로 가능 / openapi=구독 필요).
5. **관련성 랭킹** — 73건 중 외국인 금융과 무관한 항목 다수(예: '졸업생 취업현황(일반대학원)').
   priority 가 전부 'mid'. → 제목·키워드 매칭 점수로 정렬/노이즈 필터.
6. **`/admin` 인증 게이트** — 출처 승인 페이지(`/admin`)는 현재 무인증(anon 쓰기). 신규 운영 콘솔
   (`/admin/console`)의 토큰 로그인과 통합 권장.
7. **HTML 스크래핑 취약성** — 검색 페이지 구조 변경/차단 시 조용히 빈 결과. data.go.kr 통합검색
   OpenAPI(구독 필요)로 전환하면 견고.
8. **승인 후 수집 결과 피드백** — 승인했는데 수집 실패(file/openapi 한계) 시 관리자에게 신호 없음.
   → 승인 후보별 최근 수집 상태 표시.
