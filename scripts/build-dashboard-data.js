const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUTPUT = path.join(DATA_DIR, "dashboard-data.json");
const CONFIG_OUTPUT = path.join(DATA_DIR, "dashboard-config.js");
const GEOCODE_CACHE = path.join(DATA_DIR, "geocode-cache.json");
const DEPLOYED_DOMAIN = "https://5060book.vercel.app";

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    process.env[key] = rest.join("=");
  }
}

function safeStatus(name, status, detail = {}) {
  return {
    name,
    status,
    total: detail.total ?? null,
    code: detail.code ?? null,
    safeMessage: detail.safeMessage || "",
    operatorAction: detail.operatorAction || "",
    keyExposedToBrowser: false,
  };
}

const ENV_REQUIREMENTS = [
  { key: "KAKAO_REST_API_KEY", purpose: "Kakao Local REST 주소 검색/좌표 변환", phase: "map-geocoding", usage: "implemented" },
  { key: "KAKAO_GEOCODE_LIMIT", purpose: "Kakao 좌표 보강 최대 호출 수 제한. 없으면 기본값 420", phase: "map-geocoding", usage: "not-required" },
  { key: "KAKAO_CLIENT_SECRET", purpose: "Kakao OAuth 계열에서만 필요. 지도/Local에는 현재 불필요", phase: "none", usage: "not-required" },
  { key: "KAKAO_JAVASCRIPT_KEY_DEFAULT", purpose: "Kakao Map SDK 브라우저 키 후보", phase: "map-sdk", usage: "pending" },
  { key: "NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY", purpose: "Kakao Map SDK 브라우저 키", phase: "map-sdk", usage: "implemented" },
  { key: "VWORLD_API_KEY", purpose: "VWorld 노인복지시설 좌표/속성 수집", phase: "public-data", usage: "implemented" },
  { key: "VWORLD_DATA_ENDPOINT", purpose: "VWorld Data API endpoint", phase: "public-data", usage: "implemented" },
  { key: "VWORLD_DOMAIN", purpose: "VWorld 인증용 배포 도메인 파라미터", phase: "public-data", usage: "implemented" },
  { key: "PUBLIC_DATA_SERVICE_KEY", purpose: "공공데이터포털 표준데이터 호출", phase: "public-data", usage: "implemented" },
  { key: "SOCIAL_WELFARE_ENDPOINT", purpose: "사회복지시설 XML API endpoint", phase: "public-data", usage: "pending" },
  { key: "LIFELONG_LECTURE_ENDPOINT", purpose: "전국평생학습강좌 API", phase: "public-data", usage: "implemented" },
  { key: "LIFELONG_FACILITY_ENDPOINT", purpose: "전국평생교육시설 API", phase: "public-data", usage: "implemented" },
  { key: "KEDI_LIFELONG_INSTITUTIONS_CSV", purpose: "한국교육개발원 평생교육기관 CSV", phase: "public-data", usage: "implemented" },
  { key: "SOCIAL_WELFARE_DOCX", purpose: "사회복지시설 API 명세 확인", phase: "public-data", usage: "implemented" },
  { key: "SENIOR_WELFARE_PDF", purpose: "노인복지시설 파일데이터 원천", phase: "public-data", usage: "pending" },
  { key: "SENIOR_WELFARE_HWPX", purpose: "노인복지시설 파일데이터 원천", phase: "public-data", usage: "pending" },
  { key: "SUPABASE_URL", purpose: "Supabase DB 접속 URL", phase: "database", usage: "pending" },
  { key: "SUPABASE_ANON_KEY", purpose: "브라우저 read/RLS 검증용 anon key", phase: "database", usage: "pending" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", purpose: "서버/빌드 수집 데이터 upsert", phase: "database", usage: "pending" },
  { key: "SUPABASE_ACCESS_TOKEN", purpose: "Supabase Management API 프로젝트 생성/키 조회용 PAT", phase: "database", usage: "implemented" },
  { key: "SUPABASE_ORG_ID", purpose: "Supabase 프로젝트 생성 대상 조직 ID", phase: "database", usage: "pending" },
  { key: "EMAIL_PROVIDER_API_KEY", purpose: "Resend/SendGrid/Mailgun/SES 등 발송 provider", phase: "email", usage: "pending" },
  { key: "LISTMONK_BASE_URL", purpose: "self-hosted listmonk API base URL", phase: "email", usage: "pending" },
  { key: "LISTMONK_API_TOKEN", purpose: "listmonk API token", phase: "email", usage: "pending" },
  { key: "N8N_WEBHOOK_URL", purpose: "이메일 수집/검수/발송 자동화 webhook", phase: "automation", usage: "pending" },
];

function buildEnvStatus() {
  return ENV_REQUIREMENTS.map((item) => {
    const configured = Boolean(process.env[item.key]);
    let status = configured ? "configured" : "missing";
    if (item.usage === "not-required") status = configured ? "configured-not-required" : "not-required";
    if (item.usage === "pending" && configured) status = "configured-unused";
    if (item.usage === "pending" && !configured) status = "missing-for-future-stage";
    return {
      key: item.key,
      configured,
      status,
      usage: item.usage,
      phase: item.phase,
      purpose: item.purpose,
    };
  });
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 220)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`JSON parse failed: ${body.slice(0, 220)}`));
        }
      });
    });
    req.setTimeout(30000);
    req.on("timeout", () => {
      req.destroy(new Error("request timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}

function fetchJsonFromUrl(url, headers = {}) {
  return fetchJson(url, headers);
}

function loadJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function csvParse(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quote = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quote && char === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quote = !quote;
    } else if (!quote && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quote && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);

  const header = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(header.map((name, index) => [name, values[index] || ""])));
}

const REGION_CENTERS = {
  서울: [37.5665, 126.978],
  부산: [35.1796, 129.0756],
  대구: [35.8714, 128.6014],
  인천: [37.4563, 126.7052],
  광주: [35.1595, 126.8526],
  대전: [36.3504, 127.3845],
  울산: [35.5384, 129.3114],
  세종: [36.4801, 127.289],
  경기: [37.4138, 127.5183],
  강원: [37.8228, 128.1555],
  충북: [36.6357, 127.4917],
  충남: [36.6588, 126.6728],
  전북: [35.7175, 127.153],
  전남: [34.8679, 126.991],
  경북: [36.4919, 128.8889],
  경남: [35.4606, 128.2132],
  제주: [33.4996, 126.5312],
};

function normalizeSido(value = "") {
  const raw = value.trim();
  if (raw.startsWith("서울")) return "서울";
  if (raw.startsWith("부산")) return "부산";
  if (raw.startsWith("대구")) return "대구";
  if (raw.startsWith("인천")) return "인천";
  if (raw.startsWith("광주")) return "광주";
  if (raw.startsWith("대전")) return "대전";
  if (raw.startsWith("울산")) return "울산";
  if (raw.startsWith("세종")) return "세종";
  if (raw.startsWith("경기")) return "경기";
  if (raw.startsWith("강원")) return "강원";
  if (raw.startsWith("충청북") || raw.startsWith("충북")) return "충북";
  if (raw.startsWith("충청남") || raw.startsWith("충남")) return "충남";
  if (raw.startsWith("전북") || raw.startsWith("전라북")) return "전북";
  if (raw.startsWith("전남") || raw.startsWith("전라남")) return "전남";
  if (raw.startsWith("경북") || raw.startsWith("경상북")) return "경북";
  if (raw.startsWith("경남") || raw.startsWith("경상남")) return "경남";
  if (raw.startsWith("제주")) return "제주";
  return raw || "미상";
}

function extractRegionFromAddress(address = "") {
  const parts = address.trim().split(/\s+/);
  return {
    sido: normalizeSido(parts[0] || ""),
    sigungu: parts[1] || "",
  };
}

function getCenter(sido, seed) {
  const [lat, lng] = REGION_CENTERS[sido] || [36.5, 127.8];
  const offset = ((seed % 17) - 8) * 0.018;
  return [Number((lat + offset).toFixed(5)), Number((lng - offset).toFixed(5))];
}

function getRawLatLng(raw, sido, index) {
  const lat = Number(raw.lat || raw.y || raw.latitude || raw["위도"]);
  const lng = Number(raw.lng || raw.x || raw.longitude || raw["경도"]);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [Number(lat.toFixed(7)), Number(lng.toFixed(7))];
  return getCenter(sido, index);
}

function scoreInstitution(item) {
  const text = `${item.name} ${item.category} ${item.subCategory} ${item.programFit}`.toLowerCase();
  let age = 55;
  if (/노인|시니어|복지|경로|50/.test(text)) age += 28;
  if (/평생|도서관|교육/.test(text)) age += 12;
  let classics = 45;
  if (/도서관|평생|교육|강좌|아카데미/.test(text)) classics += 30;
  if (/교회|신학|평신도/.test(text)) classics += 18;
  let purchase = 40;
  if (/도서관|교육|평생/.test(text)) purchase += 24;
  if (/복지|시니어|노인/.test(text)) purchase += 16;
  const priority = Math.min(100, Math.round(age * 0.36 + classics * 0.34 + purchase * 0.3));
  return {
    ageFitScore: Math.min(age, 100),
    classicsFitScore: Math.min(classics, 100),
    purchasePotentialScore: Math.min(purchase, 100),
    priorityScore: priority,
  };
}

function makeLeadFields(item) {
  const expectedOrderType = item.targetGroup === "library" ? "도서관비치" : item.targetGroup === "lifelong" ? "강좌교재" : "미정";
  const expectedQuantity = item.priorityScore >= 85 ? 30 : item.priorityScore >= 72 ? 15 : 5;
  return {
    leadStage: item.priorityScore >= 85 ? "검수중" : "미접촉",
    owner: "미배정",
    lastContactedAt: "",
    nextFollowupAt: "",
    followupReason: item.website ? "대표 이메일 확인" : "전화 또는 홈페이지 확인",
    interestLevel: item.priorityScore >= 85 ? "높음" : item.priorityScore >= 70 ? "중간" : "낮음",
    decisionMakerKnown: false,
    lastAction: "데이터 수집",
    expectedOrderType,
    expectedQuantity,
    expectedRevenue: expectedQuantity * 5900,
    budgetCycle: "미확인",
    proposalStatus: "미작성",
    sampleSentAt: "",
    quoteSentAt: "",
    orderStatus: "미접촉",
    orderAmount: 0,
    booksInterested: item.targetGroup === "church" ? ["기독교 변론", "명상록"] : ["국부론", "자유론", "명상록"],
    programFit: item.programFit,
  };
}

function normalizeInstitution(raw, index, source) {
  const name = raw.name || raw.operInstitutionNm || raw.flctNm || raw["기관명"] || raw.edcPlace || "이름 미상";
  const address = raw.address || raw.edcRdnmadr || raw.lctnRoadNmAddr || raw["기관주소1"] || "";
  const addressRegion = extractRegionFromAddress(address);
  const sido = normalizeSido(raw.sido || raw.ctpvNm || raw["시도"] || addressRegion.sido || "");
  const sigungu = raw.sigungu || raw.sggNm || raw["지역"] || addressRegion.sigungu || "";
  const category = raw.category || raw.flctSeNm || raw["기관유형대분류"] || "평생교육기관";
  const targetText = `${name} ${category} ${raw.subCategory || raw.lctreNm || raw.flctSeNm || ""}`;
  const targetGroup = /교회|신학|성당|목회|평신도|선교/.test(targetText)
    ? "church"
    : /도서관/.test(targetText)
      ? "library"
      : /복지|노인|경로|시니어/.test(targetText)
        ? "senior"
        : "lifelong";
  const [lat, lng] = getRawLatLng(raw, sido, index);
  const base = {
    id: `${source.id}-${index}-${Buffer.from(name).toString("hex").slice(0, 8)}`,
    name,
    category,
    subCategory: raw.subCategory || raw.lctreNm || raw.flctSeNm || "",
    targetGroup,
    sido,
    sigungu,
    address,
    lat,
    lng,
    phone: raw.phone || raw.operPhoneNumber || raw.telno || raw["기관대표 전화번호"] || "",
    website: raw.website || raw.homepageUrl || raw.hmpgAddr || "",
    sourceDataset: source.name,
    sourceUrl: source.url,
    sourceLicenseType: source.license,
    sourceCollectedAt: new Date().toISOString(),
    dataConfidence: source.confidence,
    coordinateSource: raw.coordinateSource || (Number.isFinite(Number(raw.lat)) && Number.isFinite(Number(raw.lng)) ? source.confidence : "region-center"),
    reviewStatus: "검수 대기",
    notes: raw.notes || "",
    programFit: raw.programFit || (raw.lctreNm ? "평생학습강좌" : "평생교육"),
  };
  return { ...base, ...scoreInstitution(base) };
}

function createContactCandidate(institution) {
  return {
    id: `contact-${institution.id}`,
    institutionId: institution.id,
    institutionName: institution.name,
    email: "",
    emailType: institution.website ? "홈페이지 확인 필요" : "이메일 미확보",
    sourceUrl: institution.website || institution.sourceUrl,
    isRoleAccount: false,
    isPersonalEmailSuspected: false,
    validationStatus: "미수집",
    reviewStatus: "수집 필요",
    optOut: false,
    bounced: false,
    suppressionReason: "",
    phone: institution.phone,
    website: institution.website,
  };
}

function balancedSample(items, limit) {
  const groups = items.reduce((acc, item) => {
    const key = item.sido || "미상";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  Object.values(groups).forEach((group) => group.sort((a, b) => b.priorityScore - a.priorityScore));
  const keys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
  const result = [];
  let cursor = 0;
  while (result.length < limit && keys.some((key) => groups[key].length > 0)) {
    const key = keys[cursor % keys.length];
    const item = groups[key].shift();
    if (item) result.push(item);
    cursor += 1;
  }
  return result.sort((a, b) => b.priorityScore - a.priorityScore);
}

async function fetchPublicData(endpoint, serviceKey, rows = 120) {
  const url = new URL(endpoint);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", String(rows));
  url.searchParams.set("type", "json");
  const data = await fetchJson(url.toString());
  const body = data.response?.body || {};
  return {
    total: Number(body.totalCount || 0),
    items: Array.isArray(body.items) ? body.items : [],
  };
}

async function fetchVWorldFacilities() {
  const url = new URL(process.env.VWORLD_DATA_ENDPOINT || "https://api.vworld.kr/req/data");
  Object.entries({
    service: "data",
    request: "GetFeature",
    data: "LT_P_MGPRTFB",
    key: process.env.VWORLD_API_KEY,
    domain: process.env.VWORLD_DOMAIN || DEPLOYED_DOMAIN,
    format: "json",
    errorFormat: "json",
    size: "1000",
    page: "1",
    geometry: "true",
    attribute: "true",
    geomFilter: "BOX(124,33,132,39)",
    crs: "EPSG:4326",
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  const data = await fetchJson(url.toString());
  const response = data.response || {};
  if (response.status !== "OK") {
    const code = response.error?.code || "ERROR";
    const text = response.error?.text || response.error?.message || "VWorld 호출 실패";
    throw new Error(`${code}: ${text}`);
  }
  const features = response.result?.featureCollection?.features || [];
  const items = features.map((feature) => {
    const properties = feature.properties || {};
    const [lng, lat] = feature.geometry?.coordinates || [];
    const address = properties.fac_n_add || properties.fac_o_add || "";
    const region = extractRegionFromAddress(address);
    return {
      name: properties.fac_nam || "노인복지시설",
      category: properties.cat_nam || "노인복지시설",
      subCategory: "VWorld 노인복지시설",
      targetGroup: "senior",
      address,
      sido: region.sido,
      sigungu: region.sigungu,
      lat,
      lng,
      phone: properties.fac_tel || "",
      website: "",
      notes: feature.id || "",
      programFit: "노인복지시설",
      coordinateSource: "vworld-point",
    };
  });
  return {
    total: Number(response.record?.total || items.length),
    items,
  };
}

async function geocodeAddress(address) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", address);
  const data = await fetchJson(url.toString(), { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` });
  const first = data.documents?.[0];
  if (!first) return null;
  return {
    lat: Number(first.y),
    lng: Number(first.x),
    matchedAddress: first.address_name || first.road_address?.address_name || "",
  };
}

async function geocodeInstitutions(items) {
  const cache = loadJsonFile(GEOCODE_CACHE, {});
  const limit = Number(process.env.KAKAO_GEOCODE_LIMIT || 420);
  let attempted = 0;
  let success = 0;
  let cached = 0;

  for (const item of items) {
    if (item.coordinateSource && item.coordinateSource !== "region-center") continue;
    if (!item.address || attempted >= limit) continue;
    const key = item.address.trim();
    if (cache[key]) {
      item.lat = cache[key].lat;
      item.lng = cache[key].lng;
      item.coordinateSource = "kakao-cache";
      cached += 1;
      continue;
    }
    attempted += 1;
    try {
      const result = await geocodeAddress(key);
      if (!result) continue;
      cache[key] = result;
      item.lat = result.lat;
      item.lng = result.lng;
      item.coordinateSource = "kakao-rest";
      success += 1;
    } catch {
      break;
    }
  }

  fs.writeFileSync(GEOCODE_CACHE, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
  return { attempted, success, cached, totalCached: Object.keys(cache).length };
}

async function probeKakao() {
  try {
    const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
    url.searchParams.set("query", "서울특별시 종로구 종로 1");
    await fetchJson(url.toString(), { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` });
    return safeStatus("Kakao Local REST", "ok", { safeMessage: "주소 검색 정상" });
  } catch (error) {
    const message = error.message.includes("OPEN_MAP_AND_LOCAL")
      ? "OPEN_MAP_AND_LOCAL 서비스가 비활성화되어 좌표 보강을 건너뜀"
      : "Kakao Local REST 호출 실패";
    return safeStatus("Kakao Local REST", "failed", {
      code: error.message.includes("HTTP 403") ? 403 : "ERROR",
      safeMessage: message,
      operatorAction: "Kakao Developers에서 Map/Local API 활성화 후 서버 환경변수로 재수집",
    });
  }
}

async function probeVWorld() {
  try {
    const result = await fetchVWorldFacilities();
    return safeStatus("VWorld 노인복지시설", "ok", { total: result.total, safeMessage: "노인복지시설 좌표 수집 정상" });
  } catch (error) {
    return safeStatus("VWorld 노인복지시설", "failed", {
      code: "ERROR",
      safeMessage: "VWorld 호출 실패",
      operatorAction: "VWorld 개발키와 등록 도메인 확인",
    });
  }
}

async function probeSupabaseManagement() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || "";
  if (!token) {
    return safeStatus("Supabase Management API", "failed", {
      safeMessage: "SUPABASE_ACCESS_TOKEN 없음",
      operatorAction: "PAT를 로컬/배포 Secret으로 설정",
    });
  }
  try {
    const orgs = await fetchJsonFromUrl("https://api.supabase.com/v1/organizations", {
      Authorization: `Bearer ${token}`,
    });
    const orgCount = Array.isArray(orgs) ? orgs.length : 0;
    return safeStatus("Supabase Management API", orgCount === 1 || process.env.SUPABASE_ORG_ID ? "ok" : "failed", {
      total: orgCount,
      safeMessage: orgCount === 1 ? "조직 1개 확인" : `${orgCount}개 조직 확인. 생성 대상 조직 선택 필요`,
      operatorAction: orgCount > 1 && !process.env.SUPABASE_ORG_ID ? "SUPABASE_ORG_ID를 명시한 뒤 프로젝트 생성 가능" : "",
    });
  } catch (error) {
    return safeStatus("Supabase Management API", "failed", {
      safeMessage: "Supabase PAT 인증 실패",
      operatorAction: "SUPABASE_ACCESS_TOKEN 권한과 만료 여부 확인",
    });
  }
}

async function main() {
  loadEnv();
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const apiStatus = [];
  const institutions = [];

  const serviceKey = process.env.PUBLIC_DATA_SERVICE_KEY || "";
  try {
    const lecture = await fetchPublicData(process.env.LIFELONG_LECTURE_ENDPOINT, serviceKey, 120);
    apiStatus.push(safeStatus("전국평생학습강좌", "ok", { total: lecture.total, safeMessage: "정상 수집" }));
    lecture.items.forEach((item, index) => {
      institutions.push(
        normalizeInstitution(item, index, {
          id: "lecture",
          name: "전국평생학습강좌표준데이터",
          url: "https://www.data.go.kr/data/15013110/standard.do",
          license: "공공데이터포털 이용조건 확인",
          confidence: "api",
        }),
      );
    });
  } catch (error) {
    apiStatus.push(safeStatus("전국평생학습강좌", "failed", { safeMessage: "공공데이터 API 호출 실패", code: "TIMEOUT_OR_ERROR" }));
  }

  try {
    const facility = await fetchPublicData(process.env.LIFELONG_FACILITY_ENDPOINT, serviceKey, 180);
    apiStatus.push(safeStatus("전국평생교육시설", "ok", { total: facility.total, safeMessage: "정상 수집" }));
    facility.items.forEach((item, index) => {
      institutions.push(
        normalizeInstitution(item, index, {
          id: "facility",
          name: "전국평생교육시설정보표준데이터",
          url: "https://www.data.go.kr/data/15107727/standard.do",
          license: "공공데이터포털 이용조건 확인",
          confidence: "api",
        }),
      );
    });
  } catch (error) {
    apiStatus.push(safeStatus("전국평생교육시설", "failed", { safeMessage: "공공데이터 API 호출 실패", code: "TIMEOUT_OR_ERROR" }));
  }

  const csvPath = process.env.KEDI_LIFELONG_INSTITUTIONS_CSV;
  if (csvPath && fs.existsSync(csvPath)) {
    const rows = csvParse(fs.readFileSync(csvPath, "utf8"));
    apiStatus.push(safeStatus("한국교육개발원 평생교육기관 CSV", "ok", { total: rows.length, safeMessage: "로컬 CSV 정상 로드" }));
    rows.forEach((item, index) => {
      institutions.push(
        normalizeInstitution(item, index, {
          id: "kedi",
          name: "한국교육개발원_평생교육기관리스트",
          url: "https://www.data.go.kr/data/15050130/fileData.do",
          license: "공공데이터포털 파일데이터 이용조건 확인",
          confidence: "local-file",
        }),
      );
    });
  } else {
    apiStatus.push(safeStatus("한국교육개발원 평생교육기관 CSV", "failed", { safeMessage: "로컬 CSV 파일 없음" }));
  }

  apiStatus.push(
    safeStatus("한국사회보장정보원 사회복지시설 DOCX", fs.existsSync(process.env.SOCIAL_WELFARE_DOCX || "") ? "ok" : "failed", {
      safeMessage: fs.existsSync(process.env.SOCIAL_WELFARE_DOCX || "") ? "명세 문서 확인됨. 서비스별 operation 매핑 필요" : "명세 문서 없음",
    }),
  );

  try {
    const vworldFacilities = await fetchVWorldFacilities();
    apiStatus.push(safeStatus("VWorld 노인복지시설 실데이터", "ok", { total: vworldFacilities.total, safeMessage: "노인복지시설 실좌표 수집" }));
    vworldFacilities.items.forEach((item, index) => {
      institutions.push(
        normalizeInstitution(item, index, {
          id: "vworld-senior",
          name: "VWorld_노인복지시설",
          url: "https://api.vworld.kr/req/data",
          license: "브이월드 오픈API 이용조건 확인",
          confidence: "api-coordinate",
        }),
      );
    });
  } catch (error) {
    apiStatus.push(
      safeStatus("VWorld 노인복지시설 실데이터", "failed", {
        safeMessage: "VWorld 노인복지시설 수집 실패",
        operatorAction: "domain=https://5060book.vercel.app 포함 여부와 개발키 상태 확인",
      }),
    );
  }

  apiStatus.push(await probeKakao());
  apiStatus.push(await probeVWorld());
  apiStatus.push(await probeSupabaseManagement());

  const byKey = new Map();
  institutions.forEach((item) => {
    const key = `${item.name}|${item.sido}|${item.sigungu}|${item.address}`;
    if (!byKey.has(key)) {
      byKey.set(key, { ...item, ...makeLeadFields(item) });
      return;
    }
    const existing = byKey.get(key);
    if (item.priorityScore > existing.priorityScore) byKey.set(key, { ...item, ...makeLeadFields(item) });
  });
  const deduped = [...byKey.values()];
  const vworldSenior = deduped.filter((item) => item.sourceDataset === "VWorld_노인복지시설");
  const nonVworld = deduped.filter((item) => item.sourceDataset !== "VWorld_노인복지시설");
  const normalized = [...vworldSenior, ...balancedSample(nonVworld, 420)].sort((a, b) => b.priorityScore - a.priorityScore);
  const geocodeStatus = await geocodeInstitutions(normalized);
  apiStatus.push(
    safeStatus("Kakao REST 좌표 보강", "ok", {
      total: geocodeStatus.success + geocodeStatus.cached,
      safeMessage: `좌표 보강 ${geocodeStatus.success}건, 캐시 ${geocodeStatus.cached}건`,
    }),
  );
  const contacts = normalized.map(createContactCandidate);

  const regionCounts = normalized.reduce((acc, item) => {
    acc[item.sido] = (acc[item.sido] || 0) + 1;
    return acc;
  }, {});
  const targetCounts = normalized.reduce((acc, item) => {
    acc[item.targetGroup] = (acc[item.targetGroup] || 0) + 1;
    return acc;
  }, {});
  const pipelineCounts = normalized.reduce((acc, item) => {
    acc[item.leadStage] = (acc[item.leadStage] || 0) + 1;
    return acc;
  }, {});

  const dashboard = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalInstitutions: normalized.length,
      totalContacts: contacts.length,
      approvedContacts: contacts.filter((contact) => contact.reviewStatus === "승인").length,
      suppressedContacts: contacts.filter((contact) => contact.optOut || contact.bounced).length,
      regionCounts,
      targetCounts,
      pipelineCounts,
      coordinateCounts: normalized.reduce((acc, item) => {
        const key = item.coordinateSource || "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    },
    apiStatus,
    envStatus: buildEnvStatus(),
    institutions: normalized,
    contacts,
  };

  fs.writeFileSync(OUTPUT, `${JSON.stringify(dashboard, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    CONFIG_OUTPUT,
    `window.DASHBOARD_CONFIG = ${JSON.stringify(
      {
        kakaoJavaScriptKey: process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || "",
        vworldDomain: process.env.VWORLD_DOMAIN || DEPLOYED_DOMAIN,
        deployedDomain: DEPLOYED_DOMAIN,
      },
      null,
      2,
    )};\n`,
    "utf8",
  );
  console.log(`dashboard-data generated: ${normalized.length} institutions, ${contacts.length} contact candidates`);
  console.log(apiStatus.map((item) => `${item.name}:${item.status}`).join(" | "));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
