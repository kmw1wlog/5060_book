# 학원 지도/위치/영업 데이터 소스

작성일: 2026-07-09

## 결론

학원 모의고사 영업 대시보드의 1차 데이터는 `NEIS 학원교습소정보` 또는 이를 표준화한 `전국학원및교습소표준데이터`로 시작하는 것이 맞다. 이 데이터는 학원명, 등록상태, 정원, 분야, 계열, 과정, 주소, 수강료 공개 여부 등을 제공한다. 다만 전국 표준 데이터는 좌표가 항상 핵심 필드로 제공되는 형태가 아니므로, 지도 표시를 위해 주소를 좌표로 보강해야 한다.

빠른 지도 MVP는 좌표가 포함된 `경기도_학원 및 교습소 현황` 같은 지역 API로 먼저 검증하고, 이후 전국 데이터에 지오코딩을 붙여 확장하는 순서가 현실적이다.

## 1차 학원/교습소 데이터

### NEIS 학원교습소정보

- 링크: https://open.neis.go.kr/portal/data/service/selectServicePage.do?infId=OPEN19220231012134453534385&infSeq=1
- 제공: 교육부, 16개 시도교육청
- 형태: Sheet, File, Open API
- 적재 주기: 매주
- 주요 필드: 학원명, 휴원일자, 등록상태, 정원, 분야, 계열, 과정, 수강료 공개 여부, 수강료 내용
- 사용 목적: 전국 학원/교습소 master 목록
- 주의: 지도 표시에는 주소 정규화와 좌표 보강이 필요할 수 있다.

### 전국학원및교습소표준데이터

- 링크: https://www.data.go.kr/data/15096277/standard.do
- 제공: 공공데이터포털 표준데이터
- 형태: JSON, XML, CSV 등 표준데이터 조회
- 주요 필드: 학원명, 휴원일자, 등록상태, 정원, 분야, 계열, 과정, 수강료 공개 여부/내용
- 사용 목적: 전국 단위 표준 수집 파이프라인
- 주의: 직접 조회 시 시도교육청 선택이 필수인 조건이 있을 수 있다.

### 한국교육학술정보원 학원교습소 데이터 설명

- 링크: https://www.data.go.kr/data/15154468/fileData.do
- 성격: NEIS/공공데이터 기반 학원교습소 데이터 설명 및 파일 데이터
- 사용 목적: 법적 근거, 데이터 수집 주체, 관리 방식 확인

## 좌표 포함 또는 지역별 보조 데이터

### 경기도_학원 및 교습소 현황

- 링크: https://www.data.go.kr/data/15057004/openapi.do
- 형태: Open API, XML
- 주요 필드: 시군명, 업종구분명, 시설명, 교습과정명, 전화번호, 지번/도로명 주소, 우편번호, WGS84 좌표
- 사용 목적: 좌표 포함 학원 데이터로 지도 MVP 빠르게 검증
- 장점: WGS84 좌표가 포함되어 있어 지오코딩 없이 지도 표시 가능

### 경기도교육청 학원 및 교습소 현황 공개

- 링크: https://www.goe.go.kr/goe/na/ntt/selectNttInfo.do?mi=10961&nttSn=108885
- 형태: XLSX 첨부
- 기준: 2025.07.01 기준 공개 자료
- 사용 목적: 경기도 최신성 보조, API 데이터와 대조

### 서울시 학원 교습소정보

- 서울 열린데이터광장: https://data.seoul.go.kr/dataList/OA-20528/A/1/datasetView.do
- 공공데이터포털: https://www.data.go.kr/data/15080795/fileData.do
- 주요 필드: 행정구역명, 학원/교습소명, 학원지정번호, 개설일자, 등록일자, 등록상태, 정원, 일시수용능력, 분야, 계열, 과정, 수강료, 기숙사 여부, 도로명주소, 우편번호
- 사용 목적: 서울권 영업 우선순위 및 주소/과정 정보 보강

## 학교/학령 수요 보조 데이터

학원 모의고사 판매에서는 학원 자체 데이터만으로 부족하다. 주변 학교 수, 중고등학교 밀집도, 학생 수, 학군 정보가 우선순위 점수에 필요하다.

### 전국초중등학교위치표준데이터

- 링크: https://www.data.go.kr/data/15021148/standard.do
- 제공기관: 한국교육시설안전원
- 수정일: 2026-05-06
- 주요 필드: 학교ID, 학교명, 학교급구분, 운영상태, 주소, 시도교육청, 교육지원청, 위도, 경도, 데이터기준일자
- 사용 목적: 학원 주변 학교 밀집도, 중고등 타겟 지역 우선순위

### NEIS 학교기본정보

- NEIS 링크: https://open.neis.go.kr/portal/data/service/selectServicePage.do?infId=OPEN17020190531110010104913&infSeq=2
- 공공데이터포털 링크: https://www.data.go.kr/data/15122275/openapi.do
- 주요 필드: 학교명, 소재지, 주소, 전화번호, 홈페이지, 남녀공학 여부, 주야 구분, 개교기념일
- 사용 목적: 학원 주변 학교 정보 보강, 지역별 학생 대상 추정

### 학교알리미 공시정보

- API 링크: https://www.data.go.kr/data/15098092/openapi.do
- 이용 안내: https://www.schoolinfo.go.kr/ng/go/pnnggo_a01_m0.do
- 주요 내용: 학생/교원 현황, 시설, 교육여건, 재정, 학업성취 등 공시정보
- 사용 목적: 지역별 교육 수요와 학교 규모 기반 우선순위 점수

### 학구도 안내서비스 공공데이터

- 링크: https://schoolzone.emac.kr/publicData/dataInfo.do
- 제공: 학교 위치 CSV, 초등학교 통학구역 SHP, 중학교 학구/학군 SHP, 고등학교 학교군 SHP, 학교-학구도 연계정보 CSV
- 사용 목적: 상권/학군 단위 분석, 학원 밀집 지역의 학생 유입권 추정

## 지도와 좌표 보강 API

### Kakao Local REST API

- 링크: https://developers.kakao.com/docs/ko/local/dev-guide
- 기능: 주소 검색, 좌표 변환, 키워드 장소 검색
- 사용 목적: 전국 학원 주소를 WGS84 좌표로 보강
- 장점: 현재 5060 대시보드에서 이미 Kakao 키와 지도 스택을 사용한 경험이 있다.

### Kakao Maps JavaScript API / MarkerClusterer

- 문서: https://apis.map.kakao.com/web/documentation/
- 클러스터 샘플: https://apis.map.kakao.com/web/sample/basicClusterer/
- 사용 목적: 학원 마커 클러스터링, 전국/시도 단위 지도 렌더링

### VWorld Geocoder API

- 주소 -> 좌표: https://www.vworld.kr/dev/v4dv_geocoderguide2_s001.do
- 공공데이터포털: https://www.data.go.kr/data/15101106/openapi.do
- 사용 목적: 주소 좌표 변환 보조
- 주의: VWorld 지오코더는 실시간 사용 조건과 저장 제한이 명시되어 있으므로, 좌표 저장 정책을 반드시 확인해야 한다.

### Naver Maps Geocoding API

- 링크: https://guide.ncloud-docs.com/docs/maps-geocoding-api
- JavaScript Geocoder 예시: https://navermaps.github.io/maps.js.ncp/docs/tutorial-Geocoder-Geocoding.html
- 사용 목적: Kakao 지오코딩 실패 주소의 보조 변환 또는 Naver 지도 스택 검토

## 연락처/이메일 수집 현실

- 학원 공공데이터에는 이메일이 거의 없을 가능성이 높다.
- 기본 연락 수단은 전화번호, 홈페이지, 문의 페이지다.
- 이메일은 학원 홈페이지의 대표 이메일, 문의 이메일, 입학상담 이메일처럼 공개된 기관 대표 채널만 별도 검수해야 한다.
- 개인 강사 이메일로 보이는 주소는 자동 발송 대상에서 제외한다.

## 권장 수집 순서

1. `NEIS 학원교습소정보` 또는 `전국학원및교습소표준데이터`로 전국 master를 만든다.
2. `경기도_학원 및 교습소 현황`으로 좌표 포함 데이터 흐름을 먼저 검증한다.
3. 서울 데이터로 서울권 필드와 과정/수강료 정보를 대조한다.
4. 주소가 있는 전국 학원 데이터를 Kakao Local REST로 좌표 보강한다.
5. 학교 위치/학교기본정보/학교알리미로 주변 학교 밀집도와 대상 학년 점수를 만든다.
6. 홈페이지 URL이 없는 학원은 검색 API 또는 수동 검수 큐로 넘긴다.
7. 이메일은 홈페이지에서 대표 채널만 추출하고 `검수필요` 상태로 저장한다.

## 대시보드에 필요한 외부 서비스

- 지도: Kakao Maps JavaScript API
- 주소 좌표화: Kakao Local REST API, 필요 시 VWorld 또는 Naver 보조
- DB: Supabase 별도 프로젝트
- 파일 백업: CSV export/import
- 이메일 발송: Resend, SendGrid, AWS SES, Mailgun 중 1개
- 자동화: n8n 또는 Supabase Edge Functions
- 브라우저 검수/스크래핑: Playwright 기반 수동 검수 보조

## MVP에서 먼저 만들 데이터셋

- `academies_raw_neis`
- `academies_normalized`
- `academy_geocode_cache`
- `academy_contacts`
- `academy_contact_reviews`
- `academy_campaign_events`
- `academy_email_suppressions`
- `school_locations`
- `school_density_by_region`

