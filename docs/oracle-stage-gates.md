# Oracle 단계 게이트 및 구현 우선순위

## 현재 배포 URL

- 랜딩: `https://5060book.vercel.app`
- 대시보드: `https://5060book.vercel.app/dashboard.html`
- GitHub: `https://github.com/kmw1wlog/5060_book`

## 목적 재정의

이 대시보드는 랜딩페이지가 아니라 전국 기관 영업 지도다.

최종 목적은 한국 전체 지도에서 5060 이상 독자가 많거나 고전/신학 서적 구매 가능성이 있는 기관을 한눈에 보고, 기관별 이메일·전화·홈페이지·출처·영업 단계·예상 수주 속성을 관리하는 것이다.

핵심 운영 흐름:

1. 전국 지도에 실제 기관 위치를 표시한다.
2. 기관 유형별로 지도 핀과 우측 목록을 필터링한다.
3. 기관 클릭 시 상세 관리 패널을 연다.
4. 우측 이메일 레일에서 대표 이메일 수집·검수 상태를 본다.
5. 승인된 대표 이메일만 발송 큐에 올린다.
6. 발송, 반송, 수신거부, 수주 가능성을 DB에 남긴다.

## 직전 검증 결과

로컬 검증:

- `npm run data:dashboard` 통과
- `npm run test:e2e` 통과
- `npx playwright test tests/dashboard.spec.js --reporter=line` 통과
- 비밀키 스캔 통과: `.env` 밖 키 노출 없음

배포 URL 브라우저 검증:

- `https://5060book.vercel.app/dashboard.html` 접속 성공
- 전체 기관 핀 420개 표시
- 우측 이메일 후보 180개 표시
- 교회·신학 필터 8개 표시
- API 상태 패널 표시

## 현재 미흡점

현재 구현은 지도형 대시보드 구조로 바뀌었지만 완성형 운영 시스템은 아니다.

- Kakao Map SDK가 아직 실제로 렌더링되지 않는다.
- 현재 지도는 CSS 기반 한국 지도 캔버스다.
- 현재 핀 좌표는 실주소 지오코딩 결과가 아니라 시도 대표 좌표에 분산한 값이다.
- Kakao Local REST는 `OPEN_MAP_AND_LOCAL` 비활성화로 실패한다.
- VWorld는 인증키/도메인 문제로 실패한다.
- 사회복지시설 XML API는 문서만 확인했고 operation 매핑은 아직 없다.
- 노인복지시설 PDF/HWPX는 파일 존재만 확인했고 파싱은 아직 없다.
- Supabase는 PAT만 있고 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`가 없어 DB 연동이 불가능하다.
- 이메일 자동화는 provider/listmonk/n8n 설정이 없어 잠금 상태가 맞다.
- 교회 데이터 소스가 부족하다. 현재 교회·신학 후보는 평생교육 데이터 안에서 잡힌 8건뿐이다.

## Oracle 전달문

Oracle 검수 시 아래 내용을 그대로 전달한다.

```text
Open and review https://5060book.vercel.app/dashboard.html.

Be strict and honest. The goal is not a landing page. The goal is a Korean map-canvas dashboard for 5060+ classic-book institutional outreach.

Check whether the deployed dashboard makes the user understand:
- Korea-wide institution map canvas
- target institution pins
- institution type toggles
- right-side email/contact rail
- click-to-open institution management detail
- sales/order pipeline attributes
- API status and environment status
- email automation is safely locked until real provider integration

Also acknowledge what is not implemented:
- no actual Kakao Map SDK rendering yet
- pins are approximate until geocoding succeeds
- Kakao Local REST is blocked by service activation
- VWorld is blocked by key/domain status
- Supabase runtime keys are missing
- email provider/listmonk/n8n are missing

Return PASS or FAIL for the current deployed state as a stage-0 dashboard.
If FAIL, give blocking fixes only.
If PASS, recommend the next single implementation stage.
```

## Oracle 접근 상태

2026-07-03 현재 Oracle 검수는 실행을 시도했지만 완료되지 않았다.

실패 사유:

- Browser mode: ChatGPT 쿠키가 적용되지 않아 ChatGPT 세션을 열 수 없음
- API mode: `OPENAI_API_KEY`가 없어 provider preflight 실패

따라서 현재 문서와 구현은 Oracle 검수 통과 상태가 아니다. Oracle 게이트를 실제로 사용하려면 아래 둘 중 하나가 필요하다.

- Chrome/Chromium 프로필에 ChatGPT 로그인을 열어 Oracle browser mode가 쿠키를 읽을 수 있게 한다.
- `OPENAI_API_KEY`를 제공해 Oracle API mode를 사용한다.

## 단계별 구현 게이트

각 단계는 `구현 -> 로컬 테스트 -> 배포 URL 테스트 -> Oracle 검수` 순서로 진행한다.

Oracle 검수가 불가능한 경우:

- ChatGPT 쿠키 또는 `OPENAI_API_KEY` 부재를 차단 사유로 기록한다.
- Playwright 테스트와 실제 API probe 결과를 대체 검증으로 남긴다.
- 외부 서비스 설정이 필요한 단계는 통과 처리하지 않는다.

### Stage 0. 배포된 지도형 대시보드

상태: 완료

완료 기준:

- 배포 URL 접속 성공
- 전체 기관 420개 로딩
- 지도 핀 420개 표시
- 기관 유형 토글 작동
- 우측 이메일 레일 표시
- 기관 클릭 시 상세/영업/수주 속성 표시
- 발송 자동화 잠금
- env 상태 패널 표시

테스트:

- `npm run data:dashboard`
- `npm run env:audit`
- `npm run test:e2e`
- `npx playwright test tests/dashboard.spec.js --reporter=line`

### Stage 1. Kakao Map SDK 실제 지도 렌더링

우선순위: 1

필요 환경:

- `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`
- Kakao Developers JS SDK 도메인 등록: `https://5060book.vercel.app`

구현:

- 현재 CSS 지도 캔버스를 fallback으로 유지한다.
- Kakao SDK 로드 성공 시 실제 Kakao map을 렌더링한다.
- SDK 실패 시 fallback 지도와 명확한 오류 상태를 보여준다.

테스트:

- 배포 URL에서 Kakao SDK script 로드 확인
- `window.kakao.maps.Map` 존재 확인
- 지도 타일 컨테이너 표시 확인
- fallback도 깨지지 않는지 확인

차단:

- 도메인 미등록 또는 JS 키 불일치 시 실제 지도가 뜨지 않는다.

### Stage 2. Kakao Local REST 지오코딩

우선순위: 2

필요 환경:

- `KAKAO_REST_API_KEY`
- Kakao Developers에서 Map/Local API 활성화

구현:

- 주소 -> 좌표 변환을 build script에 추가한다.
- 변환 결과를 `data/dashboard-data.json`에 캐시한다.
- 실패 주소는 fallback 좌표와 실패 사유를 남긴다.

테스트:

- 샘플 주소 1개 지오코딩 성공
- 전체 기관 좌표 확보율 산출
- 실패율과 사유 대시보드 표시

차단:

- 현재 `OPEN_MAP_AND_LOCAL` 비활성화로 403 실패 중이다.

### Stage 3. VWorld/공공데이터 소스 확장

우선순위: 3

필요 환경:

- `VWORLD_API_KEY`
- `VWORLD_DATA_ENDPOINT`
- `PUBLIC_DATA_SERVICE_KEY`
- `SOCIAL_WELFARE_ENDPOINT`
- `SENIOR_WELFARE_PDF`
- `SENIOR_WELFARE_HWPX`

구현 순서:

1. VWorld 노인복지시설 API 정상화
2. 사회복지시설 XML API operation 매핑
3. 노인복지시설 PDF/HWPX 파싱
4. 도서관/평생교육/사회복지/노인복지 데이터셋 통합 dedupe

테스트:

- 데이터셋별 수집 건수 표시
- 샘플 레코드 스키마 검증
- 좌표 포함 비율 검증

차단:

- VWorld는 현재 인증키 오류다.
- 사회복지시설 XML API는 명세 분석이 필요하다.

### Stage 4. Supabase DB 저장

우선순위: 4

필요 환경:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

현재 부족:

- 사용자가 제공한 PAT는 관리용이다.
- 앱에서 DB를 읽고 쓰려면 Supabase 프로젝트 URL과 anon/service role key가 필요하다.

구현:

- institutions, contacts, campaigns, events, suppressions 테이블 생성 SQL
- build script에서 institutions/contacts upsert
- 브라우저는 anon key + RLS로 read-only 조회
- service role key는 서버/빌드에서만 사용

테스트:

- 테이블 생성 검증
- upsert 1건 검증
- 조회 1건 검증
- RLS로 비허용 write 차단 검증

### Stage 5. 이메일 수집/검수 큐

우선순위: 5

필요 환경:

- 초기에는 외부 API 없이 CSV/수동 검수 가능
- 자동화 시 `N8N_WEBHOOK_URL` 또는 별도 crawler endpoint

구현:

- 기관 홈페이지 후보 URL에서 대표 이메일만 수집한다.
- 개인 이메일 의심 주소는 자동 제외한다.
- 사람이 승인한 주소만 `승인` 상태로 바뀐다.

테스트:

- 대표 이메일/문의 이메일 분류
- 개인 이메일 제외
- 출처 URL 없는 이메일 제외

### Stage 6. 이메일 발송 자동화

우선순위: 6

필요 환경:

- `EMAIL_PROVIDER_API_KEY` 또는
- `LISTMONK_BASE_URL`
- `LISTMONK_API_TOKEN`
- 선택: `N8N_WEBHOOK_URL`

구현:

- 테스트 발송부터 구현한다.
- 승인된 role email만 발송 큐에 넣는다.
- 수신거부/반송은 전역 suppression에 저장한다.

테스트:

- 승인 대상만 발송 큐 진입
- 수신거부/반송 제외
- 실제 발송 버튼은 operator confirm 전까지 잠금

## 환경변수 사용 상태 분류

대시보드 데이터는 `envStatus` 배열을 포함한다.

상태 의미:

- `configured`: 설정되어 있고 현재 코드 경로에서 사용한다.
- `configured-unused`: 설정되어 있지만 다음 단계 구현 전까지 아직 사용하지 않는다.
- `missing-for-future-stage`: 다음 단계에 필요하지만 아직 비어 있다.
- `not-required`: 현재 목적에 필요 없다.

확인 명령:

```bash
npm run data:dashboard
npm run env:audit
```
