# 학원 모의고사 영업/주문관리 대시보드 기획

작성일: 2026-07-09

## 1. 목적

이 대시보드의 목적은 사설 학원에 모의고사를 판매하기 위한 `학원 타겟 DB`, `연락처 검수`, `영업 단계`, `샘플/상담/견적`, `주문/납품/재구매`를 한 흐름으로 관리하는 것이다.

이것은 이메일을 많이 보내는 도구가 아니다. 운영자가 매일 들어와서 아래 질문에 답할 수 있어야 한다.

- 오늘 어느 학원에 연락해야 하는가?
- 어느 학원이 지도상에서 우선순위가 높은가?
- 어느 학원이 홈페이지와 대표 연락처 검수가 끝났는가?
- 어느 학원이 샘플을 받았고, 어느 학원이 견적 단계인가?
- 어느 학원이 몇 부를 살 가능성이 있는가?
- 이미 산 학원은 다음 회차에 다시 살 가능성이 있는가?

5060 기관 대시보드에서 가져올 모티브는 `지도`, `지역 요약`, `목록/검수`, `선택 기관 상세`, `이메일 발송 잠금`, `출처 기반 연락처 검수` 구조다. 다만 데이터, DB, 환경변수, Vercel 프로젝트는 5060과 분리한다.

## 2. 내가 관리해야 할 것

### 학원 기본 정보

- 학원명
- 학원 유형: 학원, 교습소, 독서실, 평생교육시설, 기타
- 운영 상태: 운영, 휴원, 폐원, 미상
- 시도, 시군구, 읍면동
- 도로명주소, 지번주소, 우편번호
- 위도, 경도
- 대표 전화번호
- 홈페이지
- 문의 페이지 URL
- 공공데이터 출처
- 데이터 기준일, 수집일, 마지막 검수일
- 학원 등록번호 또는 지정번호
- 교습 분야
- 교습 계열
- 교습 과정
- 대상 학년 추정: 초등, 중등, 고등, N수, 혼합, 미상
- 정원 또는 일시수용능력
- 과정 수
- 수강료 공개 여부
- 수강료 텍스트
- 기숙사 여부
- 내부 메모

### 규모와 학생 수 추정

초기에는 실제 재원생 수를 알기 어렵다. 따라서 학생 수는 확정값이 아니라 추정값으로 관리한다.

- `capacity`: 공공데이터 정원
- `temporary_capacity`: 일시수용능력
- `course_count`: 과정 수
- `branch_count_estimate`: 지점 수 추정
- `estimated_student_count`: 예상 학생 수
- `student_count_confidence`: 낮음, 중간, 높음
- `student_count_source`: 공공데이터, 홈페이지, 전화확인, 수동입력, 추정

### 구매 가능성/우선순위

- `exam_fit_score`: 모의고사 적합도
- `school_density_score`: 주변 중고등학교 밀집도
- `contactability_score`: 연락 가능성
- `purchase_potential_score`: 구매 가능성
- `priority_score`: 종합 우선순위

초기 점수는 단순 룰 기반으로 시작한다.

- 고등/N수 대상이면 가점
- 입시, 보습, 수학, 영어, 국어, 과학, 논술 계열이면 가점
- 주변 중고등학교가 많으면 가점
- 정원, 일시수용능력, 과정 수가 크면 가점
- 홈페이지와 대표 전화가 있으면 가점
- 공개 이메일 또는 문의폼이 있으면 가점
- 폐원, 휴원, 비대상 업종이면 감점 또는 제외

### 이메일/연락처 검수

공공데이터에는 이메일이 거의 없을 가능성이 높다. 따라서 이메일은 자동 발송 대상이 아니라 검수 대상이다.

- 이메일 후보
- 이메일 유형: 대표, 문의, 입학상담, 행정, 기타
- 이메일 출처 URL
- 홈페이지 URL
- 문의 페이지 URL
- 전화번호
- 검수 상태: 수집, 검수필요, 승인, 제외
- 유효성 상태: 미검증, 형식정상, 도메인확인, 반송, 수신거부
- 개인 이메일 의심 여부
- role account 여부
- 수신거부 여부
- 반송 여부
- suppression reason
- 마지막 검수자
- 마지막 검수일

원칙:

- 대표 채널이 아닌 개인 이메일은 자동 발송 대상에서 제외한다.
- 출처 URL 없는 이메일은 캠페인 후보로 올리지 않는다.
- 수신거부/반송 주소는 전체 캠페인에서 재발송 차단한다.

### 영업 활동

- 담당자
- 영업 단계
- 마지막 접촉일
- 다음 후속일
- 다음 액션
- 통화 기록
- 이메일 준비 기록
- 이메일 발송 기록
- 답장 기록
- 샘플 요청 여부
- 샘플 발송 여부
- 상담 예정일
- 상담 결과
- 견적 여부
- 계약 여부
- 주문 여부
- 제외 사유
- 내부 메모

### 모의고사 발주 후 관리

주문 후에는 영업 상태 하나로 관리하면 안 된다. 학원 하나가 여러 회차, 여러 과목, 여러 부수를 반복 구매할 수 있으므로 주문 객체를 따로 둔다.

- 주문 ID
- 학원 ID
- 주문 상태
- 시험 상품명
- 시험 회차
- 과목
- 학년/대상
- 난이도/트랙
- 주문 부수
- 예상 응시 인원
- 단가
- 총액
- 할인
- 결제 상태
- 세금계산서/현금영수증 여부
- 납품 방식: PDF, 인쇄본, 배송, 학원 자체 출력
- 납품 예정일
- 실제 납품일
- 배송 정보
- 송장번호
- 시험 시행 예정일
- 시험 시행 완료일
- 성적 처리 여부
- OMR/답안 수거 여부
- 성적표 제공 여부
- 클레임/오류 이슈
- 재구매 예정일
- 재구매 가능성
- 주문 메모

## 3. 화면 구조

### 지역 요약

전국 학원을 처음부터 마커로 다 뿌리지 않고, 지역별 우선순위를 보는 첫 화면이다.

표시 항목:

- 지역명
- 전체 학원 수
- 중등/고등/N수 대상 추정 수
- 입시/보습/수학/영어/국어/과학/논술 계열 수
- 홈페이지 보유 수
- 이메일 후보 수
- 이메일 승인 수
- 캠페인 가능 수
- 샘플 제안 중 수
- 상담 예정 수
- 견적 중 수
- 주문 완료 수
- 평균 우선순위 점수
- 마지막 데이터 갱신일

액션:

- `지도에서 보기`
- `목록에서 보기`
- `캠페인 후보 보기`
- `미검수 연락처 보기`

### 실지도

학원 위치와 주변 학교/상권을 보면서 우선순위를 판단하는 화면이다.

구성:

- Kakao 지도
- MarkerClusterer
- 학원 목록
- 선택 학원 drawer
- 상단 필터바

필터:

- 지역
- 대상 학년
- 교습 과정
- 운영 상태
- 연락처 검수 상태
- 영업 단계
- 우선순위
- 주문 여부
- 다음 후속일
- 담당자

UX 원칙:

- 필터를 바꿨다고 지도를 자동으로 전국 fit 하지 않는다.
- `지도에 맞추기`를 눌렀을 때만 카메라를 이동한다.
- fallback 점 레이어와 Kakao 실지도를 겹치지 않는다.
- 전국 단위는 기본 클러스터링이다.
- 선택된 학원은 목록과 지도에서 동시에 강조한다.

### 목록/검수

실제 운영에서 가장 자주 쓰게 될 화면이다.

컬럼:

- 학원명
- 지역
- 유형
- 대상 학년
- 교습 과정
- 정원/규모 추정
- 전화번호
- 홈페이지
- 이메일 상태
- 이메일 출처
- 우선순위
- 영업 단계
- 마지막 접촉일
- 다음 액션
- 담당자
- 주문 여부
- 메모

대량 작업:

- 검수 완료
- 제외 처리
- 캠페인 후보 지정
- 담당자 배정
- 다음 후속일 지정
- CSV export

MVP에서는 이메일 자동발송을 열지 않는다. CSV export와 캠페인 후보 지정까지만 허용한다.

### 학원 상세 drawer

학원 하나를 클릭했을 때 보이는 작업 화면이다.

섹션:

- 기본 정보
- 위치/지도
- 연락처 후보
- 검수 이력
- 영업 타임라인
- 샘플/상담/견적
- 주문 이력
- 메모

상세에서 바로 바꿀 수 있어야 하는 값:

- 영업 단계
- 연락처 검수 상태
- 다음 액션
- 다음 후속일
- 담당자
- 메모
- 제외 사유
- 샘플 발송 여부
- 상담 일정
- 견적 상태
- 주문 생성

### 캠페인 준비

발송 전 사람이 검수하고, 세그먼트를 만들고, 캠페인 후보를 export하는 화면이다.

세그먼트 예시:

- 서울 강남/서초 고등 수학 학원
- 경기 수원 중등 보습 학원
- 대치동 고등/N수 입시 학원
- 부산 해운대 고등 영어/국어 학원
- 정원 100명 이상 추정 학원
- 홈페이지 있고 대표 이메일 승인된 학원

발송 가능 조건:

- 대표 이메일 승인
- 출처 URL 존재
- 수신거부 아님
- 반송 아님
- 개인 이메일 의심 아님
- 최근 발송 중복 아님
- 제외 상태 아님

MVP 버튼명은 `발송`이 아니라 `CSV 내보내기`, `발송 후보 잠금`, `검수 완료 후보`처럼 둔다.

### 주문 관리

주문이 생기면 영업 대시보드가 운영 대시보드가 된다.

컬럼:

- 주문번호
- 학원명
- 지역
- 상품명
- 회차
- 과목
- 대상
- 부수
- 단가
- 총액
- 주문 상태
- 결제 상태
- 납품 방식
- 납품 예정일
- 시험 시행일
- 성적 처리 상태
- 담당자
- 재구매 예정일

주문 상태:

- 주문접수
- 결제대기
- 결제확인
- 제작/준비중
- 납품대기
- 납품완료
- 시행완료
- 성적처리중
- 완료
- 취소
- 환불
- 클레임

### 후속관리/리텐션

모의고사는 반복 구매가 중요하므로 재구매 가능성을 별도로 본다.

관리 항목:

- 첫 구매일
- 최근 구매일
- 총 주문 횟수
- 총 주문 부수
- 총 매출
- 선호 과목
- 선호 난이도
- 시험 시행 주기
- 다음 회차 제안일
- 재구매 가능성
- 클레임 여부
- 만족도 메모

## 4. 상태 파이프라인

### 주문 전 영업 단계

내부 상태값:

- `unqualified_raw`: 원천 데이터만 있음
- `needs_contact_review`: 홈페이지/이메일/전화 검수 필요
- `contact_verified`: 연락 가능한 대표 채널 확인
- `priority_scored`: 우선순위 산정 완료
- `campaign_candidate`: 캠페인 후보
- `email_prepared`: 이메일 문안/대상 준비
- `sample_offered`: 샘플 제안
- `sample_requested`: 샘플 요청
- `sample_sent`: 샘플 발송
- `followup_needed`: 후속 필요
- `meeting_scheduled`: 상담 예정
- `meeting_done`: 상담 완료
- `quote_sent`: 견적 발송
- `negotiating`: 협의 중
- `order_expected`: 주문 가능성 높음
- `ordered`: 주문 발생
- `lost`: 실패
- `excluded`: 제외
- `opted_out`: 수신거부
- `bounced`: 반송

화면 표시용 단계:

- 미검수
- 검수완료
- 캠페인후보
- 샘플제안
- 샘플발송
- 상담/견적
- 주문예상
- 주문완료
- 제외

### 주문 후 운영 단계

- `order_created`: 주문 생성
- `payment_pending`: 결제 대기
- `payment_confirmed`: 결제 확인
- `material_preparing`: 자료 준비
- `delivery_pending`: 납품 대기
- `delivered`: 납품 완료
- `exam_scheduled`: 시험 예정
- `exam_completed`: 시험 완료
- `grading_pending`: 채점/성적 처리 대기
- `grading_completed`: 성적 처리 완료
- `closed`: 종료
- `renewal_candidate`: 재구매 후보
- `renewed`: 재구매
- `cancelled`: 취소
- `refunded`: 환불
- `issue_open`: 클레임/오류 처리 중

## 5. 데이터 모델

### `academies`

- `id`
- `name`
- `academy_type`
- `operation_status`
- `sido`
- `sigungu`
- `eupmyeondong`
- `road_address`
- `jibun_address`
- `postal_code`
- `lat`
- `lng`
- `phone`
- `website`
- `contact_page_url`
- `source_dataset`
- `source_url`
- `source_updated_at`
- `collected_at`
- `neis_office_code`
- `academy_registration_no`
- `field_name`
- `teaching_series`
- `teaching_course`
- `course_list`
- `target_grade`
- `capacity`
- `temporary_capacity`
- `course_count`
- `branch_count_estimate`
- `estimated_student_count`
- `student_count_confidence`
- `student_count_source`
- `tuition_public`
- `tuition_text`
- `dormitory_yn`
- `exam_fit_score`
- `school_density_score`
- `contactability_score`
- `purchase_potential_score`
- `priority_score`
- `lead_stage`
- `owner`
- `last_contacted_at`
- `next_followup_at`
- `next_action`
- `excluded_reason`
- `notes`
- `created_at`
- `updated_at`

### `academy_contacts`

- `id`
- `academy_id`
- `email`
- `email_type`
- `phone`
- `website`
- `contact_page_url`
- `source_url`
- `source_text`
- `collected_at`
- `review_status`
- `validation_status`
- `is_role_account`
- `is_personal_email_suspected`
- `opt_out`
- `bounced`
- `suppression_reason`
- `reviewed_by`
- `reviewed_at`
- `notes`
- `created_at`
- `updated_at`

### `academy_campaign_events`

- `id`
- `academy_id`
- `contact_id`
- `order_id`
- `event_type`
- `event_payload`
- `owner`
- `created_at`

### `academy_orders`

- `id`
- `academy_id`
- `contact_id`
- `owner`
- `order_no`
- `order_status`
- `product_id`
- `product_name`
- `exam_round`
- `subject`
- `target_grade`
- `difficulty_track`
- `quantity`
- `estimated_student_count`
- `unit_price`
- `discount_amount`
- `total_amount`
- `payment_status`
- `invoice_status`
- `delivery_method`
- `delivery_due_at`
- `delivered_at`
- `shipping_address`
- `tracking_no`
- `exam_scheduled_at`
- `exam_completed_at`
- `grading_required`
- `omr_required`
- `answer_sheet_collected`
- `grading_status`
- `report_delivered_at`
- `issue_status`
- `issue_notes`
- `renewal_expected_at`
- `renewal_probability`
- `notes`
- `created_at`
- `updated_at`

### `mock_exam_products`

- `id`
- `product_name`
- `exam_round`
- `subject`
- `target_grade`
- `difficulty_track`
- `version`
- `base_price`
- `available_from`
- `available_until`
- `status`
- `description`
- `created_at`
- `updated_at`

### `academy_order_items`

- `id`
- `order_id`
- `product_id`
- `subject`
- `target_grade`
- `quantity`
- `unit_price`
- `discount_amount`
- `total_amount`
- `notes`

### `academy_email_suppressions`

- `id`
- `email`
- `domain`
- `reason`
- `source_event_id`
- `created_at`

### `academy_geocode_cache`

- `id`
- `raw_address`
- `normalized_address`
- `lat`
- `lng`
- `provider`
- `confidence`
- `geocoded_at`
- `status`
- `error_message`

### `school_density_by_region`

- `id`
- `sido`
- `sigungu`
- `middle_school_count`
- `high_school_count`
- `student_count_estimate`
- `school_density_score`
- `source_dataset`
- `source_updated_at`

## 6. API 삽입 전 MVP

API 연동 전에는 정적 JSON과 CSV import/export 기반으로 만든다.

MVP 목표:

- 학원 1,000~5,000개 샘플을 넣는다.
- 지역 요약에서 우선순위를 본다.
- 실지도에서 학원 위치와 목록을 같이 본다.
- 학원 상세 drawer에서 연락처와 영업 상태를 바꾼다.
- 목록/검수에서 이메일 후보를 승인/제외한다.
- 캠페인 후보를 CSV로 내보낸다.
- 주문 상태 최소 버전을 관리한다.

초기 지역 샘플:

- 서울 강남/서초/송파
- 경기 수원/성남/용인/고양
- 부산 해운대/수영/남구
- 대구 수성구
- 대전 서구/유성구

MVP 화면:

1. 지역 요약
2. 실지도
3. 목록/검수
4. 학원 상세 drawer
5. 주문 관리 최소 버전

MVP에서 허용:

- 이메일 후보 저장
- 검수 상태 변경
- 캠페인 후보 지정
- CSV export
- 영업 이벤트 로그 수동 추가
- 주문 상태 수동 변경

MVP에서 금지:

- 대량 자동발송
- 자동 스크래핑 후 즉시 발송
- 개인 이메일 자동 포함
- 출처 URL 없는 이메일 발송 후보 포함
- 결제/세금계산서 자동화
- 성적처리 시스템 연동

## 7. 다음 구현 지시 기준

다음 턴에서 API 삽입 전 대시보드를 만들 때의 기준은 아래와 같다.

- 5060과 파일/데이터/환경변수를 분리한다.
- 새 파일명은 `academy-dashboard.html`, `academy-dashboard.css`, `academy-dashboard.js`를 우선 사용한다.
- 정적 데이터는 `data/academy-dashboard-data.json`으로 둔다.
- 첫 화면은 랜딩페이지가 아니라 운영 대시보드여야 한다.
- `지역 요약`, `실지도`, `목록/검수`를 모드 탭으로 둔다.
- 지도는 API 전 단계이므로 정적 캔버스 또는 mock map으로 구현하되, 이후 Kakao MarkerClusterer로 교체 가능한 구조로 둔다.
- 오른쪽 패널은 긴 이메일 목록이 아니라 선택 학원의 작업 drawer로 둔다.
- 긴 목록은 중앙 또는 별도 `목록/검수` 모드에서 독립 스크롤/페이지네이션으로 처리한다.
- 이메일 발송 버튼은 만들지 말고 `CSV 내보내기`, `발송 후보 잠금`, `검수 완료 후보`만 둔다.
- 주문 관리는 최소 필드로 시작하되, 데이터 모델은 `academy_orders`를 따로 설계한다.

## 8. Oracle 검토 요약

Oracle은 이 제품의 핵심을 `전국 학원 DB -> 주소 좌표화 -> 지역/과정/대상/규모 기반 우선순위 -> 홈페이지/대표 연락처 검수 -> 캠페인 후보 지정 -> 샘플 제안 -> 샘플 발송 -> 상담 -> 견적 -> 주문 -> 납품/결제/시행/성적처리 여부 -> 재구매 관리` 흐름으로 정리했다.

핵심 판단:

- 이메일 자동발송이 아니라 학원 타겟 DB와 검수 큐, 영업 상태관리가 초기 가치다.
- 학생 수는 직접값이 아니라 추정값과 신뢰도로 관리해야 한다.
- 주문 후에는 영업 단계와 별도로 `academy_orders` 객체가 필요하다.
- MVP에서는 이메일 API, 자동 스크래핑, 결제/세금계산서, 성적처리 시스템을 만들지 않는다.
- Kakao/VWorld/한국 공공데이터/Supabase 흐름을 유지하고, Mapbox/deck.gl 전면 교체는 지금 필요하지 않다.

