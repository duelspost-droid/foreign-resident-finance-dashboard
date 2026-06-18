# 외국인 금융 데이터 — 전방위 외부 소스 발굴 리서치 (검색 흔적)

> 발굴이 data.go.kr 한 곳에 묶이지 않도록, **외부 웹을 전방위로 검색**해 외국인 금융 관련
> 사이트·API를 발굴하고 그 **검색 흔적**을 남긴 기록. (2026-06-18, 6개 각도 + 완전성 비평가 병렬 리서치)

- **검색어 130개 · 발견 소스 89개** (7개 각도)
- 범례: `[수집가능성/접근방식/인증]` · ★ = 외국인 특화 + 수집가능성 높음(최우선)
- 이미 사용 중(중복 제외): data.go.kr(file/openapi 일부), KOSIS, 한국은행 ECOS, 법무부 체류 CSV, 대학알리미

## ★ 최우선 등록 권장 (외국인 특화 + 수집가능성 높음)

**이민자체류실태 및 고용조사 (Survey on Immigrants' Living Conditions and Labour Force) — 마이크로데이터 / 보도자료** — 통계청·법무부 (Statistics Korea + Ministry of Justice 공동조사)
- `portal/subscribe` · https://www.k-stat.go.kr/metasvc/msea100/statsdcdta-popup?statsConfmNo=920018
- 외국인 금융과 직결 최상위 소스. 임금·송금·저축·주거비·지출구조 등 외국인 가구 금융행태를 직접 담은 유일한 공식 표본조사. 송금/소득 대시보드 핵심 변수.

**출입국·외국인정책 통계연보 / 통계월보 (immigration.go.kr 빅데이터 통계)** — 법무부 출입국·외국인정책본부
- `file/none` · https://www.immigration.go.kr/immigration/1570/subview.do
- 외국인 금융의 모집단·세그먼트 기준(체류자격별 E-9/F-2/F-5/D-2 등, 국적별, 지역별 체류외국인 수)을 제공. 송금·계좌·신용 분석의 분모. 단 금융변수 자체는 없음(인구통계).

**행정안전부 지방자치단체 외국인주민 현황 (통계연보 OpenAPI)** — 행정안전부 (k-stat/공공데이터포털 OpenAPI + mois.go.kr 보고서)
- `openapi/key` · https://www.data.go.kr/data/15107331/openapi.do
- 외국인근로자/결혼이민자/유학생 등 금융세그먼트별·지역별 모집단. 다문화·외국인 금융수요 지역 타깃팅 기준. 금융변수는 없음.

**한국부동산원 부동산통계정보시스템(R-ONE) — 외국인주택소유현황·외국인 토지/주택 거래** — 한국부동산원 — reb.or.kr/r-one
- `portal/subscribe` · https://www.reb.or.kr/reb/cm/cntnts/cntntsView.do?mi=10339&cntntsId=1515&statId=S237120287
- 외국인 부동산(주택·토지) 보유·거래 = 외국인 자산·신용·대출 직접 금융지표. 국적별·지역별 외국인 부동산 자산 대시보드 핵심. R-ONE OpenAPI도 존재(부동산통계 조회 서비스).

**국민건강보험공단 내외국인 건강보험료 부과 및 급여 현황 / 외국인 건강보험 적용인구** — 국민건강보험공단(NHIS) — nhis.or.kr (data.go.kr 게재)
- `file/none` · https://www.data.go.kr/data/15138933/fileData.do
- 외국인 건강보험료(보험·준조세 부담)·가입유형(직장/지역)은 외국인 소득·사회보험 부담의 금융지표. 외국인 가입자 보험료 부과액=소득 프록시.

**금융감독원 OpenAPI - 외국인 국내 투자동향 API** — 금융감독원(FSS)
- `openapi/key` · https://www.fss.or.kr/fss/kr/openApi/detail/openApi5.jsp
- 높음. '외국인' 명시 API로 외국인 자본시장 투자 흐름을 직접 제공. 다만 개인 체류 외국인이 아닌 외국인 투자자(기관/비거주자) 관점.

**서울 열린데이터광장 (Open API 전체 플랫폼)** — 서울특별시
- `openapi/key` · https://data.seoul.go.kr/
- 외국인주민/외국인근로자/결혼이민자/유학생 인구 통계가 다수. 경제활동인구·사업체·창업률 등 외국인 금융 맥락(소득·소비·고용 추정)에 결합 가능한 지역 단위 데이터 보유.

**경기데이터드림** — 경기도
- `openapi/key` · https://data.gg.go.kr/
- 외국인 밀집지역(안산·화성·시흥 포함) 광역 데이터. 외국인 지원인프라(복지·다문화센터) 위치·연락처 — 금융접근성/서비스 매핑의 보조. 외국인 고용·사업체 데이터셋 탐색 여지.

**인천 연수구 외국인 부동산 거래 현황 통계** — 인천광역시 (인천데이터포털, data.go.kr 미러)
- `file/none` · https://www.incheon.go.kr/data/DATA010201/view?docId=15065556
- 외국인 '부동산' 금융의 직접 지표 — 취득금액·공시지가 포함. 외국인 자산·부동산 투자 분석에 핵심.

**고용행정통계 (EIS) — 외국인근로자 근무현황(분기/년) · 외국인고용 사업장현황 · 일반고용허가제 도입현황** — 고용노동부 / 한국고용정보원
- `portal/none` · https://eis.work24.go.kr/eisps/rpt/reptDtl.do?menuId=030020020
- 외국인근로자(E-9/H-2)의 고용·업종·지역·국적 분포 = 소득·임금·소비 추정의 핵심 모집단 데이터. 금융 인사이트의 외국인근로자 세그먼트 기반.

**이민자 체류실태 및 고용조사 (마이크로데이터)** — 통계청 / 법무부 (MDIS 제공)
- `file/key` · https://mdis.kostat.go.kr/dwnlSvc/ofrSurvSearch.do
- 외국인의 송금·소득·임금·소비·생활을 직접 담은 가장 직결된 마이크로데이터. 외국인 금융 행태 분석의 1순위 소스.

**근로복지공단 — 외국인근로자 산재처리현황** — 근로복지공단
- `file/none` · https://www.data.go.kr/data/15104688/fileData.do
- 외국인근로자 산재=노동위험/보험 청구. 외국인 보험 행태·근로환경 보조지표.

**한국교육개발원 교육통계서비스 (KESS)** — 한국교육개발원(KEDI) 국가교육통계센터
- `portal/none` · https://kess.kedi.re.kr/index
- 외국인 유학생(D-2/D-4) 규모·국적·지역 분포 = 유학생 금융(등록금·생활비·송금) 세그먼트 모집단.

**여성가족부(성평등가족부) 전국다문화가족실태조사 마이크로데이터** — 여성가족부 / 성평등가족부
- `file/none` · https://www.data.go.kr/data/15114756/fileData.do
- 결혼이민자·다문화가구의 소득·주거·경제활동 = 외국인 가구 금융(소득·소비·주거) 직결 원자료.

**World Bank KNOMAD Remittance Data (Bilateral Remittance Matrix & Inflow/Outflow)** — World Bank / KNOMAD
- `file/none` · https://www.worldbank.org/en/topic/migration/brief/remittances-knomad
- 외국인 근로자/체류자의 본국 송금 규모를 한국발 corridor 기준으로 직접 추정 가능. 외국인 금융 행태의 핵심(송금) 지표.

**Remittance Prices Worldwide (RPW)** — World Bank
- `file/none` · https://remittanceprices.worldbank.org/data-download
- 한국은 송출국으로 포함(보도상 'G20 중 최저 비용 송출국 2.98%'). 외국인이 한국에서 본국으로 보내는 송금의 실제 비용 구조 파악 — 외국인 금융 비용/접근성 핵심.

**UN DESA International Migrant Stock 2024** — UN DESA Population Division
- `file/none` · https://www.un.org/development/desa/pd/content/international-migrant-stock
- 한국 거주 외국인을 출신국별로 분해(양자 origin-destination) — 송금 corridor 추정·외국인 구성 분석의 기초 인구 데이터. KNOMAD 양자 송금추정의 입력값이기도 함.

**OECD International Migration Database (IMD) + Data Explorer/SDMX API** — OECD (ELS/IMD)
- `openapi/none` · https://data-explorer.oecd.org/vis?df%5Bds%5D=DisseminateFinalDMZ&df%5Bid%5D=DSD_MIG@DF_MIG&df%5Bag%5D=OECD.ELS.IMD
- 한국 내 외국인 인구를 국적별로 OECD 비교 가능. 외국인 노동시장/통합 맥락에서 송금·소득 분석의 비교 baseline.

**통계청 이민자체류실태 및 고용조사 - 보도자료 원자료(KOSTAT)** — 통계청 (법무부 공동) - 국가데이터처
- `file/none` · https://kostat.go.kr/board.es?bid=11109&mid=a10301030400
- 외국인의 임금·소득·취업·송금 행태를 담은 핵심 공식 조사. 본국송금 여부/금액 문항 포함되어 외국인 금융의 1차 통계

**국세통계포털(TASIS) - 외국인근로자 연말정산 신고현황(국적별·결정세액)** — 국세청 (National Tax Service) 국세데이터담당관실
- `portal/none` · https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml
- 외국인 근로자의 근로소득·세부담을 국적별로 보여주는 행정자료 기반 통계로 외국인 소득 측면 핵심. 송금·소비의 소득 베이스 추정에 직접 활용 가능

**관세청 면세점 내외국인별 유형별 품목별 매출실적 / 면세점 품목별 내외국인 매출현황** — 관세청 (Korea Customs Service), 공공데이터포털 게재
- `file/none` · https://www.data.go.kr/data/15123277/fileData.do
- 국내 체류·방문 외국인의 면세 소비(고가품·기호품) 규모를 내외국인 분리로 직접 제공. 외국인 소비 데이터로 명확히 부합

**산업통상자원부 외국인직접투자(FDI) 동향 통계 (data.go.kr OpenAPI/파일 + KOTRA)** — 산업통상자원부 / KOTRA 인베스트코리아
- `file/none` · https://www.data.go.kr/data/15054400/fileData.do
- 외국인의 국내 직접투자(기업단위)로 개인 체류외국인 금융과는 거리가 있음 → 약한 연관(법인 중심)

## 각도별 발견 소스 (전체 89)

### 중앙부처·이민/체류 통계 포털·API (10)
- `[high/portal/subscribe]` · 외국인특화 **통계청·법무부 (Statistics Korea + Ministry of Justice 공동조사)** — 이민자체류실태 및 고용조사 (Survey on Immigrants' Living Conditions and Labour Force) — 마이크로데이터 / 보도자료
  - https://www.k-stat.go.kr/metasvc/msea100/statsdcdta-popup?statsConfmNo=920018
  - 외국인·귀화허가자 대상 표본조사. 월평균임금(임금근로자 임금구간별 인원), 본국 송금(송금자 비율 39.1%, 연평균 송금횟수 9.8회), 총소득 대비 지출구조(생활비 39.4%/국내외송금 23.2%/저축 15.7%/주거비 11.8%), 고용·체류실태. KOSIS 통계표 + MDIS 마이크로데이터 + 보도자료(korea.kr)로 제공.
- `[mid/file/subscribe]` **통계청 (국가데이터처) — mdis.kostat.go.kr / mdis.mods.go.kr** — MDIS 마이크로데이터 통합서비스 (외국인고용조사·이민자조사 원시자료)
  - https://mdis.kostat.go.kr/dwnlSvc/ofrSurvSearch.do?curMenuNo=UI_POR_P9240
  - 개인·가구·사업체 단위 원시 마이크로데이터. 외국인고용조사/이민자체류실태조사의 임금·근로소득·송금 등 개별 응답 변수 포함. 일반 다운로드(비식별)·인가용(원격접속/RDC센터)·주문형 서비스.
- `[high/file/none]` · 외국인특화 **법무부 출입국·외국인정책본부** — 출입국·외국인정책 통계연보 / 통계월보 (immigration.go.kr 빅데이터 통계)
  - https://www.immigration.go.kr/immigration/1570/subview.do
  - 체류외국인 국적별·체류자격(비자)별·지역별 현황, 입국자, 등록외국인, 난민통계 등. 통계연보(연 1회, 69개 발간)·통계월보(월간, 428건) 엑셀+PDF 첨부파일.
- `[high/openapi/key]` **통계청 (국가데이터처) — sgis.kostat.go.kr / sgis.mods.go.kr** — SGIS 통계지리정보서비스 OpenAPI (외국인 인구 공간통계)
  - https://sgis.kostat.go.kr/developer/html/openApi/api/intro.html
  - 인구주택총조사 기반 인구·가구·주택·사업체 공간통계 API + 지도 API + 행정경계. 다문화가구·외국인 인구의 시군구/읍면동/격자 단위 분포를 좌표·경계와 결합 제공.
- `[high/openapi/key]` · 외국인특화 **행정안전부 (k-stat/공공데이터포털 OpenAPI + mois.go.kr 보고서)** — 행정안전부 지방자치단체 외국인주민 현황 (통계연보 OpenAPI)
  - https://www.data.go.kr/data/15107331/openapi.do
  - 연도별·유형별 지자체 외국인주민. 한국국적 미보유자, 외국인근로자, 결혼이민자, 유학생, 외국국적동포 등 유형별·시도/시군구별 인원. OpenAPI(getForeignLocalGovernmentsYear) + 행안부 누리집 PDF보고서.
- `[mid/portal/none]` · 외국인특화 **고용노동부·한국고용정보원 — eis.work24.go.kr** — 고용행정통계 (EIS) — 외국인근로자 근무현황·외국인고용 사업장·고용보험
  - https://eis.work24.go.kr/eisps/rpt/reptDtl.do?menuId=030020020
  - 외국인근로자 근무현황(분기, 일반/특례 고용허가제별), 외국인고용 사업장현황, 외국인 고용보험 피보험자 관련 통계. OLAP 리포트 뷰어 + 자료실.
- `[low/portal/unknown]` · 외국인특화 **한국산업인력공단 — eps.hrdkorea.or.kr / eps.go.kr** — 한국산업인력공단 고용허가제(EPS) 통합서비스
  - https://eps.hrdkorea.or.kr/
  - 고용허가제 도입 외국인근로자 체류자격별·업종별 배분, 도입현황, 송출국(16개국)별 현황. 외국인근로자 전용보험(귀국비용보험·출국만기보험 등) 관련 안내.
- `[high/portal/subscribe]` · 외국인특화 **한국부동산원 — reb.or.kr/r-one** — 한국부동산원 부동산통계정보시스템(R-ONE) — 외국인주택소유현황·외국인 토지/주택 거래
  - https://www.reb.or.kr/reb/cm/cntnts/cntntsView.do?mi=10339&cntntsId=1515&statId=S237120287
  - 외국인주택소유현황(국적별·지역별 252개 시군구·소유주택수·1인당 평균보유, 반기별 5월말/11월말). 부동산거래현황통계 중 외국인토지신고/허가/처분·매입자거주지별·거래주체별 외국인거래.
- `[high/file/none]` · 외국인특화 **국민건강보험공단(NHIS) — nhis.or.kr (data.go.kr 게재)** — 국민건강보험공단 내외국인 건강보험료 부과 및 급여 현황 / 외국인 건강보험 적용인구
  - https://www.data.go.kr/data/15138933/fileData.do
  - 내외국인 건강보험료 부과액·급여(보험급여)·부정수급·일반검진비 현황(2019~2023), 재외국민·외국인 건강보험 적용인구(직장/지역가입자 구분, 연도별).
- `[mid/portal/none]` **통계청·기획재정부 등 42개 중앙부처 — index.go.kr** — e-나라지표 / 지표누리 (외국인근로자 고용·체류외국인 정책지표)
  - https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1501
  - 체류외국인 수(연도별, 등록+단기), 고용허가제 외국인근로자 고용동향(지역별 사업장 수), 총 출입국자, 외국인 관련 정책지표(746개 국가지표 중). 그래프·통계표·메타.
  - ⚠️ 갭: 금융변수를 직접 담은 외국인 특화 공식통계는 '이민자체류실태및고용조사'(임금·송금·저축·지출)와 한국부동산원 '외국인주택소유현황'(부동산 자산)이 사실상 유일. 이 각도(중앙부처·이민통계)에서 외국인 '계좌·신용·소비·연금' 미시지표는 부재 — 계좌/신용은 신용정보원·은행연합회·금융결제원, 소비는 카드사/BC, 연금 외국인별 분해는 NPS 빅데이터포털이 국적 미공개라 막힘(국민연금 data.nps.or.kr는 성/연령/업종/규모/지역만, 외국인 구분 없음 → 확인됨). 국민연금 외국인 가입자 수치(45.5만명)는 보도·연보 수준이고 구조화 통계포털 미제공. EPS 외국인 전용보험(출국만기보험 등) 통계의 구체 다운로드처 미확인(산인공 포털이 통계보다 민원 중심) → collectability low. MDI

### 금융 통계 기관·API (12)
- `[mid/portal/subscribe]` · 외국인특화 **과학기술정보통신부·한국지능정보사회진흥원(NIA) / BC카드 운영** — 금융 빅데이터 플랫폼 (Financial Big Data Platform, BC카드 주관)
  - https://www.bigdata-finance.kr/
  - BC카드 결제 빅데이터 기반 데이터 상품. 외국인 국적별 국내 소비(카드 이용건수/금액), 외국인 근로자 해외송금·소비 집계, 외국인 관광객 소비, 상권 매출, 부동산·인구 데이터. GME(글로벌머니익스프레스) 협업 외국인 근로자 약 100만명 송금/소비 분석 데이터 포함.
- `[mid/scrape/none]` · 외국인특화 **BC카드** — BC카드 신금융연구소 BCiF (외국인 근로자 송금·소비 리포트)
  - https://bcif.bccard.com/
  - 외국인 근로자 송금/소비 분석 리포트. 송금자 직업분포(급여소득자 81%), 연령(2030 63%), 성별(남성 68%), 지역별 소비 증가율(전남·경남·강원), 본인계좌 vs 가족 송금 비율 추이 등. GME 송금데이터 + BC카드 소비데이터 결합.
- `[high/openapi/key]` · 외국인특화 **금융감독원(FSS)** — 금융감독원 OpenAPI - 외국인 국내 투자동향 API
  - https://www.fss.or.kr/fss/kr/openApi/detail/openApi5.jsp
  - 외국인 국내(주식·채권) 투자동향 시계열. 조회 시작일/종료일 파라미터, 인증키 기반. 함께 제공되는 '금융시장동향 API'(openApi6)에는 환율·외국인 유가증권 투자금액 등 포함.
- `[high/openapi/key]` **금융감독원(FSS)** — 금융통계정보시스템(FISIS) OpenAPI
  - https://fisis.fss.or.kr/
  - 금융권역별(은행·보험·금투·비은행) 금융회사 업무보고서 기반 통계. 금융회사코드, 통계표 목록, 계정항목. 국내은행 주요영업활동(대출금·예수금·외화예금 등) 시계열 제공.
- `[high/openapi/key]` **금융감독원(FSS)** — 전자공시 OpenDART
  - https://opendart.fss.or.kr/
  - 상장·외부감사 기업 공시 원문, 재무정보, 지분공시, 주요사항보고. OpenAPI/XBRL/EXCEL/TXT. 외국법인·외국인 대주주 지분 등 공시 메타 포함.
- `[low/portal/subscribe]` · 외국인특화 **한국신용정보원(KCIS)** — 한국신용정보원 금융빅데이터 개방시스템 CreDB
  - https://credb.kcredit.or.kr/frt/creDB/creDB.do
  - 신용정보 표본DB·맞춤형DB·모의DB(비식별). 개인-기업-보험 연계 분석. 외국인 전용상품·중금리대출 특화 신용평가모형 개발 사례 존재.
- `[mid/portal/subscribe]` **금융보안원(FSEC)** — 금융데이터거래소 (FinDataMall)
  - https://www.findatamall.or.kr/
  - 은행·카드·보험·증권·CB·공공·통신 제공 데이터/API 상품 마켓. 일반·맞춤·API/Link 데이터. 원격분석환경 제공.
- `[low/portal/subscribe]` **금융결제원(KFTC)** — 금융결제원 데이터 플랫폼 / 데이탑(DATOP)
  - https://www.datop.or.kr/
  - 지급결제·금융결제 비식별 통계 및 가공 표본데이터. 웹 파일/API 제공, 원격분석환경(가명DB). 이체·송금 결제 데이터 기반.
- `[mid/openapi/key]` **한국주택금융공사(HF)** — 한국주택금융공사 주택금융통계시스템(HOUSTAT) OpenAPI
  - https://houstat.hf.go.kr/research/portal/openapi/openApiIntroPage.do
  - 주택금융 통계(보금자리론·전세자금보증·주택연금 등 공급/보증/대출 시계열). OpenAPI 통계코드 기반.
- `[high/openapi/key]` **한국예탁결제원(KSD)** — 한국예탁결제원 SEIBro OpenAPI (증권예탁/국제거래 통계)
  - https://api.seibro.or.kr/pubc/pubr/cmm/CMPubrHome/viewCMPubrHome.do
  - 증권예탁통계, 국제거래정보, 주식정보, 증권대차 등. 외국인 보유 증권/국제거래(외화증권 예탁·결제) 통계 포함.
- `[high/openapi/key]` **예금보험공사(KDIC)** — 예금보험공사 공공데이터
  - https://www.data.go.kr/data/3037352/openapi.do
  - 예금자보호 금융상품 목록, 발간도서/보고서 메타, 영업정지저축은행 수신잔액 등.
- `[high/openapi/key]` **한국은행(BOK)** — 한국은행 국제수지통계(BOP) - 개인이전·노동소득 (송금)
  - https://www.data.go.kr/data/15059631/openapi.do
  - 국제수지 내 본원소득(노동소득)·이전소득(개인이전/근로자송금) 항목. 외국인 근로자 본국송금이 잡히는 거시 시계열.
  - ⚠️ 갭: 확인 못하거나 막힌 부분: (1) FSS '외국인 국내 투자동향 API'(openApi5.jsp)는 WebFetch 시 반복적으로 에러페이지가 반환되어(JS/세션 의존 추정) 정확한 응답 필드·파라미터 스키마를 직접 확인하지 못함 — 실존은 다중 검색으로 확인. (2) FISIS·HOUSTAT의 외화예금/외국인 차주 등 '외국인 세분' 통계표 존재 여부는 통계코드 직접 조회가 필요해 미확정(외국인 특화 false로 보수 표기). (3) CreDB·금융결제원 DATOP·findatamall은 심사·계약 기반 비공개 채널이라 외국인 세분 데이터의 실제 보유·수집가능성을 외부에서 확정 불가(collectability low~mid 보수 추정). (4) bigdata-finance.kr의 개별 외국인 데이터셋의 무

### 지자체·광역 열린데이터 포털 (13)
- `[high/openapi/key]` · 외국인특화 **서울특별시** — 서울 열린데이터광장 (Open API 전체 플랫폼)
  - https://data.seoul.go.kr/
  - 서울시 행정 전 분야 데이터셋(인구/가구 카테고리 256개 포함). 외국인주민 통계, 경제활동인구, 사업체·종사자, 사업체 창업률(동별), 생활인구 등. data.go.kr와 별개 포털 — 자체 인증키·자체 openapi.seoul.go.kr:8088 엔드포인트 운영.
- `[mid/portal/unknown]` · 외국인특화 **서울특별시 (서울 열린데이터광장)** — 서울시 외국인근로자(국적별) 통계
  - https://data.seoul.go.kr/dataList/11032/S/2/datasetView.do
  - 국적별 외국인근로자 수 통계(서울시 단위).
- `[low/portal/none]` · 외국인특화 **서울특별시 (서울 열린데이터광장)** — 서울시 외국인주민 총괄 통계 (서비스 종료)
  - https://data.seoul.go.kr/dataList/11026/S/2/datasetView.do
  - 국적별·연령별·체류기간별·국적취득별 외국인주민, 결혼이민자/외국인근로자/유학생, 외국인주민 자녀(연령별).
- `[high/openapi/key]` · 외국인특화 **경기도** — 경기데이터드림
  - https://data.gg.go.kr/
  - 경기도 공공데이터 통합포털. Sheet/Chart/Map/File/Link + 개발자용 Open API 서비스. 외국인 주민(복지)센터 현황, 다문화 가족지원센터 현황 등.
- `[high/file/none]` · 외국인특화 **인천광역시 (인천데이터포털, data.go.kr 미러)** — 인천 연수구 외국인 부동산 거래 현황 통계
  - https://www.incheon.go.kr/data/DATA010201/view?docId=15065556
  - 연수구 내 외국인 부동산 거래: 필지, 면적, 취득금액, 공시지가 금액 등. 연도별(2020~2023) CSV.
- `[mid/portal/unknown]` · 외국인특화 **인천광역시** — 인천데이터포털 / 인천 오픈데이터허브
  - https://data.incheon.go.kr/
  - 인천시 공공데이터 포털(별도 icloud.incheon.go.kr/opendatahub/, smart-incheon ArcGIS 오픈데이터 허브 병존).
- `[mid/openapi/key]` **부산광역시** — 부산 Big-데이터웨이브 (data.busan.go.kr/bdip)
  - https://data.busan.go.kr/bdip/
  - 부산시·공공기관 데이터 통합. API 326건, 파일 2,660, 시트 2,465, 링크 9,358 등. 16개 분야(재정금융·산업고용·사회복지 포함).
- `[mid/openapi/key]` **부산광역시** — 부산 개방형 빅데이터포털 / 부산 API셋
  - https://data.busan.go.kr/apiSet/list.nm
  - 부산시 OpenAPI 목록 페이지. 빅데이터 분석·시각화(bigdata.busan.go.kr 병존).
- `[mid/openapi/key]` **충청남도 (천안·아산 등 시군 포함)** — 충청남도 데이터포털 올담 (alldam)
  - https://alldam.chungnam.go.kr/
  - 충남 광역+시군 공공데이터 통합포털. Open API 제공(명세서 다운 후 활용). 올담데이터맵.
- `[low/openapi/key]` **경상남도 (거제시·김해시 등)** — 경남빅데이터허브플랫폼 / 거제·김해 데이터포털
  - https://bigdata.gyeongnam.go.kr/
  - 경남 광역 빅데이터 허브 + 거제시 데이터포털(data.geoje.go.kr), 김해시 공공데이터안내 등. OpenAPI 활용신청.
- `[low/portal/unknown]` **대구광역시** — D-데이터허브 (대구) / 대구빅데이터활용센터
  - https://data.daegu.go.kr/
  - 대구시 공공데이터 통합포털(data.daegu.go.kr) + 대구빅데이터활용센터(bigdata.dip.or.kr). 생활/교통/관광 등.
- `[low/portal/subscribe]` · 외국인특화 **서울특별시** — 서울특별시 빅데이터캠퍼스 (외국인 카드소비 데이터)
  - https://bigdata.seoul.go.kr/
  - 신용카드(내국인 개인카드+외국인 카드이용내역), 교통카드, 수도권 생활이동 등 민간·고가 데이터. 외국인 가맹점 카드이용 건 포함.
- `[mid/file/none]` · 외국인특화 **각 지자체 (data.go.kr 등록, 지자체 원천)** — data.go.kr 외국인 부동산/토지 거래 현황 (시군구 fileData)
  - https://www.data.go.kr/
  - 여러 자치구가 등록한 '외국인 부동산/토지 거래 현황' fileData(취득금액·공시지가·필지·면적). 인천 연수구 외 다수 자치구 산재.
  - ⚠️ 갭: 1) 경기데이터드림 데이터셋 검색페이지(searchDatasetPage.do)가 JS 렌더라 WebFetch로 전체 외국인 데이터셋 목록 확보 실패 — 확인된 건 복지/다문화 '센터 현황' 인프라 데이터뿐이고, 외국인 소득·임금·사업체 등 직접 금융 데이터셋의 존재여부는 미확정. 2) 안산·화성 등 외국인 최다 밀집 기초지자체의 '자체' 외국인 금융 데이터셋을 핀포인트로 확인 못함(안산은 외국인주민지원본부 페이지만 확인, 데이터셋 아님). 3) 부산/대구/경남/충남 광역 포털은 실존·OpenAPI 체계는 확인했으나, 각 포털 내 '외국인 특화 + 금융' 데이터셋의 구체 유무는 미검증(collectability mid/low로 표기). 4) 서울 외국인근로자(11032) 등 일부 데이터셋의 OpenAPI 서비

### 공공기관 — 고용·교육·복지·연금·보험 (15)
- `[high/portal/none]` · 외국인특화 **고용노동부 / 한국고용정보원** — 고용행정통계 (EIS) — 외국인근로자 근무현황(분기/년) · 외국인고용 사업장현황 · 일반고용허가제 도입현황
  - https://eis.work24.go.kr/eisps/rpt/reptDtl.do?menuId=030020020
  - 외국인근로자 고용허가서 발급 건수(취득·전근·연장·이동·고용승계·재고용·복귀), 국적별·업종(표준산업분류)·지역(우편코드)별·고용허가제구분(일반/특례) 분기·연 집계. 외국인고용 사업장현황 별도 메뉴.
- `[high/file/key]` · 외국인특화 **통계청 / 법무부 (MDIS 제공)** — 이민자 체류실태 및 고용조사 (마이크로데이터)
  - https://mdis.kostat.go.kr/dwnlSvc/ofrSurvSearch.do
  - 국내 90일 이상 거주 외국인·귀화자(15세 이상) 대상 체류자격별 취업·임금·소득·근로조건, 본국 송금, 생활만족도 등 개인·가구 단위 원자료(국가승인통계). EU/OECD 이민자 사회통합지표 반영.
- `[mid/portal/subscribe]` **국민연금공단 / 전북창조경제혁신센터** — 국민연금 금융혁신 빅데이터 플랫폼
  - https://data.nps.or.kr/service/
  - 공단 보유데이터(지역이동량 등 4종), 금융구매데이터(신용정보 등 54종), 수집데이터(예금·환율정보 등 56종) 총 114종(약 34억 건). 국내 최초 가명정보 분석·활용 환경.
- `[mid/portal/none]` **국민연금공단** — 국민연금 빅데이터 포털 — 대국민 빅데이터 서비스
  - https://data.nps.or.kr/
  - 사업장가입자 현황, 노령연금 현황 등 124종 국민연금 통계데이터 시각화 제공.
- `[high/file/none]` · 외국인특화 **근로복지공단** — 근로복지공단 — 외국인근로자 산재처리현황
  - https://www.data.go.kr/data/15104688/fileData.do
  - 산재보험 가입 외국인근로자의 재해유형별(업무상 사고/질병) 신청·승인 건수 연도별 집계.
- `[low/portal/subscribe]` **국민건강보험공단** — 국민건강보험 자료공유서비스 (NHISS) — 맞춤형/표본 연구DB
  - https://nhiss.nhis.or.kr/
  - 건강보험·장기요양 가명처리 맞춤형연구DB, 표본연구DB, 건강검진·자격·보험료 데이터. 연구목적 추출.
- `[mid/openapi/key]` **건강보험심사평가원** — 보건의료빅데이터개방시스템 (HIRA)
  - https://opendata.hira.or.kr/
  - 공공데이터(데이터셋·오픈API), 의료통계(질병·의약품·의료기관), 빅데이터분석센터. 의료기관 입원실에 '외국인전용' 구분 포함.
- `[low/portal/unknown]` · 외국인특화 **삼성화재 (위탁운영, 고용노동부 의무보험)** — 삼성화재 외국인근로자 전용보험 (출국만기·임금체불보증·귀국비용·상해보험)
  - https://foreign-worker.sfmi.co.kr/data
  - E-9/H-2 외국인근로자 의무가입 4대 전용보험(출국만기보험=퇴직금, 임금체불보증, 귀국비용, 상해) 상품·가입 안내 및 자료실.
- `[high/portal/none]` · 외국인특화 **한국교육개발원(KEDI) 국가교육통계센터** — 한국교육개발원 교육통계서비스 (KESS)
  - https://kess.kedi.re.kr/index
  - 국가별·학위과정별·전공별 외국인유학생 수, TOPIK 언어능력별, 재학·휴학·졸업, 학교/학과별 데이터셋. 통계연보·간행물.
- `[low/portal/subscribe]` · 외국인특화 **한국교육개발원(KEDI) / 교육부** — 고등교육통계조사 시스템 (HiEd)
  - https://hi.kedi.re.kr/
  - 고등교육기관 외국인유학생 현황 등 고등교육 원자료 조사 시스템. 외국인유학생 졸업·취업 통계 포함.
- `[mid/file/none]` **한국장학재단(KOSAF)** — 한국장학재단 공공데이터 개방 / 장학금 통계연보
  - https://www.kosaf.go.kr/ko/openinfo.do?pg=operation04
  - 장학금 사업현황 통계연보(지원금액·건수), 대학별 장학금 수혜현황(교내외 장학금). 학자금 지원구간.
- `[mid/portal/unknown]` · 외국인특화 **한국산업인력공단(HRDK)** — 한국산업인력공단 EPS 고용허가제 통합서비스
  - https://eps.hrdkorea.or.kr/
  - EPS(E-9) 외국인근로자 도입현황, 송출국가별, EPS-TOPIK, 근로계약·도입절차. 표준근로계약·의무보험 안내.
- `[mid/file/key]` **고용노동부** — 고용노동통계포털 (laborstat) — 마이크로데이터/자료신청
  - https://laborstat.moel.go.kr/
  - 고용노동 조사통계 통계DB(주제별/통계별), 마이크로데이터신청, 통계조사 보고서, OpenAPI 네비 존재. 고용형태별근로실태조사 등.
- `[high/file/none]` · 외국인특화 **여성가족부 / 성평등가족부** — 여성가족부(성평등가족부) 전국다문화가족실태조사 마이크로데이터
  - https://www.data.go.kr/data/15114756/fileData.do
  - 다문화가족 결혼이민자·귀화자 가구특성·주거·경제상황·소득(월소득 구간), 자녀교육, 코드북. 3년 주기 국가승인통계.
- `[low/scrape/subscribe]` **한국고용정보원** — 한국고용정보원 (KEIS) 고용보험DB
  - https://www.keis.or.kr/
  - 고용보험 행정DB(피보험자 취득·상실 이력, 사업장). 외국인 피보험자 추적 잠재.
  - ⚠️ 갭: - 외국인근로자 본국 '송금액' 실측 데이터: 이민자체류실태조사에 송금 문항이 있으나 금액 분포·집계의 공개 단위(국적·체류자격별) 정밀도는 미확인. 한국은행 ECOS(개인이전수지/근로소득수지)는 이미 등록.\n- EPS/HRDK·삼성화재 전용보험의 '가입자/보험금 집계 통계'가 공개 다운로드되는지 확인 못함(상품 안내 페이지만 확인). 출국만기보험 적립·지급액은 외국인 퇴직금 자산 규모 지표가 될 수 있으나 공개처 불명.\n- nhiss(맞춤형DB)·NPS 금융혁신플랫폼은 모두 방문/승인형 안심구역 모델이라 자동수집 불가, collectability low/mid. 외국인 변수 분리 가능 여부는 신청·심의 후에야 확정.\n- KEDI 고등교육통계(hi.kedi.re.kr), KEIS 고용보험DB는 로그인/

### 국제기구·글로벌 비교(송금·이주) (10)
- `[high/file/none]` · 외국인특화 **World Bank / KNOMAD** — World Bank KNOMAD Remittance Data (Bilateral Remittance Matrix & Inflow/Outflow)
  - https://www.worldbank.org/en/topic/migration/brief/remittances-knomad
  - 양자 송금 매트릭스(bilateral remittance matrix .xlsx, 송출국×수취국), 국가별 연간 송금 유입/유출액(remittance inflows/outflows), 양자 이주 매트릭스(bilateral migration matrix). 한국이 송출국·수취국 양쪽으로 포함됨.
- `[high/file/none]` · 외국인특화 **World Bank** — Remittance Prices Worldwide (RPW)
  - https://remittanceprices.worldbank.org/data-download
  - 송금 corridor별 비용(평균 수수료 %, 환율 마진 포함 총비용), 송출국·수취국·corridor 단위. 367개 corridor, 48개 송출국×105개 수취국. 2011~최근분기 시계열.
- `[mid/openapi/unknown]` · 외국인특화 **World Bank Data360** — World Bank Data360 API (KNOMAD 양자 송금추정 등 지표 API)
  - https://data360.worldbank.org/en/api
  - WB_KNOMAD_BRE(이주민 스톡·소득 기반 양자 송금 추정 US$m), WB_KNOMAD_MRI(송금 유입 US$m) 등 300M+ 데이터포인트. country/time/sex/age 등 필터 지원 시계열.
- `[high/file/none]` · 외국인특화 **UN DESA Population Division** — UN DESA International Migrant Stock 2024
  - https://www.un.org/development/desa/pd/content/international-migrant-stock
  - 국제 이주민 스톡 추정(1990~2024, 233개국). 표: Total(destination), Total(origin), Destination×Origin 양자 매트릭스(성별 포함).
- `[high/openapi/none]` · 외국인특화 **OECD (ELS/IMD)** — OECD International Migration Database (IMD) + Data Explorer/SDMX API
  - https://data-explorer.oecd.org/vis?df%5Bds%5D=DisseminateFinalDMZ&df%5Bid%5D=DSD_MIG@DF_MIG&df%5Bag%5D=OECD.ELS.IMD
  - OECD국 외국인/외국출생 인구 스톡·유입 플로우(국적별), 망명신청, 국적취득 연간 시계열. 한국(KOR) 포함.
- `[mid/portal/none]` · 외국인특화 **OECD** — OECD Databases on Migration — DIOC & Indicators of Immigrant Integration (Settling In)
  - https://www.oecd.org/en/data/datasets/oecd-databases-on-migration.html
  - DIOC(Database on Immigrants in OECD Countries): 이민자 인구·노동시장 특성(고용/자영업/학력/소득). Indicators of Immigrant Integration(Settling In): 고용·교육·사회통합·소득 통합지표.
- `[mid/openapi/unknown]` · 외국인특화 **IMF (STA)** — IMF Balance of Payments Statistics (BOP) — Personal Remittances / Compensation of Employees
  - https://data.imf.org/en/datasets/IMF.STA:BOP
  - BPM6 기준 국제수지: personal transfers + compensation of employees = personal remittances(2차소득/본원소득). 한국 송금 수취/지급 시계열.
- `[mid/openapi/unknown]` · 외국인특화 **IOM GMDAC** — IOM Global Migration Data Portal (GMDAC) + Portal API
  - https://www.migrationdataportal.org/themes/remittances-overview
  - 송금(remittances) 테마 지표, 국제이주민 스톡, 노동이주, 송금 인포그래픽. 글로벌/지역/국가 단위 큐레이션 지표(상당수 World Bank/UN 원천 재집계).
- `[high/file/none]` **World Bank** — World Bank Global Findex Database 2025 (송금·계좌·디지털금융 포용)
  - https://www.worldbank.org/en/publication/globalfindex/download-data
  - 약 300개 지표(계좌보유, 송금 수취/송금, 디지털결제, 저축/신용/금융회복력) — 141개국 14.5만명 수요측 설문. 국가별·인구집단별.
- `[mid/openapi/none]` **Bank for International Settlements** — BIS Data Portal — Locational Banking Statistics (LBS) / Cross-border positions
  - https://data.bis.org/topics
  - 은행 국경간 자산·부채(통화·부문·상대국별). LBS는 200개국 이상 상대국 대상 cross-border claims/liabilities. 한국 보고/상대국 포함.
  - ⚠️ 갭: 한계/미해결: (1) data360 API(data360api.worldbank.org)와 IMF data.imf.org(IMF.STA:BOP), IOM Portal API의 정확한 REST 엔드포인트 경로·스키마·API key 필요 여부를 공식 문서로 끝까지 확정하지 못함 — 해당 페이지들이 WebFetch 403(세션/브라우저 필요) 또는 베타 상태라 collectability를 일부 mid로 둠. 실제 호출 검증은 브라우저 기반 도구(Chrome MCP)나 키 발급 후 테스트 필요. (2) KNOMAD bilateral remittance matrix의 최신연도 직접 파일 URL은 본문 임베드 링크라 연도별 확인 필요(파일명 패턴 변동). (3) UN DESA·OECD IMD는 한국 포함이 사실상 확실

### 연구기관·민간·핀테크 (18)
- `[mid/portal/none]` · 외국인특화 **이민정책연구원 (Migration Research & Training Centre, 법무부 산하 / IOM 협력)** — 이민정책연구원(MRTC) - 발간물·연구자료·정기간행물
  - https://mrtc.re.kr/main/main.php
  - 이민·체류·외국인 노동자 관련 연구보고서, 정책자료, 정기간행물(이민자 경제활동·송금·소득 분석 포함). PDF 문서 위주
- `[high/openapi/key]` **경제·인문사회연구회 (산하 26개 국책연구기관 통합 - KDI, KIEP, 한국보건사회연구원, 한국교육개발원 등)** — NKIS 국가정책연구포털 (OpenAPI 제공)
  - https://www.nkis.re.kr
  - 26개 정부출연연구기관의 정책연구보고서 메타데이터+원문(이민·다문화·외국인 노동·송금 주제 다수). OpenAPI로 보고서 메타데이터 수집 가능
- `[mid/portal/none]` **대외경제정책연구원 (Korea Institute for International Economic Policy)** — KIEP 대외경제정책연구원 - 발간물/보고서
  - https://www.kiep.go.kr/menu.es?mid=a10101000000
  - 이주노동·국제이주·송금·외국인직접투자(FDI)·개발협력 관련 연구보고서(전체보고서·기본연구·오늘의세계경제 등). PDF
- `[low/portal/none]` **대외경제정책연구원(KIEP) 운영** — EMERiCs 신흥지역정보 종합지식포털
  - https://csf.kiep.go.kr/menu.es?mid=a10601010000&systemcode=02
  - 신흥국(동남아·중앙아 등 외국인 노동자 송출국) 경제·비즈니스·이슈분석 정보. 송금 수취국 동향·ODA·이주 관련 이슈심층분석
- `[mid/portal/none]` **한국개발연구원(KDI) 경제정보센터** — KDI 경제정보센터(EIEC) - 국내외 연구자료 아카이브
  - https://eiec.kdi.re.kr/policy/domesticView.do
  - 외국인 금융접근성·송금·이주 관련 국내외 연구자료를 큐레이션해 모아둔 아카이브(예: '국내 거주 외국인의 금융 접근성 현황 및 개선과제', 2025, KIF). 원문 PDF 링크
- `[mid/portal/none]` · 외국인특화 **한국금융연구원 (Korea Institute of Finance)** — 한국금융연구원(KIF) - 금융브리프/금융리포트
  - https://www.kif.re.kr/
  - 외국인 금융접근성·소액해외송금시장·디지털금융 분석 보고서(예: '국내 거주 외국인의 금융 접근성 현황 및 개선과제' 2025-05). PDF 뷰어
- `[mid/portal/unknown]` **국회예산정책처 (National Assembly Budget Office)** — 국회예산정책처 NABOSTATS 재정경제통계시스템
  - https://www.nabostats.go.kr/
  - 재정·조세·경제·인구사회통계. 'NABO 인구전망 2025~2045'의 외국인 인구 전망(2025년 206만→2045년 345만, 인구의 7.0%) 등. 통계표 다운로드
- `[high/file/none]` · 외국인특화 **통계청 (법무부 공동) - 국가데이터처** — 통계청 이민자체류실태 및 고용조사 - 보도자료 원자료(KOSTAT)
  - https://kostat.go.kr/board.es?bid=11109&mid=a10301030400
  - 외국인 임금근로자 월평균 임금분포, 고용률, 체류자격별 경제활동, 송금 관련 문항 포함 조사 결과. 보도자료(HWP/PDF/엑셀 첨부)
- `[mid/portal/subscribe]` · 외국인특화 **통계청 국가데이터처 (MicroData Integrated Service)** — MDIS 마이크로데이터 통합서비스 - 이민자체류실태및고용조사 원시자료
  - https://mdis.kostat.go.kr/
  - 이민자체류실태및고용조사 등 외국인 대상 조사의 개인단위 마이크로데이터(원시자료). 소득·임금·송금·체류 변수 포함
- `[mid/portal/subscribe]` **서울대학교 한국사회과학자료원 (Korea Social Science Data Archive)** — KOSSDA 한국사회과학자료원 - 다문화/이민 설문 데이터
  - https://kossda.snu.ac.kr/
  - 다문화·이주민·외국인 대상 사회조사 마이크로데이터(설문지·코드북 공개, 자료는 신청). 경제·소득·송금 문항 포함 조사 다수
- `[mid/portal/none]` **한국보건사회연구원 (Korea Institute for Health and Social Affairs)** — 한국보건사회연구원(KIHASA) 보고서/Repository
  - https://www.kihasa.re.kr/publish/
  - 빈곤통계연보, 이주민·다문화 가구 소득·빈곤·복지 연구보고서. PDF + repository.kihasa.re.kr 디지털 아카이브
- `[low/portal/unknown]` · 외국인특화 **한국이민학회(kimanet.org), 한국이민정책학회, 한국이민행정학회** — 한국이민학회 학술지 '한국이민학' + 관련 학회
  - https://kimanet.org/
  - 외국인 노동자 송금액 영향요인, 송금방식 선택요인 등 실증 논문(학술지 '한국이민학' ISSN 2093-6044). 논문 PDF
- `[low/portal/unknown]` · 외국인특화 **금융결제원 (Korea Financial Telecommunications & Clearings Institute)** — 금융결제원 EXK(국가간 ATM·해외송금) 서비스
  - https://exk.kftc.or.kr/
  - 국가간 실시간 해외송금·해외ATM 인출 서비스(베트남·태국·필리핀·말레이시아·인도네시아 등 corridor). 이용지역·제휴ATM 정보
- `[low/openapi/key]` **금융결제원 (KFTC 오픈API 개발자사이트)** — 금융결제원 오픈API (오픈뱅킹·계좌·이체)
  - https://developers.kftc.or.kr/dev
  - 오픈뱅킹(잔액·거래내역·계좌실명·입출금이체·송금인정보조회), 어카운트인포(계좌통합조회), 대출이동, FIN MAP(ATM/지점·수수료) 등 API
- `[mid/openapi/key]` **금융위원회·금융감독원 외 15개 금융 공공기관 (예보·산은·기은·신보·캠코·주금공·서금원·예탁결제원·거래소·생손보협회·보험개발원)** — 금융공공데이터 개방 (FSC 금융위 주관)
  - https://www.fsc.go.kr/in060101
  - 기업·금융회사·자본시장·서민금융상품·금융통계 정보. 87개 API·290개 테이블(서민금융·금융상품 등 외국인 연관 가능 항목 포함)
- `[mid/portal/none]` **한국핀테크지원센터 (fintech.or.kr, 삼정KPMG 수행)** — 한국핀테크지원센터 - 핀테크 동향보고서/산업현황조사
  - https://fintech.or.kr/
  - 한국 핀테크 동향보고서(기업수·종사자·매출 통계), 핀테크 산업현황 조사. 해외송금·디지털금융 트렌드 포함. PDF 보고서
- `[low/scrape/none]` · 외국인특화 **연세대학교 간호대학 MHR(Multicultural Health Research) 연구센터** — 연세대 간호대학 MHR - 다문화/외국인 공공데이터 모음
  - http://mhr.co.kr/sub_data/public_dataC.php
  - 전국다문화가족실태조사 등 다문화·외국인 인구 관련 공공데이터를 정리·재배포한 큐레이션 페이지(주거·경제조건 항목 포함)
- `[mid/portal/none]` · 외국인특화 **금융감독원(FINE 금융소비자포털) / 업계·언론 집계** — 소액해외송금업 관련 통계 (금융감독원 FINE / 업계 집계)
  - https://fine.fss.or.kr/main/fin_comp/smallsum/remittance1.jsp
  - 소액해외송금업자 등록현황·송금액·송금건수·국가별 비중(네팔24%·필리핀19%·베트남12% 등). 분기 집계
  - ⚠️ 갭: 민간 송금 핀테크(센트비·한패스·GME)와 시중은행(하나 Hana EZ 등)의 '국가별·금액별 송금 데이터'는 마케팅 보도자료 수준만 공개되고, 다운로드 가능한 정형 데이터셋/공개 API는 확인되지 않음(영업비밀). 한패스 외국인고객 90%·센트비 누적 6조원 같은 단편 수치만 언론에 산재. 신용평가사(NICE/KCB)의 '외국인 thin filer 신용' 전용 공개 데이터/리포트도 실재 확인 불가(일반 신용점수 설명만 존재). 토스·카카오뱅크의 외국인 금융포용 '데이터 리포트'는 보도자료 외 정형 소스 미발견. EXK·금융결제원의 외국인 송금 '거래량 통계' 공개 다운로드 여부, NABOSTATS·금융공공데이터의 외국인 특화 테이블 존재 여부는 포털 직접 로그인/조회가 필요해 collectability=u

### 추가 사냥(완전성) (11)
- `[high/portal/none]` · 외국인특화 **국세청 (National Tax Service) 국세데이터담당관실** — 국세통계포털(TASIS) - 외국인근로자 연말정산 신고현황(국적별·결정세액)
  - https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml
  - 외국인 근로자 연말정산 신고현황 통계표(신고인원, 총급여, 결정세액, 국적별 분포 - 중국/베트남/네팔 등). 2023년 기준 61.1만명 신고, 결정세액 1조1657억원, 평균 총급여 3,278만원. 분기별/연간 국세통계 공표
- `[high/file/none]` · 외국인특화 **관세청 (Korea Customs Service), 공공데이터포털 게재** — 관세청 면세점 내외국인별 유형별 품목별 매출실적 / 면세점 품목별 내외국인 매출현황
  - https://www.data.go.kr/data/15123277/fileData.do
  - 보세판매장(면세점) 매출·이용객을 내국인/외국인으로 구분, 면세점 유형(시내·출국장·입국장·외교관·지정)별·품목별(가방·귀금속·담배·화장품·시계 등) 매출액(USD/KRW). 2018.1~현재 월별
- `[mid/portal/none]` · 외국인특화 **한국관광공사 (KTO), 신한카드 등 카드사·통신·내비 데이터 융합** — 한국관광 데이터랩 - 외국인 신용카드 관광소비 / 간편결제(제로페이) 소비
  - https://datalab.visitkorea.or.kr/datalab/portal/nat/getNatFocTourAna.do
  - 신용카드 기반 방한 외국인 관광소비 동향(업종별·지역별 지출액, 전년대비 증감), 제로페이 기반 외국인 간편결제 지역분포. 모바일통신·카드·내비 융합분석
- `[high/openapi/key]` **한국은행 (Bank of Korea)** — 한국은행 경제통계시스템(ECOS) OpenAPI - 국제수지 개인이전·노동소득·여행수지
  - https://ecos.bok.or.kr/api/
  - 국제수지(BOP) 본통계 시계열: 개인이전수지(노동자송금 포함), 본원소득(피용자보수=노동소득), 여행수지, 거주자/비거주자 대외포지션 등 ECOS 전체 통계코드 API 제공
- `[mid/scrape/none]` · 외국인특화 **기획재정부 등록·금융감독원 감독 + 각 사 IR/언론 집계** — 소액해외송금업 핀테크사(한패스·센트비·GME 등) 거래실적 / 기재부 등록현황
  - https://fine.fss.or.kr/main/fin_comp/smallsum/remittance1.jsp
  - 소액해외송금업자 등록 28곳 명단, 업체별 누적 송금액·외국인 고객 비중(한패스 외국인 90%+, 센트비 누적 6조원+ 등), 시장규모 추정
- `[low/file/none]` **우정사업본부(과학기술정보통신부) / 우체국금융개발원** — 우체국금융개발원 / 우정사업본부 우체국예금 공공데이터
  - https://www.koreapost.go.kr/kpost/subIndex/175.do
  - 우체국예금 상품·가입·잔액 통계(공공데이터 개방목록), 우편·금융 통계 21종. 외국인 전용 통계는 미공개
- `[low/openapi/key]` **행정안전부 / MG새마을금고중앙회 / 신협중앙회** — MG새마을금고 / 신협 회원·예수금 통계 (행정안전부 통계연보 OpenAPI)
  - https://www.data.go.kr/data/15107267/openapi.do
  - 지역별 새마을금고 회원수·자산·예금·대출 통계(행안부 통계연보 OpenAPI). 새마을금고중앙회 통계정보(kfcc.co.kr/federation/fed0602.do)
- `[mid/file/none]` · 외국인특화 **통계청(국가데이터처)·금융감독원·한국은행 공동(가계금융복지조사)** — 통계청 가계금융복지조사 / 다문화·외국인 가구 자산·부채 통계표 (KOSIS)
  - https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1HDCA06
  - 가구특성별 자산·부채·소득(가계금융복지조사) 통계표, 다문화/외국인 가구 통계(인구·경제활동·자산 등 6개분야 83항목). data.go.kr 15140145(가구특성별 자산·부채 통계표)
- `[mid/portal/unknown]` · 외국인특화 **법무부 출입국·외국인정책본부 / 이민정책연구원(MRTC) 분석** — 법무부 투자이민제(부동산·공익사업) 예치·투자 현황 통계
  - https://www.moj.go.kr/moj/189/subview.do
  - 투자이민제(F-2→F-5) 투자건수·투자금액(부동산 10억↑·공익사업 예치금), 비자/영주권 부여 인원. 누적 1961건·1.47조원(2021.6 기준)
- `[high/file/none]` · 외국인특화 **산업통상자원부 / KOTRA 인베스트코리아** — 산업통상자원부 외국인직접투자(FDI) 동향 통계 (data.go.kr OpenAPI/파일 + KOTRA)
  - https://www.data.go.kr/data/15054400/fileData.do
  - 국가별·산업별·투자형태별(M&A·그린필드) 대한 외국인직접투자 통계. 분기별. KOTRA FDI 빅데이터 시각화(kotra.or.kr/bigdata/visualization/fdi)
- `[high/file/none]` **국세청 (NTS), 공공데이터포털 게재** — 근로소득 백분위(천분위) 자료 / 외국인 소득세 신고현황 (국세청 data.go.kr)
  - https://www.data.go.kr/data/15082063/fileData.do
  - 근로소득 백분위·천분위 분포 자료(전체 근로자). index.go.kr idx_cd=2849 '외국법인 법인세 및 외국인 소득세 신고현황' / idx_cd=1126 근로소득 지급조서 현황
  - ⚠️ 갭: 새마을금고·신협, 우체국예금은 '외국인 회원/계좌' 분리 통계가 공개 목록에 없어 외국인 특화 수집 가능성이 낮음(중앙회 직접 문의 필요). BC카드/신한카드 외국인 카드소비 원자료는 상업 데이터 상품(데이터바다·금융빅데이터플랫폼)으로 유료·구독 장벽(기존 목록과 중복). 핀테크 소액송금사 업체별 외국인 거래실적은 공식 통계가 아니라 IR·언론 스크래핑에 의존해 정합성·시계열 한계. 외국인 가구 자산·부채(가계금융복지조사)는 다문화가구 표본이 작아 외국인 전용 금융지표 신뢰도가 제한적. 지자체 외국인지원센터(서울글로벌센터 등)는 상담·지원 건수는 있으나 금융 마이크로데이터로 개방된 것은 확인 못함. TASIS·관세청 면세점은 외국인 분리 통계가 확실하나 전용 OpenAPI보다 통계표/파일 다운로드 위주라 자

## 검색 흔적 (사용한 검색어 130개)

### 중앙부처·이민/체류 통계 포털·API
- `출입국·외국인정책본부 통계연보 통계월보 API 데이터 immigration.go.kr`
- `통계청 MDIS 마이크로데이터 외국인 외국인고용조사 microdata.kostat.go.kr`
- `SGIS 통계지리정보 OpenAPI 외국인 인구 sgis.kostat.go.kr 개발지원센터`
- `행정안전부 지방자치단체 외국인주민 현황 통계 데이터 다운로드`
- `e-나라지표 외국인 송금 외국인근로자 임금 체류외국인 지표 index.go.kr`
- `통계청 이민자체류실태 고용조사 외국인 소득 송금 마이크로데이터 KOSIS`
- `이민자 체류실태 및 고용조사 월평균임금 본국 송금 조사항목 통계청 결과`
- `고용노동부 외국인 고용허가제 EPS 통계 고용허가 외국인근로자 통계 API`
- `출입국 외국인정책 통계서비스 통계포털 immigration statistics service 외국인정책본부 통계 조회 시스템`
- `국가데이터처 k-stat.go.kr 통계포털 OpenAPI 외국인 통계 마이그레이션 KOSIS`
- `고용행정통계 work24 외국인근로자 임금 고용보험 외국인 피보험자 통계 eis.work24.go.kr`
- `국민연금공단 외국인 가입자 통계 국민연금 통계포털 외국인 사업장가입자`
- `한국부동산원 외국인 토지 주택 거래 건축물 매입 통계 R-ONE 부동산통계정보`
- `다문화 통계 KOSIS 다문화인구통계 결혼이민자 다문화가구 소득 통계 포털`
- `국민건강보험공단 외국인 가입자 통계 빅데이터 건강보험 외국인 지역가입자 통계연보 nhis`
- `법무부 출입국 통계 OpenAPI immigration.go.kr 통계 자체 API 미등록외국인 불법체류 통계 데이터셋`
- `통계청 외국인고용조사 마이크로데이터 다운로드 MDIS 임금 근로소득 변수 제공`

### 금융 통계 기관·API
- `금융위원회 금융공공데이터개방시스템 FSC opendata API`
- `금융감독원 공시 통계 OpenAPI DART 외국인`
- `한국신용정보원 CreDB 신용정보 개방 빅데이터 외국인`
- `예금보험공사 통계 OpenAPI 부보예금 공공데이터`
- `한국주택금융공사 HF 통계 OpenAPI 주택금융 외국인 보증`
- `한국은행 ECOS 개인송금 거주자외화예금 통계 시계열 API`
- `금융데이터거래소 findatamall 외국인 송금 데이터상품 거래소`
- `금융감독원 fss.or.kr OpenAPI 목록 외국인 투자동향 금융통계정보시스템 FISIS`
- `금융결제원 KFTC 송금 해외송금 통계 외환 데이터 API`
- `한국은행 국제수지통계 개인이전 노동소득 송금 ECOS data.go.kr`
- `fisis.fss.or.kr OpenAPI 개발자 인증키 통계조회 fisis_open`
- `우체국 예금보험 우정사업본부 외화송금 통계 공공데이터 API`
- `FISIS 금융통계정보시스템 OpenAPI 인증키 외화예금 거주자 비거주자 통계조회`
- `credb.kcredit.or.kr 금융빅데이터 개방시스템 표본DB 외국인 신용 데이터셋`
- `금융 빅데이터 플랫폼 bigdata-finance.kr 외국인 소득 송금 소비 데이터셋`
- `bigdata-finance.kr 외국인 국적별 소비 BC카드 해외송금 집계 데이터 상품`
- `BC카드 BCiF 외국인 근로자 송금 소비 분석 리포트 GME 데이터`
- `금융결제원 금융결제통계 데이터플랫폼 표본데이터 다운로드 신청 비식별`
- `금융위원회 금융공공데이터 개방시스템 API 외국인 투자 외국환 거래 통계 테이블`
- `한국예탁결제원 SEIBro 외국인 보유 증권 통계 OpenAPI 공공데이터`

### 지자체·광역 열린데이터 포털
- `서울 열린데이터광장 외국인주민 OpenAPI data.seoul.go.kr`
- `경기데이터드림 data.gg.go.kr 외국인 다문화 API`
- `서울 열린데이터광장 외국인 주민 등록 인구 통계 데이터셋`
- `안산시 외국인주민 다문화 오픈데이터 API data.go.kr`
- `인천 데이터포털 외국인 외국인주민 통계 open data`
- `서울 열린데이터광장 외국인 사업체 외국인 근로자 소득 데이터셋`
- `부산 빅데이터포털 외국인주민 외국인 통계 API`
- `경기데이터드림 외국인 근로자 임금 소득 다문화가족 데이터셋 OpenAPI`
- `대구 데이터포털 화성시 오픈데이터 외국인주민 통계 API`
- `서울 열린데이터광장 외국인 관광객 카드 소비 매출 데이터셋 API`
- `경기데이터드림 외국인 부동산 거래 외국인 토지 소유 데이터`
- `서울 빅데이터캠퍼스 외국인 카드소비 데이터 bigdata.seoul.go.kr 신청`
- `충청남도 천안 아산 외국인근로자 다문화 오픈데이터 포털 API`
- `data.seoul.go.kr 외국인 통계 데이터셋 목록 외국인근로자 결혼이민자 OpenAPI 인증키`
- `경기데이터드림 외국인 사업체 외국인 경제활동 취업 통계 OpenAPI`
- `경상남도 김해 거제 외국인주민 데이터포털 오픈API 다문화`
- `data.go.kr 외국인 부동산 거래 현황 통계 시군구 취득금액 fileData`
- `서울 열린데이터광장 외국인주민 경제활동 사업체 종사자 통계 datasetView`

### 공공기관 — 고용·교육·복지·연금·보험
- `고용허가제 EPS 외국인근로자 통계 OpenAPI eps.go.kr`
- `국민건강보험공단 외국인 가입자 통계 데이터 API`
- `국민연금공단 외국인 가입자 통계 OpenAPI 공공데이터`
- `국민건강보험 빅데이터 nhiss.nhis.or.kr 외국인 자료 신청 맞춤형`
- `국민연금 빅데이터 포털 data.nps.or.kr 외국인 가입 데이터`
- `근로복지공단 외국인 산재보험 통계 데이터 공공데이터`
- `한국교육개발원 KEDI 교육통계서비스 OpenAPI 외국인 유학생`
- `한국장학재단 외국인 유학생 장학금 통계 데이터 공공데이터`
- `고용행정통계 work24 eis.work24.go.kr 외국인 고용보험 통계`
- `한국산업인력공단 외국인고용 EPS 도입 통계 송금 임금`
- `국민연금 금융혁신 빅데이터 플랫폼 데이터 제공 신청`
- `외국인근로자 전용보험 출국만기보험 임금체불보증보험 삼성화재 통계`
- `고용노동부 외국인 임금 근로조건 고용형태별 근로실태조사 데이터`
- `한국교육개발원 교육통계 OpenAPI kess.kedi.re.kr API 인증키 제공`
- `여성가족부 전국다문화가족실태조사 마이크로데이터 외국인 소득 경제`
- `한국고용정보원 고용보험 DB 외국인 피보험자 마이크로데이터 자료신청`
- `고등교육통계 hi.kedi.re.kr 외국인 유학생 마이크로데이터 데이터 제공`
- `한국이민재단 이민자 체류실태 고용조사 통계청 외국인 마이크로데이터`
- `통계청 마이크로데이터 MDIS mdis.kostat.go.kr 이민자 체류실태 고용조사 외국인 송금 소득`
- `건강보험심사평가원 보건의료빅데이터 opendata.hira.or.kr 외국인 진료 API`

### 국제기구·글로벌 비교(송금·이주)
- `World Bank KNOMAD remittance data Korea bilateral remittance matrix download API`
- `World Bank Remittance Prices Worldwide RPW database download corridor Korea`
- `OECD International Migration Database IMD foreign-born population Korea API SDMX download`
- `UN DESA International Migrant Stock 2024 bilateral migrant stock destination origin Korea xlsx download`
- `data360.worldbank.org API documentation indicator query JSON bilateral remittance KNOMAD`
- `IOM Migration Data Portal remittances Korea API download migrationdataportal.org`
- `IMF remittances data BPM6 balance of payments personal remittances Korea API portal data.imf.org`
- `data360 World Bank API example query URL data360api WB_KNOMAD_BRE JSON indicator endpoint`
- `BIS data portal cross-border payments remittances locational banking statistics Korea API stats.bis.org`
- `OECD migration database foreign-born employment self-employment immigrants income IMO Settling In indicators Korea download`
- `World Bank Global Findex database remittance account ownership received remittances digital Korea download`
- `"data360api.worldbank.org" OR "data360 api" data query indicator example REST GET`

### 연구기관·민간·핀테크
- `이민정책연구원 migration.or.kr 이민자 통계 데이터 송금 소득`
- `KIEP 대외경제정책연구원 외국인 송금 이주노동자 데이터`
- `통계청 이민자 체류실태 및 고용조사 마이크로데이터 원자료 MDIS 외국인`
- `국회예산정책처 NABO 외국인 이민 재정 데이터 통계`
- `외국인 해외송금 핀테크 한패스 센트비 GME 외국인 근로자 송금 시장 데이터 리포트`
- `하나은행 외국인 고객 전용 계좌 송금 데이터 리포트 외국인 금융 보고서`
- `KOSSDA 한국사회과학자료원 이민자 다문화 외국인 설문조사 마이크로데이터`
- `한국금융연구원 KIF 외국인 금융 이주민 송금 보고서 자본시장연구원`
- `소액해외송금업 통계 송금 규모 금융감독원 한국은행 국제수지 개인이전 송금`
- `한국이민학회 이민학연구 외국인 경제 송금 학술지 데이터`
- `외국인 근로자 금융생활 실태조사 다문화가족 경제 소비 신용 부채 보고서`
- `NICE 평가정보 KCB 외국인 신용평가 외국인 대출 신용점수 thin filer 보고서`
- `코리아크레딧뷰로 토스 카카오뱅크 외국인 금융 포용 리포트 외국인 송금 데이터 인사이트`
- `KIEP 이주 송금 개발 ODA 데이터베이스 신흥지역정보 종합지식포털 EMERiCs 외국인투자`
- `"외국인" 송금 OR 금융 통계 데이터 API 한국 핀테크 오픈API 외화이체 통계`
- `KOSIS 외국인 송금 OR 외국인고용조사 통계청 보도자료 이민자 체류실태 고용조사 결과 임금 소득`
- `센트비 한패스 송금 백서 리포트 송금 트렌드 국가별 외국인 송금 데이터 발표`
- `한국보건사회연구원 KIHASA 이주민 다문화 외국인 소득 빈곤 보고서 데이터`
- `금융결제원 EXK 국가간 ATM 해외송금 통계 외국인 근로자 본국송금 데이터 exk.or.kr`
- `금융위원회 금융공공데이터 개방 OpenAPI 외국인 외국환 송금 통계 금융감독원 통계정보시스템`
- `한국핀테크지원센터 fintech.or.kr 핀테크 통계 데이터 외국인 디지털금융 보고서 오픈API`

### 추가 사냥(완전성)
- `통계청 외국인고용조사 마이크로데이터 원자료 MDIS`
- `한국은행 지역경제보고서 외국인 근로자 외국인 노동`
- `BC카드 신한카드 외국인 소비 데이터 개방 빅데이터`
- `한국부동산원 외국인 토지 주택 거래 통계 분기`
- `관세청 면세점 외국인 매출 통계 데이터 OpenAPI`
- `우체국예금 우정사업본부 외국인 송금 통계 공공데이터`
- `새마을금고 신협 외국인 회원 계좌 통계 공공데이터`
- `외국인주민 지원센터 외국인노동자지원센터 데이터 통계 한국외국인력지원센터`
- `관세청 면세점 유형별 매출액 이용객 외국인 내국인 data.go.kr`
- `KOSIS 외국인 금융 송금 소득 임금 통계표 국가통계포털`
- `한국은행 거주자 비거주자 대외송금 개인 해외송금 통계 외국인 노동소득`
- `소액해외송금업자 핀테크 외국인 송금 한패스 센트비 GME 통계`
- `한국관광 데이터랩 외국인 카드 소비 지출 datalab.visitkorea.or.kr`
- `한국은행 ECOS OpenAPI 국제수지 여행수지 이전소득 비거주자`
- `국세청 외국인 근로자 연말정산 근로소득 신고 통계 국세통계포털 TASIS`
- `신용보증기금 서민금융진흥원 외국인 대출 통계 서민금융`
- `통계청 외국인고용조사 결과 송금 본국 송금액 임금 월평균 보도자료`
- `KOSIS 외국인 가구 자산 부채 금융 가계금융복지조사 다문화`
- `국세통계포털 외국인 근로자 연말정산 통계표 다운로드 API 국세통계`
- `외국인 투자 부동산투자이민제 예치금 법무부 투자이민 통계`
- `국세통계 9-1-1 외국인근로자 연말정산 신고현황 국적별 결정세액 통계표`
- `산업통상자원부 외국인직접투자 FDI 통계 OpenAPI data.go.kr`

## 발굴 파이프라인 확장 제안

현재 발굴(`discoverDataGoKr`)은 **data.go.kr 검색 HTML 스크래핑**만 한다. 위 리서치로 확인된 확장 방향:

### A. data.go.kr 발굴 키워드 추가 (즉시 — `discoveryQueries`에 추가)
data.go.kr에 이미 게재된 외국인 금융 데이터가 더 있다. 신규 키워드 후보:
- `외국인 부동산 거래` / `외국인 주택 토지 취득` (한국부동산원·지자체)
- `면세점 내외국인 매출` (관세청 15123277 등)
- `외국인근로자 연말정산` / `외국인 소득세 신고` (국세청)
- `다문화가족 실태조사` (여가부 15114756)
- `외국인근로자 산재` (근로복지공단 15104688)
- `외국인 직접투자` (산업부 15054400)
- `내외국인 건강보험료` (건보 15138933)

### B. data.go.kr 외 신규 수집처 (전용 collector 필요 — 로드맵)
| 소스 | 접근 | 가치 |
|---|---|---|
| **KOSIS 이민자체류실태및고용조사** | KOSIS OpenAPI(집계표) | 외국인 임금·송금·저축·지출 — **금융 직결 1순위** |
| **법무부 출입국 통계연보/월보** (immigration.go.kr) | 파일(엑셀) | 체류자격×국적 교차표(data.go.kr보다 상세) |
| **한국부동산원 R-ONE** 외국인주택소유 | OpenAPI(15134761)/포털 | 외국인 부동산 자산·거래 |
| **서울 열린데이터광장 / 경기데이터드림** | OpenAPI(키) | 지자체 외국인 인구·고용·사업체 |
| **국세통계포털 TASIS** | 포털 | 외국인 국적별 근로소득·결정세액 |
| **World Bank KNOMAD / RPW** | 파일(엑셀/CSV) | 한국발 송금 corridor·송금비용(외국인 송금 핵심) |
| **OECD IMD (SDMX) / UN DESA** | OpenAPI/파일 | 외국인 국적별 비교 baseline |
| **금감원 FISIS/외국인투자 OpenAPI** | OpenAPI(키) | 외국인 자본·금융 통계 |

### C. 막힌 곳 (영업비밀·미공개 — 수집 불가/저우선)
- **계좌·신용·소비 미시지표**: 신용정보원 CreDB·카드사(BC/신한)·금융결제원 → 유료 구독/영업비밀
- **국민연금 외국인 분해**: NPS 빅데이터포털이 국적 미공개
- **민간 송금 핀테크(센트비·한패스·GME) 거래실적**: IR·언론 단편 수치만, 정형 공개 데이터/공개 API 없음
