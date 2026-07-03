# 기관 발굴 대시보드 기획안

## 1. 목적

이 대시보드의 목적은 전국의 50대 이상 독자가 많이 모이는 기관을 찾아, 거장문고의 고전 서적과 독서지도 PDF를 소개할 수 있는 합법적이고 추적 가능한 기관 발굴·검수 대장을 만드는 것이다.

핵심은 이메일을 많이 모으는 것이 아니라 아래 흐름을 관리하는 것이다.

1. 어떤 기관이 적합한지 찾는다.
2. 공개 출처가 있는 기관 정보만 저장한다.
3. 지도에서 지역별 우선순위를 본다.
4. 사람이 검수한 대표 연락처만 발송 대상으로 확정한다.
5. 발송 가능 여부, 반송, 수신거부, 후속 연락 이력을 남긴다.

초기 MVP는 실제 API 없이 껍데기부터 만든다. 이유는 카카오맵 도메인 등록, Supabase 스키마, 공공데이터 API 키, 이메일 발송 도메인 인증이 모두 배포 URL과 운영 정책 확정 뒤에 붙는 편이 안전하기 때문이다.

## 2. 운영 원칙

- 수집 대상은 기관 대표 이메일과 공개 문의 채널로 제한한다.
- 개인 담당자 이메일은 명확한 공개 업무 연락처가 아니면 제외한다.
- 모든 기관과 이메일에는 출처 URL, 수집일, 검수 상태를 저장한다.
- 공공데이터는 데이터셋별 이용조건과 상업 이용 가능 여부를 저장한다.
- 공개 이메일이어도 광고성 정보 발송 가능 상태로 단정하지 않는다.
- 자동 수집 후 즉시 자동 발송하지 않는다.
- 발송 전 상태는 `수집됨`, `검수필요`, `승인`, `제외`, `수신거부`로 나눈다.
- 모든 발송에는 발신자 정보, 문의처, 수신거부 링크를 포함한다.
- 반송 또는 수신거부된 주소는 전역 재발송 차단 목록에 넣는다.

## 3. 우선 타깃 기관

1차 타깃:

- 요양원
- 양로원
- 노인복지관
- 경로당
- 시니어클럽
- 50플러스센터
- 공공도서관
- 작은도서관
- 평생학습관
- 주민센터 문화교실

2차 타깃:

- 교회
- 성당
- 신학교
- 신학대학원
- 교회 도서관
- 장년부/권사회/평신도 아카데미
- 기독교 서점
- 인문학 아카데미
- 고전 독서모임
- 북카페

우선순위 점수는 `5060 밀집도`, `고전 독서 적합도`, `단체 구매 가능성`, `연락처 신뢰도`, `지역 확장성`으로 계산한다.

## 4. API 없는 껍데기 MVP 범위

이번 MVP는 외부 API 없이 정적/목업 데이터로 구현한다. Oracle 자문 결과, 초기 화면은 발송 도구보다 기관 발굴·검수 흐름을 검증하는 데 집중한다.

포함:

- 개요
- 지도 기반 발굴
- 기관 목록
- 기관 상세 패널
- 지도 영역 플레이스홀더
- 지역/기관유형/상태 필터
- 점수 카드
- 이메일 검수 큐
- CSV 업로드/다운로드 UI 목업
- 비활성 캠페인 준비 UI 목업
- 수신거부/반송 상태 표시
- API 연결 예정 배너

제외:

- 실제 카카오맵 호출
- 실제 공공데이터 호출
- 실제 이메일 발송
- 실제 Supabase 저장
- 로그인/권한 관리
- 크롤러 실행
- 실제 캠페인 발송 가능 버튼

## 5. 대시보드 화면 구조

### 화면 A. 개요

역할: 현재 기관 발굴 상태를 빠르게 파악한다.

구성:

- 총 기관 수
- 검수 대기 이메일 수
- 발송 가능 기관 수
- 수신거부/반송 수
- 지역별 기관 분포
- 이번 주 후속 연락 예정

### 화면 B. 지도 기반 발굴

역할: 지역별로 기관을 탐색하고 영업 우선순위를 본다.

구성:

- 좌측 필터 패널
- 중앙 지도 플레이스홀더
- 우측 기관 상세 패널
- 기관 유형 배지
- 적합도 점수
- 출처 URL 표시

초기에는 카카오맵 대신 목업 지도 카드를 사용한다. 배포 후 Kakao JavaScript 키에 도메인을 등록하고 SDK로 교체한다.

### 화면 C. 기관 목록

역할: 수집된 기관을 검수하고 상태를 바꾼다.

구성:

- 테이블
- 검색
- 지역/유형/상태 필터
- 이메일 존재 여부
- 출처 확인 버튼
- 상태 변경 드롭다운

### 화면 D. 이메일 검수

역할: 발송 가능한 대표 이메일만 확정한다.

구성:

- 검수 대기 이메일 목록
- 이메일 유형: 대표, 문의, 도서관, 교육, 목회, 기타
- 공개 출처 URL
- 승인/제외 버튼
- 제외 사유 입력

### 화면 E. 캠페인 준비

역할: 실제 발송 전 대상과 메시지를 점검한다. MVP에서는 비활성 목업으로 두고, 자동발송 기능처럼 보이지 않게 한다.

구성:

- 캠페인 대상 세그먼트
- 예상 발송 수
- 수신거부 제외 수
- 메일 템플릿 미리보기
- 발송 API 연결 상태
- `실제 발송 전 검수 필요` 고지

### 화면 F. 설정

역할: 향후 API 연결 항목을 모아둔다.

구성:

- Kakao JavaScript 키 등록 안내
- Kakao REST 키 환경변수 안내
- 공공데이터포털 서비스 키 안내
- Supabase URL/anon/service role 안내
- 이메일 발송 Provider 설정 안내
- CSV 백업/복원 안내

## 6. 데이터 모델 초안

### institutions

- `id`
- `name`
- `category`
- `sub_category`
- `region_sido`
- `region_sigungu`
- `address`
- `lat`
- `lng`
- `phone`
- `website`
- `source_url`
- `source_type`
- `source_license_type`
- `source_dataset_name`
- `source_collected_at`
- `source_checked_at`
- `source_snapshot_url`
- `data_confidence`
- `age_fit_score`
- `classics_fit_score`
- `purchase_potential_score`
- `contact_status`
- `review_status`
- `is_active`
- `excluded_reason`
- `last_contacted_at`
- `next_followup_at`
- `notes`

### contacts

- `id`
- `institution_id`
- `email`
- `email_type`
- `source_url`
- `collected_at`
- `review_status`
- `validation_status`
- `is_role_account`
- `is_personal_email_suspected`
- `consent_status`
- `consent_source`
- `opt_out`
- `opt_out_at`
- `bounced`
- `bounced_at`
- `suppression_reason`
- `reviewed_by`
- `reviewed_at`
- `last_sent_at`

### suppression_list

- `id`
- `email`
- `reason`
- `source`
- `created_at`

### source_records

- `id`
- `institution_id`
- `source_url`
- `source_type`
- `license_type`
- `captured_at`
- `raw_note`

### audit_logs

- `id`
- `actor`
- `action`
- `target_type`
- `target_id`
- `before_state`
- `after_state`
- `created_at`

### campaigns

- `id`
- `name`
- `segment`
- `subject`
- `status`
- `created_at`
- `scheduled_at`
- `sent_at`

### mail_events

- `id`
- `campaign_id`
- `contact_id`
- `event_type`
- `provider_message_id`
- `created_at`

## 7. API 연결 순서

1. Vercel 배포 URL 확정
2. Kakao JavaScript 키 도메인 등록
3. CSV import/export로 검수 플로우 운영
4. Supabase 프로젝트 생성 및 스키마 적용
5. 공공데이터포털 API 키 발급
6. Kakao Map JavaScript SDK로 지도 표시 연결
7. 공공데이터 원본 좌표 또는 수동 검수 좌표만 저장
8. listmonk 또는 이메일 발송 API 연결
9. n8n self-host 또는 Vercel Cron으로 수집/동기화 자동화

주의:

- Kakao Local API 응답을 배치로 저장하는 방식은 약관 리스크가 있을 수 있어, 초기에는 지도 표시 또는 실시간 보조 용도로만 사용한다.
- 좌표 저장은 공공데이터 원본 좌표, 직접 입력, 수동 검수 좌표처럼 저장 근거가 명확한 값부터 사용한다.
- 공공데이터는 API별 이용조건이 다르므로 `source_license_type` 없이 영업 대상으로 확정하지 않는다.

## 8. 구현 단계와 검증 기준

### Step 1. 대시보드 정적 UI

구현:

- 기존 사이트 스타일과 연결되는 관리자 대시보드 페이지 추가
- 목업 데이터로 카드, 테이블, 지도 플레이스홀더 표시

검증:

- Playwright에서 대시보드 제목, 핵심 KPI, 기관 테이블, 지도 영역 확인
- 모바일에서 가로 스크롤이 없어야 한다

### Step 2. 필터와 상세 패널

구현:

- 지역, 유형, 검수 상태 필터
- 기관 클릭 시 상세 패널 업데이트

검증:

- 필터 적용 시 기관 수가 바뀐다
- 기관 클릭 시 이름, 주소, 연락상태가 바뀐다

### Step 3. 이메일 검수 큐

구현:

- 승인/제외 상태 전환 UI
- 수신거부/반송 배지
- 출처 URL 표시

검증:

- 승인 버튼 클릭 시 상태가 `승인`으로 바뀐다
- 제외 버튼 클릭 시 발송 가능 수에서 빠진다

### Step 4. CSV import/export

구현:

- 목업 CSV 업로드 영역
- 현재 필터 결과 CSV 다운로드 버튼
- CSV 컬럼 안내

검증:

- CSV 컬럼 안내에 출처 URL, 이용조건, 검수상태가 포함된다
- API 없이도 CSV 버튼과 안내가 정상 표시된다

### Step 5. 캠페인 준비 화면

구현:

- 세그먼트 선택 목업
- 메일 템플릿 미리보기
- 발송 전 체크리스트

검증:

- 승인된 이메일만 예상 발송 수에 포함된다
- 수신거부 이메일은 항상 제외된다
- 개인 이메일 의심 항목은 기본 제외 또는 보류로 표시된다

### Step 6. API 연결 준비

구현:

- `.env.example` 추가
- Supabase/Kakao/Public Data/email provider 환경변수 이름 확정
- API 미설정 상태 메시지 표시

검증:

- 환경변수 없이도 로컬/배포 화면이 깨지지 않는다
- API 키가 없어도 테스트가 통과한다

## 9. 추천 기술 선택

초기 구현은 기존 정적 사이트 구조를 크게 바꾸지 않는다. 다음 턴 구현은 `dashboard.html`, `dashboard.css`, `dashboard.js`를 추가하는 방식이 가장 단순하다.

이유:

- 기존 랜딩 페이지를 깨뜨리지 않는다.
- API 없는 껍데기 구현에 React/Next 전환은 과하다.
- Vercel 정적 배포와 Playwright 검증이 이미 작동한다.
- Supabase/API 연결 시점에 필요한 화면과 데이터 구조를 검증할 수 있다.

API 연결 단계에서 대시보드가 복잡해지면 그때 Next.js 또는 Supabase Auth 기반 앱으로 분리한다.

## 10. Oracle 자문 상태

`steipete/oracle`은 `.tools/oracle`에 설치했고 Node 24 로컬 런타임으로 빌드와 CLI 실행까지 확인했다.

Oracle 브라우저 모드로 `gpt-5.5` 자문을 실행했고, 출력은 `/tmp/oracle-dashboard-advice.md`에 저장했다.

반영한 핵심 자문:

- 초기 MVP는 영업 발송 도구가 아니라 기관 발굴·검수 대장으로 정의한다.
- 공개 이메일이어도 광고성 메일 발송 가능 상태로 단정하지 않는다.
- 캠페인 화면은 실제 발송 기능 없이 비활성 목업으로 둔다.
- 공공데이터의 이용조건과 상업 이용 가능 여부를 데이터에 저장한다.
- Kakao Local API 응답 좌표를 별도 저장하는 방식은 뒤로 미루고, 지도 표시와 수동 검수 중심으로 시작한다.
- 수신거부/반송은 연락처 테이블만이 아니라 전역 `suppression_list`로 관리한다.
- 교회/성당 등 종교 기관은 대표 이메일 또는 공식 문의폼만 허용하고 개인 연락처 수집을 피한다.
