# 거장문고

5060 세대를 위한 경제·철학 고전 실물 서적 판매 웹사이트입니다.

## 로컬 실행

```bash
npm install
npm run serve
```

브라우저에서 `http://127.0.0.1:5173/`을 엽니다.

대시보드는 `http://localhost:5173/dashboard.html`에서 확인합니다. Kakao Developers에 등록된 로컬 도메인이 `http://localhost:5173`이므로 `127.0.0.1` 대신 `localhost`를 사용합니다.

## 기관 지도 대시보드

대시보드는 정적 배포 파일인 `data/dashboard-data.json`과 `data/dashboard-config.js`를 읽습니다. 배포 전 실데이터를 갱신하려면 아래 순서로 실행합니다.

```bash
npm run data:dashboard
npm run env:audit
npx playwright test tests/dashboard.spec.js --reporter=line
```

현재 연동 범위:

- Kakao Map JavaScript SDK: 배포 도메인에서 실제 지도 렌더링
- Kakao Local REST: 기관 주소 좌표 보강
- VWorld `LT_P_MGPRTFB`: 노인복지시설 실좌표 수집
- 공공데이터포털: 평생학습강좌, 평생교육시설
- KEDI CSV: 평생교육기관 로컬 파일 데이터
- Supabase Management API: PAT 인증 및 조직 수 확인
- Supabase DB: institutions/contacts 스키마, RLS, 데이터 upsert, read-only anon 검증

이메일 발송은 의도적으로 비활성화되어 있습니다. Supabase 프로젝트 생성은 접근 가능한 조직이 여러 개일 때 자동 진행하지 않고 `SUPABASE_ORG_ID`가 명시된 뒤 진행합니다.

## Supabase DB

현재 운영 DB 프로젝트:

- organization: `kmwOrg`
- project: `5060_book-prod`
- project ref: `jgjgwlqfnhxqedpupxek`

스키마는 `supabase/migrations/20260704010000_dashboard_schema.sql`에 있습니다.

DB 동기화와 검증:

```bash
npm run db:sync
npm run db:verify
```

검증 기준:

- `institutions` 775건
- `contacts` 775건
- anon key 읽기 성공
- anon key 쓰기 차단

DB 비밀번호, service role key, PAT는 `.env`/`.env.local`에만 저장하며 커밋하지 않습니다.

## 검증

```bash
npm run test:e2e
npx playwright test tests/dashboard.spec.js --reporter=line
```

Playwright로 랜딩 페이지와 지도 대시보드의 주요 사용자 흐름을 확인합니다.
