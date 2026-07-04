# 5060 기관 지도 대시보드 벤치마크

## 현재 목적

이 대시보드는 운영자가 전국 단위의 5060+ 영업 타겟 기관을 빠르게 찾고 관리할 수 있어야 한다.

- 시니어 시설, 교회, 도서관, 평생교육기관 등 타겟 기관을 한국 지도에서 한눈에 본다.
- 기관 유형과 지역을 바꿔도 사용자가 보고 있던 맥락이 유지되어야 하며, 명시적으로 요청하지 않는 한 전국 시야로 강제 복귀하면 안 된다.
- 지도를 탐색하는 동안 이메일/연락처 목록을 계속 볼 수 있고 작업할 수 있어야 한다.
- 기관별로 영업 상태, 연락처 검증, 이메일 출처, 다음 액션, 메모를 관리할 수 있어야 한다.
- 이메일 발송 자동화는 이후 단계에서 붙이되, 현재 단계에서는 검증 전 이메일 발송이 잠겨 있어야 한다.

## 현재 대시보드에서 확인된 문제

스크린샷: `docs/benchmarks/screenshots/current-dashboard.png`

- `전국` 관련 상호작용이 지도를 과도하게 fit 시키면서 사용자가 보고 있던 확대 상태를 계속 전국 시야로 되돌린다.
- Kakao 실지도와 fallback 점 레이어가 동시에 보여서, 두 개의 지도 시스템이 겹쳐진 것처럼 보인다.
- 수백 개의 원시 마커가 한꺼번에 렌더링되어 시야가 지저분하고 pan/zoom 랙의 원인이 된다.
- 오른쪽 이메일/영업 패널은 목록이 길어지면 블록끼리 겹치고, 자동화 패널이 연락처 목록 영역을 침범한다.
- `실지도 탐색`, `정적 지역 요약`, `목록/연락처 운영`이 분리되어 있지 않다.
- 필터가 지도의 작업 공간을 잡아먹고 있으며, 상단의 간결한 조작 바나 접이식 패널 역할을 하지 못한다.

## 확인한 벤치마크 사례

### Baymard Split View 연구

출처: https://baymard.com/blog/accommodations-split-view

스크린샷: `docs/benchmarks/screenshots/baymard-split-view.png`

벤치마크 가치:

- 여러 장소를 비교할 때는 안정적인 목록-지도 분할 화면이 유효하다.
- 선택한 엔티티는 목록 안에서 계속 보이고, 지도는 공간 맥락을 유지해야 한다.
- 운영 화면에서는 사용자를 지도 단독 탐색으로 몰아넣으면 안 된다.

현재 대시보드에 적용할 점:

- `실지도` 모드는 좌우 어느 한쪽에 독립 스크롤이 되는 기관 목록을 둬야 한다.
- 카드를 선택하면 하나의 마커가 강조되고 기관 상세 drawer가 열려야 한다.
- 필터를 누를 때마다 지도가 자동 초기화되면 안 된다.

### Kakao MarkerClusterer

출처: https://apis.map.kakao.com/web/sample/basicClusterer/

스크린샷: `docs/benchmarks/screenshots/kakao-clusterer.png`

벤치마크 가치:

- Kakao 기본 클러스터 버블은 수백 개의 핀을 지역별 개수 묶음으로 줄여준다.
- 전국 단위 데이터에서는 원시 마커보다 훨씬 읽기 쉽다.
- 지도 공급자를 바꾸지 않고도 현재 Kakao 스택을 유지할 수 있다.

현재 대시보드에 적용할 점:

- `실지도`에서는 전국 단위 원시 마커를 Kakao MarkerClusterer로 바꾼다.
- 실지도 레이어에서는 fallback 점을 완전히 제거한다.
- 775개 이상 기관을 다룰 때 기본 렌더링 전략은 클러스터가 되어야 한다.

### Mapbox Store Locator

출처: https://docs.mapbox.com/help/tutorials/building-a-store-locator-react/

스크린샷: `docs/benchmarks/screenshots/mapbox-store-locator.png`

벤치마크 가치:

- 스토어 로케이터 UX는 현재 기관 영업 워크플로와 매우 가깝다.
- 목록 카드와 지도 포인트는 서로 동기화되어야 한다.
- 선택된 위치는 단순 핀이 아니라 실제 작업 대상 객체가 되어야 한다.

현재 대시보드에 적용할 점:

- 선택된 기관 카드에 영업 상태, 연락처 상태, 전화번호, 홈페이지, 이메일 신뢰도, 다음 액션을 보여준다.
- 오른쪽 패널은 항상 복잡하게 섞인 상태가 아니라, 선택 이후 상세 중심으로 재구성되어야 한다.

### Open User Map List View

출처: https://www.open-user-map.com/list-view/

스크린샷: `docs/benchmarks/screenshots/open-user-map-list.png`

벤치마크 가치:

- 긴 목록은 페이지네이션이나 가상 스크롤이 필요하다.
- 목록 화면은 지도의 부수효과가 아니라 독립된 1급 모드여야 한다.

현재 대시보드에 적용할 점:

- 연락처 검수와 이메일 수집을 위한 `목록/검수` 모드를 분리한다.
- 패널 겹침을 막기 위해 고정 높이 스크롤 영역과 페이지네이션을 사용한다.
- 대량 작업 버튼은 카드 위를 떠다니게 하지 말고 상단이나 하단의 고정 액션 바에 둔다.

### NSW School Finder

출처: https://schoolfinder.education.nsw.gov.au/

스크린샷: `docs/benchmarks/screenshots/nsw-school-finder.png`

벤치마크 가치:

- 전국 단위나 광역 검색은 촘촘한 실지도보다 먼저 검색과 지역 선택부터 시작할 수 있다.
- 초기 과부하를 줄이고 사용자를 더 좁은 지역 워크플로로 유도한다.

현재 대시보드에 적용할 점:

- `전국` 상태의 기본값은 개별 마커 과밀이 아니라 지역 요약이어야 한다.
- 개별 기관 마커가 본격적으로 보이기 전에 시도/시군구 단계로 내려가도록 유도해야 한다.

### deck.gl ScreenGridLayer

출처: https://deck.gl/docs/api-reference/aggregation-layers/screen-grid-layer

스크린샷: `docs/benchmarks/screenshots/deckgl-screen-grid.png`

벤치마크 가치:

- 모든 점을 다 보여주지 않고도 밀집도를 전달할 수 있는 집계 레이어다.
- 데이터가 더 커졌을 때 Kakao 클러스터만으로 부족하면 유효할 수 있다.

현재 대시보드에 적용할 점:

- deck.gl 스타일의 그리드는 차후 성능 레이어 후보로만 본다.
- 지금 단계에서는 두 번째 지도 엔진을 붙이기보다, 더 단순한 정적 지역 요약 모드를 먼저 구현하는 편이 맞다.

### Mapbox Cluster Example

출처: https://docs.mapbox.com/mapbox-gl-js/example/cluster/

스크린샷: `docs/benchmarks/screenshots/mapbox-cluster.png`

벤치마크 가치:

- 클러스터 스타일에 개수나 우선순위를 실을 수 있다.
- 클러스터 클릭으로 해당 지역을 확대하는 흐름이 자연스럽다.

현재 대시보드에 적용할 점:

- 클러스터 클릭만 클러스터 기반 확대 동작을 하게 유지한다.
- 일반 필터 변경은 사용자가 `지도에 맞추기`를 누르지 않는 한 자동 줌을 하지 않는다.

### TEA School District Locator

출처: https://tea.texas.gov/families-and-students/school-district-locator/school-district-locator

스크린샷: `docs/benchmarks/screenshots/tea-school-district-locator.png`

벤치마크 가치:

- 공공 서비스 검색 페이지는 설명 영역과 검색 UI를 분리하는 경우가 많다.
- 다만 현재 대시보드에는 직접적인 적합도가 높지 않다.

현재 대시보드에 적용할 점:

- 이 사례의 설명 위주 공공 페이지 구조는 그대로 모방하지 않는다.
- 약한 참고 사례로만 남긴다.

### Mark-a-Spot Amsterdam

출처: https://demo.mark-a-spot.com/amsterdam

스크린샷: `docs/benchmarks/screenshots/mark-a-spot-amsterdam.png`

벤치마크 가치:

- 상태 기반 워크플로 개념은 참고할 수 있지만, 이번 케이스에서는 클러스터/목록 사례보다 효용이 낮았다.

현재 대시보드에 적용할 점:

- 상태가 있는 레코드 관리라는 개념만 참고하고, UI 자체는 모방하지 않는다.

## 권장 제품 구조

### 모드 탭

- `실지도`: Kakao 실지도 + MarkerClusterer + 기관 목록 + 선택 기관 상세 drawer
- `지역 요약`: 시도/시군구별 집계가 보이는 정적 한국 캔버스, pan 랙 없음
- `목록/검수`: 이메일 출처 검증, 연락처 상태, 영업 상태, CSV 내보내기를 위한 테이블/카드 목록

### 실지도 모드

- 상단 바: 기관 유형 토글, 지역 선택, 상태 선택, 검색, `지도에 맞추기`
- 메인 캔버스: Kakao 지도만 사용, fallback 점 오버레이 없음
- 마커 전략: 전국 단위에서는 클러스터, 충분히 확대했을 때만 개별 마커 확장
- 목록: 우선순위 기준 정렬된 기관 카드, 독립 스크롤
- 상세 drawer: 카드나 마커 클릭 시 열리고 연락처/영업 필드 표시

### 지역 요약 모드

- 실시간 Kakao 지도 대신 정적 한국 지도 또는 지역 그리드 사용
- 각 시도/시군구에 기관 수, 검증 이메일 수, 미검증 이메일 수, 고우선 기관 수, 마지막 수집일 표시
- 사용자가 `지도에서 보기`를 눌렀을 때만 해당 지역 필터와 함께 `실지도`로 전환

### 목록/검수 모드

- 총 개수와 현재 필터를 보여주는 고정 헤더
- 테이블 컬럼: 기관명, 유형, 지역, 전화번호, 홈페이지, 이메일 상태, 출처 URL, 영업 상태, 우선순위, 다음 액션
- 선택 기관 메모와 출처 검증을 위한 오른쪽 drawer
- 대량 작업: CSV 내보내기, 검증 완료 처리, 제외 처리, 캠페인 준비

## 필요한 데이터 속성

- `institution_name`
- `institution_type`
- `sido`
- `sigungu`
- `address`
- `lat`
- `lng`
- `phone`
- `homepage`
- `email`
- `email_status`: `missing`, `candidate`, `verified`, `excluded`, `bounced`
- `email_source_url`
- `source_dataset`
- `source_updated_at`
- `outreach_status`: `not_contacted`, `queued`, `sent`, `replied`, `meeting`, `ordered`, `excluded`
- `priority_score`
- `last_contacted_at`
- `next_action`
- `owner`
- `notes`

## 구현 우선순위

1. `실지도`에서 fallback 점 오버레이를 제거하고, fallback/정적 점은 별도 `지역 요약` 모드로 분리한다.
2. Kakao MarkerClusterer를 붙이고 전국 또는 고밀도 상태에서는 기본적으로 클러스터를 렌더링한다.
3. 필터 변경 시 자동 fit을 중단하고, `전국 보기` 또는 `지도에 맞추기`에서만 fitBounds를 호출한다.
4. 오른쪽 패널을 독립 스크롤 섹션으로 분리하거나, 선택 기관 drawer 구조로 교체한다.
5. 추가 데이터 소스를 붙이기 전에 `목록/검수` 모드와 페이지네이션 또는 가상 스크롤을 먼저 만든다.

## 대체 판단

- 현재는 Mapbox로 전체 교체하는 것을 권장하지 않는다. Kakao/VWorld/한국 좌표 워크플로가 이미 맞물려 있고 Kakao에 기본 클러스터 기능이 있기 때문이다.
- 데이터가 수만 건 단위로 커지면 deck.gl이 유효할 수 있지만, 현재 775개 수준에서는 과하다.
- 가장 강한 즉시 적용 패턴은 `Kakao MarkerClusterer + split-view 목록 + 별도 정적 지역 요약`이다.

## Oracle 검토 요약

검토 대상:

- GitHub: https://github.com/kmw1wlog/5060_book
- Vercel: https://5060book.vercel.app/dashboard.html

Oracle 판정:

- 제안 IA: `PASS`
- 현재 구현을 운영 대시보드로 봤을 때: `FAIL`
- 다른 지도 공급자로의 전면 교체: 현재는 정당화되지 않음

Oracle 우선순위:

1. 필터 변경을 지도 이동 명령처럼 다루지 말 것. 카메라 이동은 `전국 보기`, `지도에 맞추기`, 클러스터 클릭에서만 일어나야 한다.
2. `실지도`에서 fallback 점 레이어를 제거할 것. 그것은 `지역 요약`이나 진짜 fallback 상태에만 있어야 한다.
3. Kakao MarkerClusterer를 전국 렌더링의 기본 경로로 쓸 것.
4. 지도 탐색과 연락처 운영을 분리할 것.
5. 긴 이메일/연락처 목록은 `목록/검수`로 옮길 것. 지도 옆 패널은 선택 기관의 작업 기록만 보여줘야 한다.
6. 랜딩페이지 같은 헤드라인과 KPI 블록을 운영용 명령 바 형태로 바꿀 것.
7. 상태 관리를 `selectedInstitutionId`, 파생 필터 결과, 유지되는 viewport, debounce된 map event 중심으로 재구성할 것.

Oracle 벤치마크 정리:

- 유지: Kakao MarkerClusterer, Baymard split view, Mapbox Store Locator의 UX 패턴, Open User Map list view, NSW School Finder
- 제외 또는 후순위: TEA School District Locator, Mark-a-Spot Amsterdam, Mapbox cluster example, deck.gl ScreenGridLayer

Oracle의 대체 판단:

- 현재 스택은 Kakao, VWorld, 한국 공공데이터, Supabase에 이미 묶여 있으므로 Kakao를 유지하는 것이 맞다.
- 데이터가 수만 건으로 커지거나, 커스텀 벡터 타일 스타일링, 무거운 WebGL 집계, 비한국 확장, Kakao 제약 문제가 생길 때만 교체를 다시 검토한다.
