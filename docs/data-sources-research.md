# 외국인 금융 데이터 출처 조사 (2026-06-15)

목적: 외국인 금융 인사이트 대시보드에 추가로 연동할 **집계 통계 출처**를 면밀히 조사한 결과.
모든 출처는 개인 단위가 아닌 집계값만 사용한다 (CLAUDE.md 보안 제약 준수).

## 우선순위 요약

| 우선순위 | 출처 | 인증키 | 비고 |
|----------|------|--------|------|
| ★★★ | 한국은행 ECOS (국제수지·개인송금) | **ECOS_API_KEY 신규 발급 필요** | 금융 대시보드 핵심: 송금 흐름 거시지표 |
| ★★★ | 금융위 금융공공데이터 (국내은행 통계) | DATA_GO_KR_SERVICE_KEY (기존) | 계좌·은행 통계 보조 |
| ★★★ | KOSIS 외국인 통계 (statisticsParameterData.do) | KOSIS_API_KEY (기존) | 호출 방식 수정 필요 (아래 참고) |
| ★★ | data.go.kr 발굴 후보 file 다수 | 불필요 | 즉시 등록 가능, 검증만 필요 |
| ★★ | data.go.kr 발굴 후보 openapi 다수 | DATA_GO_KR_SERVICE_KEY | 오퍼레이션명 확인 필요 |

---

## 1. 한국은행 ECOS OpenAPI (신규·최우선)

- 포털: https://ecos.bok.or.kr/api/  (인증키 별도 발급, data.go.kr 키와 다름)
- data.go.kr 미러: 국제수지통계 `15059631`, 대외채권·채무 `15059636`, 국민계정 `15059629`
- 호출 형식: `https://ecos.bok.or.kr/api/StatisticSearch/{API_KEY}/json/kr/1/100/{통계표코드}/{주기}/{시작}/{종료}/{항목코드}`
- 활용: **이전소득수지·개인 해외송금** 흐름은 외국인 근로자(E-9/H-2) 본국송금 수요의 거시 대리지표.
  지역·국적 단위가 아니므로 세그먼트 보조 지표로만 사용.
- TODO: ECOS 통계표 코드 확정 필요 (국제수지 / 이전소득수지 카테고리). 콜센터 02-759-4114 또는
  ECOS "통계검색"에서 코드 조회. 신규 collector type `ecos` 추가 검토.

## 2. 금융위원회 금융공공데이터 (data.go.kr, 기존 키 재사용)

- `15061304` 금융위_금융통계국내은행정보 — 은행별 주요 현황·경영지표 (시계열)
- `15094809` 금융위_금융투자협회종합통계정보
- `15043423` 금융위_주식발행정보, `15043459` 기업 재무정보
- 활용: 외국인 직접 통계는 아니나 **지역 은행 인프라/금융 접근성** 보조 지표. 우선순위는 ECOS보다 낮음.

## 3. KOSIS — 호출 방식 수정 필요 (현재 실패 원인)

현재 `statisticsData.do` + `itmId=ALL&objL1=ALL` 호출이 `필수요청변수값이 누락되었습니다` 오류.

**원인**: KOSIS는 테이블별 실제 `itmId`/`objL` 분류코드를 요구한다 (`ALL`이 항상 통하지 않음).
정식 호출 예시(개발가이드):
```
https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=...
  &itmId=T1+&objL1=ALL&objL2=&objL3=&format=json&jsonVD=Y
  &prdSe=Y&startPrdDe=2017&endPrdDe=2024&orgId=110&tblId=TX_11025_A000_A
```

**해결 절차 (2단계)**:
1. 메타데이터로 분류코드 조회:
   ```
   GET https://kosis.kr/openapi/statisticsData.do?method=getMeta&type=ITM&apiKey=...&orgId=110&tblId=TX_11025_A000_A&format=json
   GET https://kosis.kr/openapi/statisticsData.do?method=getMeta&type=OBJ&apiKey=...&orgId=110&tblId=TX_11025_A000_A&format=json
   ```
2. 조회된 `itmId`, `objL1` 코드로 `statisticsParameterData.do` 재호출.

**확인된 KOSIS 외국인 통계표**:
- `orgId=110, tblId=TX_11025_A000_A` — 시도별 외국인주민 현황 (행안부) ← 현재 등록됨
- `orgId=110, tblId=DT_110025_A033_A` — 국적별 등록외국인 (법무부 출입국) ← **신규 후보**
- KOSIS "체류외국인" 검색 결과 1,180건 — 추가 테이블 다수 존재

## 4. data.go.kr 자동 발굴 후보 (이미 discovery 로 수집됨, 미등록)

> 일일 크롤러(`scripts/fetch_public_data.mjs`)가 키워드로 발굴해 카탈로그에 기록한 datasetId.
> file 타입은 인증키 불필요 → 즉시 `data_sources.mjs` 등록 가능. openapi 는 오퍼레이션명 확인 필요.

### 행정안전부 외국인주민
- file: `3079542`, `15047604`, `15047603`, `15045324`, `15116895`
- openapi: `15057877`, `15108065`, `15057894`, `15058854`, `15058374`

### 교육부 / 대학알리미 유학생
- file: `15050054`, `15050055`, `15100039`, `15149964`, `3069982`, `3050000`
- openapi: `15057888`, `15058233`, `15057333`, `15058982`, `15074265`

### 법무부 출입국 추가
- file: `3075821`, `15100009`, `15112636`
- openapi: `15149911`, `15149906`

### 고용노동부 (취업 외국인 = 급여계좌 수요)
- file: `15032256`, `3035864`, `15046410`

### 여성가족부 / 통계청 (다문화·결혼이민)
- file: `3034249`, `15011595`, `15074047`, `3073460`

## 다음 작업 권장 순서

1. **data.go.kr file 후보 일괄 등록·검증** (인증키 불필요, 가장 빠름): 위 file ID들을
   `data_sources.mjs`에 등록 → CI 1회 실행 → 다운로드 성공한 것만 `verified:true`.
2. **KOSIS 2단계 호출 구현**: `getMeta`로 itmId/objL 조회 후 `statisticsParameterData.do` 호출하도록
   `collectKosisSource` 개선. DT_110025_A033_A(국적별 등록외국인) 추가.
3. **한국은행 ECOS collector 신규 추가**: ECOS 키 발급 → `ecos` type collector → 국제수지/이전소득수지 코드 연동.
4. openapi 후보는 오퍼레이션명을 알 수 없으면 보류 (data.go.kr 상세페이지가 WebFetch 403, CI에서도 HTML 파싱 한계).

## 조사 한계
- data.go.kr·ECOS·KOSIS 상세 페이지는 WebFetch에서 HTTP 403 → 정확한 응답 필드/오퍼레이션명은
  CI 런타임(한국 IP·인증키)에서 실제 호출로만 확정 가능.
- openapi 후보의 정확한 오퍼레이션 경로는 미확인. file 후보부터 처리하는 것이 ROI 높음.

## 출처
- 공공데이터포털 https://www.data.go.kr/
- 금융위 금융공공데이터 https://www.fsc.go.kr/in060101
- 한국은행 ECOS OpenAPI https://ecos.bok.or.kr/api/
- KOSIS OpenAPI 개발가이드 https://kosis.kr/openapi/devGuide/devGuide_0201List.do
- KOSIS 시도별 외국인주민 https://kosis.kr/statHtml/statHtml.do?orgId=110&tblId=TX_11025_A000_A
