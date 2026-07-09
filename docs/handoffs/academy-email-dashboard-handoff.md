# 학원 모의고사 영업 이메일 대시보드 핸드오프

작성일: 2026-07-09

## 목적

이 핸드오프의 목적은 현재 5060 기관 메일 대시보드에서 얻은 구조와 교훈을, 별도 제품인 `학원 대상 모의고사 판매 대시보드`로 넘기는 것이다. 새 대시보드는 전국 학원과 교습소를 지도와 목록에서 관리하고, 학원별 연락처 검수, 영업 단계, 샘플 발송, 모의고사 도입 가능성을 추적하는 내부 영업 도구가 되어야 한다.

핵심 목표는 이메일을 많이 모으는 것이 아니라 아래 흐름을 안정적으로 관리하는 것이다.

- 전국 학원/교습소 목록을 공식 출처 기반으로 수집한다.
- 주소를 좌표로 보강해 지도에서 지역별 밀집도와 우선순위를 본다.
- 학원 유형, 교습 과정, 학생 대상, 지역, 학교 밀집도 기준으로 영업 우선순위를 매긴다.
- 대표 전화, 홈페이지, 공개 이메일, 문의 폼을 검수한다.
- 검수된 연락처만 캠페인 후보로 올리고, 발송/반송/수신거부/후속 연락을 기록한다.
- 모의고사 판매에 필요한 샘플 신청, 상담, 견적, 계약, 재구매 흐름을 기관별로 관리한다.

## 5060 대시보드에서 이어받을 것

현재 5060 대시보드는 다음 자산을 제공한다.

- 정적 웹 앱 구조: `dashboard.html`, `dashboard.css`, `dashboard.js`
- 데이터 생성 파이프라인: `scripts/build-dashboard-data.js`
- Supabase 스키마 예시: `supabase/migrations/20260704010000_dashboard_schema.sql`
- 환경변수 검증 흐름: `scripts/audit-dashboard-env.js`
- Supabase 동기화/검증 흐름: `scripts/sync-supabase-data.js`, `scripts/verify-supabase.js`
- Playwright 사용자 흐름 테스트: `tests/dashboard.spec.js`
- 지도형 대시보드 벤치마크: `docs/benchmarks/map-dashboard-benchmark.md`

이 자산은 새 대시보드의 출발점으로 유효하지만, 5060 대상 기관 데이터와 학원 영업 데이터는 섞으면 안 된다.

## 반드시 분리할 것

- 새 Supabase 프로젝트 또는 최소한 별도 schema/table prefix 사용
- 새 데이터 생성 스크립트: 예시 `scripts/build-academy-dashboard-data.js`
- 새 정적 데이터 파일: 예시 `data/academy-dashboard-data.json`
- 새 대시보드 파일: 예시 `academy-dashboard.html`, `academy-dashboard.css`, `academy-dashboard.js`
- 새 환경변수 prefix: 예시 `ACADEMY_*`
- 새 Vercel 프로젝트 또는 별도 라우트
- 새 공공데이터 수집 로그와 출처 테이블

권장 방향은 별도 저장소 또는 별도 Vercel 프로젝트다. 5060 도서 영업과 학원 모의고사 영업은 타겟, 전환 지표, 데이터 출처, 개인정보 리스크가 다르다.

## 새 제품의 핵심 사용자 흐름

1. 운영자는 전국 지도에서 학원 밀집 지역을 본다.
2. 지역, 교습 과정, 대상 학년, 운영 상태, 연락처 검수 상태로 필터링한다.
3. 학원 카드를 선택하면 전화, 홈페이지, 이메일 후보, 주소, 과정, 수강료 공개 여부, 정원/수용 규모를 확인한다.
4. 공개 출처가 있는 대표 이메일 또는 문의 채널만 `검수 완료` 처리한다.
5. 영업 단계는 `미접촉`, `샘플 제안`, `샘플 발송`, `상담 예정`, `견적`, `계약`, `재구매`, `제외`로 관리한다.
6. 캠페인 후보는 이메일 발송 전에 사람이 다시 검수한다.
7. 발송 이후 반송, 수신거부, 답장, 상담, 구매 가능성을 기관별 히스토리로 남긴다.

## 권장 화면 구조

### 1. 실지도

- Kakao 지도 또는 Naver 지도 기반의 실제 지도
- 학원/교습소 마커는 클러스터링 기본 적용
- 지도에는 원시 점묘와 fallback 레이어를 겹치지 않는다.
- 필터 변경은 목록과 마커만 바꾸고, 지도 카메라는 사용자가 `지도에 맞추기`를 누를 때만 이동한다.
- 선택 학원 drawer에는 영업에 필요한 핵심 정보만 보여준다.

### 2. 지역 요약

- 전국/시도/시군구별 학원 수, 중고등 대상 학원 수, 입시/보습 계열 수, 연락처 검수율, 영업 단계별 수를 집계한다.
- 지도 pan/zoom 없이 빠르게 지역 우선순위를 보는 정적 화면이다.
- 지역 클릭 시 `실지도에서 보기` 또는 `목록에서 보기`로 전환한다.

### 3. 목록/검수

- 학원 목록을 테이블 또는 밀도 높은 카드로 보여준다.
- 컬럼은 학원명, 지역, 교습 과정, 대상, 전화, 홈페이지, 이메일 상태, 출처, 우선순위, 영업 단계, 다음 액션으로 구성한다.
- 페이지네이션 또는 가상 스크롤을 사용해 긴 목록이 패널과 겹치지 않게 한다.
- 대량 작업은 CSV 내보내기, 검수 완료, 제외, 캠페인 후보 지정 정도만 둔다.

### 4. 캠페인 준비

- 실제 발송 전 잠금 상태를 기본으로 둔다.
- 세그먼트 예시: `서울 강남/서초 고등 보습`, `경기 수원 중등 수학`, `대치동 입시 논술`
- 발송 가능 조건: 대표 이메일 검수 완료, 출처 URL 존재, 수신거부 아님, 반송 아님, 최근 발송 중복 아님

## 데이터 모델 초안

### academies

- `id`
- `name`
- `academy_type`: `학원`, `교습소`, `독서실`, `평생교육시설`, `기타`
- `operation_status`
- `sido`
- `sigungu`
- `road_address`
- `jibun_address`
- `lat`
- `lng`
- `phone`
- `website`
- `source_dataset`
- `source_url`
- `source_updated_at`
- `neis_office_code`
- `academy_registration_no`
- `field_name`
- `teaching_series`
- `teaching_course`
- `course_list`
- `capacity`
- `tuition_public`
- `tuition_text`
- `dormitory_yn`
- `target_grade`: `초등`, `중등`, `고등`, `N수`, `혼합`, `미상`
- `exam_fit_score`
- `school_density_score`
- `purchase_potential_score`
- `priority_score`
- `lead_stage`
- `owner`
- `last_contacted_at`
- `next_followup_at`
- `notes`

### academy_contacts

- `id`
- `academy_id`
- `email`
- `email_type`: `대표`, `문의`, `입학상담`, `행정`, `기타`
- `phone`
- `website`
- `contact_page_url`
- `source_url`
- `review_status`: `수집`, `검수필요`, `승인`, `제외`
- `validation_status`: `미검증`, `형식정상`, `도메인확인`, `반송`, `수신거부`
- `is_role_account`
- `is_personal_email_suspected`
- `opt_out`
- `bounced`
- `suppression_reason`

### academy_campaign_events

- `id`
- `academy_id`
- `contact_id`
- `event_type`: `note`, `call`, `email_prepared`, `email_sent`, `reply`, `sample_sent`, `meeting`, `quote`, `order`, `opt_out`, `bounce`
- `event_payload`
- `created_at`

## 우선순위 점수 기준

- 교습 과정 적합도: 보습, 입시, 수학, 영어, 국어, 논술, 과학 계열 가중
- 대상 학년 적합도: 중등/고등/N수 가중
- 지역 밀집도: 학원 밀집 지역과 학교 밀집 지역 가중
- 규모 추정: 정원, 일시수용능력, 과정 수, 지점 수 가중
- 연락 가능성: 전화번호, 홈페이지, 이메일 후보, 문의 폼 존재 여부 가중
- 구매 가능성: 시험 대비 과정, 내신/수능/모의고사 키워드 가중

## MVP 구현 단계

1. 공식 데이터 링크와 필드 정의를 확정한다.
2. NEIS/공공데이터 기반 CSV 또는 API를 받아 학원 기본 목록을 만든다.
3. 좌표가 있는 데이터는 그대로 쓰고, 없는 주소는 Kakao Local 또는 VWorld 지오코딩으로 보강한다.
4. `academies`, `academy_contacts`, `academy_campaign_events`, `email_suppressions` 테이블을 만든다.
5. `지역 요약`, `실지도`, `목록/검수` 3개 모드를 먼저 구현한다.
6. 이메일 발송은 잠근 상태로 두고, CSV export와 캠페인 후보 지정까지만 연다.
7. Playwright로 전국 보기, 지역 필터, 학원 선택, 연락처 검수, CSV export 흐름을 테스트한다.

## 리스크와 운영 원칙

- 공공데이터에 이메일은 거의 없을 가능성이 높다. 이메일은 홈페이지/문의 페이지에서 대표 연락처만 별도로 검수해야 한다.
- 학원 대표자명, 설립자명 같은 개인 식별 가능 정보는 영업용 화면에서 기본 노출하지 않는다.
- 개인 이메일로 보이는 주소는 자동 발송 대상에서 제외한다.
- 공개 이메일이어도 광고성 발송 가능 상태로 단정하지 않는다.
- 수신거부/반송 주소는 전체 캠페인에서 재발송 차단한다.
- 모든 기관/연락처에는 출처 URL과 수집일을 저장한다.

## 다음 담당자가 바로 확인할 파일

- `dashboard.html`
- `dashboard.css`
- `dashboard.js`
- `data/dashboard-data.json`
- `data/dashboard-config.js`
- `scripts/build-dashboard-data.js`
- `scripts/audit-dashboard-env.js`
- `scripts/sync-supabase-data.js`
- `scripts/verify-supabase.js`
- `supabase/migrations/20260704010000_dashboard_schema.sql`
- `docs/benchmarks/map-dashboard-benchmark.md`
- `docs/handoffs/academy-data-sources.md`

